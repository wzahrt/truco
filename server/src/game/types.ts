export type Suit = "CLUBS" | "HEARTS" | "SPADES" | "DIAMONDS";

export type Rank =
  | "4"
  | "5"
  | "6"
  | "7"
  | "QUEEN"
  | "JACK"
  | "KING"
  | "ACE"
  | "2"
  | "3";

export type Team = "A" | "B";

export type GamePhase =
  | "LOBBY"
  | "DEALING"
  | "CALLS"
  | "PLAYING"
  | "TRICK_COMPLETE"
  | "ROUND_COMPLETE"
  | "GAME_OVER";

export interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
}

export interface Player {
  id: string;
  name: string;
  socketId: string;
  seat: number;
  team: Team;
  hand: Card[];
  connected: boolean;
}

export interface PlayedCard {
  playerId: string;
  seat: number;
  team: Team;
  card: Card;
}

export interface Trick {
  number: 1 | 2 | 3;
  leadSeat: number;
  cards: PlayedCard[];
  winnerTeam?: Team;
  winnerSeat?: number;
  tied?: boolean;
}

export interface GameState {
  roomCode: string;
  players: Player[];
  phase: GamePhase;

  deck: Card[];
  topCard: Card | null;
  trumpRank: Rank | null;

  dealerSeat: number;
  currentTurnSeat: number;

  tricks: Trick[];
  currentTrick: Trick | null;

  teamAScore: number;
  teamBScore: number;

  roundValue: number;
  lastTrucoTeam: Team | null;

  message: string;
  winner?: Team;
}