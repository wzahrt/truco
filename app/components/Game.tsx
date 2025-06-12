'use client'
import React, { useState, useEffect } from 'react';
import { Player } from '../models/Player';
import { deckService } from '../services/deckService';
import { Card as Cards } from '../models/types';
import Card from './Card';

const Game: React.FC = () => {
  const whoStartsRound = Math.floor(Math.random() * 4); 
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerHands, setPlayerHands] = useState<Cards[][]>([[], [], [], []]);
  const [topCard, setTopCard] = useState<Cards | null>(null);
  const [trump, setTrump] = useState<string>("");
  const [round, setRound] = useState<number>(0);
  const [trick, setTrick] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(whoStartsRound);
  const [playedCards, setPlayedCards] = useState<Cards[]>([]);
  const [gamePhase, setGamePhase] = useState<'dealing' | 'playing' | 'trick-complete' | 'round-complete'>('dealing');
  const cardRanking: Array<string> = ['4', '5', '6', '7', 'QUEEN', 'JACK', 'KING', 'ACE', '2', '3'];
  const suitOrder: Array<string> = ["DIAMONDS", "SPADES", "HEARTS", "CLUBS"];

const startNewRound = async (playersArray?: Player[]) => {
  setGamePhase('dealing');
  setRound(prev => prev + 1);
  setTrick(1);
  setCurrentPlayerIndex((round + whoStartsRound) % 4);
  await dealCards(playersArray || players);
  await decideTrump()
  setGamePhase('playing');
};

// Deal 3 cards to all 4 players
const dealCards = async (playersArray: Player[]) => {
  try {
    setLoading(true);
    await deckService.initializeDeck();
    
    const hands: Cards[][] = [];
    const updatedPlayers = [...playersArray];
    
    for (let i = 0; i < 4; i++) {
      const cards = await deckService.drawThree();
      updatedPlayers[i].setHand(cards);
      hands.push(cards);
    }
    
    setPlayers(updatedPlayers);
    setPlayerHands(hands);
    setError(null);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to deal cards');
  } finally {
    setLoading(false);
  }
};

const decideTrump = async () => {
  setLoading(true);
  const drawnCard = await deckService.drawCard();
  setTopCard(drawnCard[0]);
  console.log("the top card is,", drawnCard[0]);
  const trumpIndex = cardRanking.indexOf(drawnCard[0].value) + 1

  // Accounts for a three being pulled as the top card making 4 the trump card
  if (drawnCard[0].value == "3")
    setTrump(cardRanking[0]); // Set trump to 4
  else
    setTrump(cardRanking[trumpIndex])

  setLoading(false);
}

// Decides the winner of the trick and assigns them as the first player of the next trick.
const decideTrickWinner = (cardsOut: Cards[], currentTrump: string) => {
  let firstPlayerIndex = (currentPlayerIndex + 1) % 4;
  const orderOfPlayers = [];
  let winnerIndex = 0;
  let highestCardIndex = -1;
  let highestSuit = -1;

  for (let i = 0; i < 4; i++) {
    orderOfPlayers.push(firstPlayerIndex);
    firstPlayerIndex = (firstPlayerIndex + 1) % 4
  }

  for (let i = 0; i < 4; i++) {
    const currentCard = cardsOut[i];
    console.log(currentCard);
    if (currentCard.value == currentTrump) { // If someone plays a trump card decide who the winner is from that
      console.log(currentCard.value);
      if (suitOrder.indexOf(currentCard.suit) > highestSuit) {
        highestSuit = suitOrder.indexOf(currentCard.suit);
        winnerIndex = i;
      }
    } else if (cardRanking.indexOf(currentCard.value) > highestCardIndex && highestSuit == -1) {
      highestCardIndex = cardRanking.indexOf(currentCard.value);
      winnerIndex = i;
    } else if (cardRanking.indexOf(currentCard.value) == highestCardIndex) { // For now just announce it's a tie in the console.
        console.log("it's a tie!");
      }

  }

  console.log("Player", orderOfPlayers[winnerIndex] + 1, "won the trick!")
  setCurrentPlayerIndex(orderOfPlayers[winnerIndex]); // Set the player of the next trick to the winner of this trickk

}

  // Handle card play
