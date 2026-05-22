import { enqueueFrontend, dequeueFrontend, tryCreateFrontendMatch, getFrontendRoom, updatePlayerFile, submitVotes, deleteFrontendRoom } from '../services/frontendService.js';
import { setUserRoom, clearUserRoom } from '../services/userService.js';

const PVP_TOPICS = [
    "Design a modern cafe landing page",
    "Build a secure login screen for a banking app",
    "Create a futuristic analytics dashboard",
    "Design a minimal portfolio for yourself",
    "Build a checkout cart UI for an e-commerce store"
];

export function frontendHandlers(io, socket) {
    socket.on("joinFrontendQueue", async ({ username }) => {
                if (!username) return;
                await enqueueFrontend(username);
                await tryCreateFrontendMatch().then((r) => {
                    if (r) {
                        const { roomId, players, endTime } = r;
                        players.forEach(p => {
                            io.to(p).emit('frontendMatchFound', { roomId, endTime });
                            setUserRoom(p, roomId);
                        });
                    }
                });
    });

    socket.on("leaveFrontendQueue", ({ username }) => {
        if (!username) return;
        dequeueFrontend(username);
    });

    socket.on("joinFrontendRoom", ({ roomId, username }) => {
        if (!roomId || !username) return;
        (async () => {
          const room = await getFrontendRoom(roomId);
          if (!room) return;
          socket.username = username;
          socket.frontendRoomId = roomId;
          await setUserRoom(username, roomId);
          socket.join(roomId);
          socket.emit('frontendRoomState', { roomId, endTime: Number(room.endTime), files: room.playerFiles[username], players: room.players, topic: room.topic });
        })();
    });

    socket.on("frontendCodeChange", ({ roomId, username, path, code }) => {
        if (!roomId || !username || !path || typeof code !== 'string') return;
        updatePlayerFile(roomId, username, path, code);
    });

    socket.on("frontendFilesSync", ({ roomId, username, files }) => {
        if (!roomId || !username || !files || typeof files !== 'object') return;
                (async () => {
                    const sanitized = sanitizeFiles(files);
                    for (const [path, code] of Object.entries(sanitized)) await updatePlayerFile(roomId, username, path, code);
                })();
    });

    socket.on("getShowcaseData", ({ roomId }) => {
                (async () => {
                    const room = await getFrontendRoom(roomId);
                    if (room && room.status === 'voting') {
                        socket.emit('showcaseDataPayload', { topic: room.topic, players: room.players, playerFiles: room.playerFiles });
                    }
                })();
    });

    socket.on("disconnect", () => {
        const username = socket.username;
        if (!username) return;
        dequeueFrontend(username);
    });

    socket.on('getFrontendMatchDetails', ({ roomId }) => {
        (async () => {
          const room = await getFrontendRoom(roomId);
          if (room) socket.emit('frontendMatchDetails', { endTime: Number(room.endTime) });
        })();
    });

    socket.on("submitVotes", ({ roomId, voter, votes }) => {
        (async () => {
          const ok = await submitVotes(roomId, voter, votes);
          if (!ok) return;
          // We won't compute leaderboard here; this service stores votes. Simple broadcast to room that vote accepted.
          io.to(roomId).emit('voteAccepted', { voter });
        })();
    });
}

// legacy helper functions removed; storage is Redis-backed via frontendService

function sanitizeFiles(files) {
    const out = {};

    Object.entries(files).forEach(([path, value]) => {
        if (typeof path !== "string") return;

        if (typeof value === "string") {
            out[path] = value;
            return;
        }

        if (value && typeof value === "object" && typeof value.code === "string") {
            out[path] = value.code;
        }
    });

    return out;
}

function createDefaultFiles() {
    return {
        "/App.js": "export default function App() {\n  return <h1>Hello PixelPvP</h1>;\n}\n",
    };
}