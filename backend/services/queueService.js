import { createClient } from 'redis';
import { getRedisClient } from './redis.js';

// Basic queue helpers using Redis lists for matchmaking/submissions
const MATCHMAKING_KEY = 'matchmaking:queue';
const SUBMISSIONS_KEY = 'submissions:queue';

export async function enqueueMatchmaking(payload) {
  const client = getRedisClient();
  await client.rPush(MATCHMAKING_KEY, JSON.stringify(payload));
}

export async function dequeueMatchmaking() {
  const client = getRedisClient();
  const raw = await client.lPop(MATCHMAKING_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function enqueueSubmission(payload) {
  const client = getRedisClient();
  await client.rPush(SUBMISSIONS_KEY, JSON.stringify(payload));
}

export async function dequeueSubmission() {
  const client = getRedisClient();
  const raw = await client.lPop(SUBMISSIONS_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}
