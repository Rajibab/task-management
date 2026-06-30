import React, { useState } from 'react';
import { 
  Users, IndianRupee, BarChart3, CheckSquare, 
  ArrowUpRight, ArrowDownRight, Activity, Sparkles, TrendingUp,
  Briefcase, Calendar, CheckSquare2, Plus, AlertCircle, Key, FileText,
  Clock, CheckCircle2, User, HelpCircle, ArrowRight, Check, CreditCard,
  Gauge, ShieldAlert
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
  RadialBarChart, RadialBar, Legend
} from 'recharts';
import { MOCK_TEAM, INITIAL_SERVICES } from '../mockData';
import firebaseService from '../firebaseService';

export default function Overview({ 
  clients, 
  invoices, 
  tasks, 
  activityLogs, 
  seoReports,
  setCurrentRole,
  setActiveTab,
  brandColor = 'indigo',
  currentUser,
  currentRole = 'admin',
  serviceRequests = [],
  setServiceRequests,
  setClients,
  setInvoices,
  setTasks,
  logActivity,
  teamMembers = []
}) {
  // Global projection variables for Admin Dashboard
  const [projectionMonths, setProjectionMonths] = useState(6);
  const [growthScenario, setGrowthScenario] = useState('moderate'); // moderate, aggressive, hyper

  // Client Dashboard Service Addition state
  const [requestServiceBrief, setRequestServiceBrief] = useState('');
  const [requestServiceId, setRequestServiceId] = useState('srv-seo');
  const [serviceSubmitSuccess, setServiceSubmitSuccess] = useState(false);

  // Billing loading state
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);
  const [paySuccessMsg, setPaySuccessMsg] = useState('');

  // Primary brand helper classes matching theme parameters
  const getBrandTextColor = () => {
    switch (brandColor) {
      case 'emerald': return 'text-emerald-400';
      case 'violet': return 'text-violet-400';
      case 'amber': return 'text-amber-400';
      default: return 'text-indigo-400';
    }
  };

  const getBrandBgColor = () => {
    switch (brandColor) {
      case 'emerald': return 'bg-emerald-500 hover:bg-emerald-600';
      case 'violet': return 'bg-violet-500 hover:bg-violet-600';
      case 'amber': return 'bg-amber-500 hover:bg-amber-600';
      default: return 'bg-indigo-500 hover:bg-indigo-600';
    }
  };

  const getBrandBorderColor = () => {
    switch (brandColor) {
      case 'emerald': return 'border-emerald-500/20 hover:border-emerald-500/40';
      case 'violet': return 'border-violet-500/20 hover:border-violet-500/40';
      case 'amber': return 'border-amber-500/20 hover:border-amber-500/40';
      default: return 'border-indigo-500/20 hover:border-indigo-500/40';
    }
  };

  const getBrandAccentRing = () => {
    switch (brandColor) {
      case 'emerald': return 'focus:ring-emerald-500 focus:border-emerald-500';
      case 'violet': return 'focus:ring-violet-500 focus:border-violet-500';
      case 'amber': return 'focus:ring-amber-500 focus:border-amber-500';
      default: return 'focus:ring-indigo-500 focus:border-indigo-500';
    }
  };

  // Helper to extract status styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
      case 'Paid':
      case 'Completed':
      case 'On Track':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'Paused':
      case 'Due':
      case 'Pending':
      case 'In Progress':
      case 'In Review':
      case 'Todo':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'Overdue':
      case 'Delayed':
      case 'Critical':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  // ==========================================
  // RENDER INTERACTION ROUTERS BY LOGGED-IN ROLE
  // ==========================================

  // Determine current active user details
  const userName = currentUser?.displayName || 'User';
  const userEmail = currentUser?.email || '';

  // -------------------------------------------------------------
  // VIEWPORT A: TEAM MEMBER DASHBOARD (e.g., Chloe Chen)
  // -------------------------------------------------------------
  if (currentRole === 'team') {
    // Sift tasks allocated specifically to this user
    const activeTeamMember = teamMembers?.find(tm => tm.email.toLowerCase() === currentUser?.email?.toLowerCase());
    const targetName = activeTeamMember ? activeTeamMember.name : (currentUser?.displayName || '');
    const userTasks = tasks.filter(t => t.assignee.toLowerCase() === targetName.toLowerCase());
    const pendingTasks = userTasks.filter(t => t.status !== 'Completed');
    const completedTasksCount = userTasks.filter(t => t.status === 'Completed').length;
    
    // Calculate unique clients this team member supports
    const uniqueClients = [...new Set(userTasks.map(t => t.client))];

    // Compute task deadline alert counts (due in 7 days or less)
    const upcomingDeadlinesCount = pendingTasks.filter(t => {
      if (!t.deadline) return false;
      const today = new Date('2026-05-20');
      const due = new Date(t.deadline);
      const diffTime = due - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    // Handle interactive toggle to check off tasks in-place
    const handleToggleTask = async (taskId, title, client) => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const newStatus = task.status === 'Completed' ? 'In Progress' : 'Completed';
        const updatedTask = { ...task, status: newStatus };

        try {
          await firebaseService.saveDocument('tasks', taskId, updatedTask);
        } catch (err) {
          console.error('Failed to save toggled task checklist in Overview:', err);
        }

        // Log custom audit activity log
        logActivity(
          newStatus === 'Completed' ? 'Task Completed' : 'Task Opened',
          `Team member ${userName} marked task "${title}" for ${client} as ${newStatus.toLowerCase()}.`
        );

        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      }
    };

    // Calculate work categories distribution (SEO, PPC, Development, Branding)
    const getWorkCategoryBreakdown = () => {
      const breakdown = { SEO: 0, PPC: 0, Development: 0, Branding: 0, Creative: 0 };
      userTasks.forEach(t => {
        const titleLower = t.title.toLowerCase();
        if (titleLower.includes('seo') || titleLower.includes('meta') || titleLower.includes('link') || titleLower.includes('rank')) breakdown.SEO++;
        else if (titleLower.includes('ad') || titleLower.includes('merchant') || titleLower.includes('ppc')) breakdown.PPC++;
        else if (titleLower.includes('deploy') || titleLower.includes('portal') || titleLower.includes('revamp') || titleLower.includes('code') || titleLower.includes('link')) breakdown.Development++;
        else if (titleLower.includes('brand') || titleLower.includes('logo') || titleLower.includes('wireframe')) breakdown.Branding++;
        else breakdown.Creative++;
      });
      return breakdown;
    };
    const catData = getWorkCategoryBreakdown();

    // Slices Recharts state
    const taskStatusRecharts = [
      { name: 'Completed', count: completedTasksCount, fill: '#10b981' },
      { name: 'Pending Review', count: userTasks.filter(t => t.status === 'Review').length, fill: '#a855f7' },
      { name: 'In Progress', count: userTasks.filter(t => t.status === 'In Progress').length, fill: '#3b82f6' },
      { name: 'To Do', count: userTasks.filter(t => t.status === 'Todo' || t.status === 'Backlog').length, fill: '#f59e0b' }
    ].filter(item => item.count > 0);

    return (
      <div className="space-y-6">
        
        {/* Focus Greeting Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-slate-900/40 border border-slate-900 rounded-3xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-[-20%] left-[-10%] w-[30%] h-[60%] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Focus Workspace Mode
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-slate-100">
              Welcome back, <span className={getBrandTextColor()}>{userName}</span>
            </h2>
            <p className="text-xs text-slate-400">Here is your customized task sprint status and active deliverables queue.</p>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-center min-w-[80px]">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">My Velocity</span>
              <span className={`text-lg font-black block mt-0.5 ${getBrandTextColor()}`}>
                {userTasks.length > 0 ? Math.round((completedTasksCount / userTasks.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* KPIs Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* KPI 1 */}
          <div className="p-5 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-slate-900 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <CheckSquare2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Assigned Workload</span>
              <span className="text-xl font-bold text-slate-200 mt-0.5">{userTasks.length} Active Tasks</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="p-5 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-slate-900 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Pending Queue</span>
              <span className="text-xl font-bold text-slate-200 mt-0.5">{pendingTasks.length} Tasks Left</span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="p-5 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-slate-900 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Upcoming Deadlines</span>
              <span className={`text-xl font-bold mt-0.5 block ${upcomingDeadlinesCount > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                {upcomingDeadlinesCount} Due Soon
              </span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="p-5 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-slate-900 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <Briefcase className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Assigned Accounts</span>
              <span className="text-xl font-bold text-slate-200 mt-0.5">{uniqueClients.length} Brands Supported</span>
            </div>
          </div>
        </div>

        {/* Primary Interactive Checklist Pipeline & Recharts Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Checklist Widget */}
          <div className="lg:col-span-2 p-6 bg-slate-950/40 border border-slate-900 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Interactive Sprint Checklist</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Toggle checkboxes to instantly mark tasks complete in the centralized agency database.</p>
              </div>
              <button 
                onClick={() => setActiveTab('tasks')}
                className={`text-[10px] font-bold ${getBrandTextColor()} hover:underline cursor-pointer`}
              >
                Go to Kanban Board
              </button>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {userTasks.map((t) => (
                <div 
                  key={t.id} 
                  className={`p-3.5 bg-slate-900/40 border rounded-xl flex items-center gap-3.5 transition-all select-none ${
                    t.status === 'Completed' 
                      ? 'border-slate-900/60 opacity-60' 
                      : 'border-slate-850 hover:border-slate-800 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Custom Checkbox Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleTask(t.id, t.title, t.client)}
                    className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                      t.status === 'Completed'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'border-slate-700 hover:border-slate-500 hover:bg-slate-850'
                    }`}
                  >
                    {t.status === 'Completed' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold leading-snug truncate ${t.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {t.title}
                    </h4>
                    <div className="flex items-center gap-2.5 mt-1 text-[9px] text-slate-500 font-semibold">
                      <span className="text-indigo-400 uppercase tracking-wider">{t.client}</span>
                      <span>•</span>
                      <span>Due {t.deadline}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                      t.priority === 'High' 
                        ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                        : 'bg-slate-800 border-slate-750 text-slate-400'
                    }`}>
                      {t.priority}
                    </span>
                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${getStatusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}

              {userTasks.length === 0 && (
                <div className="py-12 text-center bg-slate-900/20 border border-slate-900 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-slate-400">All caught up!</h4>
                  <p className="text-[10px] text-slate-500 mt-1">No tasks assigned to your focus profile right now.</p>
                </div>
              )}
            </div>
          </div>

          {/* Allocation Breakdown and Recharts Chart */}
          <div className="p-6 bg-slate-950/40 border border-slate-900 rounded-2xl shadow-xl flex flex-col justify-between space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Velocity Chart</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Task distribution for your assignee profile.</p>
              
              <div className="h-44 mt-3">
                {taskStatusRecharts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskStatusRecharts} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ background: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '10px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {taskStatusRecharts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] text-slate-500 italic">
                    No data to plot. Complete tasks to see records.
                  </div>
                )}
              </div>
            </div>

            {/* Campaign Category Breakdown Progress Bars */}
            <div className="border-t border-slate-900 pt-4 space-y-3">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold block">
                Deliverables Balance
              </span>
              
              <div className="space-y-2 text-[10px]">
                {/* SEO */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-slate-400">
                    <span>SEO Optimization</span>
                    <span className="text-slate-300">{catData.SEO} Tasks</span>
                  </div>
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${userTasks.length > 0 ? (catData.SEO / userTasks.length) * 100 : 0}%` }} />
                  </div>
                </div>

                {/* PPC */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-slate-400">
                    <span>PPC Campaigns</span>
                    <span className="text-slate-300">{catData.PPC} Tasks</span>
                  </div>
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${userTasks.length > 0 ? (catData.PPC / userTasks.length) * 100 : 0}%` }} />
                  </div>
                </div>

                {/* Website Revamp */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-slate-400">
                    <span>Website Development</span>
                    <span className="text-slate-300">{catData.Development} Tasks</span>
                  </div>
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${userTasks.length > 0 ? (catData.Development / userTasks.length) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEWPORT B: CLIENT HUB VIEWPORT (e.g., AeroMedia Group)
  // -------------------------------------------------------------
  if (currentRole === 'client') {
    // Sift active brand properties and specifications
    const clientRecord = clients.find(c => c.companyName.toLowerCase() === userName.toLowerCase() || c.email === userEmail || c.portalEmail === userEmail) || {
      companyName: userName,
      activeServices: ['SEO Optimization', 'Google Ads Management', 'Online Reputation Management'],
      monthlyBilling: 4500,
      projectStatus: 'On Track',
      documents: ['Master_Engagement_Agreement.pdf'],
      closingDate: '2026-12-31'
    };

    const companyName = clientRecord.companyName;

    // Filter relevant invoices matching client
    const clientInvoices = invoices.filter(inv => inv.clientName.toLowerCase() === companyName.toLowerCase() || inv.clientEmail === userEmail);
    const outstandingInvoices = clientInvoices.filter(inv => inv.status !== 'Paid');
    const outstandingTotal = outstandingInvoices.reduce((acc, curr) => acc + curr.total, 0);

    // Slices tasks and campaign metrics
    const clientTasks = tasks.filter(t => t.client.toLowerCase() === companyName.toLowerCase());
    const openTasks = clientTasks.filter(t => t.status !== 'Completed');

    // Simulate Payment Retainer flow
    const handlePayInvoiceSimulated = async (invoiceId, invoiceTotal, invNum) => {
      setPayingInvoiceId(invoiceId);
      setPaySuccessMsg('');
      
      // Simulate Stripe/Gateway payment checkout processing delay (1.2s)
      await new Promise(resolve => setTimeout(resolve, 1200));

      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        const updatedInvoice = { ...invoice, status: 'Paid' };
        try {
          await firebaseService.saveDocument('invoices', invoiceId, updatedInvoice);
        } catch (err) {
          console.error('Failed to save paid invoice status:', err);
        }

        // Log Activity to system
        logActivity(
          'Invoice Settled',
          `Client ${companyName} settled retainer payment for invoice #${invNum} (₹${invoiceTotal.toLocaleString('en-IN')} settled total).`
        );

        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? updatedInvoice : inv));
      }

      setPayingInvoiceId(null);
      setPaySuccessMsg(`Successfully processed payment of ₹${invoiceTotal.toLocaleString('en-IN')} for Invoice #${invNum}!`);
      
      // Remove success alert toast after 4s
      setTimeout(() => setPaySuccessMsg(''), 4000);
    };

    // Client Campaign proposal submitting
    const handleRequestServiceAddition = async (e) => {
      e.preventDefault();
      setServiceSubmitSuccess(false);

      if (!requestServiceBrief) {
        alert('Please fill out the campaign focus description.');
        return;
      }

      const matchSrv = INITIAL_SERVICES.find(s => s.id === requestServiceId) || INITIAL_SERVICES[0];

      // Add service request
      const newRequest = {
        id: `req-${Date.now()}`,
        clientName: companyName,
        serviceName: matchSrv.name,
        cost: matchSrv.price,
        requestedDate: '2026-05-20',
        status: 'Pending',
        brief: requestServiceBrief
      };

      try {
        await firebaseService.saveDocument('serviceRequests', newRequest.id, newRequest);
      } catch (err) {
        console.error('Failed to save service request to database:', err);
      }

      setServiceRequests(prev => [newRequest, ...prev]);

      // Log system audit log
      logActivity(
        'Campaign Addition Proposal',
        `Client ${companyName} submitted service proposal requesting launch of "${matchSrv.name}" (₹${matchSrv.price.toLocaleString('en-IN')}/mo).`
      );

      // Reset fields
      setRequestServiceBrief('');
      setServiceSubmitSuccess(true);
    };

    // Technical SEO gauges data
    const activeSeoReport = seoReports?.find(r => r.clientName.toLowerCase() === companyName.toLowerCase()) || seoReports?.[0];
    const activeSeoScore = activeSeoReport ? activeSeoReport.technicalScore : 84;
    const daScore = activeSeoReport ? activeSeoReport.da : 42;
    const paScore = activeSeoReport ? activeSeoReport.pa : 38;

    return (
      <div className="space-y-6">
        
        {/* Brand Command Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-slate-900/40 border border-slate-900 rounded-3xl relative overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute top-[-20%] left-[-10%] w-[35%] h-[60%] rounded-full bg-violet-500/10 blur-[90px] pointer-events-none" />
          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
              <Briefcase className="w-3.5 h-3.5 text-violet-400" /> Client Command Center
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-slate-100">
              Welcome, <span className="text-violet-400">{companyName}</span> Hub
            </h2>
            <p className="text-xs text-slate-400">Track active billing retainers, search engine rankings, and request service upgrades.</p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-[10px] bg-slate-950 border border-slate-850 text-slate-400 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Agency Service Live
            </span>
          </div>
        </div>

        {/* Global Success Notifications */}
        {paySuccessMsg && (
          <div className="p-4 bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold leading-normal">{paySuccessMsg}</span>
          </div>
        )}

        {/* KPIs Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* KPI 1 */}
          <div className="p-5 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-slate-900 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <Briefcase className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Active Services</span>
              <span className="text-xl font-bold text-slate-200 mt-0.5">{clientRecord.activeServices.length} Subscribed</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="p-5 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-slate-900 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <IndianRupee className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Outstandings Ledger</span>
              <span className={`text-xl font-bold mt-0.5 block ${outstandingTotal > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                ₹{outstandingTotal.toLocaleString('en-IN')} Due
              </span>
            </div>
          </div>

          {/* KPI 3: Account Closing Date */}
          <div className={`p-5 rounded-2xl bg-slate-950/40 backdrop-blur-md shadow-xl flex items-center gap-4 border ${
            (clientRecord.closingDate && clientRecord.closingDate < '2026-06-29')
              ? 'border-2 border-red-550/80 shadow-[0_0_15px_rgba(239,68,68,0.25)] bg-red-950/5 animate-pulse'
              : 'border-slate-900'
          }`}>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <Calendar className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Account Closing Date</span>
              <span className="text-sm font-bold text-slate-200 mt-0.5 block">{clientRecord.closingDate || 'Not Specified'}</span>
              <span className="text-[8px] text-slate-500 font-semibold block mt-0.5">Current Date: 2026-06-29</span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="p-5 rounded-2xl bg-slate-950/40 backdrop-blur-md border border-slate-900 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Pending Deliverables</span>
              <span className="text-xl font-bold text-slate-200 mt-0.5">{openTasks.length} Active Tasks</span>
            </div>
          </div>
        </div>

        {/* Dynamic Billing Ledgers and Active Services Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Active Campaigns and Invoices */}
          <div className="lg:col-span-12 space-y-6">
            
            {/* Active Service Cards */}
            <div className="p-6 bg-slate-950/40 border border-slate-900 rounded-2xl shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-200">Subscribed Services & Campaigns</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {clientRecord.activeServices.map((srvName, idx) => {
                  const srvDetails = INITIAL_SERVICES.find(s => s.name === srvName) || { price: 1500, timeline: 'Monthly', deliverables: 'Keyword Tracking, Analytics' };
                  return (
                    <div key={idx} className="p-4 bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-xl space-y-3 transition-all">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-200">{srvName}</span>
                        <span className="text-[9px] uppercase tracking-wider font-black text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                          Active
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">{srvDetails.deliverables}</p>
                      <div className="border-t border-slate-850 pt-2 flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Contract Rate:</span>
                        <span className="font-extrabold text-slate-200">₹{srvDetails.price.toLocaleString('en-IN')} / {srvDetails.timeline}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invoices Table */}
            <div className="p-6 bg-slate-950/40 border border-slate-900 rounded-2xl shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-200">Retainers & Billing Invoices</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-extrabold tracking-wider">
                      <th className="py-3 px-2">Invoice ID</th>
                      <th className="py-3 px-2">Bill Date</th>
                      <th className="py-3 px-2">Service Allocation</th>
                      <th className="py-3 px-2">Amount</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    {clientInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-3.5 px-2 font-mono text-[10px]">{inv.id.toUpperCase()}</td>
                        <td className="py-3.5 px-2 font-semibold text-slate-400">{inv.issueDate}</td>
                        <td className="py-3.5 px-2 max-w-[150px] truncate" title={inv.serviceList.join(', ')}>
                          {inv.serviceList.join(', ')}
                        </td>
                        <td className="py-3.5 px-2 font-bold text-slate-200">₹{inv.total.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-2">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${getStatusBadge(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          {inv.status === 'Paid' ? (
                            <button
                              onClick={() => alert(`[PRINTER LEDGER] Generating PDF Receipt for Invoice: ${inv.id.toUpperCase()}\nClient: ${companyName}\nRetainer Total: ₹${inv.total.toLocaleString('en-IN')}\nStatus: Settled (Paid)`)}
                              className="text-[10px] font-bold text-violet-400 hover:underline cursor-pointer"
                            >
                              Download Receipt
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={payingInvoiceId === inv.id}
                              onClick={() => handlePayInvoiceSimulated(inv.id, inv.total, inv.id.toUpperCase())}
                              className={`text-[9px] uppercase font-black bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-650 hover:to-indigo-650 text-white px-2.5 py-1.5 rounded-lg shadow-lg cursor-pointer transition-all flex items-center gap-1.5 ml-auto ${
                                payingInvoiceId === inv.id ? 'opacity-70 cursor-not-allowed' : ''
                              }`}
                            >
                              {payingInvoiceId === inv.id ? (
                                <>
                                  <span className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Checking
                                </>
                              ) : (
                                <>
                                  <IndianRupee className="w-3 h-3" /> Pay Invoice
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {clientInvoices.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500 italic">
                          No invoice statements or payment retainers logged.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEWPORT C: SUPER ADMIN DASHBOARD (DEFAULT VIEW)
  // -------------------------------------------------------------
  
  // Dynamic Metrics calculations
  const activeClients = clients.filter(c => c.status === 'Active');
  const mrr = clients.reduce((acc, curr) => curr.status === 'Active' ? acc + curr.monthlyBilling : acc, 0);
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  
  // Custom interactive projections calculator
  const calculateProjections = () => {
    let growthRate = 0.05; // 5% moderate
    if (growthScenario === 'aggressive') growthRate = 0.12; // 12%
    if (growthScenario === 'hyper') growthRate = 0.22; // 22%

    const data = [];
    let currentMRR = mrr > 0 ? mrr : 12000;
    
    for(let i = 1; i <= projectionMonths; i++) {
      currentMRR = Math.round(currentMRR * (1 + growthRate));
      data.push({
        month: `Month ${i}`,
        mrr: currentMRR,
        clients: Math.round(activeClients.length * (1 + growthRate * 0.8) + i * 0.5)
      });
    }
    return data;
  };

  const projectionsData = calculateProjections();

  return (
    <div className="space-y-6">
      
      {/* Top Banner with greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Welcome to your Operations Center</h2>
          <p className="text-xs text-slate-400 mt-1">Here is a real-time health summary for your digital agency network.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Sync Engaged
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1 */}
        <div 
          onClick={() => setActiveTab('clients')}
          className={`p-5 rounded-2xl glassmorphism-card border cursor-pointer ${getBrandBorderColor()}`}
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <Users className={`w-5 h-5 ${getBrandTextColor()}`} />
            </div>
            <span className="text-[10px] bg-green-500/10 border border-green-500/35 text-green-400 py-0.5 px-2 rounded-full font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +12%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs text-slate-400 font-medium">Active Partners</h3>
            <div className="text-2xl font-bold text-slate-100 mt-1">{activeClients.length} <span className="text-xs text-slate-500">/{clients.length} Total</span></div>
          </div>
        </div>

        {/* Metric 2 */}
        <div 
          onClick={() => setActiveTab('billing')}
          className={`p-5 rounded-2xl glassmorphism-card border cursor-pointer ${getBrandBorderColor()}`}
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <IndianRupee className={`w-5 h-5 ${getBrandTextColor()}`} />
            </div>
            <span className="text-[10px] bg-green-500/10 border border-green-500/35 text-green-400 py-0.5 px-2 rounded-full font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +8.4%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs text-slate-400 font-medium">Monthly Recurring Revenue (MRR)</h3>
            <div className="text-2xl font-bold text-slate-100 mt-1">₹{mrr.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Metric 3 */}
        <div 
          onClick={() => setActiveTab('reports')}
          className={`p-5 rounded-2xl glassmorphism-card border cursor-pointer ${getBrandBorderColor()}`}
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <BarChart3 className={`w-5 h-5 ${getBrandTextColor()}`} />
            </div>
            <span className="text-[10px] bg-green-500/10 border border-green-500/35 text-green-400 py-0.5 px-2 rounded-full font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +4.2%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs text-slate-400 font-medium">Global SEO Performance</h3>
            <div className="text-2xl font-bold text-slate-100 mt-1">{(seoReports && seoReports[0]) ? seoReports[0].technicalScore : 84}% <span className="text-xs text-slate-500">Tech Score</span></div>
          </div>
        </div>

        {/* Metric 4 */}
        <div 
          onClick={() => setActiveTab('tasks')}
          className={`p-5 rounded-2xl glassmorphism-card border cursor-pointer ${getBrandBorderColor()}`}
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <CheckSquare className={`w-5 h-5 ${getBrandTextColor()}`} />
            </div>
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/35 text-amber-400 py-0.5 px-2 rounded-full font-bold flex items-center gap-0.5">
              {taskCompletionRate > 80 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {taskCompletionRate}%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs text-slate-400 font-medium">Task Velocity</h3>
            <div className="text-2xl font-bold text-slate-100 mt-1">{completedTasks} <span className="text-xs text-slate-500">/{tasks.length} Resolved</span></div>
          </div>
        </div>

      </div>



      {/* Team Workload Tracker Widget [NEW ADDITION] */}
      <div className="p-6 bg-slate-950/40 border border-slate-900 rounded-2xl shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Team Workloads & Allocation</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Review current assignees, active sprint workload index, and employee roles.</p>
          </div>
          <span className="text-[9px] uppercase font-extrabold tracking-wider bg-slate-900 border border-slate-850 px-3 py-1 rounded-full text-slate-400">
            {teamMembers.length} Active Staff
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {teamMembers.map((member, idx) => (
            <div key={idx} className="p-4 bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-xl flex items-center gap-3.5 transition-all">
              <img 
                src={member.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256"} 
                alt={member.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-800"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-200 truncate">{member.name}</h4>
                <p className="text-[9px] text-slate-500 font-semibold truncate mt-0.5">{member.role}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] text-slate-400 font-medium">{member.workload || '0 tasks'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Log and CRM Pipelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Live System Activity Feed */}
        <div className="p-5 rounded-2xl glassmorphism border border-slate-800">
          <div className="flex items-center justify-between mb-4.5">
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${getBrandTextColor()}`} />
              <h3 className="text-sm font-bold text-slate-200">System Activity Ledger</h3>
            </div>
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Live feed</span>
          </div>

          <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex gap-3 text-xs py-1 border-b border-slate-900/60 last:border-b-0 text-left">
                <span className="text-slate-500 select-none tabular-nums mt-0.5">{log.time}</span>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-slate-300">{log.user}</span>{' '}
                  <span className="text-slate-400">{log.action}</span>
                  {log.details && (
                    <p className="text-[10px] text-slate-500 mt-0.5 italic">{log.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Velocity Widget */}
        <div className="p-5 rounded-2xl glassmorphism border border-slate-800">
          <div className="flex justify-between items-center mb-4.5">
            <h3 className="text-sm font-bold text-slate-200">Current Task Allocation</h3>
            <button 
              onClick={() => setActiveTab('tasks')}
              className={`text-[10px] font-bold ${getBrandTextColor()} hover:underline cursor-pointer`}
            >
              Open Workflow Board
            </button>
          </div>

          <div className="space-y-3.5">
            {tasks.slice(0, 4).map((task) => (
              <div 
                key={task.id} 
                className="p-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-900 hover:border-slate-800/80 rounded-xl transition-all flex items-center justify-between"
              >
                <div className="text-left min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-slate-300 leading-tight truncate">{task.title}</h4>
                  <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-500 font-semibold">
                    <span className="font-semibold text-slate-400">{task.client}</span>
                    <span>•</span>
                    <span>Due {task.deadline}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 ml-3">
                  <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                    task.priority === 'High' 
                      ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                      : task.priority === 'Medium'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    {task.priority}
                  </span>

                  <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                    task.status === 'Completed' 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : task.status === 'In Review' || task.status === 'Review'
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                        : task.status === 'In Progress'
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
