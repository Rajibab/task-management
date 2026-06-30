import React, { useState } from 'react';
import { ShieldCheck, Users, Briefcase, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import firebaseService from '../firebaseService';

export default function LoginGateway({ brandColor = 'indigo' }) {
  const [selectedRole, setSelectedRole] = useState('admin'); // admin, team, client
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Color mapping utilities matching dashboard theme system
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

  const getBrandGlowColor = () => {
    switch (brandColor) {
      case 'emerald': return 'from-emerald-500/20 to-transparent';
      case 'violet': return 'from-violet-500/20 to-transparent';
      case 'amber': return 'from-amber-500/20 to-transparent';
      default: return 'from-indigo-500/20 to-transparent';
    }
  };

  const getBrandBorderColor = () => {
    switch (brandColor) {
      case 'emerald': return 'border-emerald-500/20 focus-within:border-emerald-500';
      case 'violet': return 'border-violet-500/20 focus-within:border-violet-500';
      case 'amber': return 'border-amber-500/20 focus-within:border-amber-500';
      default: return 'border-indigo-500/20 focus-within:border-indigo-500';
    }
  };

  const getBrandActiveRing = () => {
    switch (brandColor) {
      case 'emerald': return 'ring-2 ring-emerald-500/40 border-emerald-500';
      case 'violet': return 'ring-2 ring-violet-500/40 border-violet-500';
      case 'amber': return 'ring-2 ring-amber-500/40 border-amber-500';
      default: return 'ring-2 ring-indigo-500/40 border-indigo-500';
    }
  };

  // Role switching handles selected visual tab but does not auto-populate inputs visibly
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!email || !password) {
      setErrorMsg('Please enter both your email address and password.');
      setLoading(false);
      return;
    }

    try {
      await firebaseService.signIn(email, password);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      
      {/* Decorative Blur Background Spheres */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br ${getBrandGlowColor()} blur-[120px] opacity-40`} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-indigo-500/10 to-transparent blur-[120px] opacity-40" />

      {/* Main Container */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 items-center">
        
        {/* Left Column: Platform Branding & Highlights */}
        <div className="lg:col-span-5 space-y-6 text-center lg:text-left pr-0 lg:pr-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
            <Sparkles className={`w-3.5 h-3.5 ${getBrandTextColor()} animate-spin-slow`} />
            Next-Gen Operating System
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight uppercase">
              AuraScale <br/>
              <span className="bg-gradient-to-r from-slate-200 via-slate-400 to-slate-200 bg-clip-text text-transparent">
                Agency Console
              </span>
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto lg:mx-0">
              Welcome back to your high-performance CRM, Billing, and digital campaign builder gateway. Authenticate with your secure role credentials.
            </p>
          </div>

          {/* Quick Info Points */}
          <div className="hidden lg:block space-y-3 text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Role-Based Multi-Dashboard Viewports</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>Session-Safe Onboarding Engine</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span>Production Firestore & Secure Storage</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Login Container */}
        <div className="lg:col-span-7 bg-slate-950/40 backdrop-blur-md border border-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
          
          {/* Card Border Top Glow Accent */}
          <div className={`absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-${brandColor}-500 to-transparent blur-[1.5px]`} />

          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-slate-100">Authenticate Security Access</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Select your account profile role below</p>
          </div>

          {/* 3-Column Selectable Cards Layout */}
          <div className="grid grid-cols-3 gap-3">
            
            {/* Super Admin Card */}
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`p-3.5 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center space-y-2 group ${
                selectedRole === 'admin' 
                  ? `${getBrandActiveRing()} bg-slate-900/60` 
                  : 'bg-slate-900/20 border-slate-900 hover:border-slate-850 hover:bg-slate-900/30'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${
                selectedRole === 'admin' 
                  ? 'bg-indigo-500/10 text-indigo-400' 
                  : 'bg-slate-900 text-slate-400 group-hover:text-slate-200'
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wide block">Admin</span>
            </button>

            {/* Team Member Card */}
            <button
              type="button"
              onClick={() => handleRoleSelect('team')}
              className={`p-3.5 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center space-y-2 group ${
                selectedRole === 'team' 
                  ? `${getBrandActiveRing()} bg-slate-900/60` 
                  : 'bg-slate-900/20 border-slate-900 hover:border-slate-850 hover:bg-slate-900/30'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${
                selectedRole === 'team' 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-slate-900 text-slate-400 group-hover:text-slate-200'
              }`}>
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wide block">Team</span>
            </button>

            {/* Client Card */}
            <button
              type="button"
              onClick={() => handleRoleSelect('client')}
              className={`p-3.5 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center space-y-2 group ${
                selectedRole === 'client' 
                  ? `${getBrandActiveRing()} bg-slate-900/60` 
                  : 'bg-slate-900/20 border-slate-900 hover:border-slate-850 hover:bg-slate-900/30'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${
                selectedRole === 'client' 
                  ? 'bg-violet-500/10 text-violet-400' 
                  : 'bg-slate-900 text-slate-400 group-hover:text-slate-200'
              }`}>
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wide block">Client</span>
            </button>

          </div>

          {/* Form and Fields */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-medium leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              
              {/* Email Input Field */}
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Email Address</label>
                <div className={`relative flex items-center bg-slate-900 border rounded-xl transition-all ${getBrandBorderColor()}`}>
                  <Mail className="w-4 h-4 absolute left-3.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    placeholder="e.g. name@aurascale.io"
                    autoComplete="username"
                    className="w-full bg-transparent pl-11 pr-4 py-3 text-slate-200 placeholder-slate-650 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Input Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 font-medium">Access Password</label>
                </div>
                <div className={`relative flex items-center bg-slate-900 border rounded-xl transition-all ${getBrandBorderColor()}`}>
                  <Lock className="w-4 h-4 absolute left-3.5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="••••••"
                    autoComplete="current-password"
                    className="w-full bg-transparent pl-11 pr-12 py-3 text-slate-200 placeholder-slate-650 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

            </div>

            {/* Authenticate Action Trigger */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 text-xs font-bold text-white rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 ${getBrandBg()} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Authenticate Access <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

          </form>

        </div>

      </div>
    </div>
  );
}
