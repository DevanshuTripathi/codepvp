import { rooms, activeTimers, userToRoom } from "../store/rooms.js";

export function gameHandlers(io, socket) {
  socket.on("startGame", ({ roomId, username, time }) => {
    const room = rooms[roomId];
    if (!room || room.owner !== username) return;

    const allReady = [...room.teamA, ...room.teamB].filter(Boolean).every(p => p.ready);
    if (!allReady) return;

    room.status = "in-progress";
    room.duration = time*60;
    room.startTime = Date.now();
    room.endTime = room.startTime + room.duration * 1000;

    room.teamAFinishedTime = null;
    room.teamBFinishedTime = null;

    const timerId = setTimeout(() => {
      io.to(roomId).emit("matchEnd", { reason: "time_up" });
      activeTimers.delete(roomId);
    }, room.duration * 1000);

    activeTimers.set(roomId, timerId);
    io.to(roomId).emit("navigateToProblemset", { roomId, room });
  });

  socket.on("getMatchDetails", ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.endTime) {
      socket.emit("matchDetails", { endTime: room.endTime });
    } else {
      socket.emit("matchDetails", { endTime: null });
    }
  });

  socket.on("finishGame", ({ roomId, teamId }) => {
    const room = rooms[roomId];
    if (!room || room.status !== "in-progress") return;

    const finishTime = Date.now();
    room[`team${teamId}FinishedTime`] = finishTime;

    console.log(room.teamAFinishedTime && room.teamBFinishedTime);

    io.to(roomId).emit("teamFinishedUpdate", { teamId, finishTime });

    if (room.teamAFinishedTime && room.teamBFinishedTime) {
      clearTimeout(activeTimers.get(roomId));
      activeTimers.delete(roomId);
      io.to(roomId).emit("matchEnd", { reason: "both_teams_finished" });
    }
  });

  socket.on("deleteRoom", ({ roomId }) => {
    const room = rooms[roomId];

    const allPlayers = [...room.teamA, ...room.teamB].filter(p => p !== null);
    allPlayers.forEach(p => {
      delete userToRoom[p.pid];
    })

    delete rooms[roomId];

  })
}
