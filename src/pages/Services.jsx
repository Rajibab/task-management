import React, { useState } from 'react';
import { 
  Sparkles, Layers, CheckCircle2, ChevronRight, ShoppingBag, 
  Trash2, Plus, X, ArrowUpRight, HelpCircle, IndianRupee,
  Clock, FolderOpen, ShieldCheck, CheckSquare
} from 'lucide-react';
import firebaseService from '../firebaseService';

export default function Services({ 
  services, 
  setServices, 
  clients, 
  setClients, 
  serviceRequests, 
  setServiceRequests, 
  currentRole, 
  logActivity,
  brandColor = 'indigo',
  currentUser = null,
  onOpenAuth = () => {},
  teamMembers = [],
  tasks = []
}) {
  
  // Builder bucket state
  const [bucket, setBucket] = useState([]);
  const [discount, setDiscount] = useState(0); // in percent
  
  // Modal toggles
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newService, setNewService] = useState({
    name: '', category: 'SEO', price: '', timeline: 'Monthly', deliverables: ''
  });

  // Drag-and-Drop state indicators
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Helper matching current client details (e.g. AeroMedia is cli-1)
  const activeClientAccount = (currentRole === 'client' && currentUser)
    ? (clients.find(c => c.email === currentUser.email) || clients[0])
    : (clients.find(c => c.id === 'cli-1') || clients[0]);

  // Filter proposals pipeline for clients
  const displayedServiceRequests = currentRole === 'client'
    ? serviceRequests.filter(req => req.clientName.toLowerCase() === activeClientAccount.companyName.toLowerCase())
    : serviceRequests;

  // Dynamic values calculation
  const getSubtotal = () => bucket.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const getGst = () => Math.round(getSubtotal() * 0.18); // 18% GST standard
  const getDiscountAmount = () => Math.round(getSubtotal() * (discount / 100));
  const getTotal = () => getSubtotal() + getGst() - getDiscountAmount();

  // HTML5 Drag-and-Drop Handlers
  const handleDragStart = (e, service) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(service));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    try {
      const serviceData = JSON.parse(e.dataTransfer.getData('text/plain'));
      addServiceToBucket(serviceData);
    } catch (err) {
      console.error('Drop parsing error', err);
    }
  };

  // Action: Add service to builder bucket
  const addServiceToBucket = (service) => {
    // Avoid duplicate entries in current bucket building session
    if (bucket.some(item => item.id === service.id)) {
      alert(`${service.name} is already added in the builder bucket.`);
      return;
    }
    setBucket(prev => [...prev, { ...service, customPrice: service.price }]);
  };

  // Action: Remove from bucket
  const removeFromBucket = (id) => {
    setBucket(prev => prev.filter(item => item.id !== id));
  };

  // Action: Update price custom inside bucket
  const handleUpdatePriceInBucket = (id, newPrice) => {
    setBucket(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, price: parseFloat(newPrice) || 0 };
      }
      return item;
    }));
  };

  // Action: Add new service into overall catalog (Admin only)
  const handleCreateServiceCatalog = async (e) => {
    e.preventDefault();
    if (!newService.name || !newService.price) return;

    const created = {
      ...newService,
      id: `srv-${Date.now()}`,
      price: parseFloat(newService.price) || 1000
    };

    try {
      await firebaseService.saveDocument('services', created.id, created);
    } catch (err) {
      console.error('Failed to save service to database:', err);
    }

    setServices(prev => [...prev, created]);
    logActivity('Service Catalog Updated', `Created new agency service "${created.name}" for ₹${created.price.toLocaleString('en-IN')}.`);
    
    // Reset Form
    setNewService({ name: '', category: 'SEO', price: '', timeline: 'Monthly', deliverables: '' });
    setIsAddServiceOpen(false);
  };

  // Action: Delete service from catalog (Admin only)
  const handleDeleteServiceCatalog = async (id, name) => {
    if (confirm(`Remove "${name}" from overall available offerings list?`)) {
      try {
        await firebaseService.deleteDocument('services', id);
      } catch (err) {
        console.error('Failed to delete service from database:', err);
      }
      setServices(prev => prev.filter(s => s.id !== id));
      logActivity('Service Retired', `Removed "${name}" from catalog.`);
    }
  };

  // Action: Client submits requested services bucket
  const handleSubmitClientRequest = () => {
    if (!currentUser) {
      alert('Authentication Required. Please sign in or register to submit campaign proposals to your account manager.');
      onOpenAuth();
      return;
    }
    if (bucket.length === 0) {
      alert('Selected bucket is currently empty. Drag/click services to add them.');
      return;
    }

    // Create custom service requests to Admin
    const newRequests = bucket.map(item => ({
      id: `req-${Date.now()}-${item.id}`,
      clientName: currentRole === 'client' ? activeClientAccount.companyName : 'AeroMedia Group',
      clientId: currentRole === 'client' ? activeClientAccount.id : 'cli-1',
      serviceName: item.name,
      cost: item.price,
      requestedDate: new Date().toISOString().split('T')[0],
      status: 'Pending'
    }));

    const promises = newRequests.map(req => firebaseService.saveDocument('serviceRequests', req.id, req));
    Promise.all(promises).catch(err => {
      console.error('Failed to save service requests to database:', err);
    });

    setServiceRequests(prev => [...newRequests, ...prev]);
    logActivity('Services Proposal Submitted', `Requested ${bucket.length} new marketing services. Pending approval.`);
    setBucket([]);
    alert('Your services request has been submitted to your account manager! You will receive a notification upon review.');
  };

  // Action: Admin Approves Service Request
  const handleApproveRequest = async (request) => {
    if (!currentUser) {
      alert('Authentication Required. You must sign in or register before approving proposals and adjusting financial contracts.');
      onOpenAuth();
      return;
    }

    // 1. Find and update the client document directly in the database
    const client = clients.find(c => c.companyName === request.clientName);
    if (client) {
      const active = [...client.activeServices];
      if (!active.includes(request.serviceName)) {
        active.push(request.serviceName);
      }
      const updatedClient = {
        ...client,
        activeServices: active,
        monthlyBilling: client.monthlyBilling + request.cost
      };

      try {
        await firebaseService.saveDocument('clients', client.id, updatedClient);
      } catch (err) {
        console.error('Failed to save updated client to database:', err);
      }

      setClients(prev => prev.map(c => c.id === client.id ? updatedClient : c));
    }

    // 2. Mark request approved directly in the database
    const updatedRequest = { ...request, status: 'Approved' };
    try {
      await firebaseService.saveDocument('serviceRequests', request.id, updatedRequest);
    } catch (err) {
      console.error('Failed to save approved service request status:', err);
    }

    setServiceRequests(prev => prev.map(r => r.id === request.id ? updatedRequest : r));
    logActivity('Service Proposal Approved', `Added "${request.serviceName}" to ${request.clientName} active contract. Billing updated by +₹${request.cost.toLocaleString('en-IN')}/mo.`);
  };

  // Action: Admin Rejects Service Request
  const handleRejectRequest = async (id, serviceName, clientName) => {
    if (confirm(`Reject service request for "${serviceName}" from ${clientName}?`)) {
      const request = serviceRequests.find(r => r.id === id);
      if (request) {
        const updatedRequest = { ...request, status: 'Rejected' };
        try {
          await firebaseService.saveDocument('serviceRequests', id, updatedRequest);
        } catch (err) {
          console.error('Failed to save rejected service request status:', err);
        }
        setServiceRequests(prev => prev.map(r => r.id === id ? updatedRequest : r));
      }
      logActivity('Service Proposal Declined', `Declined "${serviceName}" for ${clientName}.`);
    }
  };

  // Color mapping utilities
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

  const getBrandBorderColor = () => {
    switch (brandColor) {
      case 'emerald': return 'border-emerald-500/25';
      case 'violet': return 'border-violet-500/25';
      case 'amber': return 'border-amber-500/25';
      default: return 'border-indigo-500/25';
    }
  };

  if (currentRole === 'team') {
    const activeTeamMember = currentUser ? teamMembers.find(tm => tm.email.toLowerCase() === currentUser.email.toLowerCase()) : null;
    const activeTeamName = activeTeamMember ? activeTeamMember.name : '';

    const myTasks = tasks.filter(t => 
      t.assignee.toLowerCase() === activeTeamName.toLowerCase() || 
      (currentUser && currentUser.displayName && t.assignee.toLowerCase() === currentUser.displayName.toLowerCase())
    );



    const todoCount = myTasks.filter(t => t.status === 'Todo').length;
    const inProgressCount = myTasks.filter(t => t.status === 'In Progress').length;
    const reviewCount = myTasks.filter(t => t.status === 'Review').length;
    const completedCount = myTasks.filter(t => t.status === 'Completed').length;

    const getStatusPill = (status) => {
      switch (status) {
        case 'Todo': return 'bg-slate-800 border-slate-700 text-slate-400';
        case 'In Progress': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
        case 'Review': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
        case 'Completed': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
        default: return 'bg-slate-800 border-slate-700 text-slate-400';
      }
    };

    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'High': return 'text-red-400 bg-red-500/10 border-red-500/20';
        case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        default: return 'text-slate-400 bg-slate-900 border-slate-800';
      }
    };

    return (
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Team Work Center</h2>
            <p className="text-xs text-slate-400 mt-1">
              Work-focused campaigns tracker, assigned milestones queue, and client services approval pipeline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase bg-slate-900 border border-slate-800 text-slate-400 py-1.5 px-3 rounded-full font-extrabold flex items-center gap-1.5 shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Team Access Portal
            </span>
          </div>
        </div>

        {/* Workflow Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'To Do', count: todoCount, desc: 'Awaiting action', color: 'text-slate-400 border-slate-800' },
            { label: 'In Progress', count: inProgressCount, desc: 'Active execution', color: `${getBrandTextColor()} ${getBrandBorderColor()}` },
            { label: 'In Review', count: reviewCount, desc: 'Awaiting approval', color: 'text-amber-400 border-amber-500/20' },
            { label: 'Completed', count: completedCount, desc: 'Successfully delivered', color: 'text-emerald-400 border-emerald-500/20' }
          ].map((stat, idx) => (
            <div key={idx} className={`p-4 rounded-2xl glassmorphism-card border border-slate-800/80 bg-slate-900/40 flex flex-col justify-between h-24`}>
              <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">{stat.label}</span>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black ${stat.color.split(' ')[0]}`}>{stat.count}</span>
                <span className="text-[9px] text-slate-500 font-medium">{stat.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Split Layout: Assigned Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Assigned Tasks */}
          <div className="lg:col-span-12 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CheckSquare className={`w-4 h-4 ${getBrandTextColor()}`} /> Assigned Tasks ({myTasks.length})
              </h3>
              <span className="text-[10px] text-slate-500 font-semibold">Real-time Sprint Sync</span>
            </div>

            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {myTasks.map((t) => (
                <div key={t.id} className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between gap-3 hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-200 leading-snug">{t.title}</h4>
                      <p className="text-[10px] text-slate-500">Partner: <span className="text-indigo-300 font-semibold">{t.client}</span></p>
                    </div>
                    <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border ${getStatusPill(t.status)}`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-900/60 text-[9px] font-semibold text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      <span>Deadline: <span className="text-slate-300">{t.deadline}</span></span>
                    </div>
                    <span className={`px-2 py-0.5 rounded uppercase border font-extrabold text-[8px] tracking-wider ${getPriorityColor(t.priority)}`}>
                      {t.priority} Priority
                    </span>
                  </div>
                </div>
              ))}

              {myTasks.length === 0 && (
                <div className="py-12 text-center bg-slate-950/40 border border-slate-900 rounded-2xl">
                  <FolderOpen className="w-8 h-8 text-slate-600 mx-auto mb-2.5" />
                  <h4 className="text-xs font-bold text-slate-400">No active work delegated to you</h4>
                  <p className="text-[10px] text-slate-600 mt-1">Super Admin has not assigned sprint milestones to your profile.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Service Catalog & Proposals Builder</h2>
          <p className="text-xs text-slate-400 mt-1">
            {currentRole === 'client' 
              ? 'Select premium growth strategies and calculate custom recurring or flat budgets.' 
              : 'Add services to client portfolios, configure global pricing structures, and audit proposals.'}
          </p>
        </div>
        
        {currentRole === 'admin' && (
          <button 
            onClick={() => setIsAddServiceOpen(true)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 ${getBrandBg()}`}
          >
            <Plus className="w-4 h-4" /> Add Service to Catalog
          </button>
        )}
      </div>

      {/* Main Builder Area: Draggable catalog left, bucket calculator right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Services Catalog */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Digital Campaigns</h3>
            <span className="text-[10px] text-slate-500 font-medium">Drag card or click "+" to build proposal</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                draggable
                onDragStart={(e) => handleDragStart(e, service)}
                className="p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl transition-all cursor-grab active:cursor-grabbing select-none group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800 uppercase">
                      {service.category}
                    </span>
                    {currentRole === 'admin' && (
                      <button 
                        onClick={() => handleDeleteServiceCatalog(service.id, service.name)}
                        className="text-slate-600 hover:text-red-400 p-0.5 transition-colors cursor-pointer"
                        title="Retire from catalog"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-200 mt-3 group-hover:text-slate-100">{service.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{service.deliverables}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-950/60 flex items-center justify-between">
                  {currentRole === 'admin' ? (
                    <div>
                      <span className="text-[8px] uppercase tracking-wider font-semibold text-slate-500">Retail Rate</span>
                      <div className="text-xs font-bold text-slate-200 mt-0.5">₹{service.price.toLocaleString('en-IN')}<span className="text-[9px] text-slate-500 font-medium">/{service.timeline === 'Monthly' ? 'mo' : 'flat'}</span></div>
                    </div>
                  ) : (
                    <div />
                  )}
                  
                  <button
                    onClick={() => addServiceToBucket(service)}
                    className={`p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer transition-all`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: selected builder bucket */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected Services Bucket</h3>
            <ShoppingBag className={`w-4 h-4 ${getBrandTextColor()}`} />
          </div>

          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`min-h-[350px] p-5 rounded-2xl glassmorphism border flex flex-col justify-between transition-all duration-300 ${
              isDraggingOver 
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01] shadow-[0_0_20px_-3px_rgba(99,102,241,0.25)]' 
                : 'border-slate-800/80 bg-slate-900/10'
            }`}
          >
            {/* Draggable drop zone placeholder */}
            {bucket.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                <div className={`p-4 bg-slate-950 rounded-full border border-slate-800 mb-3 animate-pulse`}>
                  <Layers className="w-6 h-6 text-slate-600" />
                </div>
                <h4 className="text-xs font-bold text-slate-400">Proposal Bucket is Empty</h4>
                <p className="text-[10px] text-slate-600 max-w-xs mt-1 leading-relaxed">
                  Drag items from the available catalog or click "+" to begin calculating dynamic package rates.
                </p>
              </div>
            ) : (
              <div className="flex-1 space-y-3.5 mb-5 overflow-y-auto max-h-60 pr-1">
                {bucket.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 bg-slate-950/60 border border-slate-900 hover:border-slate-800 rounded-xl flex items-center justify-between gap-3 animate-in slide-in-from-right-3 duration-200"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-300 truncate leading-tight">{item.name}</h4>
                      <span className="text-[8px] text-slate-500 mt-1 block uppercase font-semibold">{item.timeline} deliverable</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Price Editor Field inside bucket (Admin only) */}
                      {currentRole === 'admin' && (
                        <div className="relative">
                          <IndianRupee className="absolute left-1.5 top-2.5 w-3 h-3 text-slate-500" />
                          <input 
                            type="number" 
                            value={item.price}
                            onChange={(e) => handleUpdatePriceInBucket(item.id, e.target.value)}
                            className="w-18 bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-4.5 pr-1.5 text-center text-xs font-bold text-slate-200 focus:outline-none"
                          />
                        </div>
                      )}

                      <button 
                        onClick={() => removeFromBucket(item.id)}
                        className="text-slate-600 hover:text-red-400 p-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations layout */}
            {bucket.length > 0 && (
              <div className="pt-4 border-t border-slate-800/80 space-y-3 bg-slate-950/30 -mx-5 -mb-5 p-5 rounded-b-2xl">
                
                {/* Calculations row (Admin only) */}
                {currentRole === 'admin' && (
                  <div className="space-y-1.5 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Subtotal Services</span>
                      <span className="font-semibold text-slate-200">₹{getSubtotal().toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>GST / Sales Tax (18% Agency Standard)</span>
                      <span className="font-semibold text-slate-200">+₹{getGst().toLocaleString('en-IN')}</span>
                    </div>

                    {/* Discount input slider (Admin only) */}
                    <div className="pt-1.5 pb-1 border-t border-slate-900/60">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                        <span>Package Discount (%)</span>
                        <span className="text-emerald-400">-{discount}% (-₹{getDiscountAmount().toLocaleString('en-IN')})</span>
                      </div>
                      <input 
                        type="range" min="0" max="30" value={discount} 
                        onChange={(e) => setDiscount(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer focus:outline-none accent-emerald-400"
                      />
                    </div>

                    {/* Total */}
                    <div className="pt-3 border-t border-slate-900 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500">Compounded Proposal Budget</span>
                        <div className="text-lg font-bold text-emerald-400 mt-0.5">₹{getTotal().toLocaleString('en-IN')}<span className="text-[11px] text-slate-500 font-medium">/mo</span></div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmitClientRequest}
                  className={`w-full px-4 py-2.5 bg-gradient-to-r ${
                    currentRole === 'client' ? 'from-violet-500 to-indigo-500 hover:from-violet-650 hover:to-indigo-650' : 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700'
                  } text-white font-bold rounded-xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95`}
                >
                  {currentRole === 'client' ? 'Submit Proposal to Manager' : 'Assign Package directly'}
                </button>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Admin Proposal Approval Queue */}
      <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
          <ChevronRight className={`w-4 h-4 ${getBrandTextColor()}`} />
          Service Requests Approval Pipeline
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800 bg-slate-950/20">
              <tr>
                <th className="py-3 px-4">Partner Brand</th>
                <th className="py-3 px-4">Campaign Requested</th>
                <th className="py-3 px-4 text-center">Estimated Billing</th>
                <th className="py-3 px-4">Requested Date</th>
                <th className="py-3 px-4">Approval State</th>
                {currentRole === 'admin' && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedServiceRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-950/20 transition-all select-none">
                  <td className="py-3.5 px-4 font-bold text-slate-200">{req.clientName}</td>
                  <td className="py-3.5 px-4 font-semibold text-indigo-300">{req.serviceName}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">₹{req.cost.toLocaleString('en-IN')}/mo</td>
                  <td className="py-3.5 px-4 text-slate-500 font-semibold">{req.requestedDate}</td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[8px] font-extrabold uppercase border px-2 py-0.5 rounded-full shadow-inner ${
                      req.status === 'Pending' 
                        ? 'bg-amber-500/10 border-amber-500/35 text-amber-400' 
                        : req.status === 'Approved'
                          ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/35 text-red-400'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  {currentRole === 'admin' && (
                    <td className="py-3.5 px-4 text-right">
                      {req.status === 'Pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleRejectRequest(req.id, req.serviceName, req.clientName)}
                            className="px-2.5 py-1.5 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-red-400 rounded-lg cursor-pointer font-bold text-[10px] transition-all bg-slate-950"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleApproveRequest(req)}
                            className={`px-2.5 py-1.5 rounded-lg text-white font-bold text-[10px] cursor-pointer hover:scale-105 active:scale-95 transition-all shadow ${getBrandBg()}`}
                          >
                            Approve & Integrate
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">Resolved</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}

              {displayedServiceRequests.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 font-semibold italic">
                    No active proposals logged in queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD SERVICE FORM */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateServiceCatalog}
            className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
          >
            <div className="p-5 border-b border-slate-900 bg-slate-900/40 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-100">Create New Service Offering</h3>
              <button type="button" onClick={() => setIsAddServiceOpen(false)} className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Service / Campaign Name *</label>
                <input 
                  type="text" required
                  placeholder="e.g. TikTok Influencer Outreach"
                  value={newService.name}
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Category</label>
                  <select 
                    value={newService.category}
                    onChange={(e) => setNewService({...newService, category: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="SEO">SEO</option>
                    <option value="Social Media">Social Media</option>
                    <option value="PPC">PPC</option>
                    <option value="Branding">Branding</option>
                    <option value="Development">Development</option>
                    <option value="Creative">Creative</option>
                    <option value="ORM">ORM</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Billing Model</label>
                  <select 
                    value={newService.timeline}
                    onChange={(e) => setNewService({...newService, timeline: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="Monthly">Monthly Retainer</option>
                    <option value="One-time">One-time Flat</option>
                    <option value="Per Project">Per Project Scope</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Retail Price (₹) *</label>
                <input 
                  type="number" required
                  placeholder="2000"
                  value={newService.price}
                  onChange={(e) => setNewService({...newService, price: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Primary Deliverables & Scope Summary</label>
                <textarea 
                  placeholder="e.g. 5 viral video edits, graphic templates, influencer listings brief..."
                  rows="3"
                  value={newService.deliverables}
                  onChange={(e) => setNewService({...newService, deliverables: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none resize-none"
                />
              </div>

            </div>

            <div className="p-4 border-t border-slate-900 bg-slate-900/40 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsAddServiceOpen(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={`px-4 py-2 ${getBrandBg()} text-white rounded-xl text-xs font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md`}
              >
                Add to Catalog
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
