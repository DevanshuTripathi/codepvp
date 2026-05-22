import { getRedisClient } from './redis.js';
import { scheduleTimer } from './timerService.js';

const QUEUE_KEY = 'frontend:queue';
const ROOM_KEY = (id) => `frontend:room:${id}`;
const ROOM_PLAYERS = (id) => `frontend:room:${id}:players`;
const ROOM_FILES = (id) => `frontend:room:${id}:files`;
const ROOM_META = (id) => `frontend:room:${id}:meta`;

export async function enqueueFrontend(username) {
  const client = getRedisClient();
  const exists = await client.lRange(QUEUE_KEY, 0, -1);
  if (exists.includes(username)) return;
  await client.rPush(QUEUE_KEY, username);
}

export async function dequeueFrontend(username) {
  const client = getRedisClient();
  const list = await client.lRange(QUEUE_KEY, 0, -1);
  const filtered = list.filter(u => u !== username);
  await client.del(QUEUE_KEY);
  if (filtered.length) await client.rPush(QUEUE_KEY, filtered);
}

export async function tryCreateFrontendMatch() {
  const client = getRedisClient();
  const len = await client.lLen(QUEUE_KEY);
  if (len < 4) return null;
  const players = [];
  for (let i = 0; i < 4; i++) {
    const p = await client.lPop(QUEUE_KEY);
    if (p) players.push(p);
  }
  if (players.length < 4) return null;

  const roomId = Math.floor(100000 + Math.random() * 900000).toString();
  const start = Date.now();
  const time = 15 * 60 * 1000;
  const end = start + time;

  await client.hSet(ROOM_META(roomId), { status: 'in-progress', startTime: String(start), endTime: String(end) });
  await client.rPush(ROOM_PLAYERS(roomId), players);

  // initialize files
  for (const p of players) {
    await client.hSet(ROOM_FILES(roomId), p, JSON.stringify({ '/App.js': 'export default function App() {\n  return <h1>Hello PixelPvP</h1>;\n}\n' }));
  }

  // schedule end timer and voting cleanup
  await scheduleTimer(`frontend:${roomId}:end`, end, { event: 'frontendMatchEnd', roomId });

  return { roomId, players, endTime: end };
}

export async function getFrontendRoom(roomId) {
  const client = getRedisClient();
  const meta = await client.hGetAll(ROOM_META(roomId));
  if (!meta || Object.keys(meta).length === 0) return null;
  const players = await client.lRange(ROOM_PLAYERS(roomId), 0, -1);
  const filesRaw = await client.hGetAll(ROOM_FILES(roomId));
  const files = {};
  for (const [k, v] of Object.entries(filesRaw || {})) files[k] = JSON.parse(v);
  return { ...meta, players, playerFiles: files };
}

export async function updatePlayerFile(roomId, username, path, code) {
  const client = getRedisClient();
  const filesRaw = await client.hGet(ROOM_FILES(roomId), username) || '{}';
  const obj = JSON.parse(filesRaw);
  obj[path] = code;
  await client.hSet(ROOM_FILES(roomId), username, JSON.stringify(obj));
  await client.hSet(ROOM_META(roomId), { updatedAt: String(Date.now()) });
}

export async function submitVotes(roomId, voter, votes) {
  const client = getRedisClient();
  const key = `frontend:room:${roomId}:votes`;
  const voted = await client.sIsMember(`${key}:voters`, voter);
  if (voted) return false;
  await client.sAdd(`${key}:voters`, voter);
  for (const [player, score] of Object.entries(votes)) {
    await client.hIncrBy(`${key}:scores`, player, Number(score));
    await client.hIncrBy(`${key}:counts`, player, 1);
  }
  return true;
}

export async function deleteFrontendRoom(roomId) {
  const client = getRedisClient();
  await client.del(ROOM_META(roomId));
  await client.del(ROOM_PLAYERS(roomId));
  await client.del(ROOM_FILES(roomId));
}
