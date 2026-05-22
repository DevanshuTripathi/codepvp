import { getRedisClient } from './redis.js';
import { createCompetitiveRoom } from './roomService.js';
import { scheduleTimer } from './timerService.js';
import { withLock } from './lockService.js';

const PARTY_KEY = (code) => `party:${code}`; // hash
const USER_PARTY = (username) => `user:${username}:party`;
const QUEUE_KEY = (mode) => `matchmaking:queue:${mode}`;
const LOCK_KEY = (mode) => `matchmaking:lock:${mode}`;

export async function createParty(partyCode, leader, avatar) {
  const client = getRedisClient();
  const party = { leader, mode: '1v1' };
  await client.hSet(PARTY_KEY(partyCode), party);
  await client.rPush(`${PARTY_KEY(partyCode)}:members`, JSON.stringify({ username: leader, avatar: avatar || null }));
  await client.set(USER_PARTY(leader), partyCode);
}

export async function getParty(partyCode) {
  const client = getRedisClient();
  const meta = await client.hGetAll(PARTY_KEY(partyCode));
  if (!meta || Object.keys(meta).length === 0) return null;
  const members = await client.lRange(`${PARTY_KEY(partyCode)}:members`, 0, -1);
  return { ...meta, members: members.map(m => JSON.parse(m)) };
}

export async function addMemberToParty(partyCode, username, avatar) {
  const client = getRedisClient();
  await client.rPush(`${PARTY_KEY(partyCode)}:members`, JSON.stringify({ username, avatar: avatar || null }));
  await client.set(USER_PARTY(username), partyCode);
}

export async function removeMemberFromParty(partyCode, username) {
  const client = getRedisClient();
  const members = await client.lRange(`${PARTY_KEY(partyCode)}:members`, 0, -1);
  const filtered = members.filter(m => JSON.parse(m).username !== username);
  await client.del(`${PARTY_KEY(partyCode)}:members`);
  if (filtered.length) await client.rPush(`${PARTY_KEY(partyCode)}:members`, filtered);
  await client.del(USER_PARTY(username));
}

export async function enqueueToQueue(mode, payload) {
  const client = getRedisClient();
  await client.rPush(QUEUE_KEY(mode), JSON.stringify(payload));
}

export async function leaveQueue(mode, username) {
  const client = getRedisClient();
  const list = await client.lRange(QUEUE_KEY(mode), 0, -1);
  const filtered = list.filter(l => {
    try { const obj = JSON.parse(l); return obj.leader !== username && !(obj.party && obj.party.includes(username)); } catch (e) { return true; }
  });
  await client.del(QUEUE_KEY(mode));
  if (filtered.length) await client.rPush(QUEUE_KEY(mode), filtered);
}

export async function tryMatch(io, mode) {
  const client = getRedisClient();
  const lockKey = LOCK_KEY(mode);

  // Run match attempt under a distributed lock
  try {
    await withLock(lockKey, async () => {
      const len = await client.lLen(QUEUE_KEY(mode));
      if (len < 2) return;

      // Pop two entries
      const aRaw = await client.lPop(QUEUE_KEY(mode));
      const bRaw = await client.lPop(QUEUE_KEY(mode));
      if (!aRaw || !bRaw) return;
      const a = JSON.parse(aRaw);
      const b = JSON.parse(bRaw);

      const teamA = a.party || [a.leader];
      const teamB = b.party || [b.leader];

      // Create competitive room (stores metadata in Firestore & Redis)
      const { roomId, endTime } = await createCompetitiveRoom(teamA, teamB, mode);

      const time = 15; // minutes
      const durationMs = time * 60 * 1000;

      // schedule match end
      await scheduleTimer(`room:${roomId}:matchEnd`, Date.now() + durationMs, { event: 'matchEnd', roomId });

      // Notify players
      for (const username of teamA) io.to(username).emit('matchFound', { roomId, team: 'A', endTime });
      for (const username of teamB) io.to(username).emit('matchFound', { roomId, team: 'B', endTime });
    }, { ttlMs: 5000, retries: 2, retryDelayMs: 100 });
  } catch (e) {
    // lock acquisition failed or error inside critical section
    if (e && e.message && e.message.includes('Failed to acquire lock')) return;
    console.error('tryMatch error', e);
  }
}
