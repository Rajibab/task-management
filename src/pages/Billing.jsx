import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, CreditCard, Clock, Plus, Trash2, Download, X, 
  FileText, CheckCircle2, AlertCircle, Calendar, Edit2, Info
} from 'lucide-react';
import firebaseService from '../firebaseService';

export default function Billing({ 
  invoices = [], 
  setInvoices = () => {}, 
  renegotiationLogs = [], 
  setRenegotiationLogs = () => {}, 
  clients = [], 
  setClients = () => {}, 
  currentRole, 
  logActivity = () => {},
  brandColor = 'indigo',
  currentUser = null,
  onOpenAuth = () => {},
  projects = [],
  setProjects = () => {},
  purchaseOrders = [],
  setPurchaseOrders = () => {}
}) {
  
  // Modals state
  const [isAddPrjOpen, setIsAddPrjOpen] = useState(false);
  const [isAddPoOpen, setIsAddPoOpen] = useState(false);
  const [isAddInvOpen, setIsAddInvOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Form states
  const [prjForm, setPrjForm] = useState({
    name: '',
    clientId: 'cli-1',
    value: '',
    paid: '',
    deadline: new Date().toISOString().split('T')[0],
    status: 'Going'
  });

  const [poForm, setPoForm] = useState({
    clientId: 'cli-1',
    invoiceNo: '',
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    fileName: '',
    fileSize: '',
    fileData: ''
  });

  const [invForm, setInvForm] = useState({
    clientId: 'cli-1',
    invoiceNo: '',
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    fileName: '',
    fileSize: '',
    fileData: ''
  });

  // Admin selected client filter state ('all' or a client.id)
  const [selectedClientId, setSelectedClientId] = useState('all');

  // Synchronize modal forms when selected client filter changes
  useEffect(() => {
    if (selectedClientId !== 'all') {
      setPrjForm(prev => ({ ...prev, clientId: selectedClientId }));
      setPoForm(prev => ({ ...prev, clientId: selectedClientId }));
      setInvForm(prev => ({ ...prev, clientId: selectedClientId }));
    } else {
      const defaultClientId = clients[0]?.id || 'cli-1';
      setPrjForm(prev => ({ ...prev, clientId: defaultClientId }));
      setPoForm(prev => ({ ...prev, clientId: defaultClientId }));
      setInvForm(prev => ({ ...prev, clientId: defaultClientId }));
    }
  }, [selectedClientId, clients]);

  // Resolve client company context
  const clientRecord = (currentRole === 'client' && currentUser)
    ? (clients.find(c => c.email?.toLowerCase() === currentUser.email?.toLowerCase()) || clients[0])
    : null;
  const companyName = clientRecord ? clientRecord.companyName : '';

  // Resolve selected filter client record for admin
  const selectedClientRecord = selectedClientId !== 'all'
    ? clients.find(c => c.id === selectedClientId)
    : null;

  // Filter datasets based on active client context or selected filter
  const displayedProjects = currentRole === 'client'
    ? projects.filter(p => p.clientName?.toLowerCase() === companyName?.toLowerCase())
    : (selectedClientId === 'all'
        ? projects
        : projects.filter(p => p.clientId === selectedClientId || p.clientName?.toLowerCase() === selectedClientRecord?.companyName?.toLowerCase())
      );

  const displayedPOs = currentRole === 'client'
    ? purchaseOrders.filter(po => po.clientName?.toLowerCase() === companyName?.toLowerCase())
    : (selectedClientId === 'all'
        ? purchaseOrders
        : purchaseOrders.filter(po => po.clientId === selectedClientId || po.clientName?.toLowerCase() === selectedClientRecord?.companyName?.toLowerCase())
      );

  const displayedInvoices = currentRole === 'client'
    ? invoices.filter(inv => inv.clientName?.toLowerCase() === companyName?.toLowerCase() || inv.clientEmail === currentUser?.email)
    : (selectedClientId === 'all'
        ? invoices
        : invoices.filter(inv => inv.clientId === selectedClientId || inv.clientName?.toLowerCase() === selectedClientRecord?.companyName?.toLowerCase() || inv.clientEmail === selectedClientRecord?.email)
      );

  // Current Date logic
  const currentDateStr = new Date().toISOString().split('T')[0]; // e.g. "2026-06-29"

  // Check if a project is overdue: status is "Going" and deadline is in the past
  const isProjectOverdue = (prj) => {
    return prj.status === 'Going' && prj.deadline < currentDateStr;
  };

  // File Picker Helpers
  const handleFileChange = (e, formType) => {
    const file = e.target.files[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024 
        ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
        : (file.size / 1024).toFixed(0) + ' KB';
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const setter = formType === 'po' ? setPoForm : setInvForm;
        setter(prev => ({
          ...prev,
          fileName: file.name,
          fileSize: sizeStr,
          fileData: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Project Submit
  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!prjForm.name || !prjForm.value) {
      alert('Please fill out all fields.');
      return;
    }

    const prjId = `prj-${Date.now()}`;
    const selectedClient = clients.find(c => c.id === prjForm.clientId) || clients[0];
    const newPrj = {
      id: prjId,
      clientId: selectedClient.id,
      clientName: selectedClient.companyName,
      name: prjForm.name,
      value: parseFloat(prjForm.value) || 0,
      paid: parseFloat(prjForm.paid) || 0,
      deadline: prjForm.deadline,
      status: prjForm.status
    };

    try {
      await firebaseService.saveDocument('projects', prjId, newPrj);
      setProjects(prev => [newPrj, ...prev]);
      logActivity('Project Created', `Added project "${prjForm.name}" for ${selectedClient.companyName}.`);
      setIsAddPrjOpen(false);
      setPrjForm({
        name: '',
        clientId: 'cli-1',
        value: '',
        paid: '',
        deadline: new Date().toISOString().split('T')[0],
        status: 'Going'
      });
    } catch (err) {
      console.error(err);
      alert('Failed to save project.');
    }
  };

  // Update Project
  const handleUpdateProjectSubmit = async (e) => {
    e.preventDefault();
    if (!editingProject) return;

    try {
      await firebaseService.saveDocument('projects', editingProject.id, editingProject);
      setProjects(prev => prev.map(p => p.id === editingProject.id ? editingProject : p));
      logActivity('Project Updated', `Modified billing progress of project "${editingProject.name}".`);
      setEditingProject(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update project.');
    }
  };

  // Delete Project
  const handleDeleteProject = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete project "${name}"?`)) {
      try {
        await firebaseService.deleteDocument('projects', id);
        setProjects(prev => prev.filter(p => p.id !== id));
        logActivity('Project Deleted', `Removed project "${name}" from ledgers.`);
      } catch (err) {
        console.error(err);
        alert('Failed to delete project.');
      }
    }
  };

  // Add Purchase Order Submit
  const handleAddPO = async (e) => {
    e.preventDefault();
    if (!poForm.invoiceNo || !poForm.title || !poForm.amount || !poForm.fileName) {
      alert('Please fill out all fields and select a file.');
      return;
    }

    const poId = `po-${Date.now()}`;
    const selectedClient = clients.find(c => c.id === poForm.clientId) || clients[0];
    const newPO = {
      id: poId,
      clientId: selectedClient.id,
      clientName: selectedClient.companyName,
      invoiceNo: poForm.invoiceNo,
      title: poForm.title,
      amount: parseFloat(poForm.amount) || 0,
      date: poForm.date,
      fileName: poForm.fileName,
      fileSize: poForm.fileSize,
      fileData: poForm.fileData || ''
    };

    try {
      await firebaseService.saveDocument('purchaseOrders', poId, newPO);
      setPurchaseOrders(prev => [newPO, ...prev]);
      logActivity('PO Uploaded', `Registered Purchase Order ${poForm.invoiceNo} for ${selectedClient.companyName}.`);
      setIsAddPoOpen(false);
      setPoForm({
        clientId: 'cli-1',
        invoiceNo: '',
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        fileName: '',
        fileSize: '',
        fileData: ''
      });
    } catch (err) {
      console.error(err);
      alert('Failed to save PO.');
    }
  };

  // Delete Purchase Order
  const handleDeletePO = async (id, invoiceNo) => {
    if (window.confirm(`Are you sure you want to delete PO "${invoiceNo}"?`)) {
      try {
        await firebaseService.deleteDocument('purchaseOrders', id);
        setPurchaseOrders(prev => prev.filter(po => po.id !== id));
        logActivity('PO Deleted', `Removed PO ${invoiceNo} from databases.`);
      } catch (err) {
        console.error(err);
        alert('Failed to delete PO.');
      }
    }
  };

  // Add Invoice Submit
  const handleAddInvoice = async (e) => {
    e.preventDefault();
    if (!invForm.invoiceNo || !invForm.title || !invForm.amount || !invForm.fileName) {
      alert('Please fill out all fields and select a file.');
      return;
    }

    const invId = `inv-${Date.now()}`;
    const selectedClient = clients.find(c => c.id === invForm.clientId) || clients[0];
    const newInv = {
      id: invId,
      clientId: selectedClient.id,
      clientName: selectedClient.companyName,
      clientEmail: selectedClient.email,
      invoiceNo: invForm.invoiceNo,
      title: invForm.title,
      amount: parseFloat(invForm.amount) || 0,
      date: invForm.date,
      issueDate: invForm.date,
      dueDate: invForm.date,
      total: parseFloat(invForm.amount) || 0,
      taxGst: 0,
      status: 'Paid', // default to paid/settled for uploaded manual invoices
      fileName: invForm.fileName,
      fileSize: invForm.fileSize,
      serviceList: [invForm.title],
      fileData: invForm.fileData || ''
    };

    try {
      await firebaseService.saveDocument('invoices', invId, newInv);
      setInvoices(prev => [newInv, ...prev]);
      logActivity('Invoice Registered', `Uploaded invoice ${invForm.invoiceNo} for ${selectedClient.companyName}.`);
      setIsAddInvOpen(false);
      setInvForm({
        clientId: 'cli-1',
        invoiceNo: '',
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        fileName: '',
        fileSize: '',
        fileData: ''
      });
    } catch (err) {
      console.error(err);
      alert('Failed to save invoice.');
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = async (id, invoiceNo) => {
    if (window.confirm(`Are you sure you want to delete Invoice "${invoiceNo}"?`)) {
      try {
        await firebaseService.deleteDocument('invoices', id);
        setInvoices(prev => prev.filter(inv => inv.id !== id));
        logActivity('Invoice Deleted', `Removed Invoice ${invoiceNo} from ledger.`);
      } catch (err) {
        console.error(err);
        alert('Failed to delete invoice.');
      }
    }
  };

  // Download Helper (generates download doc)
  const handleDownloadDoc = (docType, docItem) => {
    if (docItem.fileData) {
      fetch(docItem.fileData)
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', docItem.fileName);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        })
        .catch(err => {
          console.error("Failed to download file from base64:", err);
          fallbackDownloadDoc(docType, docItem);
        });
    } else {
      fallbackDownloadDoc(docType, docItem);
    }
  };

  const fallbackDownloadDoc = (docType, docItem) => {
    const amountVal = docItem.amount || docItem.total || 0;
    const content = `================================================
OMNIMARK DIGITAL OPERATING SYSTEM
FINANCIAL LEDGER DOCUMENT DECREE
================================================
Document Type   : ${docType}
Partner Client  : ${docItem.clientName}
Document ID/No  : ${docItem.invoiceNo || docItem.id}
Date Registered : ${docItem.date || docItem.issueDate}
Total Valuation : ₹${amountVal.toLocaleString('en-IN')}
File Origin     : ${docItem.fileName || 'System_Generated_Invoice.pdf'}

DOCUMENT NOTES & SERVICE SCOPE:
------------------------------------------------
Title Scope: ${docItem.title || (docItem.serviceList ? docItem.serviceList.join(', ') : 'Custom Contract Invoice')}
Size Token: ${docItem.fileSize || '245 KB'}

------------------------------------------------
Authorized Signature: OmniMark Financial Gateway
Verify: https://jamtion-729e2.web.app/`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const downloadName = docItem.fileName ? `${docItem.fileName.replace(/\.[^/.]+$/, "")}_Details.txt` : `${docType}_${docItem.invoiceNo || docItem.id}.txt`;
    link.setAttribute('download', downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Styling helpers
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
      case 'emerald': return 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500';
      case 'violet': return 'bg-violet-500 hover:bg-violet-600 focus:ring-violet-500';
      case 'amber': return 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500';
      default: return 'bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-500';
    }
  };

  const getBrandBorderColor = () => {
    switch (brandColor) {
      case 'emerald': return 'border-emerald-500/20';
      case 'violet': return 'border-violet-500/20';
      case 'amber': return 'border-amber-500/20';
      default: return 'border-indigo-500/20';
    }
  };

  const getBrandActiveRing = () => {
    switch (brandColor) {
      case 'emerald': return 'focus:ring-emerald-500/40 focus:border-emerald-500';
      case 'violet': return 'focus:ring-violet-500/40 focus:border-violet-500';
      case 'amber': return 'focus:ring-amber-500/40 focus:border-amber-500';
      default: return 'focus:ring-indigo-500/40 focus:border-indigo-500';
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto space-y-6 select-none animate-in fade-in duration-300">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl relative shadow-[0_0_50px_-12px_rgba(99,102,241,0.15)] w-full">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 rounded-3xl opacity-50 blur-[2px]" />
          <div className="relative p-4 bg-slate-950 rounded-2xl border border-slate-850 text-indigo-400 w-14 h-14 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CreditCard className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-slate-200 relative">Financial Database Lock</h3>
          <p className="text-xs text-slate-500 relative leading-relaxed mt-2.5">
            Security Clearance Required. Access to real-time billing ledgers, purchase orders, active project value matrices, and invoice downloads is restricted.
          </p>
        </div>
        
        <button
          type="button"
          onClick={onOpenAuth}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-bold text-xs cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_-3px_rgba(99,102,241,0.4)] flex items-center gap-2"
        >
          Authenticate Session to Unlock
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Financial Ledger & Invoices</h2>
          <p className="text-xs text-slate-400 mt-1">Audit active billing cycles, download corporate receipts, and manage project pricing.</p>
        </div>

        {currentRole !== 'client' && (
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Client Context:</span>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-slate-950 border border-slate-850 hover:border-slate-800 text-xs text-slate-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 font-semibold cursor-pointer transition-all min-w-[200px]"
            >
              <option value="all">📁 All Enterprise Partners</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  🏢 {c.companyName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* SECTION 1: PROJECTS GRID */}
      <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CreditCard className={`w-4 h-4 ${getBrandTextColor()}`} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350">Projects Overview</h3>
          </div>
          {currentRole !== 'client' && (
            <button 
              type="button"
              onClick={() => setIsAddPrjOpen(true)}
              className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-extrabold text-white rounded-lg shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-[0.95] ${getBrandBg()}`}
            >
              <Plus className="w-3.5 h-3.5" /> Add Project
            </button>
          )}
        </div>

        {displayedProjects.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-900">
            No projects registered for {companyName || 'the current view'}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {displayedProjects.map(prj => {
              const isOverdue = isProjectOverdue(prj);
              const outstanding = prj.value - prj.paid;
              
              return (
                <div 
                  key={prj.id} 
                  className={`p-5 bg-slate-950/70 border rounded-xl flex flex-col justify-between transition-all group ${
                    isOverdue 
                      ? 'border-2 border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.2)] bg-red-950/5' 
                      : 'border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="space-y-4">
                    
                    {/* Project Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[8px] font-extrabold uppercase animate-pulse mb-2">
                            <AlertCircle className="w-2.5 h-2.5" /> Overdue Deadline
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-slate-200 tracking-wide block truncate">{prj.name}</h4>
                        <span className="text-[10px] text-slate-500 block font-medium mt-0.5">Client: {prj.clientName}</span>
                      </div>
                      
                      {/* Project Controls for Admin/Team */}
                      {currentRole !== 'client' && (
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setEditingProject(prj)}
                            className="p-1 text-slate-400 hover:text-indigo-400 bg-slate-900 hover:bg-indigo-500/10 border border-slate-850 rounded-md cursor-pointer transition-colors"
                            title="Edit Project Details"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(prj.id, prj.name)}
                            className="p-1 text-slate-400 hover:text-red-400 bg-slate-900 hover:bg-red-500/10 border border-slate-850 rounded-md cursor-pointer transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Metrics Dashboard Grid */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/60 border border-slate-900 rounded-xl text-center">
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 block">Value</span>
                        <span className="text-[11px] font-bold text-slate-200 font-mono">₹{prj.value.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="space-y-1 border-x border-slate-850">
                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 block">Paid</span>
                        <span className="text-[11px] font-bold text-emerald-400 font-mono">₹{prj.paid.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 block">Outstanding</span>
                        <span className="text-[11px] font-bold text-amber-400 font-mono">₹{outstanding.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deadline Indicator Footer */}
                  <div className="border-t border-slate-900/60 pt-3 mt-4 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 text-slate-450 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <div>
                        <span className="block font-bold">Deadline: {prj.deadline}</span>
                        <span className="block text-[8px] text-slate-500 mt-0.5">Current Date: {currentDateStr}</span>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                      prj.status === 'Completed' 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                    }`}>
                      {prj.status}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: PURCHASE ORDERS (PO) */}
      <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className={`w-4 h-4 ${getBrandTextColor()}`} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350">Purchase Orders (PO) Register</h3>
          </div>
          {currentRole !== 'client' && (
            <button 
              type="button"
              onClick={() => setIsAddPoOpen(true)}
              className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-extrabold text-white rounded-lg shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-[0.95] ${getBrandBg()}`}
            >
              <Plus className="w-3.5 h-3.5" /> Add PO File
            </button>
          )}
        </div>

        {displayedPOs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-900">
            No purchase orders found.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-950 rounded-xl bg-slate-950/20">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="text-[9px] uppercase font-bold text-slate-500 border-b border-slate-900 bg-slate-950/60">
                <tr>
                  {currentRole !== 'client' && <th className="py-3 px-4">Client</th>}
                  <th className="py-3 px-4">PO No</th>
                  <th className="py-3 px-4">Agreement Title</th>
                  <th className="py-3 px-4 text-right">PO Valuation</th>
                  <th className="py-3 px-4 text-center">Upload Date</th>
                  <th className="py-3 px-4 text-center">Download File</th>
                  {currentRole !== 'client' && <th className="py-3 px-4 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {displayedPOs.map(po => (
                  <tr key={po.id} className="hover:bg-slate-950/30 transition-colors">
                    {currentRole !== 'client' && <td className="py-3.5 px-4 font-bold text-slate-350">{po.clientName}</td>}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{po.invoiceNo}</td>
                    <td className="py-3.5 px-4 max-w-xs truncate font-medium text-slate-200" title={po.title}>{po.title}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">₹{po.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-center text-slate-400 font-medium">{po.date}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDownloadDoc('Purchase Order (PO)', po)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-lg text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-slate-400" /> Download
                      </button>
                    </td>
                    {currentRole !== 'client' && (
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeletePO(po.id, po.invoiceNo)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: INVOICES REGISTRATION */}
      <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className={`w-4 h-4 ${getBrandTextColor()}`} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350">Invoices Register</h3>
          </div>
          {currentRole !== 'client' && (
            <button 
              type="button"
              onClick={() => setIsAddInvOpen(true)}
              className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-extrabold text-white rounded-lg shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-[0.95] ${getBrandBg()}`}
            >
              <Plus className="w-3.5 h-3.5" /> Add Invoice File
            </button>
          )}
        </div>

        {displayedInvoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-900">
            No invoices logged in this register.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-950 rounded-xl bg-slate-950/20">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="text-[9px] uppercase font-bold text-slate-500 border-b border-slate-900 bg-slate-950/60">
                <tr>
                  {currentRole !== 'client' && <th className="py-3 px-4">Client</th>}
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Invoice Description</th>
                  <th className="py-3 px-4 text-right">Billing amount</th>
                  <th className="py-3 px-4 text-center">Billing Date</th>
                  <th className="py-3 px-4 text-center">Download File</th>
                  {currentRole !== 'client' && <th className="py-3 px-4 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {displayedInvoices.map(inv => {
                  const desc = inv.title || (inv.serviceList ? inv.serviceList.join(', ') : 'Monthly Retainer Billing');
                  const invNo = inv.invoiceNo || inv.id;
                  const dateStr = inv.date || inv.issueDate;
                  const amtVal = inv.amount || inv.total;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-950/30 transition-colors">
                      {currentRole !== 'client' && <td className="py-3.5 px-4 font-bold text-slate-350">{inv.clientName}</td>}
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{invNo}</td>
                      <td className="py-3.5 px-4 max-w-xs truncate font-medium text-slate-200" title={desc}>{desc}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">₹{amtVal.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-center text-slate-400 font-medium">{dateStr}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDownloadDoc('Invoice Receipt', inv)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-lg text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
                        >
                          <Download className="w-3 h-3 text-slate-400" /> Download
                        </button>
                      </td>
                      {currentRole !== 'client' && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteInvoice(inv.id, invNo)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD PROJECT */}
      {isAddPrjOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
            <div className="p-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-950/40">
              <div className="flex items-center gap-2">
                <CreditCard className={`w-5 h-5 ${getBrandTextColor()}`} />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Add Billing Project</h3>
              </div>
              <button onClick={() => setIsAddPrjOpen(false)} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Project Name</label>
                <input 
                  type="text" required placeholder="e.g. Website Migration Campaign"
                  value={prjForm.name}
                  onChange={(e) => setPrjForm({...prjForm, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Client Corporate Partner</label>
                <select 
                  value={prjForm.clientId}
                  onChange={(e) => setPrjForm({...prjForm, clientId: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none cursor-pointer"
                >
                  {clients.map(cli => (
                    <option key={cli.id} value={cli.id}>{cli.companyName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Project Value (₹)</label>
                  <input 
                    type="number" required placeholder="e.g. 150000"
                    value={prjForm.value}
                    onChange={(e) => setPrjForm({...prjForm, value: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Paid Amount (₹)</label>
                  <input 
                    type="number" required placeholder="e.g. 50000"
                    value={prjForm.paid}
                    onChange={(e) => setPrjForm({...prjForm, paid: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Project Deadline</label>
                  <input 
                    type="date" required
                    value={prjForm.deadline}
                    onChange={(e) => setPrjForm({...prjForm, deadline: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Status</label>
                  <select 
                    value={prjForm.status}
                    onChange={(e) => setPrjForm({...prjForm, status: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none cursor-pointer"
                  >
                    <option value="Going">Going (Active)</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddPrjOpen(false)} className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-bold rounded-xl cursor-pointer transition-colors">Cancel</button>
                <button type="submit" className={`flex-1 py-3 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-lg ${getBrandBg()}`}>Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE/EDIT PROJECT (ADMIN/TEAM) */}
      {editingProject && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
            <div className="p-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Edit2 className={`w-5 h-5 ${getBrandTextColor()}`} />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Edit Project Billing</h3>
              </div>
              <button onClick={() => setEditingProject(null)} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProjectSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Project Name</label>
                <input 
                  type="text" required
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Total Value (₹)</label>
                  <input 
                    type="number" required
                    value={editingProject.value}
                    onChange={(e) => setEditingProject({...editingProject, value: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Paid Amount (₹)</label>
                  <input 
                    type="number" required
                    value={editingProject.paid}
                    onChange={(e) => setEditingProject({...editingProject, paid: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Deadline</label>
                  <input 
                    type="date" required
                    value={editingProject.deadline}
                    onChange={(e) => setEditingProject({...editingProject, deadline: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Status</label>
                  <select 
                    value={editingProject.status}
                    onChange={(e) => setEditingProject({...editingProject, status: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none cursor-pointer"
                  >
                    <option value="Going">Going (Active)</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 flex gap-3">
                <button type="button" onClick={() => setEditingProject(null)} className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-bold rounded-xl cursor-pointer transition-colors">Cancel</button>
                <button type="submit" className={`flex-1 py-3 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-lg ${getBrandBg()}`}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD PURCHASE ORDER */}
      {isAddPoOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
            <div className="p-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-950/40">
              <div className="flex items-center gap-2">
                <FileText className={`w-5 h-5 ${getBrandTextColor()}`} />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Upload Purchase Order</h3>
              </div>
              <button onClick={() => setIsAddPoOpen(false)} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPO} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Client Corporate Partner</label>
                <select 
                  value={poForm.clientId}
                  onChange={(e) => setPoForm({...poForm, clientId: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none cursor-pointer"
                >
                  {clients.map(cli => (
                    <option key={cli.id} value={cli.id}>{cli.companyName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">PO Number (Invoice No)</label>
                  <input 
                    type="text" required placeholder="e.g. PO-2026-001"
                    value={poForm.invoiceNo}
                    onChange={(e) => setPoForm({...poForm, invoiceNo: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Valuation Date</label>
                  <input 
                    type="date" required
                    value={poForm.date}
                    onChange={(e) => setPoForm({...poForm, date: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">PO Title / Description</label>
                <input 
                  type="text" required placeholder="e.g. Cloud Portal Development Campaign"
                  value={poForm.title}
                  onChange={(e) => setPoForm({...poForm, title: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Amount (₹)</label>
                <input 
                  type="number" required placeholder="e.g. 120000"
                  value={poForm.amount}
                  onChange={(e) => setPoForm({...poForm, amount: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Select PO File Document</label>
                <div className="flex items-center gap-3">
                  <label className={`px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer font-bold text-slate-350 hover:text-slate-250 transition-colors flex items-center gap-1.5`}>
                    <Plus className="w-3.5 h-3.5" /> Attach File
                    <input type="file" onChange={(e) => handleFileChange(e, 'po')} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" />
                  </label>
                  <div className="flex-1 min-w-0 bg-slate-950/40 p-2.5 border border-slate-900 rounded-xl text-[10px] text-slate-500 font-mono truncate">
                    {poForm.fileName ? `${poForm.fileName} (${poForm.fileSize})` : 'No file chosen'}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddPoOpen(false)} className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-bold rounded-xl cursor-pointer transition-colors">Cancel</button>
                <button type="submit" className={`flex-1 py-3 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-lg ${getBrandBg()}`}>Upload PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD INVOICE */}
      {isAddInvOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
            <div className="p-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-950/40">
              <div className="flex items-center gap-2">
                <FileText className={`w-5 h-5 ${getBrandTextColor()}`} />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Upload Invoice File</h3>
              </div>
              <button onClick={() => setIsAddInvOpen(false)} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddInvoice} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Client Corporate Partner</label>
                <select 
                  value={invForm.clientId}
                  onChange={(e) => setInvForm({...invForm, clientId: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none cursor-pointer"
                >
                  {clients.map(cli => (
                    <option key={cli.id} value={cli.id}>{cli.companyName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Invoice Number</label>
                  <input 
                    type="text" required placeholder="e.g. INV-2026-042"
                    value={invForm.invoiceNo}
                    onChange={(e) => setInvForm({...invForm, invoiceNo: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Billing Date</label>
                  <input 
                    type="date" required
                    value={invForm.date}
                    onChange={(e) => setInvForm({...invForm, date: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Invoice Description</label>
                <input 
                  type="text" required placeholder="e.g. Monthly Retainer - SEO Content Deliverables"
                  value={invForm.title}
                  onChange={(e) => setInvForm({...invForm, title: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Amount (₹)</label>
                <input 
                  type="number" required placeholder="e.g. 5000"
                  value={invForm.amount}
                  onChange={(e) => setInvForm({...invForm, amount: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Select Invoice File Document</label>
                <div className="flex items-center gap-3">
                  <label className={`px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer font-bold text-slate-350 hover:text-slate-250 transition-colors flex items-center gap-1.5`}>
                    <Plus className="w-3.5 h-3.5" /> Attach File
                    <input type="file" onChange={(e) => handleFileChange(e, 'inv')} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" />
                  </label>
                  <div className="flex-1 min-w-0 bg-slate-950/40 p-2.5 border border-slate-900 rounded-xl text-[10px] text-slate-500 font-mono truncate">
                    {invForm.fileName ? `${invForm.fileName} (${invForm.fileSize})` : 'No file chosen'}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddInvOpen(false)} className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-bold rounded-xl cursor-pointer transition-colors">Cancel</button>
                <button type="submit" className={`flex-1 py-3 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-lg ${getBrandBg()}`}>Upload Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
