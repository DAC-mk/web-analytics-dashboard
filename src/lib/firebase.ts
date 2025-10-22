// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBD19X-5GF2LtaR2O0jn9S-z0NXQg3ndl4",
  authDomain: "web-analytics-dashboard-6512e.firebaseapp.com",
  projectId: "web-analytics-dashboard-6512e",
  storageBucket: "web-analytics-dashboard-6512e.firebasestorage.app",
  messagingSenderId: "956358588971",
  appId: "1:956358588971:web:501e75ca85f00ac776c86e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };