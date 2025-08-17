// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyChMXBHOQrvDav6-apozGv5C1RaeMF7fSQ",
  authDomain: "codepvp-56d75.firebaseapp.com",
  projectId: "codepvp-56d75",
  storageBucket: "codepvp-56d75.firebasestorage.app",
  messagingSenderId: "47075937133",
  appId: "1:47075937133:web:8e073ba83083563283e864",
  measurementId: "G-QD36SMWXY9"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// const analytics = getAnalytics(app);
