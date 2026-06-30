import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Core configuration mapping from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Flags active configuration state.
// We verify that the variables are populated and aren't default placeholders.
const isConfigured = 
  !!firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.apiKey.trim() !== '';

let app;
let auth;
let db;

if (isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('🔥 OmniMark OS: Successfully connected to active Firebase SDK!');
  } catch (error) {
    console.error('⚠️ OmniMark OS: Firebase initialization error:', error);
  }
} else {
  console.log('⚡ OmniMark OS: Running in local Simulation Mode. Configure .env with valid credentials for live Firebase integration.');
}

export { app, auth, db, isConfigured };
