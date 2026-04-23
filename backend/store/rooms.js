export const rooms = {}; // Stores 'waiting' and 'in-progress' rooms
export const userToRoom = {}; // Maps user to roomId
export const activeTimers = new Map();
export const frontendQueue = [];
export const frontendRooms = {}; // Stores rooms for frontend display (includes 'waiting', 'in-progress', and 'completed')
export const frontendUserToRoom = {}; // Maps frontend player to frontend roomId
