import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import {
  addPlayer,
  callTruco,
  declineTruco,
  getPublicGameState,
  playCard,
  startRound
} from "./game/createGame";
import { createRoom, getRoom } from "./rooms";

const app = express();

app.use(cors());

app.get("/", (_req, res) => {
  res.send("Truco server is running.");
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

function emitRoomState(roomCode: string) {
  const game = getRoom(roomCode);
  if (!game) return;

  for (const player of game.players) {
    io.to(player.socketId).emit(
      "gameState",
      getPublicGameState(game, player.socketId)
    );
  }
}

io.on("connection", socket => {
  console.log("Connected:", socket.id);

  socket.on("createRoom", ({ name }, callback) => {
    try {
      const game = createRoom();
      socket.join(game.roomCode);

      const player = addPlayer(game, socket.id, name || "Player");

      callback({
        ok: true,
        roomCode: game.roomCode,
        player
      });

      emitRoomState(game.roomCode);
    } catch (err) {
      callback({ ok: false, error: String(err) });
    }
  });

  socket.on("joinRoom", ({ roomCode, name }, callback) => {
    try {
      const game = getRoom(roomCode);

      if (!game) {
        callback({ ok: false, error: "Room not found." });
        return;
      }

      socket.join(game.roomCode);

      const player = addPlayer(game, socket.id, name || "Player");

      callback({
        ok: true,
        roomCode: game.roomCode,
        player
      });

      emitRoomState(game.roomCode);
    } catch (err) {
      callback({ ok: false, error: String(err) });
    }
  });

  socket.on("playCard", ({ roomCode, cardId }, callback) => {
    try {
      const game = getRoom(roomCode);
      if (!game) throw new Error("Room not found.");

      playCard(game, socket.id, cardId);
      callback({ ok: true });

      emitRoomState(roomCode);
    } catch (err) {
      callback({ ok: false, error: String(err) });
    }
  });

  socket.on("callTruco", ({ roomCode }, callback) => {
    try {
      const game = getRoom(roomCode);
      if (!game) throw new Error("Room not found.");

      callTruco(game, socket.id);
      callback({ ok: true });

      emitRoomState(roomCode);
    } catch (err) {
      callback({ ok: false, error: String(err) });
    }
  });

  socket.on("declineTruco", ({ roomCode }, callback) => {
    try {
      const game = getRoom(roomCode);
      if (!game) throw new Error("Room not found.");

      declineTruco(game, socket.id);
      callback({ ok: true });

      emitRoomState(roomCode);
    } catch (err) {
      callback({ ok: false, error: String(err) });
    }
  });

  socket.on("nextRound", ({ roomCode }, callback) => {
    try {
      const game = getRoom(roomCode);
      if (!game) throw new Error("Room not found.");

      startRound(game);
      callback({ ok: true });

      emitRoomState(roomCode);
    } catch (err) {
      callback({ ok: false, error: String(err) });
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Truco server running on port ${PORT}`);
});