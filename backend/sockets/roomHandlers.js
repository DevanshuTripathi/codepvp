import { rooms, userToRoom } from "../store/rooms.js";

export function roomHandlers(io, socket) {
    socket.on("joinRoom", ({ roomId, username, SLOT_COUNT }) => {
        socket.username = username;
        socket.roomId = roomId;

        const existing = userToRoom[username];

        // If user present in a different room leave from that room
        if (existing && existing.roomId !== roomId) {
            const oldRoom = rooms[existing.roomId];
            if (oldRoom) {
                oldRoom.teamA = oldRoom.teamA.map(p => (p?.pid === username ? null : p));
                oldRoom.teamB = oldRoom.teamB.map(p => (p?.pid === username ? null : p));
                io.to(existing.roomId).emit("roomUpdate", oldRoom);
            }
            socket.leave(existing.roomId);
        }

        if (!rooms[roomId]) { // Mock Data 
            rooms[roomId] = { 
                owner: username, 
                teamA: Array(SLOT_COUNT).fill(null), 
                teamB: Array(SLOT_COUNT).fill(null), 
                spectators: [],
                public: true ,
                status: 'waiting'
            };
        }

        if (!rooms[roomId].spectators) {
            rooms[roomId].spectators = [];
        }

        userToRoom[username] = { roomId, role: "player" };
        socket.join(roomId);

        console.log(socket.username, "Joined room:", socket.roomId)

        io.to(roomId).emit("roomUpdate", rooms[roomId]);
    });

    socket.on("togglePrivacy", ({isPublic, roomId}) => {
        if (!rooms[roomId]) return;
        
        rooms[roomId].public = !isPublic;

        io.to(roomId).emit("roomUpdate", rooms[roomId]);

    });

    socket.on("joinSlot", ({ roomId, team, slotIndex, username, SLOT_COUNT }) => {
        const actor = socket.username || username;
        if (!actor || !roomId || (team !== "A" && team !== "B")) return;

        if (!rooms[roomId]) {
            rooms[roomId] = { 
                owner: actor, 
                teamA: Array(SLOT_COUNT).fill(null), 
                teamB: Array(SLOT_COUNT).fill(null), 
                spectators: [],
                public: true ,
                status: 'waiting'
            };
        }
        const room = rooms[roomId];

        if (!room.spectators) {
            room.spectators = [];
        }

        room.spectators = room.spectators.filter((s) => s !== actor);

        room.teamA = room.teamA.map(p => (p?.pid === actor ? null : p));
        room.teamB = room.teamB.map(p => (p?.pid === actor ? null : p));

        if (slotIndex < 0 || slotIndex >= room.teamA.length) return;

        const targetTeam = team === "A" ? room.teamA : room.teamB;
        if (!targetTeam[slotIndex]) targetTeam[slotIndex] = { pid: actor, ready: false };

        socket.username = actor;
        socket.roomId = roomId;
        socket.join(roomId);
        userToRoom[actor] = { roomId, role: "player", username: actor };

        io.to(roomId).emit("roomUpdate", room);
    });

    socket.on("joinAsSpectator", ({ roomId, username }) => {
        const actor = socket.username || username;
        if (!actor || !roomId) return;

        const room = rooms[roomId];
        if (!room) return;

        if (!room.spectators) {
            room.spectators = [];
        }

        room.teamA = room.teamA.map(p => (p?.pid === actor ? null : p));
        room.teamB = room.teamB.map(p => (p?.pid === actor ? null : p));

        if (!room.spectators.includes(actor)) {
            room.spectators.push(actor);
        }

        socket.username = actor;
        socket.roomId = roomId;
        userToRoom[actor] = { roomId, role: "spectator" };
        socket.join(roomId);

        io.to(roomId).emit("roomUpdate", room);
    });

    socket.on("toggleReady", ({ roomId, team, slotIndex, username }) => {
        const actor = socket.username || username;
        if (!actor) return;

        const room = rooms[roomId];
        if (!room) return;
        const slot = room[`team${team}`][slotIndex];
        if (slot?.pid === actor) {
            slot.ready = !slot.ready;
            io.to(roomId).emit("roomUpdate", room);
        }
    });

    socket.on("disconnectRoom", ({ username, roomId }) => {
        const room = rooms[roomId];
        if(!room) return;

        if (!room.spectators) {
            room.spectators = [];
        }

        room.teamA = room.teamA.map(p => (p && p.pid === username ? null : p));
        room.teamB = room.teamB.map(p => (p && p.pid === username ? null : p));
        room.spectators = room.spectators.filter((s) => s !== username);

        delete userToRoom[username];

        const isEmpty = [...room.teamA, ...room.teamB].every(p => p === null) && room.spectators.length === 0;

        if (isEmpty) {
            delete rooms[roomId];
            console.log(`🗑️ Room ${roomId} deleted (empty after ${username} left)`);
        } else {
            io.to(roomId).emit("roomUpdate", room);
        }

        socket.leave(roomId);
    });
}