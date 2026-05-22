import { listRooms, deleteRoom, getRoom } from './roomService.js';

let intervalId = null;

export function startSweeper({ intervalMs = 60_000, emptyRoomGraceMs = 5 * 60_1000 } = {}) {
  if (intervalId) return;
  intervalId = setInterval(async () => {
    try {
      const rooms = await listRooms();
      const now = Date.now();
      for (const r of rooms) {
        try {
          // if no users and not in-progress, or empty for longer than grace, delete
          const users = r.users || [];
          if ((!users || users.length === 0) && r.status !== 'in-progress') {
            await deleteRoom(r.id);
            continue;
          }
          // if room has startTime and ended long ago, delete
          const endTime = Number(r.endTime || 0);
          if (endTime && endTime + emptyRoomGraceMs < now) {
            await deleteRoom(r.id);
          }
        } catch (e) {
          // ignore per-room errors
        }
      }
    } catch (e) {
      console.error('sweeper error', e);
    }
  }, intervalMs);
}

export function stopSweeper() {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
}
