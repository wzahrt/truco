import React from 'react';
import { Card as CardType } from '../models/types';

interface CardProps {
  card: CardType;
  isPlayed?: boolean;
  showFront?: boolean; // New prop to control front/back display
}

const Card: React.FC<CardProps> = ({ card, isPlayed = false, showFront = false }) => {
  return (
    <div className="card-container">
      {/* Show front if card is played OR showFront is true */}
      {(isPlayed || showFront) ? (
        <div className="card-front">
          <img 
            className="card-image" 
            src={card.image} 
            alt={`${card.value} of ${card.suit}`} 
          />
        </div>
      ) : (
        <div className="card-back">
          <img 
            className="card-image" 
            src="GreenCardBack.png" 
            alt="Card back" 
          />
        </div>
      )}
    </div>
  );
};

export default Card;