// src/components/Deck.tsx
'use client'
import React, { useState, useEffect } from 'react';
import Card from './Card';
import { DeckResponse, DrawResponse, Card as CardType } from '../types';
// import './Deck.css';

const Deck: React.FC = () => {
  const [deckId, setDeckId] = useState<string>('');
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize a new 40 Truco deck (no 8s, 9s, or 10s)
  const initializeDeck = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?cards=AS,2S,3S,4S,5S,6S,7S,JS,QS,KS,AH,2H,3H,4H,5H,6H,7H,JH,QH,KH,AC,2C,3C,4C,5C,6C,7C,JC,QC,KC,AD,2D,3D,4D,5D,6D,7D,JD,QD,KD');
      const data: DeckResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to create deck');
      }

      console.log(data)
      setDeckId(data.deck_id);
      setError(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deck');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const drawCard = async () => {
    if (!deckId) return;

    setLoading(true);
    try {
      // Draw a singular card (for placing the trump card)
      const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`);
      const data: DrawResponse = await response.json();

      if (!data.success) {
        throw new Error('Not enough cards left to draw 1!');
      }

      setCards(data.cards); // Take first 40 after filtering
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to draw cards');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const drawThree = async () => {
    if (!deckId) return;

    setLoading(true);
    try {
      // Draw 3 cards for Truco hands
      const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=3`);
      const data: DrawResponse = await response.json();

      if (!data.success) {
        throw new Error('Not enough cards left to draw 3!');
      }

      console.log(data)
      setCards(data.cards);
      setError(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to draw cards');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize deck on component mount
  useEffect(() => {
    initializeDeck();
  }, []);

  return (
    <div className="deck-container">
      <h1>40-Card Deck (No 8s, 9s, or 10s)</h1>
      
      {error && <div className="error">{error}</div>}
      
      <div className="controls">
        <button className="deck-buttons" onClick={initializeDeck} disabled={loading}>
          New Deck
        </button>
        <div>
            <button 
              className="deck-buttons" onClick={drawThree} disabled={loading || !deckId}>
              Draw 3 Cards
            </button>
        </div>
      </div>

      {loading && <div>Loading...</div>}

      <div className="cards-grid mt-2">
        {cards.map((card) => (
          <Card key={card.code} card={card} />
        ))}
      </div>
      
      {cards.length > 0 && (
        <div className="deck-info mt-4">
          Showing {cards.length} cards (no 8s, 9s, or 10s)
        </div>
      )}
    </div>
  );
};

export default Deck;