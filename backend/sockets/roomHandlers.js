import { addUserToSlot, removeUserFromRoom, createRoom, getRoom, toggleReady } from "../services/roomService.js";
import { setUserRoom, clearUserRoom, getUserRoom } from "../services/userService.js";

export function roomHandlers(io, socket) {
    socket.on("joinRoom", async ({ roomId, username, SLOT_COUNT = 3 }) => {
        socket.username = username;
        socket.roomId = roomId;

        // Ensure room exists
        const existing = await getRoom(roomId);
        if (!existing) {
            await createRoom(roomId, username, SLOT_COUNT);
        }

        // Persist mapping user -> room
        await setUserRoom(username, roomId);

        // Join socket.io room
        socket.join(roomId);
        socket.join(username); // personal room

        const room = await getRoom(roomId);
        io.to(roomId).emit("roomUpdate", room);
    });

    socket.on("joinSlot", async ({ roomId, team, slotIndex, username, SLOT_COUNT = 3 }) => {
        // create room if missing
        const existing = await getRoom(roomId);
        if (!existing) await createRoom(roomId, username, SLOT_COUNT);

        await addUserToSlot(roomId, team, slotIndex, username);
        await setUserRoom(username, roomId);
        socket.join(roomId);

        const room = await getRoom(roomId);
        io.to(roomId).emit("roomUpdate", room);
    });

    socket.on("toggleReady", async ({ roomId, team, slotIndex, username }) => {
        const room = await toggleReady(roomId, team, slotIndex, username);
        if (room) io.to(roomId).emit("roomUpdate", room);
    });

    socket.on("disconnectRoom", async ({ username, roomId }) => {
        await clearUserRoom(username);
        const room = await removeUserFromRoom(roomId, username);
        socket.leave(roomId);
        if (room) io.to(roomId).emit("roomUpdate", room);
    });
}