// src/components/Card.tsx
import React, {useState} from 'react';
import { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
}

const Card: React.FC<CardProps> = ({ card }) => {
    const [isFlipped, setIsFlipped] = useState<boolean>(false);

    const handleClick = () => {
        setIsFlipped(!isFlipped);
    };
    
  return (
    <div className={`flip-card-container ${!isFlipped ? 'flipped' : ''}`} onClick={handleClick}>
        <div className="flip-card-inner">
            <div className="card-front">
                <img className='card-front-image' src={card.image} alt={`${card.value} of ${card.suit}`} />
            </div>
            <div className="card-back">
                <img className='card-back-image' src="GreenCardBack.png" />
            </div>
        </div>
    </div>
  );
};

export default Card;