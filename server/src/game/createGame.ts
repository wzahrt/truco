import { v4 as uuid } from "uuid";
import { createDeck, draw, getTrumpRank } from "./deck";
import {
  Card,
  GameState,
  PlayedCard,
  Player,
  Team
} from "./types";
import {
  decideTrickWinner,
  getTeamFromSeat,
  nextSeat
} from "./rules";

export function createGame(roomCode: string): GameState {
  return {
    roomCode,
    players: [],
    phase: "LOBBY",

    deck: [],
    topCard: null,
    trumpRank: null,

    dealerSeat: 0,
    currentTurnSeat: 0,

    tricks: [],
    currentTrick: null,

    teamAScore: 0,
    teamBScore: 0,

    roundValue: 1,
    lastTrucoTeam: null,

    message: "Waiting for players..."
  };
}

export function addPlayer(
  game: GameState,
  socketId: string,
  name: string
): Player {
  if (game.players.length >= 4) {
    throw new Error("Room is full.");
  }

  const seat = game.players.length;

  const player: Player = {
    id: uuid(),
    name,
    socketId,
    seat,
    team: getTeamFromSeat(seat),
    hand: [],
    connected: true
  };

  game.players.push(player);

  if (game.players.length === 4) {
    startRound(game);
  }

  return player;
}

export function startRound(game: GameState): void {
  game.phase = "DEALING";
  game.deck = createDeck();
  game.topCard = null;
  game.trumpRank = null;
  game.tricks = [];
  game.roundValue = 1;
  game.lastTrucoTeam = null;

  for (const player of game.players) {
    player.hand = draw(game.deck, 3);
  }

  const top = draw(game.deck, 1)[0];
  game.topCard = top;
  game.trumpRank = getTrumpRank(top.rank);

  const leadSeat = nextSeat(game.dealerSeat);
  game.currentTurnSeat = leadSeat;

  game.currentTrick = {
    number: 1,
    leadSeat,
    cards: []
  };

  game.phase = "PLAYING";
  game.message = `Round started. Seat ${leadSeat} leads.`;
}

export function playCard(
  game: GameState,
  socketId: string,
  cardId: string
): void {
  if (game.phase !== "PLAYING") {
    throw new Error("Cards cannot be played right now.");
  }

  const player = game.players.find(p => p.socketId === socketId);

  if (!player) {
    throw new Error("Player not found.");
  }

  if (player.seat !== game.currentTurnSeat) {
    throw new Error("It is not your turn.");
  }

  const cardIndex = player.hand.findIndex(card => card.id === cardId);

  if (cardIndex === -1) {
    throw new Error("Card not found in hand.");
  }

  const [card] = player.hand.splice(cardIndex, 1);

  const played: PlayedCard = {
    playerId: player.id,
    seat: player.seat,
    team: player.team,
    card
  };

  if (!game.currentTrick) {
    throw new Error("No active trick.");
  }

  game.currentTrick.cards.push(played);

  if (game.currentTrick.cards.length < 4) {
    game.currentTurnSeat = nextSeat(game.currentTurnSeat);
    return;
  }

  completeTrick(game);
}

function completeTrick(game: GameState): void {
  if (!game.currentTrick || !game.trumpRank) return;

  const result = decideTrickWinner(
    game.currentTrick.cards,
    game.trumpRank
  );

  game.currentTrick.tied = result.tied;
  game.currentTrick.winnerSeat = result.winnerSeat;
  game.currentTrick.winnerTeam = result.winnerTeam;

  game.tricks.push(game.currentTrick);

  const roundWinner = getRoundWinner(game);

  if (roundWinner) {
    awardRound(game, roundWinner);
    return;
  }

  const nextNumber = (game.tricks.length + 1) as 1 | 2 | 3;
  const nextLeadSeat = result.winnerSeat ?? game.currentTrick.leadSeat;

  game.currentTurnSeat = nextLeadSeat;
  game.currentTrick = {
    number: nextNumber,
    leadSeat: nextLeadSeat,
    cards: []
  };

  game.message = `Trick complete. Seat ${nextLeadSeat} leads next.`;
}

function getRoundWinner(game: GameState): Team | null {
  const wonByA = game.tricks.filter(t => t.winnerTeam === "A" && !t.tied).length;
  const wonByB = game.tricks.filter(t => t.winnerTeam === "B" && !t.tied).length;

  if (wonByA >= 2) return "A";
  if (wonByB >= 2) return "B";

  if (game.tricks.length === 3) {
    const lastWinner = game.tricks[2].winnerTeam;
    return lastWinner ?? "A";
  }

  return null;
}

function awardRound(game: GameState, team: Team): void {
  if (team === "A") {
    game.teamAScore += game.roundValue;
  } else {
    game.teamBScore += game.roundValue;
  }

  game.message = `Team ${team} wins the round for ${game.roundValue} point(s).`;

  if (game.teamAScore >= 12) {
    game.phase = "GAME_OVER";
    game.winner = "A";
    return;
  }

  if (game.teamBScore >= 12) {
    game.phase = "GAME_OVER";
    game.winner = "B";
    return;
  }

  game.phase = "ROUND_COMPLETE";
  game.dealerSeat = nextSeat(game.dealerSeat);
}

export function callTruco(game: GameState, socketId: string): void {
  const player = game.players.find(p => p.socketId === socketId);
  if (!player) throw new Error("Player not found.");

  if (game.lastTrucoTeam === player.team) {
    throw new Error("Your team cannot raise itself.");
  }

  if (game.roundValue === 1) {
    game.roundValue = 3;
  } else {
    game.roundValue += 2;
  }

  game.lastTrucoTeam = player.team;
  game.message = `${player.name} called Truco. Round is now worth ${game.roundValue}.`;
}

export function declineTruco(game: GameState, socketId: string): void {
  const player = game.players.find(p => p.socketId === socketId);
  if (!player) throw new Error("Player not found.");

  const winningTeam: Team = player.team === "A" ? "B" : "A";
  const pointsToAward = game.roundValue === 3 ? 1 : game.roundValue - 2;

  if (winningTeam === "A") {
    game.teamAScore += pointsToAward;
  } else {
    game.teamBScore += pointsToAward;
  }

  game.phase = "ROUND_COMPLETE";
  game.message = `Team ${player.team} declined. Team ${winningTeam} gets ${pointsToAward}.`;
}

export function getPublicGameState(game: GameState, socketId: string): GameState {
  const currentPlayer = game.players.find(p => p.socketId === socketId);

  return {
    ...game,
    deck: [],
    players: game.players.map(player => ({
      ...player,
      hand:
        currentPlayer?.id === player.id
          ? player.hand
          : player.hand.map(card => ({
              id: card.id,
              rank: "4",
              suit: "CLUBS"
            }))
    }))
  };
}