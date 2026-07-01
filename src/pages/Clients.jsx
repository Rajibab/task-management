import React, { useState } from 'react';
import { 
  Plus, Search, SlidersHorizontal, Globe, Mail, Phone, 
  Trash2, Edit, X, FolderOpen, FileText, CheckCircle, Clock,
  Key, RefreshCw, Eye, EyeOff, ShieldCheck, ToggleLeft, ToggleRight, UserCheck
} from 'lucide-react';
import firebaseService from '../firebaseService';

export default function Clients({ 
  clients, 
  setClients, 
  logActivity, 
  brandColor = 'indigo',
  currentRole = 'admin',
  teamMembers = [],
  setTeamMembers = () => {}
}) {
  const [activeDirectory, setActiveDirectory] = useState('clients'); // 'clients' or 'team'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name'); // name, billing, status
  const [selectedClient, setSelectedClient] = useState(null);
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  
  // Modals / Drawer toggles
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Forms state
  const [newClient, setNewClient] = useState({
    companyName: '', contactPerson: '', email: '', phone: '',
    website: '', industry: 'Aviation & Tech', status: 'Active',
    monthlyBilling: '', activeServices: [], projectStatus: 'On Track', notes: '',
    portalEmail: '', portalPassword: '', closingDate: '', logo: ''
  });

  const [editClientData, setEditClientData] = useState(null);

  // Team Directory specific states
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [newTeamMember, setNewTeamMember] = useState({
    name: '', email: '', password: '', jobTitle: '',
    workload: '0 Tasks Active', leadPipelineAccess: false,
    avatar: ''
  });
  const [editTeamMemberData, setEditTeamMemberData] = useState(null);

  const handleQuickLogoChange = async (itemId, e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      if (type === 'client') {
        const client = clients.find(c => c.id === itemId);
        if (client) {
          const updatedClient = { ...client, logo: base64 };
          try {
            await firebaseService.saveDocument('clients', itemId, updatedClient);
            setClients(prev => prev.map(c => c.id === itemId ? updatedClient : c));
            if (selectedClient && selectedClient.id === itemId) {
              setSelectedClient(updatedClient);
            }
            logActivity('Logo Updated', `Changed brand logo image for ${client.companyName}.`);
          } catch (err) {
            console.error('Failed to update client logo:', err);
            alert('Failed to save logo to database.');
          }
        }
      } else if (type === 'team') {
        const member = teamMembers.find(t => t.id === itemId);
        if (member) {
          const updatedMember = { ...member, avatar: base64 };
          try {
            await firebaseService.saveDocument('teamMembers', itemId, updatedMember);
            setTeamMembers(prev => prev.map(t => t.id === itemId ? updatedMember : t));
            logActivity('Avatar Updated', `Changed team member profile photo for ${member.name}.`);
          } catch (err) {
            console.error('Failed to update team avatar:', err);
            alert('Failed to save avatar to database.');
          }
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const generateStrongPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Available industry listings
  const industries = ['Aviation & Tech', 'Healthcare & Pharma', 'Retail & E-commerce', 'Renewables', 'Education & EdTech', 'Real Estate', 'Logistics'];

  // Global available services for selectors
  const ALL_SERVICES_LIST = ['SEO Optimization', 'Social Media Marketing', 'Google Ads Management', 'Website Development', 'Branding & Design', 'Video Production & Editing', 'Online Reputation Management'];

  // Dynamic filter application for CLIENTS
  const filteredClients = clients
    .filter(c => {
      const matchSearch = c.companyName.toLowerCase().includes(search.toLowerCase()) || 
                          c.contactPerson.toLowerCase().includes(search.toLowerCase()) || 
                          c.industry.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' ? true : c.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'billing') return b.monthlyBilling - a.monthlyBilling;
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return a.companyName.localeCompare(b.companyName);
    });

  // Dynamic filter for TEAM MEMBERS
  const filteredTeamMembers = teamMembers.filter(tm => {
    return tm.name.toLowerCase().includes(search.toLowerCase()) || 
           tm.email.toLowerCase().includes(search.toLowerCase()) || 
           tm.jobTitle.toLowerCase().includes(search.toLowerCase());
  });

  // Action: Add Client
  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newClient.companyName || !newClient.contactPerson || !newClient.email) {
      alert('Please fill out critical details (Company Name, Contact Person, Email)');
      return;
    }

    const portalEmailVal = newClient.portalEmail || newClient.email;
    const portalPasswordVal = newClient.portalPassword || 'client123';

    try {
      await firebaseService.createClientLogin(
        newClient.companyName,
        portalEmailVal,
        portalPasswordVal
      );
    } catch (err) {
      console.error('Failed to create client credential:', err);
    }

    const clientToAdd = {
      ...newClient,
      portalEmail: portalEmailVal,
      portalPassword: portalPasswordVal,
      id: `cli-${Date.now()}`,
      monthlyBilling: parseFloat(newClient.monthlyBilling) || 0,
      documents: ['Master_Engagement_Agreement.pdf'],
      activeServices: newClient.activeServices.length > 0 ? newClient.activeServices : ['SEO Optimization']
    };

    try {
      await firebaseService.saveDocument('clients', clientToAdd.id, clientToAdd);
    } catch (err) {
      console.error('Failed to save client document to database:', err);
    }

    setClients(prev => [clientToAdd, ...prev]);
    logActivity('Added Partner Account', `Registered brand ${clientToAdd.companyName} with active portal onboarding.`);
    
    // Reset state
    setNewClient({
      companyName: '', contactPerson: '', email: '', phone: '',
      website: '', industry: 'Aviation & Tech', status: 'Active',
      monthlyBilling: '', activeServices: [], projectStatus: 'On Track', notes: '',
      portalEmail: '', portalPassword: '', closingDate: '', logo: ''
    });
    setIsAddOpen(false);
  };

  // Action: Edit Client Trigger
  const openEditModal = (client) => {
    setEditClientData({ ...client });
    setIsEditOpen(true);
  };

  // Action: Save Edited Client
  const handleEditClientSubmit = async (e) => {
    e.preventDefault();
    if (!editClientData.companyName || !editClientData.contactPerson || !editClientData.email) return;

    const portalEmailVal = editClientData.portalEmail || editClientData.email;
    const portalPasswordVal = editClientData.portalPassword || 'client123';

    try {
      await firebaseService.createClientLogin(
        editClientData.companyName,
        portalEmailVal,
        portalPasswordVal
      );
    } catch (err) {
      console.error('Failed to update client credential:', err);
    }

    const updatedClient = {
      ...editClientData,
      portalEmail: portalEmailVal,
      portalPassword: portalPasswordVal,
      monthlyBilling: parseFloat(editClientData.monthlyBilling) || 0
    };

    try {
      await firebaseService.saveDocument('clients', updatedClient.id, updatedClient);
    } catch (err) {
      console.error('Failed to save updated client document to database:', err);
    }

    setClients(prev => prev.map(c => c.id === editClientData.id ? updatedClient : c));

    logActivity('Updated Partner Details', `Modified database profiles and access credentials for ${editClientData.companyName}.`);
    
    // Update selected profile view
    if (selectedClient && selectedClient.id === editClientData.id) {
      setSelectedClient(updatedClient);
    }
    
    setIsEditOpen(false);
  };

  // Action: Delete Client
  const handleDeleteClient = async (id, name) => {
    if (confirm(`Are you absolutely sure you want to terminate account ${name}? This action is irreversible.`)) {
      const clientToDelete = clients.find(c => c.id === id);
      const emailToDelete = clientToDelete?.portalEmail || clientToDelete?.email;
      
      try {
        await firebaseService.deleteDocument('clients', id);
        if (emailToDelete) {
          await firebaseService.deleteClientCredentials(emailToDelete);
        }
      } catch (err) {
        console.error('Failed to delete client document from database:', err);
      }
      
      setClients(prev => prev.filter(c => c.id !== id));
      logActivity('Partner Account Terminated', `Removed brand ${name} and related billing records.`);
      setSelectedClient(null);
    }
  };

  // Action: Add Team Member
  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!newTeamMember.name || !newTeamMember.email || !newTeamMember.password) {
      alert('Please fill out Name, Email and Password for the team member.');
      return;
    }

    const teamToRegister = {
      ...newTeamMember,
      id: `tm-${Date.now()}`,
      role: 'team'
    };

    // Synchronize credentials locally / simulated
    try {
      firebaseService.syncSimulatedUser(teamToRegister.name, teamToRegister.email, teamToRegister.password, 'team');
    } catch (err) {
      console.error('Failed syncing simulated user credentials:', err);
    }

    try {
      await firebaseService.saveDocument('teamMembers', teamToRegister.id, teamToRegister);
    } catch (err) {
      console.error('Failed to save team member document to database:', err);
    }

    setTeamMembers(prev => [...prev, teamToRegister]);
    logActivity('Registered Team Member', `Created credentials directory and assigned pipeline configuration for ${teamToRegister.name}.`);

    // Reset Form
    setNewTeamMember({
      name: '', email: '', password: '', jobTitle: '',
      workload: '0 Tasks Active', leadPipelineAccess: false,
      avatar: ''
    });
    setIsAddTeamOpen(false);
  };

  // Action: Edit Team Member Trigger
  const openEditTeamModal = (tm) => {
    setEditTeamMemberData({ ...tm });
    setIsEditTeamOpen(true);
  };

  // Action: Save Edited Team Member
  const handleEditTeamMemberSubmit = async (e) => {
    e.preventDefault();
    if (!editTeamMemberData.name || !editTeamMemberData.email) return;

    // Sync credentials
    try {
      firebaseService.syncSimulatedUser(
        editTeamMemberData.name,
        editTeamMemberData.email,
        editTeamMemberData.password || 'team123',
        'team'
      );
    } catch (err) {
      console.error('Failed syncing updated team credentials:', err);
    }

    try {
      await firebaseService.saveDocument('teamMembers', editTeamMemberData.id, editTeamMemberData);
    } catch (err) {
      console.error('Failed to save updated team member document to database:', err);
    }

    setTeamMembers(prev => prev.map(tm => tm.id === editTeamMemberData.id ? { ...editTeamMemberData } : tm));
    logActivity('Updated Team Member', `Modified permission attributes and login tokens for ${editTeamMemberData.name}.`);
    setIsEditTeamOpen(false);
  };

  // Action: Delete Team Member
  const handleDeleteTeamMember = async (id, email, name) => {
    if (confirm(`Are you sure you want to remove team member ${name}?`)) {
      try {
        await firebaseService.deleteDocument('teamMembers', id);
        await firebaseService.deleteSimulatedUser(email);
      } catch (err) {
        console.error('Failed to delete team member from database:', err);
      }
      setTeamMembers(prev => prev.filter(tm => tm.id !== id));
      logActivity('Team Member Removed', `Revoked workspace tokens and database access for ${name}.`);
    }
  };

  // Action: Add mock document file
  const handleUploadMockDoc = async (clientId) => {
    const docName = prompt('Enter the file name to upload (e.g. Campaign_Brief_Q3.pdf):');
    if (!docName) return;

    const targetClient = clients.find(c => c.id === clientId);
    if (!targetClient) return;

    const docs = targetClient.documents ? [...targetClient.documents, docName] : [docName];
    const updatedClient = { ...targetClient, documents: docs };

    try {
      await firebaseService.saveDocument('clients', clientId, updatedClient);
      setClients(prev => prev.map(c => c.id === clientId ? updatedClient : c));
      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient(updatedClient);
      }
      logActivity('Document Asset Uploaded', `Uploaded ${docName} to ${updatedClient.companyName} portal directory.`);
    } catch (err) {
      console.error('Failed to save uploaded document to database:', err);
    }
  };

  // Color mappings
  const getBrandTextColor = () => {
    switch (brandColor) {
      case 'emerald': return 'text-emerald-400';
      case 'violet': return 'text-violet-400';
      case 'amber': return 'text-amber-400';
      default: return 'text-indigo-400';
    }
  };

  const getBrandBg = () => {
    switch (brandColor) {
      case 'emerald': return 'bg-emerald-500';
      case 'violet': return 'bg-violet-500';
      case 'amber': return 'bg-amber-500';
      default: return 'bg-indigo-500';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'Paused': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'Pending': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      default: return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            {activeDirectory === 'team' ? 'Team Members Directory' : 'Partners & Clients Directory'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {activeDirectory === 'team' 
              ? 'Provision account manager access, change team credentials, and configure pipeline permissions.'
              : 'Manage active enterprise profiles, invoices access credentials, and pipeline status logs.'}
          </p>
        </div>
        
        {/* Switcher & Create Action button */}
        <div className="flex items-center gap-3">
          {activeDirectory === 'team' ? (
            <button 
              onClick={() => setIsAddTeamOpen(true)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 ${getBrandBg()}`}
            >
              <Plus className="w-4 h-4" /> Create Team Member
            </button>
          ) : (
            currentRole === 'admin' && (
              <button 
                onClick={() => setIsAddOpen(true)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 ${getBrandBg()}`}
              >
                <Plus className="w-4 h-4" /> Add Partner Account
              </button>
            )
          )}
        </div>
      </div>

      {/* Directory segmented selection selector for Super Admin */}
      {currentRole === 'admin' && (
        <div className="flex bg-slate-900 border border-slate-800/80 p-1.5 rounded-2xl max-w-xs relative z-10 shadow-lg">
          <button 
            type="button"
            onClick={() => { setActiveDirectory('clients'); setSearch(''); }}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center ${
              activeDirectory === 'clients' 
                ? `${getBrandBg()} text-white shadow-md` 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Clients Directory
          </button>
          <button 
            type="button"
            onClick={() => { setActiveDirectory('team'); setSearch(''); }}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center ${
              activeDirectory === 'team' 
                ? `${getBrandBg()} text-white shadow-md` 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Team Directory
          </button>
        </div>
      )}

      {/* Filter and control panel */}
      <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder={activeDirectory === 'team' ? "Search team members by name, email, role..." : "Search company, manager contact, or industry..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700"
          />
        </div>

        {activeDirectory === 'clients' ? (
          <>
            {/* Status filtering row */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-semibold mr-1.5 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filter Status:
              </span>
              {['All', 'Active', 'Pending', 'Paused', 'Completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all font-bold ${
                    statusFilter === status 
                      ? `${getBrandBg()} text-white shadow-md` 
                      : 'bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Sorting selection */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold shrink-0">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 py-1.5 px-3 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="name">Company Name</option>
                <option value="billing">Highest Billing</option>
                <option value="status">Partner Status</option>
              </select>
            </div>
          </>
        ) : (
          <div className="flex items-center text-xs text-slate-400 font-medium">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-1.5 px-3 rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Super Admin Credentials Vault Activated
            </span>
          </div>
        )}

      </div>

      {/* RENDER VIEW: TEAM MEMBERS DIRECTORY */}
      {activeDirectory === 'team' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeamMembers.map((tm) => (
            <div 
              key={tm.id}
              className="p-5 rounded-2xl glassmorphism-card border border-slate-800 flex flex-col justify-between"
            >
              <div>
                {/* Header: Avatar, Name, Job title */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center font-bold text-sm group/logo shrink-0">
                      <img 
                        src={tm.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80'} 
                        alt={tm.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay picker to change/upload logo immediately */}
                      <label className="absolute inset-0 bg-black/70 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-[8px] text-white font-bold text-center">
                        Upload
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleQuickLogoChange(tm.id, e, 'team')}
                          className="hidden" 
                        />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 leading-tight">{tm.name}</h3>
                      <span className="text-[9px] text-slate-500 font-semibold">{tm.jobTitle || 'Account Manager'}</span>
                    </div>
                  </div>
                  
                  <span className={`text-[8px] font-extrabold uppercase border px-2 py-0.5 rounded-full shadow-inner ${
                    tm.leadPipelineAccess 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    {tm.leadPipelineAccess ? 'Leads Active' : 'No Lead Access'}
                  </span>
                </div>

                {/* Operations details */}
                <div className="space-y-2 mt-5 text-[10px] text-slate-400 border-t border-slate-900/60 pt-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-600 font-mono" />
                    <span className="truncate font-medium">{tm.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                    <span>Role Permissions: <span className="text-emerald-400 font-bold">Team Member</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    <span>Workload Velocity: <span className="text-slate-300 font-bold">{tm.workload || '0 Tasks Active'}</span></span>
                  </div>
                </div>

                {/* Credentials Preview */}
                <div className="mt-4 p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1.5 text-[9px] font-semibold text-slate-400">
                  <div className="flex justify-between items-center text-slate-500 font-extrabold uppercase text-[8px] tracking-wider mb-1">
                    <span>Credentials Suite</span>
                    <span className="text-emerald-400">Secure</span>
                  </div>
                  <div><span className="text-slate-600">ID:</span> <span className="font-mono text-slate-300">{tm.email}</span></div>
                  <div><span className="text-slate-600">Password:</span> <span className="font-mono text-slate-300">{tm.password || 'team123'}</span></div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-4 border-t border-slate-900/60 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditTeamModal(tm)}
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer transition-all"
                  title="Modify Team Member Details & Permissions"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteTeamMember(tm.id, tm.email, tm.name)}
                  className="p-2 bg-slate-900/50 hover:bg-red-500/10 border border-slate-850 hover:border-red-500/30 rounded-lg text-slate-500 hover:text-red-400 cursor-pointer transition-all"
                  title="Revoke and Delete Account Access"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}

          {filteredTeamMembers.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-950/40 border border-slate-900 rounded-2xl">
              <FolderOpen className="w-8 h-8 text-slate-600 mx-auto mb-2.5" />
              <h4 className="text-xs font-bold text-slate-400">No active team members match search query</h4>
              <p className="text-[10px] text-slate-600 mt-1">Add a new team member to populate this console.</p>
            </div>
          )}
        </div>
      ) : (
        /* RENDER VIEW: CLIENTS DIRECTORY */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => (
            <div 
              key={client.id}
              className="p-5 rounded-2xl glassmorphism-card border border-slate-800 flex flex-col justify-between"
            >
              <div>
                {/* Header: Logo avatar and status */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="relative w-auto min-w-[40px] max-w-[96px] h-10 overflow-hidden flex items-center justify-center p-0.5 font-bold text-sm group/logo shrink-0">
                      {client.logo ? (
                        <img src={client.logo} alt="Client Logo" className="h-full w-auto object-contain" />
                      ) : (
                        <span className={getBrandTextColor()}>{client.companyName.charAt(0)}</span>
                      )}
                      {/* Overlay picker to change/upload logo immediately */}
                      <label className="absolute inset-0 bg-black/70 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-[8px] text-white font-bold text-center">
                        Upload
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleQuickLogoChange(client.id, e, 'client')}
                          className="hidden" 
                        />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 leading-tight">{client.companyName}</h3>
                      <span className="text-[9px] text-slate-500 font-semibold">{client.industry}</span>
                    </div>
                  </div>

                  <span className={`text-[8px] font-extrabold uppercase border px-2 py-0.5 rounded-full shadow-inner ${getStatusBadge(client.status)}`}>
                    {client.status}
                  </span>
                </div>

                {/* Contact row details */}
                <div className="space-y-2 mt-5 text-[10px] text-slate-400 border-t border-slate-900/60 pt-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-slate-600" />
                    <a href={client.website} target="_blank" rel="noreferrer" className="hover:underline hover:text-slate-300 truncate">
                      {client.website.replace('https://', '')}
                    </a>
                  </div>
                </div>

                {/* Service list pills */}
                <div className="mt-4 flex flex-wrap gap-1">
                  {client.activeServices.slice(0, 2).map((srv, idx) => (
                    <span key={idx} className="text-[8px] font-bold bg-slate-900 text-slate-300 px-2 py-0.5 rounded-md border border-slate-800/80">
                      {srv}
                    </span>
                  ))}
                  {client.activeServices.length > 2 && (
                    <span className="text-[8px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md">
                      +{client.activeServices.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              {/* Billing footer and open detail triggers */}
              <div className="mt-5 pt-4 border-t border-slate-900/60 flex items-center justify-between">
                <div>
                  <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500">Monthly Contract</span>
                  <div className="text-sm font-bold text-slate-100 mt-0.5">
                    {currentRole === 'team' ? (
                      <span className="text-[10px] bg-slate-900 border border-slate-850 px-2 py-1 rounded text-slate-400 font-extrabold flex items-center gap-1 leading-none select-none">
                        🔒 MASKED (Team)
                      </span>
                    ) : (
                      <>₹{client.monthlyBilling.toLocaleString('en-IN')}<span className="text-[10px] text-slate-500 font-medium">/mo</span></>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {currentRole === 'admin' && (
                    <button
                      onClick={() => openEditModal(client)}
                      className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer transition-all"
                      title="Edit Account Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedClient(client)}
                    className={`text-[10px] font-bold bg-slate-950 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-slate-300 px-3 py-2 rounded-lg cursor-pointer transition-all`}
                  >
                    Inspect Profile
                  </button>
                </div>
              </div>

            </div>
          ))}

          {filteredClients.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-950/40 border border-slate-900 rounded-2xl">
              <FolderOpen className="w-8 h-8 text-slate-600 mx-auto mb-2.5" />
              <h4 className="text-xs font-bold text-slate-400">No partner accounts match this scan query</h4>
              <p className="text-[10px] text-slate-600 mt-1">Try modifying search tags or registering a new company.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: INSPECT PROFILE DETAILS */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-900 flex justify-between items-start bg-slate-900/40">
              <div className="flex items-center gap-4">
                <div className="relative w-auto min-w-[48px] max-w-[144px] h-12 overflow-hidden flex items-center justify-center p-0.5 font-bold text-lg group/profile-logo shrink-0">
                  {selectedClient.logo ? (
                    <img src={selectedClient.logo} alt="Client Logo" className="h-full w-auto object-contain" />
                  ) : (
                    <span className={getBrandTextColor()}>{selectedClient.companyName.charAt(0)}</span>
                  )}
                  {/* Overlay picker inside profile inspector too */}
                  <label className="absolute inset-0 bg-black/70 opacity-0 group-hover/profile-logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-[9px] text-white font-bold text-center">
                    Change
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleQuickLogoChange(selectedClient.id, e, 'client')}
                      className="hidden" 
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">{selectedClient.companyName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manager Contact: <span className="text-slate-300 font-semibold">{selectedClient.contactPerson}</span></p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className={`text-[9px] font-extrabold uppercase border px-3 py-1 rounded-full shadow-inner ${getStatusBadge(selectedClient.status)}`}>
                  {selectedClient.status}
                </span>
                <button onClick={() => setSelectedClient(null)} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              
              {/* Profile grid summary info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-900/40 border border-slate-900 rounded-xl text-xs space-y-1.5">
                  <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Contact Details</div>
                  <div className="text-slate-300 truncate"><span className="text-slate-500">Email:</span> {selectedClient.email}</div>
                  <div className="text-slate-300"><span className="text-slate-500">Phone:</span> {selectedClient.phone || 'Not Registered'}</div>
                  <div className="text-slate-300 truncate"><span className="text-slate-500">Website:</span> <a href={selectedClient.website} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">{selectedClient.website}</a></div>
                </div>

                <div className="p-3.5 bg-slate-900/40 border border-slate-900 rounded-xl text-xs space-y-1.5">
                  <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Operations Summary</div>
                  <div className="text-slate-300"><span className="text-slate-500">Industry:</span> {selectedClient.industry}</div>
                  <div className="text-slate-300">
                    <span className="text-slate-500">Monthly Billing:</span>{' '}
                    {currentRole === 'team' ? (
                      <span className="bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-slate-400 font-extrabold text-[10px] select-none inline-flex items-center gap-1">🔒 MASKED (Team)</span>
                    ) : (
                       <>₹{selectedClient.monthlyBilling.toLocaleString('en-IN')}/mo</>
                    )}
                  </div>
                  <div className="text-slate-300 flex items-center gap-1.5"><span className="text-slate-500">Workflow Velocity:</span> 
                    <span className="bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-extrabold text-[9px]">{selectedClient.projectStatus}</span>
                  </div>
                </div>
              </div>

              {/* Active Subscribed Services list */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-2">Active Services Subscriptions</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedClient.activeServices.map((srv, index) => (
                    <span key={index} className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 py-1.5 px-3 rounded-xl transition-all">
                      ⚡ {srv}
                    </span>
                  ))}
                </div>
              </div>

              {/* Internal Manager Notes */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-2">Internal Agency Profile Notes</h4>
                <div className="p-4 bg-slate-900/50 border border-slate-900 text-xs text-slate-300 rounded-xl leading-relaxed whitespace-pre-line italic">
                  {selectedClient.notes || 'No custom notes recorded for this partner account.'}
                </div>
              </div>

              {/* Portal Authentication & Keys Vault */}
              {currentRole === 'team' ? (
                <div className="p-5 bg-slate-905 border border-slate-900 rounded-xl text-center space-y-1.5 select-none py-6 border-dashed">
                  <Key className="w-5 h-5 text-slate-600 mx-auto" />
                  <span className="text-[11px] font-extrabold text-slate-400 block">Portal Credentials Protected</span>
                  <p className="text-[10px] text-slate-600 max-w-xs mx-auto">🔒 Portal Credentials Masked (Restricted Permissions)</p>
                </div>
              ) : (
                <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl space-y-3">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block flex items-center gap-1.5 border-b border-slate-950 pb-2">
                    <Key className="w-3.5 h-3.5 text-indigo-400" /> Portal Authentication & Keys Vault
                  </span>
                  
                  <div className="grid grid-cols-2 gap-4 text-[11px]">
                    <div className="space-y-1">
                      <span className="text-slate-500 font-semibold block">Onboarding Login Email</span>
                      <span className="text-slate-200 font-mono select-all bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-850 block truncate" title="Click to select email">
                        {selectedClient.portalEmail || selectedClient.email || 'client@aurascale.io'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-semibold block">Portal Access Password</span>
                      <div className="relative flex items-center bg-slate-950 rounded-lg border border-slate-850 px-2.5 py-1.5">
                        <span className="text-slate-200 font-mono select-all block truncate flex-1">
                          {showProfilePassword 
                            ? (selectedClient.portalPassword || 'client123') 
                            : '••••••••••••'}
                        </span>
                        <button 
                          type="button"
                          onClick={() => setShowProfilePassword(!showProfilePassword)}
                          className="p-0.5 hover:text-slate-200 text-slate-500 transition-colors cursor-pointer"
                          title={showProfilePassword ? "Mask Password" : "Reveal Password"}
                        >
                          {showProfilePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents and Files Vault */}
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <h4 className="text-xs font-bold text-slate-400">Documents Vault</h4>
                  <button 
                    onClick={() => handleUploadMockDoc(selectedClient.id)}
                    className="text-[9px] uppercase font-bold text-indigo-400 hover:underline cursor-pointer"
                  >
                    + Upload Document
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {selectedClient.documents && selectedClient.documents.map((doc, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-slate-900/25 border border-slate-900 hover:border-slate-800 rounded-xl flex items-center gap-2.5 text-xs text-slate-300 transition-all select-none cursor-pointer"
                      onClick={() => alert(`Opening document asset file: "${doc}"`)}
                    >
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer triggers */}
            <div className="p-4 border-t border-slate-900 flex justify-between bg-slate-900/40">
              {currentRole === 'admin' ? (
                <button
                  onClick={() => handleDeleteClient(selectedClient.id, selectedClient.companyName)}
                  className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-400 py-2 px-3 rounded-lg hover:bg-red-500/5 cursor-pointer transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Terminate Account Contract
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                {currentRole === 'admin' && (
                  <button
                    onClick={() => openEditModal(selectedClient)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  >
                    Edit Profile Fields
                  </button>
                )}
                <button
                  onClick={() => setSelectedClient(null)}
                  className={`px-4 py-2 ${getBrandBg()} text-white rounded-xl text-xs font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md`}
                >
                  Close Profile
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: ADD PARTNER FORM */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddClient}
            className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
          >
            <div className="p-5 border-b border-slate-900 bg-slate-900/40 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-100">Register New Partner Account</h3>
              <button type="button" onClick={() => setIsAddOpen(false)} className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Company Name *</label>
                  <input 
                    type="text" required
                    placeholder="e.g. AeroMedia Group"
                    value={newClient.companyName}
                    onChange={(e) => setNewClient({...newClient, companyName: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Industry</label>
                  <input 
                    type="text"
                    list="add-industries-list"
                    value={newClient.industry}
                    onChange={(e) => setNewClient({...newClient, industry: e.target.value})}
                    placeholder="Select or type custom industry..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                  <datalist id="add-industries-list">
                    {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Contact Person *</label>
                  <input 
                    type="text" required
                    placeholder="Sarah Jenkins"
                    value={newClient.contactPerson}
                    onChange={(e) => setNewClient({...newClient, contactPerson: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Website</label>
                  <input 
                    type="text" 
                    placeholder="https://aeromedia.com"
                    value={newClient.website}
                    onChange={(e) => setNewClient({...newClient, website: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Email *</label>
                  <input 
                    type="email" required
                    placeholder="manager@company.com"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Phone</label>
                  <input 
                    type="text" 
                    placeholder="+1 (555) 234-5678"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Monthly Billing Cost ($)</label>
                  <input 
                    type="number" 
                    placeholder="4500"
                    value={newClient.monthlyBilling}
                    onChange={(e) => setNewClient({...newClient, monthlyBilling: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Contract Status</label>
                  <select 
                    value={newClient.status}
                    onChange={(e) => setNewClient({...newClient, status: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Paused">Paused</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium block">Project / Account Closing Date</label>
                <input 
                  type="date"
                  value={newClient.closingDate}
                  onChange={(e) => setNewClient({...newClient, closingDate: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium block">Partner Logo Image</label>
                <div className="flex items-center gap-3">
                  <label className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer font-bold text-slate-355 hover:text-slate-200 transition-colors flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Upload Logo
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewClient({...newClient, logo: reader.result});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden" 
                    />
                  </label>
                  {newClient.logo && (
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-750 p-1 flex items-center justify-center overflow-hidden">
                      <img src={newClient.logo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {/* Service list multiselect */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Core Marketing Subscriptions</label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900/60 border border-slate-900 rounded-lg max-h-32 overflow-y-auto">
                  {ALL_SERVICES_LIST.map((srv) => {
                    const isChecked = newClient.activeServices.includes(srv);
                    return (
                      <label key={srv} className="flex items-center gap-2 text-[10px] text-slate-300 font-medium cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setNewClient({ ...newClient, activeServices: newClient.activeServices.filter(s => s !== srv) });
                            } else {
                              setNewClient({ ...newClient, activeServices: [...newClient.activeServices, srv] });
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-transparent border-slate-800 bg-slate-950"
                        />
                        <span>{srv}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Portal Credentials Onboarding */}
              <div className="border-t border-slate-900/60 pt-3.5 space-y-3">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" /> Client Portal Credentials Onboarding
                </span>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Onboarding Login Email</label>
                    <input 
                      type="email"
                      placeholder="client@aurascale.io"
                      value={newClient.portalEmail || newClient.email}
                      onChange={(e) => setNewClient({...newClient, portalEmail: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium flex justify-between items-center">
                      <span>Portal Access Password</span>
                      <button
                        type="button"
                        onClick={() => {
                          const generated = generateStrongPassword();
                          setNewClient({...newClient, portalPassword: generated});
                        }}
                        className="text-[9px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> Auto-Generate
                      </button>
                    </label>
                    <input 
                      type="text"
                      placeholder="Enter or generate password"
                      value={newClient.portalPassword}
                      onChange={(e) => setNewClient({...newClient, portalPassword: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Internal Setup Notes</label>
                <textarea 
                  placeholder="Record onboarding notes or custom targets here..."
                  rows="3"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none resize-none"
                />
              </div>

            </div>

            <div className="p-4 border-t border-slate-900 bg-slate-900/40 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={`px-4 py-2 ${getBrandBg()} text-white rounded-xl text-xs font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md`}
              >
                Register Partner
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: EDIT PARTNER FORM */}
      {isEditOpen && editClientData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleEditClientSubmit}
            className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
          >
            <div className="p-5 border-b border-slate-900 bg-slate-900/40 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-100">Edit Partner Specifications</h3>
              <button type="button" onClick={() => setIsEditOpen(false)} className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Company Name *</label>
                  <input 
                    type="text" required
                    value={editClientData.companyName}
                    onChange={(e) => setEditClientData({...editClientData, companyName: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Industry</label>
                  <input 
                    type="text"
                    list="edit-industries-list"
                    value={editClientData.industry}
                    onChange={(e) => setEditClientData({...editClientData, industry: e.target.value})}
                    placeholder="Select or type custom industry..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                  <datalist id="edit-industries-list">
                    {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Contact Person *</label>
                  <input 
                    type="text" required
                    value={editClientData.contactPerson}
                    onChange={(e) => setEditClientData({...editClientData, contactPerson: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Website</label>
                  <input 
                    type="text" 
                    value={editClientData.website}
                    onChange={(e) => setEditClientData({...editClientData, website: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Email *</label>
                  <input 
                    type="email" required
                    value={editClientData.email}
                    onChange={(e) => setEditClientData({...editClientData, email: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Phone</label>
                  <input 
                    type="text" 
                    value={editClientData.phone}
                    onChange={(e) => setEditClientData({...editClientData, phone: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Monthly Billing Cost ($)</label>
                  <input 
                    type="number" 
                    value={editClientData.monthlyBilling}
                    onChange={(e) => setEditClientData({...editClientData, monthlyBilling: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Contract Status</label>
                  <select 
                    value={editClientData.status}
                    onChange={(e) => setEditClientData({...editClientData, status: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Paused">Paused</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium block">Project / Account Closing Date</label>
                <input 
                  type="date"
                  value={editClientData.closingDate || ''}
                  onChange={(e) => setEditClientData({...editClientData, closingDate: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium block">Partner Logo Image</label>
                <div className="flex items-center gap-3">
                  <label className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer font-bold text-slate-355 hover:text-slate-200 transition-colors flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Upload Logo
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditClientData({...editClientData, logo: reader.result});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden" 
                    />
                  </label>
                  {editClientData.logo && (
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-750 p-1 flex items-center justify-center overflow-hidden">
                      <img src={editClientData.logo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {/* Service list multiselect */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Core Marketing Subscriptions</label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900/60 border border-slate-900 rounded-lg max-h-32 overflow-y-auto">
                  {ALL_SERVICES_LIST.map((srv) => {
                    const isChecked = editClientData.activeServices.includes(srv);
                    return (
                      <label key={srv} className="flex items-center gap-2 text-[10px] text-slate-300 font-medium cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setEditClientData({ ...editClientData, activeServices: editClientData.activeServices.filter(s => s !== srv) });
                            } else {
                              setEditClientData({ ...editClientData, activeServices: [...editClientData.activeServices, srv] });
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-transparent border-slate-800 bg-slate-950"
                        />
                        <span>{srv}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Portal Credentials Edit */}
              <div className="border-t border-slate-900/60 pt-3.5 space-y-3">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" /> Edit Client Portal Credentials
                </span>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Portal Login Email</label>
                    <input 
                      type="email"
                      value={editClientData.portalEmail || editClientData.email}
                      onChange={(e) => setEditClientData({...editClientData, portalEmail: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium flex justify-between items-center">
                      <span>Portal Password</span>
                      <button
                        type="button"
                        onClick={() => {
                          const generated = generateStrongPassword();
                          setEditClientData({...editClientData, portalPassword: generated});
                        }}
                        className="text-[9px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> Regenerate
                      </button>
                    </label>
                    <input 
                      type="text"
                      value={editClientData.portalPassword || 'client123'}
                      onChange={(e) => setEditClientData({...editClientData, portalPassword: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Internal Profile Notes</label>
                <textarea 
                  rows="3"
                  value={editClientData.notes}
                  onChange={(e) => setEditClientData({...editClientData, notes: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none resize-none"
                />
              </div>

            </div>

            <div className="p-4 border-t border-slate-900 bg-slate-900/40 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={`px-4 py-2 ${getBrandBg()} text-white rounded-xl text-xs font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md`}
              >
                Save Details
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: CREATE TEAM MEMBER FORM */}
      {isAddTeamOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddTeamMember}
            className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
          >
            <div className="p-5 border-b border-slate-900 bg-slate-900/40 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-100">Provision Team Member Account</h3>
              <button type="button" onClick={() => setIsAddTeamOpen(false)} className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Full Name *</label>
                  <input 
                    type="text" required
                    placeholder="John Doe"
                    value={newTeamMember.name}
                    onChange={(e) => setNewTeamMember({...newTeamMember, name: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Job Title / Designation *</label>
                  <input 
                    type="text" required
                    placeholder="SEO Consultant"
                    value={newTeamMember.jobTitle}
                    onChange={(e) => setNewTeamMember({...newTeamMember, jobTitle: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Email ID (Login Username) *</label>
                  <input 
                    type="email" required
                    placeholder="john@aurascale.io"
                    value={newTeamMember.email}
                    onChange={(e) => setNewTeamMember({...newTeamMember, email: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium flex justify-between items-center">
                    <span>Password *</span>
                    <button
                      type="button"
                      onClick={() => {
                        const generated = generateStrongPassword();
                        setNewTeamMember({...newTeamMember, password: generated});
                      }}
                      className="text-[9px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Auto-Generate
                    </button>
                  </label>
                  <input 
                    type="text" required
                    placeholder="provision-password"
                    value={newTeamMember.password}
                    onChange={(e) => setNewTeamMember({...newTeamMember, password: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Avatar Photo</label>
                  <div className="flex items-center gap-3">
                    <label className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer font-bold text-slate-350 hover:text-slate-200 transition-colors flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Upload Photo
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewTeamMember({...newTeamMember, avatar: reader.result});
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden" 
                      />
                    </label>
                    {newTeamMember.avatar && (
                      <img src={newTeamMember.avatar} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-slate-750" />
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Initial Assigned Workload</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 0 Tasks Active"
                    value={newTeamMember.workload}
                    onChange={(e) => setNewTeamMember({...newTeamMember, workload: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* PERMISSION SETTINGS */}
              <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl space-y-3">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block flex items-center gap-1.5 border-b border-slate-950 pb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Permission Settings Suite
                </span>
                
                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-slate-200 font-semibold block text-xs">Lead Pipeline Access</span>
                    <span className="text-slate-500 text-[10px] block mt-0.5">Allow team member to inspect deal flows & pipelines. Hidden by default.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewTeamMember({...newTeamMember, leadPipelineAccess: !newTeamMember.leadPipelineAccess})}
                    className="p-1 hover:bg-slate-850 rounded text-slate-400 transition-colors cursor-pointer"
                  >
                    {newTeamMember.leadPipelineAccess ? (
                      <ToggleRight className="w-9 h-9 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-slate-900 bg-slate-900/40 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsAddTeamOpen(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={`px-4 py-2 ${getBrandBg()} text-white rounded-xl text-xs font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md`}
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 5: EDIT TEAM MEMBER FORM */}
      {isEditTeamOpen && editTeamMemberData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleEditTeamMemberSubmit}
            className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
          >
            <div className="p-5 border-b border-slate-900 bg-slate-900/40 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-100">Edit Team Member Settings</h3>
              <button type="button" onClick={() => setIsEditTeamOpen(false)} className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Full Name *</label>
                  <input 
                    type="text" required
                    value={editTeamMemberData.name}
                    onChange={(e) => setEditTeamMemberData({...editTeamMemberData, name: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Job Title / Designation *</label>
                  <input 
                    type="text" required
                    value={editTeamMemberData.jobTitle}
                    onChange={(e) => setEditTeamMemberData({...editTeamMemberData, jobTitle: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Email ID (Login Username) *</label>
                  <input 
                    type="email" required
                    value={editTeamMemberData.email}
                    onChange={(e) => setEditTeamMemberData({...editTeamMemberData, email: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none text-slate-500 bg-slate-950/60"
                    disabled
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium flex justify-between items-center">
                    <span>Password *</span>
                    <button
                      type="button"
                      onClick={() => {
                        const generated = generateStrongPassword();
                        setEditTeamMemberData({...editTeamMemberData, password: generated});
                      }}
                      className="text-[9px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Regenerate
                    </button>
                  </label>
                  <input 
                    type="text" required
                    value={editTeamMemberData.password || 'team123'}
                    onChange={(e) => setEditTeamMemberData({...editTeamMemberData, password: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Avatar Photo</label>
                  <div className="flex items-center gap-3">
                    <label className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer font-bold text-slate-350 hover:text-slate-200 transition-colors flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Upload Photo
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setEditTeamMemberData({...editTeamMemberData, avatar: reader.result});
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden" 
                      />
                    </label>
                    {editTeamMemberData.avatar && (
                      <img src={editTeamMemberData.avatar} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-slate-750" />
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Assigned Workload</label>
                  <input 
                    type="text" 
                    value={editTeamMemberData.workload}
                    onChange={(e) => setEditTeamMemberData({...editTeamMemberData, workload: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* PERMISSION SETTINGS */}
              <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl space-y-3">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block flex items-center gap-1.5 border-b border-slate-950 pb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Permission Settings Suite
                </span>
                
                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-slate-200 font-semibold block text-xs">Lead Pipeline Access</span>
                    <span className="text-slate-500 text-[10px] block mt-0.5">Allow team member to inspect deal flows & pipelines. Hidden by default.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditTeamMemberData({...editTeamMemberData, leadPipelineAccess: !editTeamMemberData.leadPipelineAccess})}
                    className="p-1 hover:bg-slate-850 rounded text-slate-400 transition-colors cursor-pointer"
                  >
                    {editTeamMemberData.leadPipelineAccess ? (
                      <ToggleRight className="w-9 h-9 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-slate-900 bg-slate-900/40 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsEditTeamOpen(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={`px-4 py-2 ${getBrandBg()} text-white rounded-xl text-xs font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md`}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
