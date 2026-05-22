import { appendMessage, getRoom } from "../services/roomService.js";

function inferTeamForUser(room, username) {
  if (!room || !username) return null;
  const a = room.teamA || [];
  const b = room.teamB || [];
  if (a.some((p) => p && (p.pid === username || p === username))) return "A";
  if (b.some((p) => p && (p.pid === username || p === username))) return "B";
  return null;
}

export function chatHandlers(io, socket) {
  socket.on("joinChat", async ({ roomId, teamId, username }) => {
    if (!roomId) return;

    socket.join(`chat-${roomId}`);

    const user = username || socket.username;

    let team = teamId;
    if (!team) {
      const room = await getRoom(roomId);
      const inferred = inferTeamForUser(room, user);
      if (inferred) team = inferred;
    }

    if (team) socket.join(`chat-${roomId}-team-${team}`);

    const room = await getRoom(roomId);
    if (!room) return socket.emit('chatHistory', { scope: 'room', roomId, messages: [] });

    if (team) {
      // extract team messages from stored messages by team flag if present
      const teamMessages = room.messages.filter(m => m.team === team);
      socket.emit("chatHistory", { scope: "team", roomId, teamId: team, messages: teamMessages });
      return;
    }

    socket.emit("chatHistory", { scope: "room", roomId, messages: room.messages });
  });

  socket.on("chatMessage", async ({ roomId, teamId, username, text }) => {
    if (!roomId || !text) return;
    const user = username || socket.username;
    const room = await getRoom(roomId);
    let team = teamId;
    if (!team) {
      team = inferTeamForUser(room, user);
    }

    const msg = { username: user, text, ts: Date.now(), team: team || null };
    await appendMessage(roomId, msg);

    if (team) {
      io.to(`chat-${roomId}-team-${team}`).emit("chatMessage", { scope: "team", roomId, teamId: team, message: msg });
      return;
    }

    io.to(`chat-${roomId}`).emit("chatMessage", { scope: "room", roomId, message: msg });
  });
}
