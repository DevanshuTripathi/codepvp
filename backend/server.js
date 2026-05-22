import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupSocket } from "./sockets/index.js";
import { attachRedisAdapter } from "./utils/redisClient.js";
import { initRoomSync } from "./utils/roomSync.js";
import { initRedis, getRedisClient } from './services/redis.js';
import { initPubSub } from './services/pubsub.js';
import { initRoomService, listRooms } from './services/roomService.js';
import "dotenv/config";
import cors from "cors";
import { getVerdict } from "./utils/judge.js";
import { v2 as cloudinary } from 'cloudinary';
import fileUpload from 'express-fileupload';
import crypto from "crypto";
import { Queue, QueueEvents } from 'bullmq';
import { db } from "./firebaseAdmin.js";

const redisConnection = {
    host: 'just-trout-105699.upstash.io',
    port: 6379,
    password: process.env.REDIS_PASS,
    tls: {}
};

const submissionQueue = new Queue('submissions', { connection: redisConnection });
const queueEvents = new QueueEvents('submissions', { connection: redisConnection });

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

// const ALL_JUDGE_NODES = [
//   "http://host.docker.internal:2358",
//   process.env.JUDGE,
//   process.env.JUDGE,
//   process.env.JUDGE,
//   process.env.JUDGE1,
//   process.env.JUDGE1,
//   process.env.JUDGE1,
//   process.env.JUDGE2,
//   process.env.JUDGE2,
//   process.env.JUDGE2,
// ];

// let JUDGE_NODES = [...ALL_JUDGE_NODES];
// let currentNodeIndex = 0;

// function getNextJudgeNode() {
//     const node = JUDGE_NODES[currentNodeIndex];
//     currentNodeIndex = (currentNodeIndex + 1) % JUDGE_NODES.length;
//     return node;
// }

// function markNodeDead(url) {
//     if (!JUDGE_NODES.includes(url)) return; // Already marked dead

//     console.error(`🚨 Judge Node Offline: ${url}. Kicking it out of rotation.`);
    
//     // Remove ALL instances of this URL from the active array
//     JUDGE_NODES = JUDGE_NODES.filter(node => node !== url);

//     // Start a heartbeat check to revive it
//     const reviveInterval = setInterval(async () => {
//         console.log(`Heartbeat check: Is ${url} back online?`);
//         try {
//             // Ping the Judge0 config endpoint as a health check
//             const res = await fetch(`${url}/languages`); 
//             if (res.ok) {
//                 console.log(`Judge Node Revived! Adding ${url} back to rotation.`);
                
//                 // Add it back with the correct weight (e.g., 3 times for remote)
//                 const originalWeight = ALL_JUDGE_NODES.filter(n => n === url).length;
//                 for(let i=0; i < originalWeight; i++) JUDGE_NODES.push(url);
                
//                 clearInterval(reviveInterval); // Stop pinging
//             }
//         } catch (e) {
//             // Still dead, do nothing. Interval will run again.
//         }
//     }, 60000); // Check every 60 seconds
// }

// async function runJudgeInBackground(id, code, problemId, languageId, attempt = 1) {
//     // 1. Get the sub object immediately
//     const sub = submissions.get(id); 
//     const selectedNode = getNextJudgeNode();

//     // Panic Protocol: If all VMs are down
//     if (!selectedNode) {
//         if (submissions.has(id)) {
//             const currentSub = submissions.get(id);
//             submissions.set(id, { ...currentSub, status: "Error", errorMessage: "All execution servers are offline." });
//         }
//         const index = queue.indexOf(id);
//         if (index > -1) queue.splice(index, 1);
//         return;
//     }

//     const startTime = Date.now();
    
//     try {
//         const result = await getVerdict(code, problemId, languageId, selectedNode);
        
//         if (!result) {
//             throw new Error("Judge returned no result");
//         }

//         const duration = Date.now() - startTime;

//         averageProcessTimeMs = (averageProcessTimeMs * 0.8) + (duration * 0.2);

//         // 2. Use the most fresh data from the Map
//         const currentSub = submissions.get(id); 
//         submissions.set(id, { ...currentSub, status: "Completed", ...result });

//         const index = queue.indexOf(id);
//         if (index > -1) queue.splice(index, 1);
//     } catch (e) {
//         console.error(`Judging Error on ${selectedNode}:`, e.message);

//         markNodeDead(selectedNode);

