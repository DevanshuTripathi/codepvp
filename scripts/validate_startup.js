#!/usr/bin/env node
import fetch from 'node-fetch';
import { createClient } from 'redis';

async function checkRedis() {
  try {
    const client = createClient({ url: `redis://redis:6379` });
    await client.connect();
    const pong = await client.ping();
    await client.disconnect();
    console.log('Redis ping:', pong);
    return true;
  } catch (e) {
    console.error('Redis check failed', e.message);
    return false;
  }
}

async function checkBackend() {
  try {
    const res = await fetch('http://localhost:5000/health');
    const json = await res.json();
    console.log('/health =>', json);
    const r = await fetch('http://localhost:5000/redis-health');
    console.log('/redis-health =>', await r.json());
    return true;
  } catch (e) {
    console.error('Backend check failed', e.message);
    return false;
  }
}

(async () => {
  const r1 = await checkRedis();
  const r2 = await checkBackend();
  if (!r1 || !r2) process.exit(2);
  console.log('Startup validation OK');
  process.exit(0);
})();
