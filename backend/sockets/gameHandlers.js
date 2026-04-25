import { rooms, activeTimers, userToRoom } from "../store/rooms.js";
import { submissions } from "../server.js";
import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  const jsonPath = new URL('../secrets/serviceAccountKey.json', import.meta.url);
  serviceAccount = JSON.parse(readFileSync(jsonPath, 'utf8'));
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const contestTeamCollection = db.collection("Teams");

// Helper function to delete all submissions linked to a specific room
function clearRoomSubmissions(targetRoomId) {
  let deletedCount = 0;
  for (const [subId, subData] of submissions.entries()) {
    if (subData.roomId === targetRoomId) {
      submissions.delete(subId);
      deletedCount++;
    }
  }
  if (deletedCount > 0) {
    console.log(`🧹 Cleaned up ${deletedCount} submissions for room: ${targetRoomId}`);
  }
}

async function updateTime(teamId) {
  await contestTeamCollection.doc(teamId).update({
    finishedAt: FieldValue.serverTimestamp()
  });
}

export function gameHandlers(io, socket) {
  socket.on("startGame", ({ roomId, username, time }) => {
    const room = rooms[roomId];
    if (!room || room.owner !== username) return;

    const allReady = [...room.teamA, ...room.teamB]
      .filter(Boolean)
      .every((p) => p.ready);
    if (!allReady) return;

    room.status = "in-progress"; // CHange room status so doesnt show in active rooms list
    room.duration = time * 60; // Time recieved is in minutes
    room.startTime = Date.now();
    room.endTime = room.startTime + room.duration * 1000;

    room.teamAFinishedTime = null;
    room.teamBFinishedTime = null;

    const timerId = setTimeout(() => {
      io.to(roomId).emit("matchEnd", { reason: "time_up" });
      activeTimers.delete(roomId);
      clearRoomSubmissions(roomId);
    }, room.duration * 1000);

    activeTimers.set(roomId, timerId);
    io.to(roomId).emit("navigateToProblemset", { roomId, room });
  });

  // NEW: Dedicated Tournament Match Starter
  socket.on("forceStartTournamentMatch", ({ roomId, p1Username, p2Username, time, adminName }) => {
    
    // 1. Forcefully create the room in memory
    rooms[roomId] = {
      owner: adminName,
      teamA: [{ pid: p1Username, ready: true }], // Force them to be ready
      teamB: p2Username ? [{ pid: p2Username, ready: true }] : [],
      public: false,
      status: "in-progress", // Hide from active lists
      duration: time * 60,   // Convert minutes to seconds
      startTime: Date.now(),
    };

    const room = rooms[roomId];
    room.endTime = room.startTime + room.duration * 1000;
    room.teamAFinishedTime = null;
    room.teamBFinishedTime = null;

    // 2. Start the Server-Side Timer
    const timerId = setTimeout(() => {
      io.to(roomId).emit("matchEnd", { reason: "time_up" });
      activeTimers.delete(roomId);
      clearRoomSubmissions(roomId);
    }, room.duration * 1000);

    activeTimers.set(roomId, timerId);

    // 3. Teleport the players using their personal username socket rooms!
    console.log(`Tournament Match ${roomId} Started. Teleporting players...`);
    
    io.to(p1Username).emit("tournamentMatchStarted", { roomId, team: "A" });
    if (p2Username) {
      io.to(p2Username).emit("tournamentMatchStarted", { roomId, team: "B" });
    }
  });

  // NEW: Dedicated FFA Contest Starter
  socket.on("startFFAContest", ({ contestId, adminName, durationMinutes }) => {
    const GRACE_PERIOD_MS = 5 * 60 * 1000;
    const codingDurationMs = durationMinutes * 60 * 1000;
    const now = Date.now();
    // 1. Create a lightweight room in memory just for the timer
    rooms[contestId] = {
      owner: adminName,
      isFFA: true, // Flag to identify mode
      status: "in-progress",
      duration: durationMinutes * 60, // convert to seconds
      startTime: now,
      endTime: now + codingDurationMs,
      graceEndTime: now + codingDurationMs + GRACE_PERIOD_MS
    };

    // 2. Start the Server-Side Timer
    const codingTimerId = setTimeout(() => {
      // When time is up, blast the matchEnd event to everyone in the problemset
      io.to(contestId).emit("codingTimeUp", { reason: "coding_time_up" });
      console.log(`FFA Contest ${contestId} coding phase ended. Grace period started.`);
    }, codingDurationMs);

    const totalTimerId = setTimeout(() => {
      io.to(contestId).emit("matchEnd", { reason: "time_up" });
      activeTimers.delete(contestId);
      clearRoomSubmissions(contestId);
      console.log(`FFA Contest ${contestId} ended completely.`);
    }, codingDurationMs + GRACE_PERIOD_MS);

    activeTimers.set(contestId, { codingTimerId, totalTimerId });
    console.log(`FFA Contest ${contestId} started by ${adminName}. ${durationMinutes}m coding + 5m grace.`);
  });

  socket.on("getMatchDetails", ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.endTime) {
      socket.emit("matchDetails", { 
        endTime: room.endTime,
        graceEndTime: room.graceEndTime || null,
        isFFA: room.isFFA || false
      });
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
      clearRoomSubmissions(roomId);
      io.to(roomId).emit("matchEnd", { reason: "both_teams_finished" });
    }
  });

  socket.on("extractSquad", ({ roomId, teamId }) => {
    const room = rooms[roomId];
    if (!room) return;

    updateTime(teamId);

    io.to(`${roomId}-team-${teamId}`).emit("squadExtracted");

  });

  socket.on("deleteRoom", ({ roomId }) => {
    const room = rooms[roomId];

    if (!room) return;

    const allPlayers = [...room.teamA, ...room.teamB].filter((p) => p !== null);
    allPlayers.forEach((p) => {
      delete userToRoom[p.pid];
    });

    if (activeTimers.has(roomId)) {
      const timers = activeTimers.get(roomId);
      if (typeof timers === 'object') {
        clearTimeout(timers.codingTimerId);
        clearTimeout(timers.totalTimerId);
      } else {
        clearTimeout(timers);
      }
      activeTimers.delete(roomId);
    }
    clearRoomSubmissions(roomId);

    delete rooms[roomId];
  });
}