//         // 2. Automatically retry the submission on a healthy server
//         if (attempt < 3 && JUDGE_NODES.length > 0) {
//             console.log(`🔄 Retrying submission ${id} (Attempt ${attempt + 1})...`);
//             // Recursively call the function. Do NOT remove from queue yet!
//             return runJudgeInBackground(id, code, problemId, languageId, attempt + 1);
//         } else {
//             // 3. Give up permanently after 3 fails or if no nodes are left
//             if (submissions.has(id)) {
//                 const currentSub = submissions.get(id);
//                 submissions.set(id, { ...currentSub, status: "Error", errorMessage: "Execution failed after multiple network attempts." });
//             }
//             const index = queue.indexOf(id);
//             if (index > -1) queue.splice(index, 1);
//         }
//     }
// }

queueEvents.on('completed', async ({ jobId, returnvalue }) => {
    // returnvalue comes directly from your worker.js
    const { submissionId, ac, result, status, error } = returnvalue;
    
    if (submissions.has(submissionId)) {
        const currentSub = submissions.get(submissionId);
        
        const finalStatus = status === 'Internal System Error' || status === 'Error' ? 'Error' : 'Completed';

        const updatedSub = { 
            ...currentSub, 
            status: finalStatus, 
            ac: ac || false, 
            result: result || [],
            errorMessage: error || ""
        };
        
        submissions.set(submissionId, updatedSub);

        // Optional: Emit this directly to the frontend via WebSockets!
        // io.to(currentSub.roomId).emit("submission_result", updatedSub);
        console.log(`✅ Submission ${submissionId} completed and mapped!`);
    }
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`❌ Job ${jobId} failed completely:`, failedReason);
});

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

app.get("/api/ping", (req, res) => {
  res.send("pong");
})

app.get("/api/rooms", async (req, res) => {
  try {
    const all = await listRooms();
    res.json(all);
  } catch (e) {
    res.status(500).json({ error: 'failed to list rooms', msg: e.message });
  }
});

app.post("/api/submit", async (req, res) => {

  const id = crypto.randomUUID();

  const { problemId, sourceCode, language, userId, roomId } = req.body;

  try {
      // 1. Fetch test cases from Firebase
      let doc = await db.collection('ProblemsWithHTC').doc(problemId).get();
      if (!doc.exists) {
          doc = await db.collection('DebugProblems').doc(problemId).get();
      }

      if (!doc.exists) {
          return res.status(404).json({ error: "Problem not found" });
      }

      const problemData = doc.data();
      const testCases = [
          ...(problemData.samples || []).map(tc => ({ ...tc, hidden: false })),
          ...(problemData.hiddenTestCases || []).map(tc => ({ ...tc, hidden: true }))
      ];

      // 2. Save pending status to local Map
      const subData = {
          id,
          status: "Processing",
          problemId,
          language,
          submittedAt: Date.now(),
          userId: userId || "anon tester",
          roomId
      };
      submissions.set(id, subData);

      // 3. Push job to Redis Queue with the test cases included
      await submissionQueue.add('execute', {
          submissionId: id,
          language,
          sourceCode,
          testCases
      }, { jobId: id, removeOnComplete: true, removeOnFail: 100 }); // Setting jobId helps track it in queueEvents

      res.json({ message: "Submitted successfully!", submissionId: id });

  } catch (error) {
      console.error("Submission error:", error);
      res.status(500).json({ error: "Failed to queue submission" });
  }
});

app.get("/api/status/:id", async (req, res) => {
    const sub = submissions.get(req.params.id);
    if (!sub) return res.status(404).json({ error: "Not found" });

    // Calculate queue position
    let position = 0;
    if (sub.status === "Processing") {
        const state = await submissionQueue.getJobState(req.params.id);

        if (state === 'waiting') {
            // Find how many jobs are ahead of this one
            const waitingJobs = await submissionQueue.getWaiting();
            position = waitingJobs.findIndex(job => job.id === req.params.id) + 1;
        }
    }

    res.json({ ...sub, queuePosition: position });
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

// Attach Redis adapter (if configured) and then setup sockets + start server
// Initialize Redis, Pub/Sub, adapter and room service before starting
(async () => {
  try {
    await initRedis();
    await attachRedisAdapter(io);
    await initPubSub();
    await initRoomService();
    await initRoomSync(io);
  } catch (e) {
    console.error('Startup init warnings:', e);
  }

  setupSocket(io);

  // Health endpoints
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/redis-health', async (req, res) => {
    try {
      const c = getRedisClient();
      const pong = await c.ping();
      res.json({ redis: pong });
    } catch (err) {
      res.status(500).json({ redis: 'unavailable', error: err.message });
    }
  });

  server.listen(PORT, "0.0.0.0", () =>
    console.log(`🚀 Server running on port ${PORT}`),
  );
})();
