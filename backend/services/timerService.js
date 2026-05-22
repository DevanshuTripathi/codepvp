import { getRedisClient } from './redis.js';
import { publish } from './pubsub.js';

const TIMERS_ZSET = 'timers:zset';
let running = false;

export async function scheduleTimer(key, timestamp, payload = {}) {
  const client = getRedisClient();
  const member = JSON.stringify({ key, payload });
  // Use score as timestamp (ms)
  await client.zAdd(TIMERS_ZSET, [{ score: Number(timestamp), value: member }]);
}

export async function cancelTimer(key) {
  const client = getRedisClient();
  // remove members matching key
  const all = await client.zRange(TIMERS_ZSET, 0, -1);
  const toRemove = all.filter(m => {
    try { return JSON.parse(m).key === key; } catch (e) { return false; }
  });
  if (toRemove.length) await client.zRem(TIMERS_ZSET, toRemove);
}

async function popDueTimers(now) {
  const client = getRedisClient();
  // zRangeByScore to get due members
  const due = await client.zRangeByScore(TIMERS_ZSET, 0, now, { LIMIT: { offset: 0, count: 100 } });
  if (!due || due.length === 0) return [];

  // Attempt to remove them atomically and process only those removed successfully
  const multi = client.multi();
  for (const member of due) multi.zRem(TIMERS_ZSET, member);
  const res = await multi.exec();

  const removed = [];
  for (let i = 0; i < due.length; i++) {
    const r = res[i];
    // redis-multi exec returns integer replies for zRem
    if (r && r > 0) removed.push(due[i]);
  }

  return removed;
}

export async function timerWorkerLoop() {
  if (running) return;
  running = true;
  const client = getRedisClient();
  if (!client) throw new Error('Redis not initialized for timer worker');

  while (running) {
    try {
      const now = Date.now();
      const dueMembers = await popDueTimers(now);
      for (const member of dueMembers) {
        try {
          const parsed = JSON.parse(member);
          // Publish a generic timer:fired pubsub event
          await publish('timerFired', { key: parsed.key, payload: parsed.payload, firedAt: now });
        } catch (e) {
          console.error('timerWorker parse error', e);
        }
      }
    } catch (e) {
      console.error('timer worker error', e);
    }
    // Sleep for a short interval
    await new Promise((r) => setTimeout(r, 500));
  }
}

export function stopTimerWorker() {
  running = false;
}
