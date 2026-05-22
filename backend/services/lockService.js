import { getRedisClient } from './redis.js';
import { randomUUID } from 'crypto';

// Acquire a lock with a unique token. Returns token string on success, null on failure.
export async function acquireLock(key, ttlMs = 5000, retries = 5, retryDelayMs = 100) {
  const client = getRedisClient();
  const token = randomUUID();
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ok = await client.set(key, token, { NX: true, PX: ttlMs });
    if (ok) return token;
    // wait and retry
    await new Promise((res) => setTimeout(res, retryDelayMs));
  }
  return null;
}

// Release lock only if token matches (atomic via Lua script)
export async function releaseLock(key, token) {
  const client = getRedisClient();
  const lua = `if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end`;
  try {
    const res = await client.eval(lua, { keys: [key], arguments: [token] });
    return res === 1 || res === '1';
  } catch (e) {
    console.error('releaseLock error', e);
    return false;
  }
}

// Convenience: run a critical section with lock
export async function withLock(key, fn, opts = {}) {
  const { ttlMs = 5000, retries = 5, retryDelayMs = 100 } = opts;
  const token = await acquireLock(key, ttlMs, retries, retryDelayMs);
  if (!token) throw new Error('Failed to acquire lock');
  try {
    return await fn();
  } finally {
    await releaseLock(key, token);
  }
}
