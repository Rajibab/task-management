import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AICopilot from './components/AICopilot';
import Overview from './pages/Overview';
import Clients from './pages/Clients';
import Services from './pages/Services';
import SEOReports from './pages/SEOReports';
import Billing from './pages/Billing';
import CRM from './pages/CRM';
import Tasks from './pages/Tasks';
import SettingsPage from './pages/Settings';

import firebaseService from './firebaseService';
import { isConfigured } from './firebase';
import AuthModal from './components/AuthModal';
import LoginGateway from './components/LoginGateway';

import { 
  INITIAL_CLIENTS, INITIAL_SERVICES, INITIAL_TASKS, 
  INITIAL_LEADS, INITIAL_INVOICES, INITIAL_NOTIFICATIONS, 
  MOCK_RENEGOTIATION_LOGS, SERVICE_REQUESTS, INITIAL_SEO_REPORT,
  MOCK_COMMENTS, MOCK_SEO_REPORTS, MOCK_TEAM,
  MOCK_PROJECTS, MOCK_PURCHASE_ORDERS
} from './mockData';

import { Bell, Search, Sun, Moon, HelpCircle } from 'lucide-react';

function App() {
  // Navigation & Role states
  const [activeTab, setActiveTab] = useState('overview');
  const [currentRole, setCurrentRole] = useState('admin'); // admin, team, client

  // Auth & Session management
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  // Core databases
  const [clients, setClients] = useState(isConfigured ? [] : INITIAL_CLIENTS);
  const [services, setServices] = useState(isConfigured ? [] : INITIAL_SERVICES);
  const [tasks, setTasks] = useState(isConfigured ? [] : INITIAL_TASKS);
  const [leads, setLeads] = useState(isConfigured ? [] : INITIAL_LEADS);
  const [invoices, setInvoices] = useState(isConfigured ? [] : INITIAL_INVOICES);
  const [notifications, setNotifications] = useState(isConfigured ? [] : INITIAL_NOTIFICATIONS);
  const [renegotiationLogs, setRenegotiationLogs] = useState(isConfigured ? [] : MOCK_RENEGOTIATION_LOGS);
  const [serviceRequests, setServiceRequests] = useState(isConfigured ? [] : SERVICE_REQUESTS);
  const [seoReports, setSeoReports] = useState(isConfigured ? [] : MOCK_SEO_REPORTS);
  const [comments, setComments] = useState(isConfigured ? [] : MOCK_COMMENTS);
  const [teamMembers, setTeamMembers] = useState(isConfigured ? [] : MOCK_TEAM);
  const [projects, setProjects] = useState(isConfigured ? [] : MOCK_PROJECTS);
  const [purchaseOrders, setPurchaseOrders] = useState(isConfigured ? [] : MOCK_PURCHASE_ORDERS);

  // White-Label configuration
  const [agencyName, setAgencyName] = useState('AuraScale');
  const [agencyLogo, setAgencyLogo] = useState('');
  const [brandColor, setBrandColor] = useState('indigo'); // indigo, emerald, violet, amber
  const [darkMode, setDarkMode] = useState(true);
  
  // Custom toggles
  const [showNotifications, setShowNotifications] = useState(false);

  // Live Activity log state
  const [activityLogs, setActivityLogs] = useState([
    { id: 'l1', time: '18:04:12', user: 'System Sync', action: 'Connected securely to scalable GraphQL backend gateway.', details: 'Node cluster running healthy' },
    { id: 'l2', time: '17:15:30', user: 'Alex Rivera', action: 'Modified metadata title tags on Homepage Meta Tags task.', details: 'SEO optimized' },
    { id: 'l3', time: '14:22:15', user: 'Admin (RAJIB)', action: 'Sent recurring monthly invoice batch #INV-101.', details: 'Retainer total: ₹5,310' }
  ]);

  // Sync dark mode style toggles globally
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.style.backgroundColor = '#020617'; // slate-950
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#f8fafc'; // slate-50
    }
  }, [darkMode]);

  const [dbLoading, setDbLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Subscribe to Authentication State
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange((user) => {
      setCurrentUser(user);
      if (user && user.role) {
        setCurrentRole(user.role);
      }
    });
    return unsubscribe;
  }, []);

  // Centralized loading routine when active user session changes
  useEffect(() => {
    let active = true;
    const fetchAllData = async () => {
      if (currentUser) {
        setDbLoading(true);
        setHasFetched(false); // Reset synchronization locks
        try {
          console.log("🔥 App: Parallel Firestore sync initializing...");
          const [
            userInvoices,
            dbClients,
            dbServices,
            dbTasks,
            dbLeads,
            dbNotifications,
            dbRenegotiationLogs,
            dbServiceRequests,
            dbSeoReports,
            dbComments,
            dbTeamMembers,
            dbSystemConfigs,
            dbProjects,
            dbPurchaseOrders
          ] = await Promise.all([
            firebaseService.getUserInvoices(),
            firebaseService.getCollectionData('clients', INITIAL_CLIENTS),
            firebaseService.getCollectionData('services', INITIAL_SERVICES),
            firebaseService.getCollectionData('tasks', INITIAL_TASKS),
            firebaseService.getCollectionData('leads', INITIAL_LEADS),
            firebaseService.getCollectionData('notifications', INITIAL_NOTIFICATIONS),
            firebaseService.getCollectionData('renegotiationLogs', MOCK_RENEGOTIATION_LOGS),
            firebaseService.getCollectionData('serviceRequests', SERVICE_REQUESTS),
            firebaseService.getCollectionData('seoReports', MOCK_SEO_REPORTS),
            firebaseService.getCollectionData('comments', MOCK_COMMENTS),
            firebaseService.getCollectionData('teamMembers', MOCK_TEAM),
            firebaseService.getCollectionData('system_config', []),
            firebaseService.getCollectionData('projects', MOCK_PROJECTS),
            firebaseService.getCollectionData('purchaseOrders', MOCK_PURCHASE_ORDERS)
          ]);

          if (active) {
            // Post-fetch session de-authorization check
            if (currentUser.role === 'team') {
              const cleanEmail = currentUser.email.toLowerCase().trim();
              const exists = dbTeamMembers.some(tm => tm.email && tm.email.toLowerCase().trim() === cleanEmail);
              if (!exists) {
                console.log("🔒 Security Gate: Active team session de-authorized. Logging out...");
                await firebaseService.signOut();
                return;
              }
            } else if (currentUser.role === 'client') {
              const cleanEmail = currentUser.email.toLowerCase().trim();
              const exists = dbClients.some(c => 
                (c.email && c.email.toLowerCase().trim() === cleanEmail) || 
                (c.portalEmail && c.portalEmail.toLowerCase().trim() === cleanEmail)
              );
              if (!exists) {
                console.log("🔒 Security Gate: Active client session de-authorized. Logging out...");
                await firebaseService.signOut();
                return;
              }
            }

            setInvoices(userInvoices);
            setClients(dbClients);
            setServices(dbServices);
            setTasks(dbTasks);
            setLeads(dbLeads);
            setNotifications(dbNotifications);
            setRenegotiationLogs(dbRenegotiationLogs);
            setServiceRequests(dbServiceRequests);
            setSeoReports(dbSeoReports);
            setComments(dbComments);
            setTeamMembers(dbTeamMembers);
            setProjects(dbProjects);
            setPurchaseOrders(dbPurchaseOrders);

            const whiteLabelConfig = dbSystemConfigs.find(c => c.id === 'white_label');
            if (whiteLabelConfig) {
              if (whiteLabelConfig.agencyName) setAgencyName(whiteLabelConfig.agencyName);
              if (whiteLabelConfig.agencyLogo) setAgencyLogo(whiteLabelConfig.agencyLogo);
              if (whiteLabelConfig.brandColor) setBrandColor(whiteLabelConfig.brandColor);
              if (whiteLabelConfig.darkMode !== undefined) setDarkMode(whiteLabelConfig.darkMode);
            }

            setHasFetched(true); // Successfully initialized Firestore records!
            console.log("🔥 App: All Firestore collections synced successfully.");
          }
        } catch (err) {
          console.error('Failed to retrieve live Firestore collections:', err);
        } finally {
          if (active) {
            setDbLoading(false);
          }
        }
      } else {
        if (active) {
          setInvoices(isConfigured ? [] : INITIAL_INVOICES);
          setClients(isConfigured ? [] : INITIAL_CLIENTS);
          setServices(isConfigured ? [] : INITIAL_SERVICES);
          setTasks(isConfigured ? [] : INITIAL_TASKS);
          setLeads(isConfigured ? [] : INITIAL_LEADS);
          setNotifications(isConfigured ? [] : INITIAL_NOTIFICATIONS);
          setRenegotiationLogs(isConfigured ? [] : MOCK_RENEGOTIATION_LOGS);
          setServiceRequests(isConfigured ? [] : SERVICE_REQUESTS);
          setSeoReports(isConfigured ? [] : MOCK_SEO_REPORTS);
          setComments(isConfigured ? [] : MOCK_COMMENTS);
          setTeamMembers(isConfigured ? [] : MOCK_TEAM);
          setProjects(isConfigured ? [] : MOCK_PROJECTS);
          setPurchaseOrders(isConfigured ? [] : MOCK_PURCHASE_ORDERS);
          setAgencyName('AuraScale');
          setAgencyLogo('');
          setBrandColor('indigo');
          setDarkMode(true);
          setHasFetched(false);
          setDbLoading(false);
        }
      }
    };
    fetchAllData();
    return () => {
      active = false;
    };
  }, [currentUser]);

  // Decoupled: clients reactive updates are handled via atomic, direct writes in page handlers
  /*
  useEffect(() => {
    if (currentUser && hasFetched && !dbLoading) {
      if (isConfigured && clients === INITIAL_CLIENTS) return;
      firebaseService.saveCollectionData('clients', clients).catch(err => console.error(err));
    }
  }, [clients, currentUser, dbLoading, hasFetched]);
  */

  /*
  useEffect(() => {
    if (currentUser && hasFetched && !dbLoading) {
      if (isConfigured && services === INITIAL_SERVICES) return;
      firebaseService.saveCollectionData('services', services).catch(err => console.error(err));
    }
  }, [services, currentUser, dbLoading, hasFetched]);

  useEffect(() => {
    if (currentUser && hasFetched && !dbLoading) {
      if (isConfigured && tasks === INITIAL_TASKS) return;
      firebaseService.saveCollectionData('tasks', tasks).catch(err => console.error(err));
    }
  }, [tasks, currentUser, dbLoading, hasFetched]);

  useEffect(() => {
    if (currentUser && hasFetched && !dbLoading) {
      if (isConfigured && leads === INITIAL_LEADS) return;
      firebaseService.saveCollectionData('leads', leads).catch(err => console.error(err));
    }
  }, [leads, currentUser, dbLoading, hasFetched]);

  useEffect(() => {
    if (currentUser && hasFetched && !dbLoading) {
      if (isConfigured && invoices === INITIAL_INVOICES) return;
      firebaseService.saveUserInvoices(invoices).catch(err => console.error(err));
    }
  }, [invoices, currentUser, dbLoading, hasFetched]);

  useEffect(() => {
    if (currentUser && hasFetched && !dbLoading) {
      if (isConfigured && notifications === INITIAL_NOTIFICATIONS) return;
      firebaseService.saveCollectionData('notifications', notifications).catch(err => console.error(err));
    }
  }, [notifications, currentUser, dbLoading, hasFetched]);

  useEffect(() => {
    if (currentUser && hasFetched && !dbLoading) {
      if (isConfigured && renegotiationLogs === MOCK_RENEGOTIATION_LOGS) return;
      firebaseService.saveCollectionData('renegotiationLogs', renegotiationLogs).catch(err => console.error(err));
    }
  }, [renegotiationLogs, currentUser, dbLoading, hasFetched]);

  useEffect(() => {
    if (currentUser && hasFetched && !dbLoading) {
      if (isConfigured && serviceRequests === SERVICE_REQUESTS) return;
      firebaseService.saveCollectionData('serviceRequests', serviceRequests).catch(err => console.error(err));
    }
  }, [serviceRequests, currentUser, dbLoading, hasFetched]);

  useEffect(() => {
    if (currentUser && hasFetched && !dbLoading) {
      if (isConfigured && seoReports === MOCK_SEO_REPORTS) return;
      firebaseService.saveCollectionData('seoReports', seoReports).catch(err => console.error(err));
    }
  }, [seoReports, currentUser, dbLoading, hasFetched]);

  useEffect(() => {
    if (currentUser && hasFetched && !dbLoading) {
      if (isConfigured && comments === MOCK_COMMENTS) return;
      firebaseService.saveCollectionData('comments', comments).catch(err => console.error(err));
    }
  }, [comments, currentUser, dbLoading, hasFetched]);
  */

  // Decoupled: teamMembers reactive updates are handled via atomic, direct writes in page handlers
  /*
  useEffect(() => {
    if (currentUser && hasFetched && !dbLoading) {
      if (isConfigured && teamMembers === MOCK_TEAM) return;
      firebaseService.saveCollectionData('teamMembers', teamMembers).catch(err => console.error(err));
    }
  }, [teamMembers, currentUser, dbLoading, hasFetched]);
  */

  // Derived permissions based on active team member records
  const activeTeamMember = currentRole === 'team' && currentUser
    ? teamMembers.find(tm => tm.email.toLowerCase() === currentUser.email.toLowerCase())
    : null;
    
  const hasLeadAccess = currentRole === 'admin' || (activeTeamMember ? activeTeamMember.leadPipelineAccess : false);

  // Router security gate redirection
  useEffect(() => {
    if (currentRole === 'team' && activeTab === 'crm' && !hasLeadAccess) {
      console.log("🔒 RBAC Gate: Team member lacks Lead Pipeline Access. Redirecting to Executive Console.");
      setActiveTab('overview');
    }
  }, [currentRole, activeTab, hasLeadAccess]);

  // Action: Append new items to activity ledger
  const logActivity = (action, details = '') => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const userMap = {
      admin: 'Admin (RAJIB)',
      team: 'Chloe Chen (PPC)',
      client: 'Sarah Jenkins'
    };
    
    const newLog = {
      id: `l-${Date.now()}`,
      time: timestamp,
      user: userMap[currentRole] || 'User',
      action: action,
      details: details
    };

    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Mark single notifications as read
  const handleMarkNotificationRead = async (id) => {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      const updated = { ...notification, read: true };
      try {
        await firebaseService.saveDocument('notifications', id, updated);
      } catch (err) {
        console.error('Failed to save read notification:', err);
      }
      setNotifications(prev => prev.map(n => n.id === id ? updated : n));
    }
  };

  // Color maps matching selections
  const getBrandTextColor = () => {
    switch (brandColor) {
      case 'emerald': return 'text-emerald-400';
      case 'violet': return 'text-violet-400';
      case 'amber': return 'text-amber-400';
      default: return 'text-indigo-400';
    }
  };

  const getBrandBorderColor = () => {
    switch (brandColor) {
      case 'emerald': return 'border-emerald-500/20 focus:border-emerald-500';
      case 'violet': return 'border-violet-500/20 focus:border-violet-500';
      case 'amber': return 'border-amber-500/20 focus:border-amber-500';
      default: return 'border-indigo-500/20 focus:border-indigo-500';
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Executive Console';
      case 'clients': return 'Partner CRM';
      case 'services': return 'Campaign Builder';
      case 'reports': return 'Search Engine Index';
      case 'billing': return 'Financial Ledger';
      case 'crm': return 'Deals Pipeline';
      case 'tasks': return 'Sprint Workflows';
      case 'settings': return 'White-Label Config';
      default: return 'OmniMark Dashboard';
    }
  };

  // Gate the application rendering under full screen SaaS LoginGateway if no session active
  if (!currentUser) {
    return <LoginGateway brandColor={brandColor} />;
  }

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-300`}>
      
      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentRole={currentRole} 
        notifications={notifications}
        agencyName={agencyName}
        agencyLogo={agencyLogo}
        brandColor={brandColor}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuth(true)}
        onSignOut={() => firebaseService.signOut()}
        hasLeadAccess={hasLeadAccess}
      />

      {/* Main viewport */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-900/60 flex items-center justify-between px-8 bg-slate-950/20 backdrop-blur-md sticky top-0 z-20 no-print">
          
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-extrabold uppercase tracking-widest bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
              {getPageTitle()}
            </h1>
            
            {/* Quick search input */}
            <div className="relative hidden md:block w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input 
                type="text" 
                placeholder="Global search index..." 
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700 text-slate-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Dark mode switch */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-all cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification bell center */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-all cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-slate-950 animate-ping" />
                )}
              </button>

              {/* Notification Drawer Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-slate-950 border border-slate-850 shadow-2xl p-4 space-y-3 z-50 animate-in fade-in slide-in-from-top-3 duration-250 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Recent Alerts</span>
                    <button 
                      onClick={async () => {
                        const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
                        try {
                          await Promise.all(updatedNotifications.map(n => firebaseService.saveDocument('notifications', n.id, n)));
                        } catch (err) {
                          console.error('Failed to clear notifications:', err);
                        }
                        setNotifications(updatedNotifications);
                        logActivity('Notifications Cleared', 'Marked all system notifications as read.');
                      }} 
                      className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-0.5">
                    {notifications.map((not) => (
                      <div 
                        key={not.id}
                        onClick={() => handleMarkNotificationRead(not.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col space-y-1 ${
                          not.read 
                            ? 'bg-slate-950/40 border-slate-900 text-slate-400' 
                            : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[10px] truncate">{not.title}</span>
                          <span className="text-[8px] text-slate-500 font-semibold">{not.time}</span>
                        </div>
                        <p className="text-[10px] leading-relaxed">{not.message}</p>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-850 rounded-xl font-bold text-slate-400 text-center cursor-pointer transition-colors block border border-slate-800/80"
                  >
                    Close Drawer
                  </button>
                </div>
              )}
            </div>

            {/* Quick Context indicator */}
            <span className="text-[10px] uppercase bg-slate-900 border border-slate-800 text-slate-400 py-1.5 px-3 rounded-full font-bold">
              Role: <span className={getBrandTextColor()}>{currentRole}</span>
            </span>

          </div>
        </header>

        {/* Dynamic subpage router */}
        <section className="flex-1 p-8">
          
          {activeTab === 'overview' && (
            <Overview 
              clients={clients} 
              invoices={invoices} 
              tasks={tasks} 
              activityLogs={activityLogs} 
              seoReports={seoReports}
              setCurrentRole={setCurrentRole}
              setActiveTab={setActiveTab}
              brandColor={brandColor}
              currentUser={currentUser}
              currentRole={currentRole}
              serviceRequests={serviceRequests}
              setServiceRequests={setServiceRequests}
              setClients={setClients}
              setInvoices={setInvoices}
              setTasks={setTasks}
              logActivity={logActivity}
              teamMembers={teamMembers}
            />
          )}

          {activeTab === 'clients' && (
            <Clients 
              clients={clients} 
              setClients={setClients} 
              logActivity={logActivity}
              brandColor={brandColor}
              currentRole={currentRole}
              teamMembers={teamMembers}
              setTeamMembers={setTeamMembers}
            />
          )}

          {activeTab === 'services' && (
            <Services 
              services={services}
              setServices={setServices}
              clients={clients}
              setClients={setClients}
              serviceRequests={serviceRequests}
              setServiceRequests={setServiceRequests}
              currentRole={currentRole}
              logActivity={logActivity}
              brandColor={brandColor}
              currentUser={currentUser}
              onOpenAuth={() => setShowAuth(true)}
              teamMembers={teamMembers}
              tasks={tasks}
            />
          )}

          {activeTab === 'reports' && (
            <SEOReports 
              seoReports={seoReports}
              setSeoReports={setSeoReports}
              currentRole={currentRole}
              logActivity={logActivity}
              brandColor={brandColor}
              clients={clients}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'billing' && (
            <Billing 
              invoices={invoices}
              setInvoices={setInvoices}
              renegotiationLogs={renegotiationLogs}
              setRenegotiationLogs={setRenegotiationLogs}
              clients={clients}
              setClients={setClients}
              currentRole={currentRole}
              logActivity={logActivity}
              brandColor={brandColor}
              currentUser={currentUser}
              onOpenAuth={() => setShowAuth(true)}
              projects={projects}
              setProjects={setProjects}
              purchaseOrders={purchaseOrders}
              setPurchaseOrders={setPurchaseOrders}
            />
          )}

          {activeTab === 'crm' && (
            <CRM 
              leads={leads}
              setLeads={setLeads}
              logActivity={logActivity}
              brandColor={brandColor}
              currentRole={currentRole}
              hasLeadAccess={hasLeadAccess}
            />
          )}

          {activeTab === 'tasks' && (
            <Tasks 
              tasks={tasks}
              setTasks={setTasks}
              comments={comments}
              setComments={setComments}
              logActivity={logActivity}
              brandColor={brandColor}
              currentUser={currentUser}
              currentRole={currentRole}
              clients={clients}
              teamMembers={teamMembers}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage 
              agencyName={agencyName}
              setAgencyName={setAgencyName}
              agencyLogo={agencyLogo}
              setAgencyLogo={setAgencyLogo}
              brandColor={brandColor}
              setBrandColor={setBrandColor}
              logActivity={logActivity}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              currentRole={currentRole}
              currentUser={currentUser}
            />
          )}

        </section>
        
      </main>

      {/* Floating AI chatbot assistant */}
      <AICopilot 
        clients={clients}
        invoices={invoices}
        leads={leads}
        brandColor={brandColor}
      />

      {/* Security Authentication Dialog overlay */}
      <AuthModal 
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        brandColor={brandColor}
      />

    </div>
  );
}

export default App;
