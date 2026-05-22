import fs from 'fs';
import path from 'path';

const required = [];

const hasRedis = Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);
if (!hasRedis) required.push('REDIS_HOST or REDIS_URL');

if (!process.env.PORT) required.push('PORT');

// Firebase: either FIREBASE_SERVICE_ACCOUNT JSON string or secrets file
const hasFirebaseEnv = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);
const serviceFile = path.resolve(process.cwd(), 'secrets', 'serviceAccountKey.json');
const hasFirebaseFile = fs.existsSync(serviceFile);
if (!hasFirebaseEnv && !hasFirebaseFile) required.push('FIREBASE_SERVICE_ACCOUNT or backend/secrets/serviceAccountKey.json');

if (required.length === 0) {
  console.log('OK: required environment configuration present');
  process.exit(0);
} else {
  console.error('Missing required env vars/files:');
  required.forEach(r => console.error(' -', r));
  process.exit(2);
}
