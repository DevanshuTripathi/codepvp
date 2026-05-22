import { getRedisClient } from './redis.js';

const USER_ROOM_KEY = (username) => `user:${username}:room`;

export async function setUserRoom(username, roomId, ttlSeconds = 600) {
  const client = getRedisClient();
  await client.set(USER_ROOM_KEY(username), roomId, { EX: ttlSeconds });
}

export async function getUserRoom(username) {
  const client = getRedisClient();
  return await client.get(USER_ROOM_KEY(username));
}

export async function clearUserRoom(username) {
  const client = getRedisClient();
  await client.del(USER_ROOM_KEY(username));
}
