import { roomHandlers } from "./roomHandlers.js";
import { gameHandlers } from "./gameHandlers.js";
import { editorHandlers } from "./editorHandlers.js";
import { rooms, userToRoom, frontendUserToRoom } from "../store/rooms.js";
import { chatHandlers } from './chatHandlers.js';
import { matchmakingHandlers } from "./matchmakingHandlers.js";
import { frontendHandlers } from "./frontendHandlers.js";

export function setupSocket(io) {
  io.on("connection", (socket) => {

    socket.on("registerUser", ({ username }) => {
      socket.username = username;     // store it on socket
      socket.join(username);          // join personal room
      console.log("Registered:", username);
    });

    roomHandlers(io, socket);
    gameHandlers(io, socket);
    editorHandlers(io, socket);
    chatHandlers(io, socket);
    matchmakingHandlers(io, socket);
    frontendHandlers(io, socket);

    socket.on("disconnect", () => {
      const username = socket.username;
      if (!username) return;

      const data = userToRoom[username];
      if (!data) return;
      const { roomId } = data;

      const room = rooms[roomId];
      if (!room) return;

      room.teamA = room.teamA.map((player) => (player?.pid === username ? null : player));
      room.teamB = room.teamB.map((player) => (player?.pid === username ? null : player));
      room.spectators = (room.spectators || []).filter((spectator) => spectator !== username);

      delete userToRoom[username]; // Cleanup after user leaves the room
      delete frontendUserToRoom[username];

      const isEmpty =
        [...room.teamA, ...room.teamB].every((slot) => slot === null) &&
        (room.spectators || []).length === 0;

      if (isEmpty) {
          delete rooms[roomId]; // Delete empty room
      } else {
          io.to(roomId).emit("roomUpdate", room);
      }
    });
  });
}
