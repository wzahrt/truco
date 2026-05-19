import { createGame } from "./game/createGame";
import { GameState } from "./game/types";

const rooms = new Map<string, GameState>();

export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export function createRoom(): GameState {
  const roomCode = generateRoomCode();
  const game = createGame(roomCode);
  rooms.set(roomCode, game);
  return game;
}

export function getRoom(roomCode: string): GameState | undefined {
  return rooms.get(roomCode.toUpperCase());
}