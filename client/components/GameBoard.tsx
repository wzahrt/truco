"use client";

import { useEffect, useState } from "react";
import { socket } from "../lib/socket";
import CardView from "./CardView";

type Card = {
  id: string;
  rank: string;
  suit: string;
};

type Player = {
  id: string;
  name: string;
  socketId: string;
  seat: number;
  team: "A" | "B";
  hand: Card[];
};

type GameState = {
  roomCode: string;
  players: Player[];
  phase: string;
  topCard: Card | null;
  trumpRank: string | null;
  currentTurnSeat: number;
  teamAScore: number;
  teamBScore: number;
  roundValue: number;
  message: string;
  winner?: "A" | "B";
  currentTrick: {
    cards: {
      playerId: string;
      seat: number;
      team: "A" | "B";
      card: Card;
    }[];
  } | null;
};

export default function GameBoard() {
  const [name, setName] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mySeat, setMySeat] = useState<number | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    socket.connect();

    socket.on("gameState", state => {
      setGame(state);
    });

    return () => {
      socket.off("gameState");
      socket.disconnect();
    };
  }, []);

  function createRoom() {
    setError("");

    socket.emit("createRoom", { name }, (response: any) => {
      if (!response.ok) {
        setError(response.error);
        return;
      }

      setRoomCode(response.roomCode);
      setMySeat(response.player.seat);
    });
  }

  function joinRoom() {
    setError("");

    socket.emit("joinRoom", { roomCode: roomInput, name }, (response: any) => {
      if (!response.ok) {
        setError(response.error);
        return;
      }

      setRoomCode(response.roomCode);
      setMySeat(response.player.seat);
    });
  }

  function playCard(cardId: string) {
    socket.emit("playCard", { roomCode, cardId }, (response: any) => {
      if (!response.ok) setError(response.error);
    });
  }

  function callTruco() {
    socket.emit("callTruco", { roomCode }, (response: any) => {
      if (!response.ok) setError(response.error);
    });
  }

  function declineTruco() {
    socket.emit("declineTruco", { roomCode }, (response: any) => {
      if (!response.ok) setError(response.error);
    });
  }

  function nextRound() {
    socket.emit("nextRound", { roomCode }, (response: any) => {
      if (!response.ok) setError(response.error);
    });
  }

  if (!game) {
    return (
      <main className="min-h-screen bg-emerald-950 p-6 text-white">
        <div className="mx-auto max-w-md rounded-3xl bg-white/10 p-6 shadow-2xl backdrop-blur">
          <h1 className="mb-2 text-4xl font-black">Truco</h1>
          <p className="mb-6 text-white/70">Create a room or join your friends.</p>

          <input
            className="mb-3 w-full rounded-xl border border-white/20 bg-white/90 p-3 text-black"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <button
            onClick={createRoom}
            className="mb-3 w-full rounded-xl bg-yellow-400 p-3 font-bold text-black shadow hover:bg-yellow-300"
          >
            Create Room
          </button>

          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-white/20 bg-white/90 p-3 text-black"
              placeholder="Room code"
              value={roomInput}
              onChange={e => setRoomInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              className="rounded-xl bg-white px-5 font-bold text-black hover:bg-white/90"
            >
              Join
            </button>
          </div>

          {error && <p className="mt-4 rounded-xl bg-red-500/20 p-3 text-red-100">{error}</p>}
        </div>
      </main>
    );
  }

  const me = game.players.find(p => p.seat === mySeat);
  const isMyTurn = mySeat === game.currentTurnSeat;

  return (
    <main className="min-h-screen bg-emerald-950 p-4 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white/10 p-4 shadow-xl backdrop-blur">
          <div>
            <h1 className="text-3xl font-black">Truco</h1>
            <p className="text-sm text-white/70">Room: {game.roomCode} · Seat: {mySeat}</p>
          </div>

          <div className="flex gap-3 text-center">
            <div className="rounded-2xl bg-white/10 px-5 py-2">
              <p className="text-xs text-white/60">Team A</p>
              <p className="text-2xl font-black">{game.teamAScore}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-2">
              <p className="text-xs text-white/60">Team B</p>
              <p className="text-2xl font-black">{game.teamBScore}</p>
            </div>
            <div className="rounded-2xl bg-yellow-400 px-5 py-2 text-black">
              <p className="text-xs opacity-70">Round</p>
              <p className="text-2xl font-black">{game.roundValue}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="rounded-[2rem] border border-white/10 bg-green-800/70 p-5 shadow-2xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{game.message}</p>
                <p className="text-sm text-white/70">
                  Phase: {game.phase} · Turn: Seat {game.currentTurnSeat} · Trump: {game.trumpRank}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {game.topCard && (
                  <div className="text-center">
                    <p className="mb-1 text-xs text-white/60">Top Card</p>
                    <CardView card={game.topCard} disabled compact />
                  </div>
                )}
              </div>
            </div>

            <div className="grid min-h-[360px] grid-rows-[auto_1fr_auto] gap-4">
              <div className="flex justify-center gap-3">
                {game.players
                  .filter(p => p.seat !== mySeat)
                  .slice(0, 1)
                  .map(player => (
                    <PlayerStrip key={player.id} player={player} mySeat={mySeat} />
                  ))}
              </div>

              <div className="grid grid-cols-[1fr_260px_1fr] items-center gap-4">
                <div className="flex justify-center">
                  {game.players
                    .filter(p => p.seat !== mySeat)
                    .slice(1, 2)
                    .map(player => (
                      <PlayerStrip key={player.id} player={player} mySeat={mySeat} />
                    ))}
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-center">
                  <h2 className="mb-3 text-lg font-bold">Current Trick</h2>
                  <div className="flex min-h-[110px] flex-wrap items-center justify-center gap-2">
                    {game.currentTrick?.cards.length ? (
                      game.currentTrick.cards.map(played => (
                        <div key={`${played.seat}-${played.card.id}`} className="text-center">
                          <p className="mb-1 text-xs text-white/70">Seat {played.seat}</p>
                          <CardView card={played.card} disabled compact />
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-white/50">No cards played yet</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-center">
                  {game.players
                    .filter(p => p.seat !== mySeat)
                    .slice(2, 3)
                    .map(player => (
                      <PlayerStrip key={player.id} player={player} mySeat={mySeat} />
                    ))}
                </div>
              </div>

              <div className="rounded-3xl bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-black">
                    Your Hand {isMyTurn ? "— Your turn" : ""}
                  </h2>
                  <p className="text-sm text-white/60">Team {me?.team}</p>
                </div>

                <div className="flex flex-row flex-wrap justify-center gap-3">
                  {me?.hand.map(card => (
                    <div key={card.id}>
                      <CardView
                        card={card}
                        disabled={!isMyTurn || game.phase !== "PLAYING"}
                        onClick={() => playCard(card.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <section className="rounded-3xl bg-white/10 p-4 shadow-xl">
              <h2 className="mb-3 text-xl font-black">Players</h2>
              <div className="space-y-2">
                {game.players.map(player => (
                  <div
                    key={player.id}
                    className={`rounded-2xl p-3 ${
                      player.seat === game.currentTurnSeat
                        ? "bg-yellow-400 text-black"
                        : "bg-white/10"
                    }`}
                  >
                    <p className="font-bold">
                      {player.name}
                      {player.seat === mySeat ? " (You)" : ""}
                    </p>
                    <p className="text-sm opacity-75">
                      Seat {player.seat} · Team {player.team} · {player.hand.length} cards
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white/10 p-4 shadow-xl">
              <h2 className="mb-3 text-xl font-black">Actions</h2>
              <div className="grid gap-2">
                <button
                  onClick={callTruco}
                  className="rounded-2xl bg-red-600 px-4 py-3 font-bold text-white shadow hover:bg-red-500"
                >
                  Call Truco
                </button>

                <button
                  onClick={declineTruco}
                  className="rounded-2xl bg-white/15 px-4 py-3 font-bold text-white hover:bg-white/20"
                >
                  Decline Truco
                </button>

                {game.phase === "ROUND_COMPLETE" && (
                  <button
                    onClick={nextRound}
                    className="rounded-2xl bg-yellow-400 px-4 py-3 font-bold text-black hover:bg-yellow-300"
                  >
                    Next Round
                  </button>
                )}
              </div>
            </section>

            {error && (
              <section className="rounded-3xl bg-red-500/20 p-4 text-red-100">
                {error}
              </section>
            )}
          </aside>
        </section>

        {game.winner && (
          <section className="rounded-3xl bg-yellow-400 p-5 text-center text-2xl font-black text-black">
            Team {game.winner} wins the game!
          </section>
        )}
      </div>
    </main>
  );
}

function PlayerStrip({
  player,
  mySeat
}: {
  player: Player;
  mySeat: number | null;
}) {
  return (
    <div className="rounded-3xl bg-black/20 p-3 text-center">
      <p className="mb-2 text-sm font-bold">
        {player.name}
        {player.seat === mySeat ? " (You)" : ""} · Seat {player.seat}
      </p>

      <div className="flex flex-row justify-center gap-1">
        {player.hand.map(card => (
          <div key={card.id}>
            <CardView card={card} hidden disabled compact />
          </div>
        ))}
      </div>
    </div>
  );
}