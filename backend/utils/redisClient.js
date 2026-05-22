import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

function getRedisUrlFromEnv() {
  // Prefer a single REDIS_URL (Upstash style), otherwise build from parts
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

export async function attachRedisAdapter(io) {
  const url = getRedisUrlFromEnv();
  if (!url) {
    console.warn('No REDIS_URL / REDIS_HOST configured — socket.io adapter not attached');
    return null;
  }

  const pubClient = createClient({ url });
  const subClient = pubClient.duplicate();

  pubClient.on('error', (err) => console.error('Redis Pub Client Error', err));
  subClient.on('error', (err) => console.error('Redis Sub Client Error', err));

  await pubClient.connect();
  await subClient.connect();

  const adapter = createAdapter(pubClient, subClient);
  io.adapter(adapter);

  console.log('✅ Socket.IO Redis adapter attached');

  return { pubClient, subClient };
}
