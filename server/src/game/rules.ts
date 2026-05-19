import { Card, PlayedCard, Rank, Team } from "./types";
import { RANKS, SUITS } from "./deck";

export function getTeamFromSeat(seat: number): Team {
  return seat % 2 === 0 ? "A" : "B";
}

export function nextSeat(seat: number): number {
  return (seat + 1) % 4;
}

export function compareCards(a: Card, b: Card, trumpRank: Rank): number {
  const aIsTrump = a.rank === trumpRank;
  const bIsTrump = b.rank === trumpRank;

  if (aIsTrump && bIsTrump) {
    return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
  }

  if (aIsTrump) return 1;
  if (bIsTrump) return -1;

  return RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank);
}

export function decideTrickWinner(
  playedCards: PlayedCard[],
  trumpRank: Rank
): {
  tied: boolean;
  winnerSeat?: number;
  winnerTeam?: Team;
} {
  let best = playedCards[0];
  let tied = false;

  for (let i = 1; i < playedCards.length; i++) {
    const current = playedCards[i];
    const comparison = compareCards(current.card, best.card, trumpRank);

    if (comparison > 0) {
      best = current;
      tied = false;
    } else if (comparison === 0) {
      best = current;
      tied = true;
    }
  }

  if (tied) {
    return {
      tied: true,
      winnerSeat: best.seat,
      winnerTeam: best.team
    };
  }

  return {
    tied: false,
    winnerSeat: best.seat,
    winnerTeam: best.team
  };
}

export function hasFamily(cards: Card[]): boolean {
  return cards.every(card =>
    ["QUEEN", "JACK", "KING"].includes(card.rank)
  );
}

export function hasSequence(cards: Card[]): boolean {
  const indexes = cards
    .map(card => RANKS.indexOf(card.rank))
    .sort((a, b) => a - b);

  return indexes[1] === indexes[0] + 1 && indexes[2] === indexes[1] + 1;
}