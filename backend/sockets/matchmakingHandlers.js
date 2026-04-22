import { db, admin } from "../firebaseAdmin.js";
import { activeTimers, rooms } from "../store/rooms.js";

// ─── Per-mode queues ──────────────────────────────────────────────────────────
const queues = {
  "1v1": [],
  "2v2": [],
  "3v3": [],
  "4v4": [],
};

// ─── Party store ──────────────────────────────────────────────────────────────
// partyCode → { leader, mode, members: [{ username, avatar }] }
const parties = {};

// username → partyCode
const userToParty = {};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function teamSizeForMode(mode) {
  return parseInt(mode[0]); // 1, 2, 3, 4
}

function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export function matchmakingHandlers(io, socket) {

  // ── Party: create ──────────────────────────────────────────────────────────
  socket.on("createParty", ({ partyCode, username, avatar }) => {
    if (userToParty[username]) {
      const oldCode = userToParty[username];
      if (parties[oldCode]?.leader === username) {
        delete parties[oldCode];
      }
    }

    parties[partyCode] = {
      leader: username,
      mode: "1v1", // Default mode
      members: [{ username, avatar: avatar || null }],
    };
    userToParty[username] = partyCode;

    socket.join(`party:${partyCode}`);
    console.log(`[Party] ${username} created party ${partyCode}`);
    
    io.to(`party:${partyCode}`).emit("partyUpdated", { 
      partyCode,
      leader: username,
      mode: parties[partyCode].mode,
      members: parties[partyCode].members 
    });
  });

  // ── Party: join ────────────────────────────────────────────────────────────
  socket.on("joinParty", ({ partyCode, username, avatar }) => {
    const party = parties[partyCode];

    if (!party) {
      socket.emit("partyJoinError", { message: "Party not found. Check the code and try again." });
      return;
    }

    if (party.members.some(m => m.username === username)) return;

    if (userToParty[username]) {
      const oldCode = userToParty[username];
      if (parties[oldCode]) {
        parties[oldCode].members = parties[oldCode].members.filter(m => m.username !== username);
        
        // Handle leader leaving
        if (parties[oldCode].members.length === 0) {
          delete parties[oldCode];
        } else if (parties[oldCode].leader === username) {
          parties[oldCode].leader = parties[oldCode].members[0].username;
          io.to(`party:${oldCode}`).emit("partyUpdated", { 
            partyCode: oldCode, leader: parties[oldCode].leader, mode: parties[oldCode].mode, members: parties[oldCode].members 
          });
        } else {
          io.to(`party:${oldCode}`).emit("partyUpdated", { 
            partyCode: oldCode, leader: parties[oldCode].leader, mode: parties[oldCode].mode, members: parties[oldCode].members 
          });
        }
        socket.leave(`party:${oldCode}`);
      }
    }

    party.members.push({ username, avatar: avatar || null });
    userToParty[username] = partyCode;

    socket.join(`party:${partyCode}`);

    io.to(`party:${partyCode}`).emit("partyUpdated", { 
      partyCode,
      leader: party.leader,
      mode: party.mode,
      members: party.members 
    });

    console.log(`[Party] ${username} joined party ${partyCode}. Members: ${party.members.map(m => m.username).join(", ")}`);
  });

  // ── Party: Change Mode ─────────────────────────────────────────────────────
  socket.on("changePartyMode", ({ partyCode, username, mode }) => {
    const party = parties[partyCode];
    // Only allow mode changes if the requester is the party leader
    if (party && party.leader === username) {
      party.mode = mode;
      io.to(`party:${partyCode}`).emit("partyUpdated", {
        partyCode,
        leader: party.leader,
        mode: party.mode,
        members: party.members
      });
      console.log(`[Party] ${partyCode} mode changed to ${mode} by ${username}`);
    }
  });

  // ── Matchmaking: join queue ────────────────────────────────────────────────
  socket.on("joinQueue", async ({ username, party, mode }) => {
    const validMode = queues[mode] ? mode : "1v1";
    const queue = queues[validMode];
    const size = teamSizeForMode(validMode);

    if (party.length !== size) {
      socket.emit("queueError", {
        message: `You need exactly ${size} player${size > 1 ? "s" : ""} in your party for ${validMode}.`,
      });
      return;
    }

    const existingIdx = queue.findIndex(e => e.leader === username);
    if (existingIdx !== -1) queue.splice(existingIdx, 1);

    queue.push({ leader: username, party });
    console.log(`[Queue:${validMode}] ${username} (party: ${party.join(", ")}) joined. Queue size: ${queue.length}`);

    await tryMatch(io, validMode);
  });

  // ── Matchmaking: leave queue ───────────────────────────────────────────────
  socket.on("leaveQueue", ({ username, mode }) => {
    const validMode = queues[mode] ? mode : "1v1";
    const queue = queues[validMode];
    const idx = queue.findIndex(e => e.leader === username || e.party.includes(username));
    if (idx !== -1) {
      queue.splice(idx, 1);
      console.log(`[Queue:${validMode}] ${username} left. Queue size: ${queue.length}`);
    }
  });

  // ── Disconnect: clean up queues and parties ────────────────────────────────
  socket.on("disconnect", () => {
    const username = socket.username;
    if (!username) return;

    for (const mode of Object.keys(queues)) {
      const queue = queues[mode];
      const idx = queue.findIndex(e => e.leader === username || e.party.includes(username));
      if (idx !== -1) {
        queue.splice(idx, 1);
        console.log(`[Queue:${mode}] ${username} removed on disconnect.`);
      }
    }

    const partyCode = userToParty[username];
    if (partyCode && parties[partyCode]) {
      parties[partyCode].members = parties[partyCode].members.filter(m => m.username !== username);
      
      if (parties[partyCode].members.length === 0) {
        delete parties[partyCode];
      } else if (parties[partyCode].leader === username) {
        // Assign new leader
        parties[partyCode].leader = parties[partyCode].members[0].username;
        io.to(`party:${partyCode}`).emit("partyUpdated", { 
          partyCode, leader: parties[partyCode].leader, mode: parties[partyCode].mode, members: parties[partyCode].members 
        });
      } else {
        io.to(`party:${partyCode}`).emit("partyUpdated", { 
          partyCode, leader: parties[partyCode].leader, mode: parties[partyCode].mode, members: parties[partyCode].members 
        });
      }
    }
    delete userToParty[username];
  });
}

