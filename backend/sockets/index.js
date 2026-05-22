import { roomHandlers } from "./roomHandlers.js";
import { gameHandlers } from "./gameHandlers.js";
import { editorHandlers } from "./editorHandlers.js";
import { chatHandlers } from './chatHandlers.js';
import { matchmakingHandlers } from "./matchmakingHandlers.js";
import { frontendHandlers } from "./frontendHandlers.js";
import { getUserRoom, clearUserRoom } from '../services/userService.js';
import { getRoom } from '../services/roomService.js';

export function setupSocket(io) {
  io.on("connection", (socket) => {

    socket.on("registerUser", ({ username }) => {
      socket.username = username;     // store it on socket
      socket.join(username);          // join personal room
      console.log("Registered:", username);
      // Try to restore previous room membership on reconnect
      (async () => {
        try {
          const roomId = await getUserRoom(username);
          if (roomId) {
            const room = await getRoom(roomId);
            if (room) {
              socket.join(roomId);
              socket.roomId = roomId;
              // rejoin chat and editor namespaces if needed
              socket.emit('roomUpdate', room);
            } else {
              // stale mapping
              await clearUserRoom(username);
            }
          }
        } catch (e) {
          console.error('restore membership error', e);
        }
      })();
    });

    roomHandlers(io, socket);
    gameHandlers(io, socket);
    editorHandlers(io, socket);
    chatHandlers(io, socket);
    matchmakingHandlers(io, socket);
    frontendHandlers(io, socket);

    socket.on('disconnect', () => {
      // Note: we intentionally do NOT immediately delete user-room mappings on disconnect.
      // A short TTL/backoff is used to allow reconnects. Actual removal happens via presence heartbeats or TTL sweepers.
      console.log('socket disconnected', socket.username);
    });
  });
}
