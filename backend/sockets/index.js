import { roomHandlers } from "./roomHandlers.js";
import { gameHandlers } from "./gameHandlers.js";
import { editorHandlers } from "./editorHandlers.js";
import { rooms, userToRoom } from "../store/rooms.js";
import { chatHandlers } from './chatHandlers.js';

export function setupSocket(io) {
  io.on("connection", (socket) => {

    roomHandlers(io, socket);
    gameHandlers(io, socket);
    editorHandlers(io, socket);
    chatHandlers(io, socket);

    socket.on("disconnect", () => {
      const username = socket.username;
      if (!username) return;

      const data = userToRoom[username];
      if (!data) return;
      const { roomId } = data;

      const room = rooms[roomId];
      if (!room) return;

      room.teamA = room.teamA.filter(player => player !== username);
      room.teamB = room.teamB.filter(player => player !== username);

      delete userToRoom[username]; // Cleanup after user leaves the room

      const isEmpty = room.teamA.length === 0 && room.teamB.length === 0;

      if (isEmpty) {
          delete rooms[roomId]; // Delete empty room
      } else {
          io.to(roomId).emit("roomUpdate", room);
      }
    });
  });
}
