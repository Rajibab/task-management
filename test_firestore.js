import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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
  const collections = [
    'teamMembers',
    'clients',
    'services',
    'tasks',
    'leads',
    'invoices',
    'notifications',
    'renegotiationLogs',
    'serviceRequests',
    'seoReports',
    'comments'
  ];

  for (const colName of collections) {
    console.log(`\nFetching ${colName}...`);
    const snap = await getDocs(collection(db, colName));
    console.log(`Found ${snap.size} documents in ${colName}:`);
    snap.forEach(doc => {
      console.log(doc.id, "=>", doc.data());
    });
  }
} catch (err) {
  console.error("Error fetching:", err);
}
process.exit(0);
