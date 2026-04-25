import admin from "firebase-admin";
import fs from "fs";
import "dotenv/config";

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  const jsonPath = new URL('../secrets/serviceAccountKey.json', import.meta.url);
  serviceAccount = JSON.parse(readFileSync(jsonPath, 'utf8'));
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

export { admin, db };
