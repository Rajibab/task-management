import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import fs from 'fs';

// Read .env manually
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

console.log("Connecting to Firebase project:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

try {
  console.log("Attempting to delete document cli-3 from clients collection...");
  await deleteDoc(doc(db, 'clients', 'cli-3'));
  console.log("Successfully deleted doc cli-3.");

  console.log("Fetching remaining clients...");
  const snap = await getDocs(collection(db, 'clients'));
  console.log(`Found ${snap.size} documents in clients:`);
  snap.forEach(doc => {
    console.log(doc.id, "=>", doc.data().companyName);
  });
} catch (err) {
  console.error("Error during deletion test:", err);
}
process.exit(0);
