import EventEmitter from 'events';
import { createClient } from 'redis';
import { initRedis, getRedisClient } from './redis.js';
import { randomUUID } from 'crypto';

const CHANNEL = 'room-events';
const emitter = new EventEmitter();
let pub = null;
let sub = null;

function getRedisUrlFromEnv() {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = process.env.REDIS_PORT || 6379;
  const user = process.env.REDIS_USERNAME;
  const pass = process.env.REDIS_PASSWORD || process.env.REDIS_PASS || '';

  if (user) return `redis://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}`;
  if (pass) return `redis://:${encodeURIComponent(pass)}@${host}:${port}`;
  return `redis://${host}:${port}`;
}

export async function initPubSub() {
  if (pub && sub) return { pub, sub };
  const url = getRedisUrlFromEnv();
  pub = createClient({ url });
  sub = createClient({ url });

  pub.on('error', (e) => console.error('pub error', e));
  sub.on('error', (e) => console.error('sub error', e));

  try {
    await pub.connect();
    await sub.connect();
    await sub.subscribe(CHANNEL, (message) => {
      try {
        const data = JSON.parse(message);
        // Lightweight dedupe: if message includes id, ensure we only process it once
        (async () => {
          try {
            const client = getRedisClient();
            if (data.id) {
              const key = `pubsub:seen:${data.id}`;
              const setRes = await client.set(key, '1', { NX: true, EX: 30 });
              if (!setRes) return; // already seen
            }
            emitter.emit(data.type || 'message', data);
          } catch (e) {
            console.error('pubsub dedupe check error', e);
            emitter.emit(data.type || 'message', data);
          }
        })();
      } catch (e) {
        console.error('pubsub parse error', e);
      }
    });
  } catch (e) {
    console.error('Failed to init pubsub', e);
  }

  return { pub, sub };
}

export async function publish(type, payload) {
  if (!pub) await initPubSub();
  try {
    const replica = process.env.REPLICA_ID || null;
    const msg = JSON.stringify({ id: randomUUID(), replica, type, ...payload });
    await pub.publish(CHANNEL, msg);
  } catch (e) {
    console.error('publish error', e);
  }
}

export function on(eventType, handler) {
  emitter.on(eventType, handler);
}
