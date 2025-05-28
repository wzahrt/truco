// src/components/Card.tsx
import React from 'react';
import { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
}

const Card: React.FC<CardProps> = ({ card }) => {
  return (
    <div className="card">
      <img src={card.image} alt={`${card.value} of ${card.suit}`} />
      <div className="card-info">
        {card.value} of {card.suit}
      </div>
    </div>
  );
};

export default Card;