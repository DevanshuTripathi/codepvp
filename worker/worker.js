import { spawn } from 'child_process';
import { writeFile, mkdir, rm } from 'fs/promises';
import { randomUUID } from 'crypto';
import { Worker } from 'bullmq';
import path from 'path';
import 'dotenv/config';

const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

// 1. Language Configuration Map
const LANG_CONFIG = {
    python: { ext: '.py', run: (file) => [pythonCmd, [file]] },
    javascript: { ext: '.js', run: (file) => ['node', [file]] },
    typescript: { ext: '.ts', run: (file) => ['ts-node', [file]] },
    go: { ext: '.go', run: (file) => ['go', ['run', file]] },
    
    // Compiled Languages require a build step
    cpp: { 
        ext: '.cpp', 
        compile: (file, dir) => ['g++', [file, '-o', path.join(dir, 'out_bin')]], 
        run: (file, dir) => [path.join(dir, 'out_bin'), []] 
    },
    rust: { 
        ext: '.rs', 
        compile: (file, dir) => ['rustc', [file, '-o', path.join(dir, 'out_bin')]], 
        run: (file, dir) => [path.join(dir, 'out_bin'), []] 
    },
    java: { 
        // Note: Java requires the filename to match the public class. 
        // We force it to be "Main.java"
        ext: '.java', 
        fileName: 'Main.java',
        compile: (file, dir) => ['javac', [file]], 
        run: (file, dir) => ['java', ['-cp', dir, 'Main']] 
    }
};

// 2. The Core Execution Wrapper
function spawnProcess(cmd, args, inputStr, workingDir) {
    return new Promise((resolve) => {
        let stdoutData = '';
        let stderrData = '';

        const secureEnv = { PATH: process.env.PATH };

        const child = spawn(cmd, args, { 
            cwd: workingDir,
            env: secureEnv, // Applies the sterilized environment
            detached: false // Prevents the child process from running independently
        });

        if (inputStr) {
            const finalInput = inputStr.endsWith('\n') ? inputStr : inputStr + '\n';
            child.stdin.write(finalInput);
            child.stdin.end();
        } else {
            child.stdin.end();
        }

        child.stdout.on('data', (data) => {
            stdoutData += data.toString();
            // Kill if output exceeds 5MB to prevent memory crashes
            if (stdoutData.length > 5 * 1024 * 1024) {
                child.kill('SIGKILL');
                resolve({ status: 'MLE', error: 'Output Limit Exceeded' });
            }
        });

        child.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        // 2-second timeout
        const timeoutId = setTimeout(() => {
            child.kill('SIGKILL');
            resolve({ status: 'TLE', error: 'Time Limit Exceeded' });
        }, 2000);

        child.on('close', (code, signal) => {
            clearTimeout(timeoutId);
            if (signal === 'SIGKILL') return; // Handled by TLE/MLE checks
            
            if (code === 0) {
                resolve({ status: 'Success', output: stdoutData });
            } else {
                resolve({ status: 'Runtime Error', error: stderrData });
            }
        });
    });
}

// 3. The Sandbox Manager
async function executeCode(language, code, testCases) {
    const config = LANG_CONFIG[language];
    if (!config) return { status: 'Error', error: 'Unsupported language' };

    // Create a unique, isolated directory for this specific run
    const runId = randomUUID();
    const sandboxDir = path.join('/tmp', `job_${runId}`);
    const fileName = config.fileName || `code${config.ext}`;
    const codeFilePath = path.join(sandboxDir, fileName);

    try {
        await mkdir(sandboxDir, { recursive: true });
        await writeFile(codeFilePath, code);

        // Step A: Compilation (If required)
        if (config.compile) {
            const [compCmd, compArgs] = config.compile(codeFilePath, sandboxDir);
            const compileResult = await spawnProcess(compCmd, compArgs, null, sandboxDir);
            
            if (compileResult.status !== 'Success') {
                return { status: 'Compilation Error', error: compileResult.error };
            }
        }

        // Step B: Execution against Test Cases
        let [runCmd, runArgs] = config.run(codeFilePath, sandboxDir);

        if (process.platform === 'linux') {
            runArgs = [
                '--quiet',               // Suppress Firejail's own terminal output
                '--net=none',            // Kill internet access (Fixes Cryptomining/Botnets)
                '--rlimit-as=256m',      // Hard cap RAM at 256MB (Fixes Fork Bombs)
                '--rlimit-fsize=5m',     // Prevent generating files larger than 5MB
                runCmd, 
                ...runArgs
            ];
            runCmd = 'firejail';
        }
        
        let results = [];
        let allPassed = true;

        for (const tc of testCases) {
            const runResult = await spawnProcess(runCmd, runArgs, tc.input, sandboxDir);
            
            // Clean up whitespace to accurately compare outputs
            const userOutput = (runResult.output || "").trim();
            const expectedOutput = tc.output.trim();
            
            let verdict = runResult.status;
            if (verdict === 'Success') {
                verdict = (userOutput === expectedOutput) ? 'Accepted' : 'Wrong Answer';
            }

            if (verdict !== 'Accepted') allPassed = false;

            results.push({
                input: tc.hidden ? "Hidden" : tc.input,
                expected: tc.hidden ? "Hidden" : expectedOutput,
                output: tc.hidden ? "Hidden" : userOutput,
                verdict: verdict,
                error: !!runResult.error,
                errorMessage: runResult.error || "",
                hidden: tc.hidden || false
            });
        }

        return { ac: allPassed, result: results };

    } catch (err) {
        return { status: 'Internal System Error', error: err.message };
    } finally {
        // ALWAYS clean up the temporary directory
        await rm(sandboxDir, { recursive: true, force: true }).catch(console.error);
    }
}

const redisConnection = {
    host: 'just-trout-105699.upstash.io',
    port: 6379,
    password: process.env.REDIS_PASS,
    tls: {}
};

// 5. Start the Queue Worker
const worker = new Worker('submissions', async job => {
    const { submissionId, language, sourceCode, testCases } = job.data;
    
    console.log(`[Worker] Processing submission: ${submissionId} (${language})`);
    
    const finalResult = await executeCode(language, sourceCode, testCases);
    
    // In your main backend server.js, you will listen for this completion 
    // event via BullMQ's QueueEvents to emit the WebSocket update.
    return { submissionId, ...finalResult };

}, { 
    connection: redisConnection,
    concurrency: 1 // Crucial for isolated performance
});

worker.on('error', err => {
  console.error("BULLMQ ERROR:", err);
});

worker.on('ready', () => {
  console.log("Worker successfully connected to Redis and is ready!");
});

setInterval(() => {
  console.log("Health check: Worker process is still alive...");
}, 30000);

worker.on('completed', job => {
    console.log(`[Worker] Finished ${job.data.submissionId}`);
});

worker.on('failed', (job, err) => {
    console.error(`[Worker] Failed ${job?.data?.submissionId}: ${err.message}`);
});

console.log('👷 Serverless Judge Worker is listening for jobs...');