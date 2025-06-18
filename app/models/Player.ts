import { Card } from './types';
export class Player {
  private id: number;
  private name: string;
  private hand: Card[];
  private cardsPlayed: Card[];
  private isBot: boolean;
  private team: string;

  constructor(id: number, name: string = 'Newbie', isBot: boolean = false, team: string) {
    this.id = id;
    this.name = name;
    this.hand = [];
    this.cardsPlayed = [];
    this.isBot = isBot;
    this.team = team;
  }

  // Add cards to player's hand
  public setHand(cards: Card[]): void {
    this.hand = cards;
  }

  // Move card to cardsPlayed hand
  public playCard(cardIndex: number): Card {
    const playedCard = this.hand[cardIndex];

    this.cardsPlayed.push(playedCard);
    this.hand = this.hand.filter((_, index) => index !== cardIndex);

    return playedCard;
  }

  public getHand(): Card[] {
    return [...this.hand]; // Return copy to prevent direct manipulation
  }

  public getCardsPlayed(): Card[] {
    return [...this.cardsPlayed];
  }

  public clearHand(): void {
    this.hand = [];
  }

  // Getters
  public getId(): number {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getIsBot(): boolean {
    return this.isBot;
  }

  public getTeam(): string {
    return this.team;
  }

  // For debugging
  public toString(): string {
    return `Player ${this.id} (${this.name}): [${this.hand.join(', ')}]`;
  }
}