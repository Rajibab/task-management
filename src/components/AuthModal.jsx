import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, Sparkles, Check } from 'lucide-react';
import firebaseService from '../firebaseService';

export default function AuthModal({ isOpen, onClose, brandColor = 'indigo' }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin' // admin, team, client
  });
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

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
      case 'emerald': return 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500';
      case 'violet': return 'bg-violet-500 hover:bg-violet-600 focus:ring-violet-500';
      case 'amber': return 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500';
      default: return 'bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-500';
    }
  };

  const getBrandRingColor = () => {
    switch (brandColor) {
      case 'emerald': return 'focus:ring-emerald-500/30 focus:border-emerald-500';
      case 'violet': return 'focus:ring-violet-500/30 focus:border-violet-500';
      case 'amber': return 'focus:ring-amber-500/30 focus:border-amber-500';
      default: return 'focus:ring-indigo-500/30 focus:border-indigo-500';
    }
  };

  const getBrandBorderColor = () => {
    switch (brandColor) {
      case 'emerald': return 'border-emerald-500/30';
      case 'violet': return 'border-violet-500/30';
      case 'amber': return 'border-amber-500/30';
      default: return 'border-indigo-500/30';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const { name, email, password, confirmPassword, role } = formData;

    if (!email || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    if (isRegister) {
      if (!name) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password should be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegister) {
        await firebaseService.registerUser(name, email, password, role);
        setSuccessMsg(`Welcome to OmniMark OS! Account created successfully.`);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        await firebaseService.signIn(email, password);
        setSuccessMsg('Session authenticated successfully. Welcome back!');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md bg-slate-950/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Glow background accent */}
        <div className={`absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-${brandColor}-500 to-transparent blur-[1px]`} />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand header */}
        <div className="p-6 pt-8 pb-4 text-center space-y-2 border-b border-slate-900/60 bg-slate-950/40">
          <div className="mx-auto w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-indigo-400 shadow-inner">
            <Sparkles className={`w-5 h-5 ${getBrandTextColor()} animate-pulse`} />
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            {isRegister ? 'Create Agency Account' : 'Authenticate Session'}
          </h2>
          <p className="text-[10px] text-slate-400 tracking-wide">
            {isRegister 
              ? 'Join OmniMark OS to manage clients, services, and billing ledger databases.' 
              : 'Enter email credentials to verify your security access level.'}
          </p>
        </div>

        {/* Auth form views */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Error Message Box */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/35 text-red-400 rounded-xl font-medium leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Success Message Box */}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 rounded-xl font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-3.5">
            {/* Full Name (Register only) */}
            {isRegister && (
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Full Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input 
                    type="text" required
                    name="name"
                    placeholder="e.g. Rajib Sen"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 ${getBrandRingColor()}`}
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input 
                  type="email" required
                  name="email"
                  placeholder="e.g. rajib@omnimark.io"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 ${getBrandRingColor()}`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Account Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input 
                  type="password" required
                  name="password"
                  placeholder="••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 ${getBrandRingColor()}`}
                />
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {isRegister && (
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input 
                    type="password" required
                    name="confirmPassword"
                    placeholder="••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 ${getBrandRingColor()}`}
                  />
                </div>
              </div>
            )}

            {/* Role Switch Selector (Register only) */}
            {isRegister && (
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Assign System Role</label>
                <div className="relative">
                  <Shield className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500 animate-pulse" />
                  <select 
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 cursor-pointer focus:ring-indigo-500/30"
                  >
                    <option value="admin" className="bg-slate-950 text-indigo-300">⚡ Super Admin (Owner)</option>
                    <option value="team" className="bg-slate-950 text-emerald-300">👥 Team Member</option>
                    <option value="client" className="bg-slate-950 text-violet-300">💼 Client Hub Account</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-xs font-bold text-white rounded-xl shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 ${getBrandBg()} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isRegister ? (
              'Create Free Account'
            ) : (
              'Authenticate Session'
            )}
          </button>

          {/* Toggle Tab Footer */}
          <div className="text-center pt-2 text-[10px]">
            <button 
              type="button"
              disabled={loading}
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-slate-500 hover:text-slate-300 cursor-pointer font-semibold underline transition-all"
            >
              {isRegister 
                ? 'Already have an account? Sign In here' 
                : "Don't have an account yet? Register one here"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
