// src/services/DeckService.ts
import { DeckResponse, DrawResponse, Card as CardType } from '../models/types';

class DeckService {
  private deckId: string = '';
  private loading: boolean = false;
  private error: string | null = null;

  // Initialize a new 40 Truco deck (no 8s, 9s, or 10s)
  async initializeDeck(): Promise<string> {
    this.loading = true;
    try {
      const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?cards=AS,2S,3S,4S,5S,6S,7S,JS,QS,KS,AH,2H,3H,4H,5H,6H,7H,JH,QH,KH,AC,2C,3C,4C,5C,6C,7C,JC,QC,KC,AD,2D,3D,4D,5D,6D,7D,JD,QD,KD');
      const data: DeckResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to create deck');
      }

      this.deckId = data.deck_id;
      this.error = null;
      return this.deckId;

    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to create deck';
      console.error(err);
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async drawCard(): Promise<CardType[]> {
    if (!this.deckId) {
      throw new Error('Deck not initialized');
    }

    this.loading = true;
    try {
      // Draw a singular card (for placing the trump card)
      const response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/draw/?count=1`);
      const data: DrawResponse = await response.json();

      if (!data.success) {
        throw new Error('Not enough cards left to draw 1!');
      }

      this.error = null;
      return data.cards;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to draw cards';
      console.error(err);
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async drawThree(): Promise<CardType[]> {
    if (!this.deckId) {
      throw new Error('Deck not initialized');
    }

    this.loading = true;
    try {
      // Draw 3 cards for Truco hands
      const response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/draw/?count=3`);
      const data: DrawResponse = await response.json();

      if (!data.success) {
        throw new Error('Not enough cards left to draw 3!');
      }

      this.error = null;
      return data.cards;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to draw cards';
      console.error(err);
      throw err;
    } finally {
      this.loading = false;
    }
  }

  getDeckId(): string {
    return this.deckId;
  }

  isLoading(): boolean {
    return this.loading;
  }

  getError(): string | null {
    return this.error;
  }
}

// Export as a singleton instance
export const deckService = new DeckService();