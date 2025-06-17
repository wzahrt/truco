export interface Card {
  code: string;
  image: string;
  value: string;
  suit: string;
}

export interface DeckResponse {
  success: boolean;
  deck_id: string;
  remaining: number;
  shuffled?: boolean;
}

export interface DrawResponse {
  success: boolean;
  cards: Card[];
  deck_id: string;
  remaining: number;
}