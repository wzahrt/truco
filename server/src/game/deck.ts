import { Card, Rank, Suit } from "./types";

export const RANKS: Rank[] = [
  "4",
  "5",
  "6",
  "7",
  "QUEEN",
  "JACK",
  "KING",
  "ACE",
  "2",
  "3"
];

export const SUITS: Suit[] = ["DIAMONDS", "SPADES", "HEARTS", "CLUBS"];

export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${rank}-${suit}`,
        rank,
        suit
      });
    }
  }

  return shuffle(deck);
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export function draw(deck: Card[], count: number): Card[] {
  return deck.splice(0, count);
}

export function getTrumpRank(topRank: Rank): Rank {
  const index = RANKS.indexOf(topRank);

  if (topRank === "3") {
    return "4";
  }

  return RANKS[index + 1];
}