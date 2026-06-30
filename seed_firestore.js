import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

// Mock data imports
import { 
  INITIAL_CLIENTS, 
  INITIAL_SERVICES, 
  INITIAL_TASKS, 
  INITIAL_LEADS, 
  INITIAL_INVOICES, 
  INITIAL_NOTIFICATIONS, 
  MOCK_RENEGOTIATION_LOGS, 
  SERVICE_REQUESTS, 
  MOCK_SEO_REPORTS, 
  MOCK_COMMENTS, 
  MOCK_TEAM,
  MOCK_PROJECTS,
  MOCK_PURCHASE_ORDERS
} from './src/mockData.js';

// Read .env file manually
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

console.log("Connecting to Firebase project to seed data:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedCollection = async (collName, arrayData) => {
  console.log(`Seeding ${collName}...`);
  for (const item of arrayData) {
    if (!item.id) {
      console.warn(`Item in ${collName} has no id:`, item);
      continue;
    }
    const docRef = doc(db, collName, item.id);
    await setDoc(docRef, item);
  }
  console.log(`Completed seeding ${collName}.`);
};

try {
  // Seed standard collections where items have IDs
  await seedCollection('teamMembers', MOCK_TEAM);
  await seedCollection('clients', INITIAL_CLIENTS);
  await seedCollection('services', INITIAL_SERVICES);
  await seedCollection('tasks', INITIAL_TASKS);
  await seedCollection('leads', INITIAL_LEADS);
  await seedCollection('invoices', INITIAL_INVOICES);
  await seedCollection('notifications', INITIAL_NOTIFICATIONS);
  await seedCollection('renegotiationLogs', MOCK_RENEGOTIATION_LOGS);
  await seedCollection('serviceRequests', SERVICE_REQUESTS);
  await seedCollection('comments', MOCK_COMMENTS);
  await seedCollection('projects', MOCK_PROJECTS);
  await seedCollection('purchaseOrders', MOCK_PURCHASE_ORDERS);

  // Seed SEO reports by mapping/assigning IDs
  const seoReportsWithIds = MOCK_SEO_REPORTS.map((report, idx) => ({
    id: `rep-cli-${idx + 1}`,
    clientId: `cli-${idx + 1}`,
    ...report
  }));
  await seedCollection('seoReports', seoReportsWithIds);

  // Seed admin credentials
  console.log("Seeding admin_logins/super_admin...");
  await setDoc(doc(db, 'admin_logins', 'super_admin'), {
    email: 'admin@aurascale.io',
    password: 'admin123',
    name: 'RAJIB (Admin)',
    authEmail: 'admin@aurascale.io'
  });
  console.log("Completed seeding admin_logins.");

  // Seed client logins so that clients can log in
  console.log("Seeding client_logins...");
  const clientLogins = [
    { email: 'client@aurascale.io', password: 'client123', role: 'client', clientId: 'cli-1' },
    { email: 'sarah@aeromedia.com', password: 'client123', role: 'client', clientId: 'cli-1' },
    { email: 'd.miller@apexhealth.org', password: 'client123', role: 'client', clientId: 'cli-2' },
    { email: 'tanaka@zenithshop.co', password: 'client123', role: 'client', clientId: 'cli-3' },
    { email: 'l.oconnor@verdant.io', password: 'client123', role: 'client', clientId: 'cli-4' }
  ];
  for (const login of clientLogins) {
    const docId = login.email.replace(/\./g, '_'); // sanitize email for doc ID
    await setDoc(doc(db, 'client_logins', docId), login);
  }
  console.log("Completed seeding client_logins.");

  console.log("\n🎉 Database seeded successfully! All mock data has been imported into your live Firebase Database.");
} catch (error) {
  console.error("❌ Error seeding database:", error);
}

process.exit(0);
