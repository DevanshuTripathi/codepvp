import { createClient } from 'redis';

let client = null;

function getRedisUrl() {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = process.env.REDIS_PORT || 6379;
  const user = process.env.REDIS_USERNAME;
  const pass = process.env.REDIS_PASSWORD || process.env.REDIS_PASS || '';

  if (user) return `redis://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}`;
  if (pass) return `redis://:${encodeURIComponent(pass)}@${host}:${port}`;
  return `redis://${host}:${port}`;
}

export async function initRedis() {
  if (client) return client;
  const url = getRedisUrl();
  client = createClient({ url });

  client.on('error', (err) => console.error('Redis Client Error', err));
  client.on('connect', () => console.log('Redis connecting...'));
  client.on('ready', () => console.log('Redis ready'));
  client.on('reconnecting', () => console.warn('Redis reconnecting'));
  client.on('end', () => console.warn('Redis connection closed'));

  try {
    await client.connect();
  } catch (e) {
    console.error('Failed to connect Redis:', e);
    // do not throw — allow app to continue and handle gracefully
  }

  return client;
}

export function getRedisClient() {
  if (!client) throw new Error('Redis client not initialized. Call initRedis() first.');
  return client;
}
