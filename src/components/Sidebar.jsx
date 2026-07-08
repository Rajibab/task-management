import React from 'react';
import { 
  LayoutDashboard, Users, Layers, FolderOpen, CreditCard, 
  CheckSquare, Settings, Sparkles, LogOut 
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  currentRole, 
  notifications,
  agencyName = 'OmniMark OS',
  agencyLogo = '',
  brandColor = 'indigo',
  currentUser = null,
  onOpenAuth = () => {},
  onSignOut = () => {},
  hasLeadAccess = false
}) {
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'team', 'client'] },
    { id: 'clients', label: 'Client CRM', icon: Users, roles: ['admin', 'team'] },
    { id: 'services', label: 'Service Hub', icon: Layers, roles: ['admin', 'team', 'client'] },
    { id: 'reports', label: 'Reports', icon: FolderOpen, roles: ['admin', 'team', 'client'] },
    { id: 'billing', label: 'Billing & Invoices', icon: CreditCard, roles: ['admin', 'client'] },
    { id: 'crm', label: 'Lead Pipeline', icon: Sparkles, roles: ['admin', 'team'] },
    { id: 'tasks', label: 'Workflows', icon: CheckSquare, roles: ['admin', 'team'] },
    { id: 'settings', label: 'White-Label Config', icon: Settings, roles: ['admin'] }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles.includes(currentRole)) return false;
    if (currentRole === 'team' && item.id === 'crm' && !hasLeadAccess) return false;
    return true;
  });

  // Dynamic border/text styling based on white-label brandColor
  const getBrandTextColor = () => {
    switch (brandColor) {
      case 'emerald': return 'text-emerald-400';
      case 'violet': return 'text-violet-400';
      case 'amber': return 'text-amber-400';
      default: return 'text-indigo-400';
    }
  };

  const getActiveItemStyle = (id) => {
    if (activeTab === id) {
      switch (brandColor) {
        case 'emerald': return 'bg-emerald-500/15 border-l-4 border-emerald-500 text-emerald-200';
        case 'violet': return 'bg-violet-500/15 border-l-4 border-violet-500 text-violet-200';
        case 'amber': return 'bg-amber-500/15 border-l-4 border-amber-500 text-amber-200';
        default: return 'bg-indigo-500/15 border-l-4 border-indigo-500 text-indigo-200';
      }
    }
    return 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-4 border-transparent';
  };

  return (
    <aside className="w-64 glassmorphism border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0 z-30 select-none">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-slate-800/60 flex flex-col items-center justify-center select-none shrink-0">
        {agencyLogo ? (
          <div className="w-full h-14 flex items-center justify-start overflow-hidden rounded-xl p-0.5">
            <img src={agencyLogo} alt={agencyName} className="max-w-full max-h-full object-contain" />
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full">
            <div className="w-9 h-9 rounded-lg border border-slate-700 shadow-inner flex items-center justify-center overflow-hidden shrink-0 bg-slate-950">
              <Sparkles className={`w-5 h-5 ${getBrandTextColor()} animate-pulse`} />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent tracking-wide leading-none">{agencyName || 'OmniMark OS'}</h1>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Agencies OS v1.2</span>
            </div>
          </div>
        )}
      </div>



      {/* Main Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Navigation</div>
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${getActiveItemStyle(item.id)}`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              
              {/* Contextual Badging */}
              {item.id === 'overview' && unreadNotifications > 0 && (
                <span className="bg-red-500/25 border border-red-500/50 text-red-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {unreadNotifications} new
                </span>
              )}
              {item.id === 'tasks' && (
                <span className="text-[10px] text-slate-500 font-bold bg-slate-800/80 border border-slate-700 px-1.5 py-0.5 rounded-md">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile/Footer Module */}
      <div className="p-4 border-t border-slate-800/60 bg-slate-950/40">
        {currentUser ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={
                    currentUser.role === 'admin' 
                      ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&h=100&q=80' 
                      : currentUser.role === 'team'
                        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80'
                        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'
                  } 
                  alt="Avatar" 
                  className={`w-9 h-9 rounded-full object-cover border border-slate-700`}
                />
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                  currentUser.role === 'admin' ? 'bg-indigo-400' : currentUser.role === 'team' ? 'bg-emerald-400' : 'bg-violet-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-slate-200 truncate">
                  {currentUser.displayName}
                </h4>
                <p className="text-[10px] text-slate-500 truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>
            
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-slate-800 hover:border-slate-700 hover:text-red-400 text-slate-400 rounded-lg cursor-pointer font-bold text-[10px] transition-all bg-slate-950/60"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out Session
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 text-center">
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Session Guest Mode</div>
            <button
              onClick={onOpenAuth}
              className={`w-full py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-bold text-[10px] text-center cursor-pointer transition-colors block border border-indigo-400/20 shadow-[0_0_15px_-4px_rgba(99,102,241,0.5)]`}
            >
              Sign In / Sign Up
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
