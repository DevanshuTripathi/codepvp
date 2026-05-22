import { getRoom, setRoomStatus, setRoomTimes, setTeamFinished, deleteRoom } from '../services/roomService.js';
import { setUserRoom, clearUserRoom } from '../services/userService.js';
import { deleteSubmissionsByRoom } from '../services/submissionService.js';
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

async function updateTime(teamId) {
  await contestTeamCollection.doc(teamId).update({ finishedAt: FieldValue.serverTimestamp() });
}

export function gameHandlers(io, socket) {
  socket.on('startGame', ({ roomId, username, time }) => {
    (async () => {
      const room = await getRoom(roomId);
      if (!room || room.owner !== username) return;

      const allReady = [...(room.teamA || []), ...(room.teamB || [])].filter(Boolean).every(p => p.ready);
      if (!allReady) return;

      const durationSec = time * 60;
      const startTime = Date.now();
      const endTime = startTime + durationSec * 1000;

      await setRoomStatus(roomId, 'in-progress');
      await setRoomTimes(roomId, { startTime, endTime, duration: durationSec });
      // timer scheduling removed in simplified architecture

      io.to(roomId).emit('navigateToProblemset', { roomId, room: await getRoom(roomId) });
    })();
  });

  socket.on('forceStartTournamentMatch', ({ roomId, p1Username, p2Username, time, adminName }) => {
    (async () => {
      const startTime = Date.now();
      const durationSec = time * 60;
      const endTime = startTime + durationSec * 1000;

      await setRoomStatus(roomId, 'in-progress');
      await setRoomTimes(roomId, { startTime, endTime, duration: durationSec });
      // timer scheduling removed in simplified architecture

      io.to(p1Username).emit('tournamentMatchStarted', { roomId, team: 'A' });
      if (p2Username) io.to(p2Username).emit('tournamentMatchStarted', { roomId, team: 'B' });
    })();
  });

  socket.on('startFFAContest', ({ contestId, adminName, durationMinutes }) => {
    (async () => {
      const GRACE_PERIOD_MS = 5 * 60 * 1000;
      const codingDurationMs = durationMinutes * 60 * 1000;
      const now = Date.now();

      await setRoomStatus(contestId, 'in-progress');
      await setRoomTimes(contestId, { startTime: now, endTime: now + codingDurationMs, duration: durationMinutes * 60 });
      // timer scheduling removed in simplified architecture

      console.log(`FFA Contest ${contestId} started by ${adminName}. ${durationMinutes}m coding + 5m grace.`);
    })();
  });

  socket.on('getMatchDetails', ({ roomId }) => {
    (async () => {
      const room = await getRoom(roomId);
      if (room && room.endTime) {
        socket.emit('matchDetails', { endTime: Number(room.endTime), graceEndTime: Number(room.graceEndTime) || null, isFFA: !!room.isFFA });
      } else {
        socket.emit('matchDetails', { endTime: null });
      }
    })();
  });

  socket.on('finishGame', ({ roomId, teamId }) => {
    (async () => {
      const finishTime = Date.now();
      const room = await setTeamFinished(roomId, teamId, finishTime);
      io.to(roomId).emit('teamFinishedUpdate', { teamId, finishTime });

      if (room.teamAFinishedTime && room.teamBFinishedTime) {
        // cancelTimer removed; timers not managed by backend in simplified architecture
        await deleteSubmissionsByRoom(roomId);
        io.to(roomId).emit('matchEnd', { reason: 'both_teams_finished' });
      }
    })();
  });

  socket.on('extractSquad', ({ roomId, teamId }) => {
    (async () => {
      const room = await getRoom(roomId);
      if (!room) return;
      updateTime(teamId);
      io.to(`${roomId}-team-${teamId}`).emit('squadExtracted');
    })();
  });

  socket.on('deleteRoom', ({ roomId }) => {
    (async () => {
      const room = await getRoom(roomId);
      if (!room) return;
      const allPlayers = [...(room.teamA || []), ...(room.teamB || [])].filter(Boolean).map(p => p.pid);
      for (const p of allPlayers) await clearUserRoom(p);
      // cancelTimer removed; timers not managed by backend in simplified architecture
      await deleteSubmissionsByRoom(roomId);
      await deleteRoom(roomId);
    })();
  });
}

