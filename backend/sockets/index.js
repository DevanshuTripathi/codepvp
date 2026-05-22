import { roomHandlers } from "./roomHandlers.js";
import { gameHandlers } from "./gameHandlers.js";
import { editorHandlers } from "./editorHandlers.js";
import { rooms, userToRoom, frontendUserToRoom } from "../store/rooms.js";
import { publishRoomEvent } from "../utils/roomSync.js";
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

      room.teamA = room.teamA.filter((player) => player !== username);
      room.teamB = room.teamB.filter((player) => player !== username);

      delete userToRoom[username]; // Cleanup after user leaves the room
      delete frontendUserToRoom[username];

      const isEmpty = room.teamA.length === 0 && room.teamB.length === 0;

      if (isEmpty) {
        delete rooms[roomId]; // Delete empty room
        // Notify other instances that room was deleted
        publishRoomEvent('roomDelete', { roomId });
      } else {
        io.to(roomId).emit("roomUpdate", room);
        // Publish update so other instances can sync
        publishRoomEvent('roomUpdate', { roomId, room });
      }
    });
  });
}
