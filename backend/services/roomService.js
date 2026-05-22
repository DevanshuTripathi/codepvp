import { getRedisClient, initRedis } from './redis.js';
import { publish } from './pubsub.js';

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
        if (r) found.push(r);
      }
    }
  } while (cursor !== 0);
  return found;
}
