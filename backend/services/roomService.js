import { getRedisClient, initRedis } from './redis.js';
import { publish } from './pubsub.js';
import { db } from '../firebaseAdmin.js';
import admin from 'firebase-admin';

// Key helpers
const ROOM_KEY = (id) => `room:${id}`;
const TEAM_KEY = (id, team) => `room:${id}:team${team}`;
const USERS_KEY = (id) => `room:${id}:users`;
const MESSAGES_KEY = (id) => `room:${id}:messages`;
const CODE_KEY = (id) => `room:${id}:code`;

export async function initRoomService() {
  await initRedis();
}

export async function createRoom(roomId, owner, slotCount = 3) {
  const client = getRedisClient();
  // store metadata
  await client.hSet(ROOM_KEY(roomId), {
    owner: owner || '',
    public: 'true',
    status: 'waiting',
    slotCount: String(slotCount)
  });

  // initialize teams with placeholders (empty slots represented by "null")
  const empty = Array.from({ length: slotCount }, () => JSON.stringify(null));
  await client.del(TEAM_KEY(roomId, 'A'));
  await client.del(TEAM_KEY(roomId, 'B'));
  if (empty.length) {
    await client.rPush(TEAM_KEY(roomId, 'A'), empty);
    await client.rPush(TEAM_KEY(roomId, 'B'), empty);
  }

  await publish('roomCreate', { roomId });
}

export async function getRoom(roomId) {
  const client = getRedisClient();
  const meta = await client.hGetAll(ROOM_KEY(roomId));
  if (!meta || Object.keys(meta).length === 0) return null;

  const slotCount = parseInt(meta.slotCount || '3', 10);
  const teamA = await client.lRange(TEAM_KEY(roomId, 'A'), 0, -1);
  const teamB = await client.lRange(TEAM_KEY(roomId, 'B'), 0, -1);
  const users = await client.sMembers(USERS_KEY(roomId));
  const messages = await client.lRange(MESSAGES_KEY(roomId), 0, -1);
  const code = await client.get(CODE_KEY(roomId));

  return {
    ...meta,
    slotCount,
    teamA: teamA.map((v) => (v === 'null' ? null : JSON.parse(v))),
    teamB: teamB.map((v) => (v === 'null' ? null : JSON.parse(v))),
    users,
    messages: messages.map((m) => JSON.parse(m)),
    code: code || null
  };
}

export async function addUserToSlot(roomId, team, slotIndex, username) {
  const client = getRedisClient();
  const key = TEAM_KEY(roomId, team);
  const slotVal = JSON.stringify({ pid: username, ready: false });
  await client.lSet(key, slotIndex, slotVal);
  await client.sAdd(USERS_KEY(roomId), username);
  const room = await getRoom(roomId);
  await publish('roomUpdate', { roomId, room });
  return room;
}

