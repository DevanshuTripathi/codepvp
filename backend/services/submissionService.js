import { getRedisClient } from './redis.js';

const SUB_KEY = (id) => `submission:${id}`;
const ROOM_SUB_SET = (roomId) => `submission:room:${roomId}:set`;

export async function saveSubmission(id, data) {
  const client = getRedisClient();
  await client.hSet(SUB_KEY(id), data);
  if (data.roomId) await client.sAdd(ROOM_SUB_SET(data.roomId), id);
}

export async function getSubmission(id) {
  const client = getRedisClient();
  return await client.hGetAll(SUB_KEY(id));
}

export async function deleteSubmissionsByRoom(roomId) {
  const client = getRedisClient();
  const ids = await client.sMembers(ROOM_SUB_SET(roomId));
  if (!ids || ids.length === 0) return 0;
  const multi = client.multi();
  for (const id of ids) {
    multi.del(SUB_KEY(id));
    multi.sRem(ROOM_SUB_SET(roomId), id);
  }
  await multi.exec();
  return ids.length;
}