const handlePlayCard = (playerIndex: number, cardIndex: number) => {
  if (gamePhase !== 'playing' || playerIndex !== currentPlayerIndex) return;

  const updatedPlayers = [...players];
  const playedCard = updatedPlayers[playerIndex].playCard(cardIndex);
    
  setPlayers(updatedPlayers);
  setPlayedCards(prev => [...prev, playedCard]);
  const cardsOut = [...playedCards, playedCard]
  
  // Update player hands for UI
  setPlayerHands(updatedPlayers.map(p => p.getHand()));

  // Move to next player or complete trick
  if (playedCards.length + 1 === 4) {
    completeTrick(cardsOut);
  } else {
    setCurrentPlayerIndex((currentPlayerIndex + 1) % 4);
  }
};

const completeTrick = (cardsOut: Cards[]) => {
  setGamePhase('trick-complete');
  decideTrickWinner(cardsOut, trump)
  setTrick(prev => prev + 1);
  
  if (trick >= 3) {
    completeRound();
  }
};

const completeRound = () => {
  setGamePhase('round-complete');
  // Determine winner, update scores, etc.
};

const startNextTrick = () => {
  console.log(playedCards)
  setPlayedCards([]);
  setGamePhase('playing');
};

useEffect(() => {
  // Initialize players synchronously (2 teams of 2)
  const initialPlayers = [
    new Player(1, 'Player 1', false, 1),
    new Player(2, 'Player 2', false, 2),
    new Player(3, 'Player 3', false, 1),
    new Player(4, 'Player 4', false, 2)
  ];
  setPlayers(initialPlayers);
  
  // Then start the first round
  startNewRound(initialPlayers);
  }, []);

  return (
    
    <div className="game-container">
      <h1>Truco Game - Round {round}, Trick {trick}</h1>
      
      {error && <div className="error">{error}</div>}
      
      {gamePhase === 'round-complete' && (
        <button onClick={() => startNewRound()} className="deal-button">
          Start Round {round + 1}
        </button>
      )}
      
      {gamePhase === 'trick-complete' && trick < 3 && (
        <button onClick={startNextTrick} className="deal-button">
          Start Next Trick
        </button>
      )}

      <div className="game-status">
        {gamePhase === 'playing' && (
          <p>Current turn: Player {currentPlayerIndex + 1}</p>
        )}
        {gamePhase === 'trick-complete' && (
          <p>Trick complete! Winner: Player X</p>
        )}
        {gamePhase === 'round-complete' && (
          <p>Round complete! Team X wins the round</p>
        )}
      </div>

      <div>
        <p className='game-status'>Card on top of the deck:</p>
        {topCard && <Card card={topCard} isPlayed={true} />}
      </div>

      <div className="played-cards">
        {playedCards.map((card, index) => (
          <Card key={`played-${index}`} card={card} isPlayed={true} />
        ))}
      </div>

      <div className="hands-container">
        {playerHands.map((hand, index) => (
          <div 
            key={`player-${index}`} 
            className={`player-hand ${index === currentPlayerIndex && gamePhase === 'playing' ? 'active-turn' : ''}`}
          >
            <h3>Player {index + 1} {players[index]?.getIsBot() ? '(Bot)' : ''}</h3>
            <div className="cards-grid">
              {hand.map((card, cardIndex) => (
                <div 
                  key={card.code} 
                  onClick={() => !players[index]?.getIsBot() && handlePlayCard(index, cardIndex)}
                >
                  <Card 
                    card={card} 
                    isPlayed={false}
                    showFront={index === currentPlayerIndex && gamePhase === 'playing'}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Game;