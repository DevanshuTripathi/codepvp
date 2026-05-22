import { createParty, getParty, addMemberToParty, removeMemberFromParty, enqueueToQueue, leaveQueue, tryMatch as serviceTryMatch } from '../services/matchmakingService.js';

export function matchmakingHandlers(io, socket) {

  socket.on('createParty', async ({ partyCode, username, avatar }) => {
    await createParty(partyCode, username, avatar);
    socket.join(`party:${partyCode}`);
    const party = await getParty(partyCode);
    io.to(`party:${partyCode}`).emit('partyUpdated', { partyCode, ...party });
  });

  socket.on('joinParty', async ({ partyCode, username, avatar }) => {
    const party = await getParty(partyCode);
    if (!party) return socket.emit('partyJoinError', { message: 'Party not found' });
    await addMemberToParty(partyCode, username, avatar);
    socket.join(`party:${partyCode}`);
    const updated = await getParty(partyCode);
    io.to(`party:${partyCode}`).emit('partyUpdated', { partyCode, ...updated });
  });

  socket.on('changePartyMode', async ({ partyCode, username, mode }) => {
    // mode change stored as hash field
    // naive: update hash directly
    const party = await getParty(partyCode);
    if (!party || party.leader !== username) return;
    const client = (await import('../services/redis.js')).getRedisClient();
    await client.hSet(`party:${partyCode}`, { mode });
    const updated = await getParty(partyCode);
    io.to(`party:${partyCode}`).emit('partyUpdated', { partyCode, ...updated });
  });

  socket.on('joinQueue', async ({ username, party, mode }) => {
    const validMode = mode || '1v1';
    await enqueueToQueue(validMode, { leader: username, party });
    await serviceTryMatch(io, validMode);
  });

  socket.on('leaveQueue', async ({ username, mode }) => {
    const validMode = mode || '1v1';
    await leaveQueue(validMode, username);
  });

  socket.on('disconnect', async () => {
    const username = socket.username;
    if (!username) return;
    // best-effort cleanup
    await leaveQueue('1v1', username);
    await leaveQueue('2v2', username);
    await leaveQueue('3v3', username);
    await leaveQueue('4v4', username);
  });
}

// ─── Room creation ────────────────────────────────────────────────────────────

async function createRoom(teamAPlayers, teamBPlayers, mode) {
  const roomId = generateRoomCode();

  const difficulty = "Easy";
  const questions = mode === "1v1" ? 4 : teamSizeForMode(mode) * 2;
  const time = 15;

  const startTime = Date.now();
  const endTime = startTime + time * 60 * 1000;

  await db.collection("rooms").doc(roomId).set({
    difficulty,
    size: mode,
    questions,
    time,
    public: false,
    status: "in-progress",
    owner: teamAPlayers[0],
    startTime,
    endTime,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const snapshot = await db.collection("ProblemsWithHTC")
    .where("difficulty", "==", difficulty)
    .get();

  const allProblems = snapshot.docs.map(doc => ({
    id: doc.id,
    statusA: 0,
    statusB: 0,
    ...doc.data(),
  }));

  const selected = allProblems.sort(() => Math.random() - 0.5).slice(0, questions);

  await db.collection("RoomSet").doc(roomId).set({
    winningTeam: null,
    teamA: {
      name: "Team A",
      score: 0,
      players: teamAPlayers.map(pid => ({ pid, problemsSolved: 0, points: 0 })),
      solvedProblems: [],
    },
    teamB: {
      name: "Team B",
      score: 0,
      players: teamBPlayers.map(pid => ({ pid, problemsSolved: 0, points: 0 })),
      solvedProblems: [],
    },
    allProblems: selected,
    startedAt: startTime,
    endTime,
  });

  rooms[roomId] = {
    status: "in-progress",
    teamA: teamAPlayers.map(pid => ({ pid, ready: true })),
    teamB: teamBPlayers.map(pid => ({ pid, ready: true })),
    owner: teamAPlayers[0],
    startTime,
    endTime,
    duration: time * 60,
    teamAFinishedTime: null,
    teamBFinishedTime: null,
  };

  return { roomId, startTime, endTime };
}