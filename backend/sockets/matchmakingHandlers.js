import { createParty, getParty, addMemberToParty, removeMemberFromParty, enqueueToQueue, leaveQueue, tryMatch as serviceTryMatch } from '../services/matchmakingService.js';

export function matchmakingHandlers(io, socket) {

  socket.on('createParty', async ({ partyCode, username, avatar }) => {
    await createParty(partyCode, username, avatar);
    socket.join(`party:${partyCode}`);
    const party = await getParty(partyCode);
    io.to(`party:${partyCode}`).emit('partyUpdated', { partyCode, ...party });
  });

  socket.on('joinParty', async ({ partyCode, username, avatar }) => {
    const party = await getParty(partyCode);
    if (!party) return socket.emit('partyJoinError', { message: 'Party not found' });
    await addMemberToParty(partyCode, username, avatar);
    socket.join(`party:${partyCode}`);
    const updated = await getParty(partyCode);
    io.to(`party:${partyCode}`).emit('partyUpdated', { partyCode, ...updated });
  });

  socket.on('changePartyMode', async ({ partyCode, username, mode }) => {
    // mode change stored as hash field
    // naive: update hash directly
    const party = await getParty(partyCode);
    if (!party || party.leader !== username) return;
    const client = (await import('../services/redis.js')).getRedisClient();
    await client.hSet(`party:${partyCode}`, { mode });
    const updated = await getParty(partyCode);
    io.to(`party:${partyCode}`).emit('partyUpdated', { partyCode, ...updated });
  });

  socket.on('joinQueue', async ({ username, party, mode }) => {
    const validMode = mode || '1v1';
    await enqueueToQueue(validMode, { leader: username, party });
    await serviceTryMatch(io, validMode);
  });

  socket.on('leaveQueue', async ({ username, mode }) => {
    const validMode = mode || '1v1';
    await leaveQueue(validMode, username);
  });

  socket.on('disconnect', async () => {
    const username = socket.username;
    if (!username) return;
    // best-effort cleanup
    await leaveQueue('1v1', username);
    await leaveQueue('2v2', username);
    await leaveQueue('3v3', username);
    await leaveQueue('4v4', username);
  });
}

// ─── Room creation ────────────────────────────────────────────────────────────
// Room creation is handled by `roomService.createCompetitiveRoom`