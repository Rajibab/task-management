import React, { useState } from 'react';
import { 
  Sparkles, Plus, IndianRupee, Layers, ChevronRight, 
  Trash2, X, User, Globe, MessageSquare, TrendingUp 
} from 'lucide-react';
import firebaseService from '../firebaseService';

export default function CRM({ 
  leads, 
  setLeads, 
  logActivity,
  brandColor = 'indigo'
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    company: '', contact: '', email: '', value: '', stage: 'Lead', industry: ''
  });

  const stages = ['Lead', 'Contacted', 'Proposal', 'Negotiating', 'Closed'];

  // Global Pipeline sizing
  const totalValuation = leads.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
  const wonValuation = leads.filter(l => l.stage === 'Closed').reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);

  // Action: Transition lead stage
  const handleTransitionLead = async (id, newStage, company) => {
    const lead = leads.find(l => l.id === id);
    if (lead) {
      const updatedLead = { ...lead, stage: newStage };
      try {
        await firebaseService.saveDocument('leads', id, updatedLead);
      } catch (err) {
        console.error('Failed to save lead stage transition:', err);
      }
      setLeads(prev => prev.map(l => l.id === id ? updatedLead : l));
    }
    logActivity('CRM Stage Changed', `Shifted lead opportunity "${company}" to deal stage: ${newStage.toUpperCase()}.`);
  };

  // Action: Add new lead opportunity
  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!newLead.company || !newLead.value) return;

    const created = {
      id: `ld-${Date.now()}`,
      company: newLead.company,
      contact: newLead.contact || 'Not Registered',
      email: newLead.email || '',
      value: parseFloat(newLead.value) || 0,
      stage: newLead.stage,
      industry: newLead.industry || 'Tech',
      date: new Date().toISOString().split('T')[0]
    };

    try {
      await firebaseService.saveDocument('leads', created.id, created);
    } catch (err) {
      console.error('Failed to save new lead opportunity:', err);
    }

    setLeads(prev => [created, ...prev]);
    logActivity('Opportunity Registered', `Logged prospective CRM deal "${created.company}" valued at ₹${created.value.toLocaleString('en-IN')}.`);
    
    // Reset Form
    setNewLead({ company: '', contact: '', email: '', value: '', stage: 'Lead', industry: '' });
    setIsAddOpen(false);
  };

  // Action: Delete lead
  const handleDeleteLead = async (id, company) => {
    if (confirm(`Remove CRM deal prospect "${company}"?`)) {
      try {
        await firebaseService.deleteDocument('leads', id);
      } catch (err) {
        console.error('Failed to delete CRM lead opportunity:', err);
      }
      setLeads(prev => prev.filter(l => l.id !== id));
      logActivity('Prospect Removed', `Deleted CRM lead "${company}".`);
    }
  };

  // Color mapping
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

  const getStageHeaderStyle = (stg) => {
    switch (stg) {
      case 'Closed': return 'border-emerald-500/30 text-emerald-400';
      case 'Negotiating': return 'border-amber-500/30 text-amber-400';
      case 'Proposal': return 'border-violet-500/30 text-violet-400';
      default: return 'border-indigo-500/30 text-indigo-400';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">CRM & Sales Deal Pipeline</h2>
          <p className="text-xs text-slate-400 mt-1">Track marketing leads, proposal feedback cycles, and forecasted monthly agency valuations.</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 ${getBrandBg()}`}
        >
          <Plus className="w-4 h-4" /> Add Lead Prospect
        </button>
      </div>

      {/* Pipeline Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Metric 1 */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500">Pipeline Deal Volume</span>
            <div className="text-lg font-bold text-slate-200 mt-0.5">₹{totalValuation.toLocaleString('en-IN')}</div>
          </div>
          <TrendingUp className="w-5 h-5 text-indigo-400" />
        </div>

        {/* Metric 2 */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500">Closed Sales (Won)</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">₹{wonValuation.toLocaleString('en-IN')}</div>
          </div>
          <IndianRupee className="w-5 h-5 text-emerald-400" />
        </div>

        {/* Metric 3 */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500">Forecast Conversion (30 Days)</span>
            <div className="text-lg font-bold text-slate-200 mt-0.5">₹{Math.round(totalValuation * 0.35).toLocaleString('en-IN')} <span className="text-[10px] text-slate-500 font-medium">(at 35%)</span></div>
          </div>
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>

      </div>

      {/* Kanban Pipeline Stage columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 items-start">
        {stages.map((stage) => {
          const stageLeads = leads.filter(l => l.stage === stage);
          const stageTotalVal = stageLeads.reduce((acc, curr) => acc + curr.value, 0);

          return (
            <div key={stage} className="p-3 bg-slate-900/40 border border-slate-900 rounded-2xl flex flex-col space-y-4">
              
              {/* Stage Header */}
              <div className="border-b border-slate-900 pb-2 flex justify-between items-center">
                <div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${getStageHeaderStyle(stage)}`}>
                    {stage}
                  </span>
                  <div className="text-[10px] font-extrabold text-slate-400 mt-1">₹{stageTotalVal.toLocaleString('en-IN')}</div>
                </div>
                <span className="bg-slate-950 border border-slate-850 text-[9px] text-slate-500 font-extrabold px-1.5 py-0.5 rounded-md">
                  {stageLeads.length}
                </span>
              </div>

              {/* Leads cards */}
              <div className="space-y-3 min-h-[250px] overflow-y-auto max-h-[60vh] pr-0.5">
                {stageLeads.map((ld) => (
                  <div
                    key={ld.id}
                    className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 rounded-xl transition-all shadow-sm select-none relative group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] font-bold bg-slate-950 text-slate-500 border border-slate-850 px-1.5 py-0.5 rounded uppercase">
                        {ld.industry}
                      </span>

                      <button
                        onClick={() => handleDeleteLead(ld.id, ld.company)}
                        className="text-slate-600 hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
                        title="Discard prospect"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200 mt-2.5">{ld.company}</h4>
                    <span className="text-[9px] text-slate-500 block mt-0.5">{ld.contact}</span>

                    <div className="mt-4 pt-2.5 border-t border-slate-950/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">₹{ld.value.toLocaleString('en-IN')}</span>
                      
                      {/* Transition swapper selector */}
                      <select
                        value={ld.stage}
                        onChange={(e) => handleTransitionLead(ld.id, e.target.value, ld.company)}
                        className="bg-slate-950 border border-slate-800 text-slate-500 py-0.5 px-1.5 rounded text-[8px] font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                      >
                        {stages.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                  </div>
                ))}

                {stageLeads.length === 0 && (
                  <p className="text-slate-600 text-center italic py-8 text-[9px]">Stage Empty</p>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL: ADD PROSPECT */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddLead}
            className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
          >
            <div className="p-5 border-b border-slate-900 bg-slate-900/40 flex justify-between items-center text-slate-200">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Sparkles className={`w-4 h-4 ${getBrandTextColor()}`} /> Record Lead Opportunity
              </h3>
              <button type="button" onClick={() => setIsAddOpen(false)} className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Company / Opportunity *</label>
                  <input 
                    type="text" required
                    placeholder="e.g. Solaria Solar"
                    value={newLead.company}
                    onChange={(e) => setNewLead({...newLead, company: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Industry</label>
                  <input 
                    type="text"
                    placeholder="e.g. Energy"
                    value={newLead.industry}
                    onChange={(e) => setNewLead({...newLead, industry: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Primary Contact</label>
                  <input 
                    type="text"
                    placeholder="Helena Vance"
                    value={newLead.contact}
                    onChange={(e) => setNewLead({...newLead, contact: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Email</label>
                  <input 
                    type="email"
                    placeholder="helena@solaria.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Forecast Deal Value ($) *</label>
                  <input 
                    type="number" required
                    placeholder="8000"
                    value={newLead.value}
                    onChange={(e) => setNewLead({...newLead, value: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Deal Stage</label>
                  <select 
                    value={newLead.stage}
                    onChange={(e) => setNewLead({...newLead, stage: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
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
                Log Prospect
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
