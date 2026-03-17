import { rooms } from "../store/rooms.js";

export function editorHandlers(io, socket) {
  socket.on("joinProblemRoom", ({ roomId, teamId, problemId }) => {
    socket.join(`${roomId}-team-${teamId}-problem-${problemId}`);
  });

  socket.on("editorChange", ({ roomId, teamId, problemId, code, source }) => {
    if (!isPlayerInTeam(roomId, teamId, socket.username)) return;

    io.to(`${roomId}-team-${teamId}-problem-${problemId}`).emit("editorUpdate", { code, source });
  });

  socket.on("markSolved", ({ roomId, teamId, problemId, username }) => {
    if (!isPlayerInTeam(roomId, teamId, socket.username || username)) return;

    io.to(`${roomId}-team-${teamId}`).emit("solvedProblem", { problemId, teamId, username });
  });

  socket.on("joinProblemset", ({ roomId, teamId }) => {
    socket.join(`${roomId}-team-${teamId}`);
  });
}

function isPlayerInTeam(roomId, teamId, username) {
  if (!roomId || !teamId || !username) return false;

  const room = rooms[roomId];
  if (!room) return false;

  const team = room[`team${teamId}`];
  if (!Array.isArray(team)) return false;

  return team.some((slot) => slot?.pid === username);
}
