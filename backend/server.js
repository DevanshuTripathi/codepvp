import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupSocket } from "./sockets/index.js";
import "dotenv/config";
import cors from "cors";
import { rooms } from "./store/rooms.js";
import { getVerdict } from "./utils/judge.js";
import { v2 as cloudinary } from 'cloudinary';
import fileUpload from 'express-fileupload';
import crypto from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const PORT = process.env.PORT || 5000;
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

export const submissions = new Map();
const queue = [];
let averageProcessTimeMs = 2000;

const ALL_JUDGE_NODES = [
  "http://host.docker.internal:2358",
  process.env.JUDGE,
  process.env.JUDGE,
  process.env.JUDGE,
  process.env.JUDGE1,
  process.env.JUDGE1,
  process.env.JUDGE1,
  process.env.JUDGE2,
  process.env.JUDGE2,
  process.env.JUDGE2,
];

let JUDGE_NODES = [...ALL_JUDGE_NODES];
let currentNodeIndex = 0;

function getNextJudgeNode() {
    const node = JUDGE_NODES[currentNodeIndex];
    currentNodeIndex = (currentNodeIndex + 1) % JUDGE_NODES.length;
    return node;
}

function markNodeDead(url) {
    if (!JUDGE_NODES.includes(url)) return; // Already marked dead

    console.error(`🚨 Judge Node Offline: ${url}. Kicking it out of rotation.`);
    
    // Remove ALL instances of this URL from the active array
    JUDGE_NODES = JUDGE_NODES.filter(node => node !== url);

    // Start a heartbeat check to revive it
    const reviveInterval = setInterval(async () => {
        console.log(`Heartbeat check: Is ${url} back online?`);
        try {
            // Ping the Judge0 config endpoint as a health check
            const res = await fetch(`${url}/languages`); 
            if (res.ok) {
                console.log(`Judge Node Revived! Adding ${url} back to rotation.`);
                
                // Add it back with the correct weight (e.g., 3 times for remote)
                const originalWeight = ALL_JUDGE_NODES.filter(n => n === url).length;
                for(let i=0; i < originalWeight; i++) JUDGE_NODES.push(url);
                
                clearInterval(reviveInterval); // Stop pinging
            }
        } catch (e) {
            // Still dead, do nothing. Interval will run again.
        }
    }, 60000); // Check every 60 seconds
}

async function runJudgeInBackground(id, code, problemId, languageId, attempt = 1) {
    // 1. Get the sub object immediately
    const sub = submissions.get(id); 
    const selectedNode = getNextJudgeNode();

    // Panic Protocol: If all VMs are down
    if (!selectedNode) {
        if (submissions.has(id)) {
            const currentSub = submissions.get(id);
            submissions.set(id, { ...currentSub, status: "Error", errorMessage: "All execution servers are offline." });
        }
        const index = queue.indexOf(id);
        if (index > -1) queue.splice(index, 1);
        return;
    }

    const startTime = Date.now();
    
    try {
        const result = await getVerdict(code, problemId, languageId, selectedNode);
        
        if (!result) {
            throw new Error("Judge returned no result");
        }

        const duration = Date.now() - startTime;

        averageProcessTimeMs = (averageProcessTimeMs * 0.8) + (duration * 0.2);

        // 2. Use the most fresh data from the Map
        const currentSub = submissions.get(id); 
        submissions.set(id, { ...currentSub, status: "Completed", ...result });

        const index = queue.indexOf(id);
        if (index > -1) queue.splice(index, 1);
    } catch (e) {
        console.error(`Judging Error on ${selectedNode}:`, e.message);

        markNodeDead(selectedNode);

        // 2. Automatically retry the submission on a healthy server
        if (attempt < 3 && JUDGE_NODES.length > 0) {
            console.log(`🔄 Retrying submission ${id} (Attempt ${attempt + 1})...`);
            // Recursively call the function. Do NOT remove from queue yet!
            return runJudgeInBackground(id, code, problemId, languageId, attempt + 1);
        } else {
            // 3. Give up permanently after 3 fails or if no nodes are left
            if (submissions.has(id)) {
                const currentSub = submissions.get(id);
                submissions.set(id, { ...currentSub, status: "Error", errorMessage: "Execution failed after multiple network attempts." });
            }
            const index = queue.indexOf(id);
            if (index > -1) queue.splice(index, 1);
        }
    }
}

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

app.use(express.json());

// Optional: REST routes can be added here
app.get("/api/rooms", (req, res) => res.json(rooms));

app.post("/api/submit", async (req, res) => {

  const id = crypto.randomUUID();

  const { problemId, sourceCode, language, userId, roomId } = req.body;

  const subData = {
      id,
      status: "Processing",
      problemId: problemId,
      language: language,
      submittedAt: Date.now(),
      userId: userId || "anaon tester", // To filter in the submissions tab
      roomId: roomId
  };

  submissions.set(id, subData);
  queue.push(id);

  runJudgeInBackground(id, sourceCode, problemId, language);

  res.json({ message: "Submitted successfully!", submissionId: id });
});

app.get("/api/status/:id", (req, res) => {
    const sub = submissions.get(req.params.id);
    if (!sub) return res.status(404).json({ error: "Not found" });

    // Calculate queue position
    let position = 0;
    let estimatedWaitTimeMs = 0;
    if (sub.status === "Processing") {
        position = queue.indexOf(req.params.id) + 1;

        const activeNodesCount = JUDGE_NODES.length;

        if (activeNodesCount === 0) {
             // Edge case: All nodes are dead. Set to -1 or a flag to show "Unknown" on the frontend
            estimatedWaitTimeMs = -1; 
        } else {
            // Group the queue into parallel batches based on active nodes
            // Example: If position is 4 and you have 3 nodes, it's in the 2nd batch (Math.ceil(4/3) = 2)
            const effectiveBatch = Math.ceil(position / activeNodesCount);
            estimatedWaitTimeMs = Math.round(effectiveBatch * averageProcessTimeMs);
        }
    }

    res.json({ ...sub, queuePosition: position, estimatedWaitTime: estimatedWaitTimeMs });
});

app.post('/upload-avatar', async (req, res) => {
  try {
    if (!req.files || !req.files.avatar) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.avatar;

    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'avatars',
      transformation: [
        { width: 300, height: 300, crop: "fill" },
        { quality: "auto" }
      ]
    });

    res.json({ url: result.secure_url });

  } catch (err) {
    console.error(err); // 👈 IMPORTANT
    res.status(500).json({ error: 'Upload failed' });
  }
});

setupSocket(io);

server.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT}`),
);
