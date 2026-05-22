import { createClient } from 'redis';

let ioInstance = null;
let subClient = null;
let pubClient = null;

function getRedisUrlFromEnv() {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT || 6379;
  const username = process.env.REDIS_USERNAME;
  const password = process.env.REDIS_PASSWORD || process.env.REDIS_PASS || '';

  if (!host) return null;

  if (username) {
    return `redis://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}`;
  }

  if (password) {
    return `redis://:${encodeURIComponent(password)}@${host}:${port}`;
  }

  return `redis://${host}:${port}`;
}

export async function initRoomSync(io) {
  ioInstance = io;
  const url = getRedisUrlFromEnv();
  if (!url) {
    console.warn('No Redis configured — room sync disabled');
    return;
  }

  pubClient = createClient({ url });
  subClient = pubClient.duplicate();

  pubClient.on('error', (e) => console.error('roomSync pub error', e));
  subClient.on('error', (e) => console.error('roomSync sub error', e));

  await pubClient.connect();
  await subClient.connect();

  await subClient.subscribe('room-events', (message) => {
    try {
      const data = JSON.parse(message);
      // Broadcast incoming room events to local sockets if io present
      if (!ioInstance) return;
      const { type, roomId, room } = data;
      if (type === 'roomUpdate') {
        ioInstance.to(roomId).emit('roomUpdate', room);
      } else if (type === 'roomDelete') {
        ioInstance.to(roomId).emit('roomDelete', { roomId });
      }
    } catch (e) {
      console.error('Failed to parse room-events message', e);
    }
  });

  console.log('✅ Room sync (pub/sub) initialized');
}

export async function publishRoomEvent(type, payload = {}) {
  try {
    if (!pubClient) {
      const url = getRedisUrlFromEnv();
      if (!url) return;
      pubClient = createClient({ url });
      await pubClient.connect();
    }
    const message = JSON.stringify({ type, ...payload });
    await pubClient.publish('room-events', message);
  } catch (e) {
    console.error('Failed to publish room event', e);
  }
}
