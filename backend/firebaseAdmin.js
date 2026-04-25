import admin from "firebase-admin";
import fs from "fs";
import "dotenv/config";
import { readFileSync } from 'fs';

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  const jsonPath = new URL('../secrets/serviceAccountKey.json', import.meta.url);
  serviceAccount = JSON.parse(readFileSync(jsonPath, 'utf8'));
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  // Optional: If it's already initialized, just use the existing default app
  admin.app();
}

const db = admin.firestore();

export { admin, db };
