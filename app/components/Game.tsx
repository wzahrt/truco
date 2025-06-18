'use client'
import React, { useState, useEffect } from 'react';
import { Player } from '../models/Player';
import { deckService } from '../services/deckService';
import { Card as Cards } from '../models/types';
import Card from './Card';
import { Bellota_Text } from 'next/font/google';

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
  const [trickWinner, setTrickWinner] = useState<string>("");
  const [roundWinner, setRoundWinner] = useState<string>("");
  const [previouslyTied, setTie] = useState<boolean>(false);
  const [aTeamTricksWon, setATeamTricksWon] = useState<number>(0);
  const [bTeamTricksWon, setBTeamTricksWon] = useState<number>(0);
  const [trickOneWinner, setTrickOneWinner] = useState<string>("");
  const [trickTwoWinner, setTrickTwoWinner] = useState<string>("");
  const [trickThreeWinner, setTrickThreeWinner] = useState<string>("");
  const [aTeamPoints, setATeamPoints] = useState<number>(0);
  const [bTeamPoints, setBTeamPoints] = useState<number>(0);
  const cardRanking: Array<string> = ['4', '5', '6', '7', 'QUEEN', 'JACK', 'KING', 'ACE', '2', '3'];
  const suitOrder: Array<string> = ["DIAMONDS", "SPADES", "HEARTS", "CLUBS"];

const startNewRound = async (playersArray?: Player[]) => {
  setGamePhase('dealing');
  setRound(prev => prev + 1);
  setPlayedCards([]);
  setTrick(1);
  setTie(false);
  setATeamTricksWon(0);
  setBTeamTricksWon(0);
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
  let tie = false;

  for (let i = 0; i < 4; i++) {
    orderOfPlayers.push(players[firstPlayerIndex]);
    firstPlayerIndex = (firstPlayerIndex + 1) % 4
  }
  console.log(orderOfPlayers);

  for (let i = 0; i < 4; i++) {
    const currentCard = cardsOut[i];
    console.log(currentCard);
    if (currentCard.value == currentTrump) { // If someone plays a trump card decide who the winner is from that
      if (suitOrder.indexOf(currentCard.suit) > highestSuit) {
        highestSuit = suitOrder.indexOf(currentCard.suit);
        winnerIndex = i;
        setTie(false);
        tie = false;
      }
    } else if (cardRanking.indexOf(currentCard.value) > highestCardIndex && highestSuit == -1) {
      highestCardIndex = cardRanking.indexOf(currentCard.value);
      winnerIndex = i;
      setTie(false);
      tie = false;
    } else if (cardRanking.indexOf(currentCard.value) == highestCardIndex) {
      winnerIndex = i;
      setTie(true);
      tie = true;
    }
  }
  console.log("before tie block");

  if (tie) {
    const winner = orderOfPlayers[winnerIndex];
    setTrickWinner(winner.getName());
    setCurrentPlayerIndex(players.indexOf(winner)); // Set the first player of the next trick to be the player who tied the current trick.
    if (previouslyTied && (aTeamTricksWon == 1 || bTeamTricksWon == 1)) {
      determineWinner(winner, trick);
    }
    return;
  }

  console.log("after tie block");


  const winner = orderOfPlayers[winnerIndex];
  console.log("the winner is ", winner);
  determineWinner(winner, trick);
  setTrickWinner(winner.getName());
  setCurrentPlayerIndex(players.indexOf(winner)); // Set the first player of the next trick to the winner of this trick.
}

const determineWinner = (winner: Player, trick: number) => {
  switch (trick) {
    case 1:
      setTrickOneWinner(winner.getTeam());
      break;
    case 2:
      setTrickTwoWinner(winner.getTeam());
      break;
    case 3:
      setTrickThreeWinner(winner.getTeam());
      break;
  }
  if (players.indexOf(winner) % 2 == 0) {
    setATeamTricksWon(aTeamTricksWon + 1);
    if (aTeamTricksWon == 1) {
      setATeamPoints(aTeamPoints + 1); // If Team A already one a trick and wins another they win the round and get points
      completeRound("A");
    }
  } else {
    setBTeamTricksWon(bTeamTricksWon + 1);
    if (bTeamTricksWon == 1) {
      setBTeamPoints(bTeamPoints + 1); // If Team B already one a trick and wins another they win the round and get points
      completeRound("B");
    }
  }
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
  decideTrickWinner(cardsOut, trump);
  setTrick(prev => prev + 1);
};

const completeRound = (winner: string) => {
  setGamePhase('round-complete');
  setRoundWinner(winner);
  // Determine winner, update scores, etc.
};

const startNextTrick = () => {
  setPlayedCards([]);
  setGamePhase('playing');
};

useEffect(() => {
  // Initialize players synchronously (2 teams of 2)
  const initialPlayers = [
    new Player(1, 'Player 1', false, "A"),
    new Player(2, 'Player 2', false, "B"),
    new Player(3, 'Player 3', false, "A"),
    new Player(4, 'Player 4', false, "B")
  ];
  setPlayers(initialPlayers);
  
  // Then start the first round
  startNewRound(initialPlayers);
  }, []);

  return (
    
    <div className="game-container">
      <h1>Truco Game - Round {round}, Trick {trick}</h1>
      
      {error && <div className="error">{error}</div>}

      <div className="scores">
        <h1 className="pr-10">Team A Points: {aTeamPoints}</h1>
        <h1>Team B Points: {bTeamPoints}</h1>
      </div>

      {gamePhase === 'playing' && (
        <div>
          <div className="scores mb-4">
            <h1 className="pr-10">Team A Tricks Won: {aTeamTricksWon}</h1>
            <h1>Team B Tricks Won: {bTeamTricksWon}</h1>
          </div>
          
          <div className="scores">
            <h1 className="pr-10">Trick One Winner: Team {trickOneWinner}</h1>
            <h1 className="pr-10">Trick Two Winner: Team{trickTwoWinner}</h1>
            <h1>Trick Three Winner: Team {trickThreeWinner}</h1>
          </div>
        </div>
      )}

      {gamePhase === 'round-complete' && (
        <button onClick={() => startNewRound()} className="deal-button">
          Start Round {round + 1}
        </button>
      )}
      
      {gamePhase === 'trick-complete' && trick < 4 && (
        <button onClick={startNextTrick} className="deal-button">
          Start Next Trick
        </button>
      )}

      <div className="game-status">
        {gamePhase === 'playing' && (
          <p>Current turn: Player {currentPlayerIndex + 1}</p>
        )}
        {gamePhase === 'trick-complete' && (
          previouslyTied ? (<p>It's a tie! Points go to team that played the last tying card.</p>) : (<p>Trick complete! Winner: {trickWinner}</p>)
        )}
        {gamePhase === 'round-complete' && (
          <p>Round complete! Team {roundWinner} wins the round!</p>
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

      <div>
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
                    isPlayed={true}
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