export async function removeUserFromRoom(roomId, username) {
  const client = getRedisClient();
  // remove from both teams by replacing matching entries with null
  for (const team of ['A', 'B']) {
    const listKey = TEAM_KEY(roomId, team);
    const len = await client.lLen(listKey);
    for (let i = 0; i < len; i++) {
      const raw = await client.lIndex(listKey, i);
      if (raw && raw !== 'null') {
        try {
          const obj = JSON.parse(raw);
          if (obj && obj.pid === username) {
            await client.lSet(listKey, i, JSON.stringify(null));
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }
  await client.sRem(USERS_KEY(roomId), username);

  // determine if room empty
  const users = await client.sMembers(USERS_KEY(roomId));
  if (!users || users.length === 0) {
    // delete room keys
    await client.del(ROOM_KEY(roomId));
    await client.del(TEAM_KEY(roomId, 'A'));
    await client.del(TEAM_KEY(roomId, 'B'));
    await client.del(USERS_KEY(roomId));
    await client.del(MESSAGES_KEY(roomId));
    await client.del(CODE_KEY(roomId));
    await publish('roomDelete', { roomId });
    return null;
  }

  const room = await getRoom(roomId);
  await publish('roomUpdate', { roomId, room });
  return room;
}

export async function toggleReady(roomId, team, slotIndex, username) {
  const client = getRedisClient();
  const key = TEAM_KEY(roomId, team);
  const raw = await client.lIndex(key, slotIndex);
  if (!raw || raw === 'null') return null;
  const obj = JSON.parse(raw);
  if (!obj || obj.pid !== username) return null;
  obj.ready = !obj.ready;
  await client.lSet(key, slotIndex, JSON.stringify(obj));
  const room = await getRoom(roomId);
  await publish('roomUpdate', { roomId, room });
  return room;
}

export async function appendMessage(roomId, message) {
  const client = getRedisClient();
  await client.rPush(MESSAGES_KEY(roomId), JSON.stringify(message));
  // trim to last 500
  await client.lTrim(MESSAGES_KEY(roomId), -500, -1);
  await publish('chatMessage', { roomId, message });
}

export async function setCode(roomId, code) {
  const client = getRedisClient();
  await client.set(CODE_KEY(roomId), code);
  await publish('codeUpdate', { roomId, code });
}

export async function getCode(roomId) {
  const client = getRedisClient();
  return await client.get(CODE_KEY(roomId));
}

export async function setCursor(roomId, username, cursor) {
  const client = getRedisClient();
  const key = `room:${roomId}:cursors`;
  await client.hSet(key, username, JSON.stringify(cursor));
  await publish('cursorUpdate', { roomId, username, cursor });
}

export async function getCursors(roomId) {
  const client = getRedisClient();
  const key = `room:${roomId}:cursors`;
  const raw = await client.hGetAll(key);
  const out = {};
  for (const [k, v] of Object.entries(raw || {})) out[k] = JSON.parse(v);
  return out;
}

export async function listRooms() {
  const client = getRedisClient();
  const found = [];
  // Use SCAN to iterate room keys
  let cursor = 0;
  do {
    const res = await client.scan(cursor, { MATCH: 'room:*', COUNT: 100 });
    cursor = Number(res.cursor);
    const keys = res.keys || res[1] || [];
    for (const k of keys) {
      // we only want top-level room:ID keys
      if (!k.startsWith('room:')) continue;
      const parts = k.split(':');
      if (parts.length === 2) {
        const id = parts[1];
        const r = await getRoom(id);
        if (r) found.push({ id, ...r });
      }
    }
  } while (cursor !== 0);
  return found;
}

export async function setRoomField(roomId, field, value) {
  const client = getRedisClient();
  await client.hSet(ROOM_KEY(roomId), { [field]: String(value) });
}

export async function setRoomStatus(roomId, status) {
  await setRoomField(roomId, 'status', status);
  const room = await getRoom(roomId);
  await publish('roomUpdate', { roomId, room });
}

export async function setRoomTimes(roomId, { startTime, endTime, duration }) {
  const client = getRedisClient();
  const obj = {};
  if (startTime) obj.startTime = String(startTime);
  if (endTime) obj.endTime = String(endTime);
  if (duration) obj.duration = String(duration);
  if (Object.keys(obj).length) await client.hSet(ROOM_KEY(roomId), obj);
  const room = await getRoom(roomId);
  await publish('roomUpdate', { roomId, room });
}

export async function setTeamFinished(roomId, teamId, timestamp) {
  const client = getRedisClient();
  await client.hSet(ROOM_KEY(roomId), { [`team${teamId}FinishedTime`]: String(timestamp) });
  const room = await getRoom(roomId);
  await publish('teamFinished', { roomId, teamId, timestamp, room });
  return room;
}

export async function deleteRoom(roomId) {
  const client = getRedisClient();
  await client.del(ROOM_KEY(roomId));
  await client.del(TEAM_KEY(roomId, 'A'));
  await client.del(TEAM_KEY(roomId, 'B'));
  await client.del(USERS_KEY(roomId));
  await client.del(MESSAGES_KEY(roomId));
  await client.del(CODE_KEY(roomId));
  await publish('roomDelete', { roomId });
}

export async function createCompetitiveRoom(teamAPlayers, teamBPlayers, mode) {
  const roomId = Math.floor(100000 + Math.random() * 900000).toString();

  const difficulty = 'Easy';
  const questions = mode === '1v1' ? 4 : parseInt(mode[0], 10) * 2;
  const time = 15;

  const startTime = Date.now();
  const endTime = startTime + time * 60 * 1000;

  await db.collection('rooms').doc(roomId).set({
    difficulty,
    size: mode,
    questions,
    time,
    public: false,
    status: 'in-progress',
    owner: teamAPlayers[0],
    startTime,
    endTime,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const snapshot = await db.collection('ProblemsWithHTC').where('difficulty', '==', difficulty).get();
  const allProblems = snapshot.docs.map(doc => ({ id: doc.id, statusA: 0, statusB: 0, ...doc.data() }));
  const selected = allProblems.sort(() => Math.random() - 0.5).slice(0, questions);

  await db.collection('RoomSet').doc(roomId).set({
    winningTeam: null,
    teamA: { name: 'Team A', score: 0, players: teamAPlayers.map(pid => ({ pid, problemsSolved: 0, points: 0 })), solvedProblems: [] },
    teamB: { name: 'Team B', score: 0, players: teamBPlayers.map(pid => ({ pid, problemsSolved: 0, points: 0 })), solvedProblems: [] },
    allProblems: selected,
    startedAt: startTime,
    endTime,
  });

  // store basic room metadata in redis
  await setRoomField(roomId, 'status', 'in-progress');
  await setRoomField(roomId, 'owner', teamAPlayers[0]);
  await setRoomField(roomId, 'startTime', String(startTime));
  await setRoomField(roomId, 'endTime', String(endTime));
  await setRoomField(roomId, 'duration', String(time * 60));

  // initialize teams lists
  const client = getRedisClient();
  const emptyA = teamAPlayers.map(pid => JSON.stringify({ pid, ready: true }));
  const emptyB = teamBPlayers.map(pid => JSON.stringify({ pid, ready: true }));
  await client.del(TEAM_KEY(roomId, 'A'));
  await client.del(TEAM_KEY(roomId, 'B'));
  if (emptyA.length) await client.rPush(TEAM_KEY(roomId, 'A'), emptyA);
  if (emptyB.length) await client.rPush(TEAM_KEY(roomId, 'B'), emptyB);

  await publish('roomCreate', { roomId });
  return { roomId, startTime, endTime };
}