// ─── Match logic ──────────────────────────────────────────────────────────────

async function tryMatch(io, mode) {
  const queue = queues[mode];
  const size = teamSizeForMode(mode);

  // For team modes we need 2 full parties; for 1v1 we need 2 individual entries
  if (queue.length < 2) return;

  const groupA = queue.shift();
  const groupB = queue.shift();

  const teamA = groupA.party; // string[]
  const teamB = groupB.party; // string[]

  const roomData = await createRoom(teamA, teamB, mode);
  const { roomId, endTime } = roomData;

  const time = 15;
  const durationMs = time * 60 * 1000;

  const timerId = setTimeout(() => {
    io.to(roomId).emit("matchEnd", { reason: "time_up" });
    activeTimers.delete(roomId);
  }, durationMs);
  activeTimers.set(roomId, timerId);

  // Make all player sockets join the room channel
  const allPlayers = [...teamA, ...teamB];
  io.sockets.sockets.forEach((s) => {
    if (allPlayers.includes(s.username)) {
      s.join(roomId);
    }
  });

  // Notify team A
  teamA.forEach(username => {
    io.to(username).emit("matchFound", { roomId, team: "A", endTime });
  });

  // Notify team B
  teamB.forEach(username => {
    io.to(username).emit("matchFound", { roomId, team: "B", endTime });
  });

  console.log(`[Match:${mode}] Room ${roomId} created. TeamA: ${teamA.join(", ")} | TeamB: ${teamB.join(", ")}`);
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