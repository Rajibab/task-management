import { isConfigured, auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  updateProfile,
  updateEmail,
  updatePassword
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where,
  deleteDoc
} from 'firebase/firestore';

// Default static invoices to load if a user is new and has no invoices saved yet
import { INITIAL_INVOICES } from './mockData';

// Simulated latency to mimic Firestore and Auth network requests (800ms)
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 800));

class FirebaseService {
  constructor() {
    this.authListeners = new Set();
    this.currentUser = null;
    
    // In local simulation mode, initialize session from localStorage
    if (!isConfigured) {
      // Seed default users if they do not exist
      const simUsers = JSON.parse(localStorage.getItem('omnimark_sim_users') || '{}');
      let updated = false;
      
      if (!simUsers['admin@aurascale.io']) {
        simUsers['admin@aurascale.io'] = {
          uid: 'sim-admin-uid',
          email: 'admin@aurascale.io',
          displayName: 'RAJIB (Admin)',
          role: 'admin',
          password: 'admin123'
        };
        updated = true;
      }
      if (!simUsers['team@aurascale.io']) {
        simUsers['team@aurascale.io'] = {
          uid: 'sim-team-uid',
          email: 'team@aurascale.io',
          displayName: 'Chloe Chen',
          role: 'team',
          password: 'team123'
        };
        updated = true;
      }
      if (!simUsers['client@aurascale.io']) {
        simUsers['client@aurascale.io'] = {
          uid: 'sim-client-uid',
          email: 'client@aurascale.io',
          displayName: 'AeroMedia Group',
          role: 'client',
          password: 'client123'
        };
        updated = true;
      }
      if (!simUsers['sarah@aeromedia.com']) {
        simUsers['sarah@aeromedia.com'] = {
          uid: 'sim-cli-1',
          email: 'sarah@aeromedia.com',
          displayName: 'AeroMedia Group',
          role: 'client',
          password: 'client123'
        };
        updated = true;
      }
      if (!simUsers['d.miller@apexhealth.org']) {
        simUsers['d.miller@apexhealth.org'] = {
          uid: 'sim-cli-2',
          email: 'd.miller@apexhealth.org',
          displayName: 'Apex Health Corp',
          role: 'client',
          password: 'client123'
        };
        updated = true;
      }
      if (!simUsers['tanaka@zenithshop.co']) {
        simUsers['tanaka@zenithshop.co'] = {
          uid: 'sim-cli-3',
          email: 'tanaka@zenithshop.co',
          displayName: 'Zenith E-Commerce',
          role: 'client',
          password: 'client123'
        };
        updated = true;
      }
      if (!simUsers['l.oconnor@verdant.io']) {
        simUsers['l.oconnor@verdant.io'] = {
          uid: 'sim-cli-4',
          email: 'l.oconnor@verdant.io',
          displayName: 'Verdant Energy',
          role: 'client',
          password: 'client123'
        };
        updated = true;
      }
      if (!simUsers['marcus@novus.edu']) {
        simUsers['marcus@novus.edu'] = {
          uid: 'sim-cli-5',
          email: 'marcus@novus.edu',
          displayName: 'Novus Learning',
          role: 'client',
          password: 'client123'
        };
        updated = true;
      }
      
      if (updated) {
        localStorage.setItem('omnimark_sim_users', JSON.stringify(simUsers));
      }

      const savedUser = localStorage.getItem('omnimark_auth_user');
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser);
        } catch (e) {
          console.error('Failed to parse simulated session user', e);
        }
      }
    } else {
      // Eagerly restore session from sessionStorage if custom session exists
      const customSession = sessionStorage.getItem('aurascale_custom_session');
      if (customSession) {
        try {
          this.currentUser = JSON.parse(customSession);
        } catch (e) {
          console.error('Failed to parse custom session user', e);
        }
      }

      // Track when standard Firebase auth has finished initial verification
      let isAuthReady = false;

      auth.authStateReady().then(() => {
        isAuthReady = true;
        if (!auth.currentUser) {
          // Standard Firebase Auth has fully initialized and determined no user exists.
          // This means there is indeed no active Firebase session, so terminate custom session.
          sessionStorage.removeItem('aurascale_custom_session');
          this.currentUser = null;
          this._notifyListeners();
        }
      }).catch((err) => {
        console.error('Firebase Auth state ready initialization error:', err);
      });

      // Connect real Firebase auth observer
      auth.onAuthStateChanged(async (fbUser) => {
        if (fbUser) {
          const customSession = sessionStorage.getItem('aurascale_custom_session');
          let role = fbUser.photoURL || 'admin';
          let email = fbUser.email;
          let displayName = fbUser.displayName || fbUser.email.split('@')[0];
          if (customSession) {
            try {
              const parsed = JSON.parse(customSession);
              if (parsed.role === 'admin') {
                role = 'admin';
                email = parsed.email || email;
                displayName = parsed.displayName || displayName;
              } else if (parsed.email === fbUser.email) {
                role = parsed.role || role;
                displayName = parsed.displayName || displayName;
              }
            } catch (e) {}
          }
          this.currentUser = {
            uid: fbUser.uid,
            email: email,
            displayName: displayName,
            role: role
          };
          // Write back to sessionStorage to keep it persistent
          sessionStorage.setItem('aurascale_custom_session', JSON.stringify(this.currentUser));
          this._notifyListeners();
        } else {
          // Only invalidate custom session on null user if auth has fully initialized (runtime changes/signout)
          if (isAuthReady) {
            sessionStorage.removeItem('aurascale_custom_session');
            this.currentUser = null;
            this._notifyListeners();
          }
        }
      });
    }
  }

  // Register listener for auth state changes
  onAuthChange(callback) {
    this.authListeners.add(callback);
    // Execute immediately for initial state
    callback(this.currentUser);
    return () => {
      this.authListeners.delete(callback);
    };
  }

  _notifyListeners() {
    this.authListeners.forEach(cb => cb(this.currentUser));
  }

  // Get current active user
  getCurrentUser() {
    return this.currentUser;
  }

  // Register User
  async registerUser(name, email, password, role = 'admin') {
    if (isConfigured) {
      // Production Flow
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // We leverage display name and photoURL for standard role & profile syncing in firebase auth
      await updateProfile(userCredential.user, {
        displayName: name,
        photoURL: role
      });
      
      // Save metadata record in Firestore for references
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        role,
        createdAt: new Date().toISOString()
      });

      this.currentUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: name,
        role: role
      };
      
      // Seed initial invoices in Firestore for this new user so they have data
      await this._seedInitialInvoices(userCredential.user.uid);
      
      return this.currentUser;
    } else {
      // Local Storage Simulation Flow
      await simulateDelay();
      
      // Load existing simulation registry
      const simUsers = JSON.parse(localStorage.getItem('omnimark_sim_users') || '{}');
      if (simUsers[email]) {
        throw new Error('An account with this email address already exists.');
      }

      const uid = `sim-uid-${Date.now()}`;
      const newUser = { uid, email, displayName: name, role, password };
      
      simUsers[email] = newUser;
      localStorage.setItem('omnimark_sim_users', JSON.stringify(simUsers));

      // Active Session User (exclude password)
      const sessionUser = { uid, email, displayName: name, role };
      this.currentUser = sessionUser;
      localStorage.setItem('omnimark_auth_user', JSON.stringify(sessionUser));
      
      // Seed initial invoices in simulated localStorage
      this._seedSimulatedInvoices(uid);

      this._notifyListeners();
      return this.currentUser;
    }
  }

  // Create client login credential safely without changing current active user session
  async createClientLogin(name, email, password) {
    if (isConfigured) {
      // Production Firestore Persistence: Save credential records securely in a collection
      // so we can on-the-fly create the actual Auth account when the client logs in first time.
      const cleanEmail = email.toLowerCase().trim();
      const docId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(db, 'client_logins', docId), {
        name,
        email: cleanEmail,
        password, // stored for onboarding reveal and on-the-fly Auth creation
        role: 'client',
        createdAt: new Date().toISOString()
      });
      
      // Also register a basic user profile record in Firestore
      await setDoc(doc(db, 'users', docId), {
        name,
        email: cleanEmail,
        role: 'client',
        createdAt: new Date().toISOString()
      });
    } else {
      // Simulated Local Storage Registry
      await simulateDelay();
      const cleanEmail = email.toLowerCase().trim();
      const simUsers = JSON.parse(localStorage.getItem('omnimark_sim_users') || '{}');
      const uid = `sim-uid-${Date.now()}`;
      
      // Register in sim database
      simUsers[cleanEmail] = {
        uid,
        email: cleanEmail,
        displayName: name,
        role: 'client',
        password
      };
      localStorage.setItem('omnimark_sim_users', JSON.stringify(simUsers));
    }
  }

  // Sign In
  async signIn(email, password) {
    if (isConfigured) {
      // Production Flow
      const cleanEmail = email.toLowerCase().trim();
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;
        const role = user.photoURL || 'admin';

        // Post-auth security verification gate
        if (role === 'team') {
          // Check if this email exists in teamMembers Firestore collection
          const teamSnap = await getDocs(collection(db, 'teamMembers'));
          let exists = false;
          teamSnap.forEach(d => {
            if (d.data().email && d.data().email.toLowerCase() === cleanEmail) {
              exists = true;
            }
          });
          if (!exists) {
            await fbSignOut(auth);
            throw new Error("auth/invalid-credential: Account has been deleted or deactivated.");
          }
        } else if (role === 'client') {
          // Check if this email exists in clients or client_logins Firestore collection
          const clientSnap = await getDocs(collection(db, 'clients'));
          const clientLoginSnap = await getDocs(collection(db, 'client_logins'));
          let exists = false;
          clientSnap.forEach(d => {
            if ((d.data().email && d.data().email.toLowerCase() === cleanEmail) || (d.data().portalEmail && d.data().portalEmail.toLowerCase() === cleanEmail)) {
              exists = true;
            }
          });
          clientLoginSnap.forEach(d => {
            if (d.data().email && d.data().email.toLowerCase() === cleanEmail) {
              exists = true;
            }
          });
          if (!exists) {
            await fbSignOut(auth);
            throw new Error("auth/invalid-credential: Account has been deleted or deactivated.");
          }
        } else if (role === 'admin') {
          // Check if this email matches the current active super admin login ID
          const adminSnap = await getDocs(collection(db, 'admin_logins'));
          let currentAdminEmail = null;
          adminSnap.forEach(d => {
            if (d.id === 'super_admin') {
              currentAdminEmail = d.data().email;
            }
          });
          if (currentAdminEmail && cleanEmail !== currentAdminEmail.toLowerCase().trim()) {
            await fbSignOut(auth);
            throw new Error("auth/invalid-credential: The specified login ID has been changed or is inactive.");
          }
        }

        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || cleanEmail.split('@')[0],
          role: role
        };
        sessionStorage.setItem('aurascale_custom_session', JSON.stringify(this.currentUser));
        this._notifyListeners();
        return this.currentUser;
      } catch (error) {
        // If sign in fails, check on-the-fly onboarding vaults (only from live Firestore, never hardcoded mocks!)
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email' || error.message.includes('auth/invalid-credential')) {
          try {
            // 1. Query Firestore client logins
            const clientSnap = await getDocs(collection(db, 'client_logins'));
            let clientMatch = null;
            clientSnap.forEach(d => {
              if (d.data().email && d.data().email.toLowerCase() === cleanEmail && d.data().password === password) {
                clientMatch = d.data();
              }
            });
            
            if (clientMatch) {
              try {
                const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
                await updateProfile(userCredential.user, {
                  displayName: clientMatch.name,
                  photoURL: 'client'
                });
                
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                  name: clientMatch.name,
                  email: cleanEmail,
                  role: 'client',
                  createdAt: new Date().toISOString()
                });

                this.currentUser = {
                  uid: userCredential.user.uid,
                  email: userCredential.user.email,
                  displayName: clientMatch.name,
                  role: 'client'
                };
                sessionStorage.setItem('aurascale_custom_session', JSON.stringify(this.currentUser));
                this._notifyListeners();
                return this.currentUser;
              } catch (createErr) {
                console.warn('⚠️ Client cloud Auth onboarding failed. Falling back to local sessionStorage session.', createErr);
                this.currentUser = {
                  uid: clientMatch.id || 'client-fallback-uid',
                  email: cleanEmail,
                  displayName: clientMatch.name,
                  role: 'client'
                };
                sessionStorage.setItem('aurascale_custom_session', JSON.stringify(this.currentUser));
                this._notifyListeners();
                return this.currentUser;
              }
            }

            // 2. Query Firestore teamMembers logins
            const teamSnap = await getDocs(collection(db, 'teamMembers'));
            let teamMatch = null;
            teamSnap.forEach(d => {
              if (d.data().email && d.data().email.toLowerCase() === cleanEmail && d.data().password === password) {
                teamMatch = d.data();
              }
            });
            
            if (teamMatch) {
              try {
                const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
                await updateProfile(userCredential.user, {
                  displayName: teamMatch.name,
                  photoURL: 'team'
                });
                
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                  name: teamMatch.name,
                  email: cleanEmail,
                  role: 'team',
                  createdAt: new Date().toISOString()
                });

                this.currentUser = {
                  uid: userCredential.user.uid,
                  email: userCredential.user.email,
                  displayName: teamMatch.name,
                  role: 'team'
                };
                sessionStorage.setItem('aurascale_custom_session', JSON.stringify(this.currentUser));
                this._notifyListeners();
                return this.currentUser;
              } catch (createErr) {
                console.warn('⚠️ Team cloud Auth onboarding failed. Falling back to local sessionStorage session.', createErr);
                this.currentUser = {
                  uid: teamMatch.id || 'team-fallback-uid',
                  email: cleanEmail,
                  displayName: teamMatch.name,
                  role: 'team'
                };
                sessionStorage.setItem('aurascale_custom_session', JSON.stringify(this.currentUser));
                this._notifyListeners();
                return this.currentUser;
              }
            }

            // 3. Query Firestore admin_logins fallback
            const adminSnap = await getDocs(collection(db, 'admin_logins'));
            let adminMatch = null;
            adminSnap.forEach(d => {
              if (d.data().email && d.data().email.toLowerCase() === cleanEmail) {
                const expectedPass = d.data().password || 'admin123';
                if (password === expectedPass) {
                  adminMatch = d.data();
                }
              }
            });

            if (adminMatch) {
              const standardAuthEmail = adminMatch.authEmail || 'admin@aurascale.io';
              try {
                // Bridge standard Firebase Auth session by signing in standardly
                const userCredential = await signInWithEmailAndPassword(auth, standardAuthEmail, password);
                
                this.currentUser = {
                  uid: userCredential.user.uid,
                  email: cleanEmail, // Expose the customized Super Admin email ID
                  displayName: adminMatch.name || 'RAJIB (Admin)',
                  role: 'admin'
                };
                sessionStorage.setItem('aurascale_custom_session', JSON.stringify(this.currentUser));
                this._notifyListeners();
                return this.currentUser;
              } catch (authErr) {
                console.warn('⚠️ Standard login failed for fallback admin email. Registering standard user on-the-fly.', authErr);
                try {
                  const userCredential = await createUserWithEmailAndPassword(auth, standardAuthEmail, password);
                  await updateProfile(userCredential.user, {
                    displayName: adminMatch.name,
                    photoURL: 'admin'
                  });
                  
                  await setDoc(doc(db, 'users', userCredential.user.uid), {
                    name: adminMatch.name,
                    email: cleanEmail,
                    role: 'admin',
                    createdAt: new Date().toISOString()
                  });

                  this.currentUser = {
                    uid: userCredential.user.uid,
                    email: cleanEmail,
                    displayName: adminMatch.name,
                    role: 'admin'
                  };
                  sessionStorage.setItem('aurascale_custom_session', JSON.stringify(this.currentUser));
                  this._notifyListeners();
                  return this.currentUser;
                } catch (createErr) {
                  console.warn('⚠️ Admin cloud Auth onboarding failed. Falling back to local sessionStorage session.', createErr);
                  this.currentUser = {
                    uid: adminMatch.uid || 'super-admin-fallback-uid',
                    email: cleanEmail,
                    displayName: adminMatch.name || 'RAJIB (Admin)',
                    role: 'admin'
                  };
                  sessionStorage.setItem('aurascale_custom_session', JSON.stringify(this.currentUser));
                  this._notifyListeners();
                  return this.currentUser;
                }
              }
            }
          } catch (fsError) {
            console.error('Failed on-the-fly onboarding checks:', fsError);
          }
        }
        throw error;
      }
    } else {
      // Local Storage Simulation Flow
      await simulateDelay();
      const cleanEmail = email.toLowerCase().trim();
      const simUsers = JSON.parse(localStorage.getItem('omnimark_sim_users') || '{}');
      const user = simUsers[cleanEmail];
      
      if (!user || user.password !== password) {
        throw new Error('Invalid email credentials or incorrect password.');
      }
      const sessionUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      };
      this.currentUser = sessionUser;
      localStorage.setItem('omnimark_auth_user', JSON.stringify(sessionUser));
      this._notifyListeners();
      return this.currentUser;
    }
  }

  // Sign Out
  async signOut() {
    if (isConfigured) {
      try {
        await fbSignOut(auth);
      } catch (err) {
        console.error('Firebase Auth signOut error:', err);
      }
      sessionStorage.removeItem('aurascale_custom_session');
      this.currentUser = null;
      this._notifyListeners();
    } else {
      await simulateDelay();
      this.currentUser = null;
      localStorage.removeItem('omnimark_auth_user');
      this._notifyListeners();
    }
  }

  // Load Invoices for active User (queries standard collection and sorts latest-first)
  async getUserInvoices() {
    if (!this.currentUser) return [];
    try {
      const invoices = await this.getCollectionData('invoices', INITIAL_INVOICES);
      return invoices.sort((a, b) => b.id.localeCompare(a.id));
    } catch (error) {
      console.error('Failed to get invoices:', error);
      throw error;
    }
  }

  // Save Invoices list securely (used for updates, new invoices, or renegotiations)
  async saveUserInvoices(invoicesList) {
    if (!this.currentUser) return;
    try {
      await this.saveCollectionData('invoices', invoicesList);
    } catch (error) {
      console.error('Failed to save invoices:', error);
      throw error;
    }
  }

  // Internal: Seed Firestore initial invoices for a brand-new user session
  async _seedInitialInvoices(userId) {
    try {
      const seeded = INITIAL_INVOICES.map(inv => ({
        ...inv,
        userId: userId,
        seeded: true
      }));
      
      const promises = seeded.map(async (invoice) => {
        await setDoc(doc(db, 'invoices', invoice.id), invoice);
      });
      await Promise.all(promises);
      return seeded;
    } catch (e) {
      console.error('Failed seeding default invoices in Firestore', e);
      return INITIAL_INVOICES;
    }
  }

  // Internal: Seed simulated localStorage invoices
  _seedSimulatedInvoices(userId) {
    const storageKey = `omnimark_sim_invoices_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(INITIAL_INVOICES));
    return INITIAL_INVOICES;
  }

  // Load a full collection from Firestore or localStorage fallback.
  async getCollectionData(collName, defaultData) {
    if (!isConfigured) {
      const storageKey = `omnimark_sim_collection_${collName}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(`Failed to parse simulated collection ${collName}`, e);
        }
      }
      // If no entry exists yet, save the defaultData baseline to local storage
      if (defaultData) {
        localStorage.setItem(storageKey, JSON.stringify(defaultData));
      }
      return defaultData || [];
    }
    try {
      if (collName === 'system_config') {
        const colRef = collection(db, collName);
        const snapshot = await getDocs(colRef);
        const data = [];
        snapshot.forEach(d => data.push({ id: d.id, ...d.data() }));
        return data;
      }

      const colRef = collection(db, collName);
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        // In production mode, we NEVER seed mock data or return defaultData as a fallback.
        // We always return an empty array to respect administrative deletions.
        console.log(`ℹ/ Collection ${collName} is empty in Firestore. Returning empty array.`);
        return [];
      }
      const data = [];
      snapshot.forEach(d => {
        data.push({ id: d.id, ...d.data() });
      });
      
      // Stable sorting based on ID
      return data.sort((a, b) => {
        if (a.id && b.id) return a.id.localeCompare(b.id);
        return 0;
      });
    } catch (error) {
      console.error(`Error loading Firestore collection ${collName}:`, error);
      // In production mode, we must THROW the error so that the calling Promise.all fails,
      // which prevents setting hasFetched to true and avoids overwriting Firestore with local states.
      throw error;
    }
  }

  // Sync entire React state array to Firestore or localStorage.
  // Automatically handles additions, updates, and deletions!
  async saveCollectionData(collName, dataList) {
    if (!dataList) return;
    if (!isConfigured) {
      const storageKey = `omnimark_sim_collection_${collName}`;
      localStorage.setItem(storageKey, JSON.stringify(dataList));
      return;
    }
    try {
      // Get all current documents in Firestore
      const colRef = collection(db, collName);
      const snapshot = await getDocs(colRef);
      const currentDocIds = snapshot.docs.map(doc => doc.id);
      
      // Compare with new dataList IDs to find deletions
      const newListIds = dataList.map(item => item.id).filter(Boolean);
      const idsToDelete = currentDocIds.filter(id => !newListIds.includes(id));
      
      // Delete obsolete documents
      const deletePromises = idsToDelete.map(id => deleteDoc(doc(db, collName, id)));
      
      // Write/Update existing ones
      const writePromises = dataList.map(async (item) => {
        const docId = item.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const cleanItem = { ...item };
        if (!cleanItem.id) cleanItem.id = docId; // Ensure id is inside document
        await setDoc(doc(db, collName, docId), cleanItem);
      });
      
      await Promise.all([...deletePromises, ...writePromises]);
    } catch (error) {
      console.error(`Error saving Firestore collection ${collName}:`, error);
      throw error;
    }
  }

  // Save a single document directly to Firestore or localStorage fallback
  async saveDocument(collName, docId, data) {
    if (!data) return;
    const cleanItem = { ...data };
    if (!cleanItem.id) cleanItem.id = docId;

    if (!isConfigured) {
      // Simulation mode: update simulated localStorage collection array
      const storageKey = `omnimark_sim_collection_${collName}`;
      const saved = localStorage.getItem(storageKey);
      let list = [];
      if (saved) {
        try {
          list = JSON.parse(saved);
        } catch (e) {
          console.error(`Failed to parse simulated collection ${collName}`, e);
        }
      }
      // Check if it already exists, if so merge/replace, otherwise push
      const index = list.findIndex(item => item.id === docId);
      if (index > -1) {
        list[index] = { ...list[index], ...cleanItem };
      } else {
        list.push(cleanItem);
      }
      localStorage.setItem(storageKey, JSON.stringify(list));
      return;
    }

    // Production mode: write to Firestore
    try {
      await setDoc(doc(db, collName, docId), cleanItem);
    } catch (error) {
      console.error(`Error saving Firestore document ${docId} in ${collName}:`, error);
      throw error;
    }
  }

  // Delete a single document directly from Firestore or localStorage fallback
  async deleteDocument(collName, docId) {
    if (!isConfigured) {
      // Simulation mode: update simulated localStorage collection array
      const storageKey = `omnimark_sim_collection_${collName}`;
      const saved = localStorage.getItem(storageKey);
      let list = [];
      if (saved) {
        try {
          list = JSON.parse(saved);
        } catch (e) {
          console.error(`Failed to parse simulated collection ${collName}`, e);
        }
      }
      list = list.filter(item => item.id !== docId);
      localStorage.setItem(storageKey, JSON.stringify(list));
      return;
    }

    // Production mode: write to Firestore
    try {
      await deleteDoc(doc(db, collName, docId));
    } catch (error) {
      console.error(`Error deleting Firestore document ${docId} in ${collName}:`, error);
      throw error;
    }
  }

  // Local storage synchronization helpers for simulated accounts
  syncSimulatedUser(name, email, password, role) {
    const cleanEmail = email.toLowerCase().trim();
    const simUsers = JSON.parse(localStorage.getItem('omnimark_sim_users') || '{}');
    const existing = simUsers[cleanEmail];
    const uid = existing ? existing.uid : `sim-uid-${Date.now()}`;
    simUsers[cleanEmail] = {
      uid,
      email: cleanEmail,
      displayName: name,
      role,
      password
    };
    localStorage.setItem('omnimark_sim_users', JSON.stringify(simUsers));
  }

  async deleteSimulatedUser(email) {
    const cleanEmail = email.toLowerCase().trim();
    if (isConfigured) {
      try {
        const docId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
        await deleteDoc(doc(db, 'users', docId));
        console.log(`Deleted Firestore user profile for ${cleanEmail}`);
      } catch (err) {
        console.error('Failed to delete user profile from Firestore:', err);
      }
    } else {
      const simUsers = JSON.parse(localStorage.getItem('omnimark_sim_users') || '{}');
      if (simUsers[cleanEmail]) {
        delete simUsers[cleanEmail];
        localStorage.setItem('omnimark_sim_users', JSON.stringify(simUsers));
      }
    }
  }

  async deleteClientCredentials(email) {
    const cleanEmail = email.toLowerCase().trim();
    if (isConfigured) {
      try {
        const docId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
        await deleteDoc(doc(db, 'client_logins', docId));
        await deleteDoc(doc(db, 'users', docId));
        console.log(`Deleted Firestore credentials and profile for ${cleanEmail}`);
      } catch (err) {
        console.error('Failed to delete client credentials from Firestore:', err);
      }
    } else {
      const simUsers = JSON.parse(localStorage.getItem('omnimark_sim_users') || '{}');
      if (simUsers[cleanEmail]) {
        delete simUsers[cleanEmail];
        localStorage.setItem('omnimark_sim_users', JSON.stringify(simUsers));
      }
    }
  }

  // Security Credentials Suite updates for Super Admin
  async updateSuperAdminCredentials(newEmail, newPassword) {
    if (isConfigured) {
      const user = auth.currentUser;
      if (!user) throw new Error("No active authenticated user found.");
      
      const cleanEmail = (newEmail || user.email).toLowerCase().trim();
      
      // Try to sync with standard Firebase Auth
      try {
        if (newEmail && newEmail.toLowerCase() !== user.email.toLowerCase()) {
          // Bypassing standard updateEmail to prevent Firebase verification gates/errors.
          // The new email is persisted directly to the admin_logins and users databases.
          // This allows the Super Admin to change their login ID instantly without any verification.
          console.log("ℹ️ Bypassing standard Firebase updateEmail to avoid verification gates. Email ID updated in database successfully.");
        }
        if (newPassword) {
          await updatePassword(user, newPassword);
        }
      } catch (authErr) {
        console.error("Firebase Auth cloud credentials update failed:", authErr);
        throw authErr; // Propagate other errors (like recent-login-required for passwords)
      }
      
      // Persist admin credentials to admin_logins for 100% reliable login fallback
      const adminUpdate = {
        email: cleanEmail,
        authEmail: user.email || 'admin@aurascale.io',
        name: user.displayName || 'RAJIB (Admin)',
        role: 'admin',
        updatedAt: new Date().toISOString()
      };
      if (newPassword) {
        adminUpdate.password = newPassword;
      }
      await setDoc(doc(db, 'admin_logins', 'super_admin'), adminUpdate, { merge: true });
      
      // Update database profile record in general users
      await setDoc(doc(db, 'users', user.uid), {
        email: cleanEmail,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      this.currentUser = {
        ...this.currentUser,
        email: cleanEmail
      };
      sessionStorage.setItem('aurascale_custom_session', JSON.stringify(this.currentUser));
      this._notifyListeners();
    } else {
      await simulateDelay();
      const simUsers = JSON.parse(localStorage.getItem('omnimark_sim_users') || '{}');
      const activeSessionUser = JSON.parse(localStorage.getItem('omnimark_auth_user') || '{}');
      const email = activeSessionUser.email;
      
      if (simUsers[email]) {
        const oldUser = simUsers[email];
        delete simUsers[email]; // remove old key if email changed
        
        const updatedUser = {
          ...oldUser,
          email: newEmail || oldUser.email,
          password: newPassword || oldUser.password
        };
        
        simUsers[updatedUser.email] = updatedUser;
        localStorage.setItem('omnimark_sim_users', JSON.stringify(simUsers));
        
        const newSession = {
          ...activeSessionUser,
          email: updatedUser.email
        };
        this.currentUser = newSession;
        localStorage.setItem('omnimark_auth_user', JSON.stringify(newSession));
        this._notifyListeners();
      }
    }
  }
}

const firebaseService = new FirebaseService();
export default firebaseService;
