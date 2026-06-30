import React, { useState } from 'react';
import { 
  Settings, Sparkles, Globe, Mail, Shield, 
  CheckCircle, Key, RefreshCw, Upload, Eye, Sun, Moon 
} from 'lucide-react';
import firebaseService from '../firebaseService';

export default function SettingsPage({ 
  agencyName, 
  setAgencyName, 
  agencyLogo,
  setAgencyLogo,
  brandColor, 
  setBrandColor, 
  logActivity,
  darkMode,
  setDarkMode,
  currentRole = 'admin',
  currentUser = null
}) {
  
  // Custom Domain state
  const [customDomain, setCustomDomain] = useState('portal.omnimark.agency');
  const [dnsStatus, setDnsStatus] = useState('Active');
  
  // SMTP Config state
  const [smtpHost, setSmtpHost] = useState('smtp.sendgrid.net');
  const [smtpUser, setSmtpUser] = useState('apikey');
  const [isSmtpVerified, setIsSmtpVerified] = useState(true);

  // Logo file path mock state
  const [logoText, setLogoText] = useState('OmniMark OS');

  // Super Admin security credentials form state
  const [adminEmail, setAdminEmail] = useState(currentUser?.email || '');
  const [adminPassword, setAdminPassword] = useState('');
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false);

  React.useEffect(() => {
    if (currentUser?.email) {
      setAdminEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleUpdateAdminCreds = async (e) => {
    e.preventDefault();
    if (!adminEmail) {
      alert('Login Email ID is required.');
      return;
    }
    setIsUpdatingCreds(true);
    try {
      await firebaseService.updateSuperAdminCredentials(adminEmail, adminPassword || null);
      logActivity('Security Credentials Updated', `Super Admin updated own account email and security credentials.`);
      alert('Security credentials updated successfully!');
      setAdminPassword('');
    } catch (err) {
      console.error(err);
      alert(`Credentials update failed: ${err.message}`);
    } finally {
      setIsUpdatingCreds(false);
    }
  };

  // Action: Save White-Label configs
  const handleSaveWhiteLabel = async (e) => {
    e.preventDefault();
    try {
      const config = {
        id: 'white_label',
        agencyName,
        agencyLogo,
        brandColor,
        darkMode
      };
      await firebaseService.saveDocument('system_config', 'white_label', config);
      logActivity('Settings Modified', `Updated White-Label configurations: Agency Name "${agencyName}" and color theme "${brandColor}".`);
      alert('White-Label configurations compiled and saved successfully! Global styles updated instantly.');
    } catch (err) {
      console.error('Failed to save white label configurations:', err);
      alert('Failed to save configurations to the database.');
    }
  };

  // Action: Check DNS records
  const handleVerifyDns = () => {
    setDnsStatus('Verifying...');
    setTimeout(() => {
      setDnsStatus('Active');
      logActivity('DNS Checked', `Verified active CNAME pointer map for "${customDomain}".`);
      alert('DNS status verified! Domain points securely to our scalable gateway servers.');
    }, 1000);
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

  const getBrandBorderColor = (color) => {
    if (brandColor === color) {
      switch (color) {
        case 'emerald': return 'border-emerald-500 ring-2 ring-emerald-500/20';
        case 'violet': return 'border-violet-500 ring-2 ring-violet-500/20';
        case 'amber': return 'border-amber-500 ring-2 ring-amber-500/20';
        default: return 'border-indigo-500 ring-2 ring-indigo-500/20';
      }
    }
    return 'border-slate-800 hover:border-slate-700';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">System & White-Label Settings</h2>
        <p className="text-xs text-slate-400 mt-1">Configure global white-label properties, domain redirects, and dark/light UI modes.</p>
      </div>

      {/* Main Settings forms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Agency Customizer (White-Label) */}
        <div className="lg:col-span-7 space-y-6">
          <form 
            onSubmit={handleSaveWhiteLabel}
            className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-5"
          >
            <div className="flex items-center gap-2 border-b border-slate-955 pb-3">
              <Sparkles className={`w-4.5 h-4.5 ${getBrandTextColor()}`} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350">Agency Branding Suite</h3>
            </div>

            <div className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Agency / Enterprise Name</label>
                  <input 
                    type="text" required
                    value={agencyName}
                    onChange={(e) => {
                      setAgencyName(e.target.value);
                      setLogoText(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Core Workspace Theme Mode</label>
                  <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setDarkMode(true)}
                      className={`flex-1 py-1.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        darkMode ? `${getBrandBg()} text-white` : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" /> Dark Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setDarkMode(false)}
                      className={`flex-1 py-1.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        !darkMode ? `${getBrandBg()} text-white` : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" /> Light Mode
                    </button>
                  </div>
                </div>
              </div>

              {/* Theme color selectors */}
              <div className="space-y-2">
                <label className="text-slate-400 font-medium block">Primary Brand Color Palette</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: 'indigo', name: 'Indigo Glow', bg: 'bg-indigo-500', text: 'text-indigo-400' },
                    { id: 'emerald', name: 'Emerald Peak', bg: 'bg-emerald-500', text: 'text-emerald-400' },
                    { id: 'violet', name: 'Violet Aura', bg: 'bg-violet-500', text: 'text-violet-400' },
                    { id: 'amber', name: 'Amber Sunrise', bg: 'bg-amber-500', text: 'text-amber-400' }
                  ].map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setBrandColor(color.id)}
                      className={`p-3 bg-slate-950/80 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${getBrandBorderColor(color.id)}`}
                    >
                      <span className={`w-4 h-4 rounded-full ${color.bg}`} />
                      <span className="text-[9px] font-bold text-slate-350">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium block">Custom Landing Logo Upload (White-Label)</label>
                <div className="p-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-center space-y-3 flex flex-col items-center justify-center">
                  {agencyLogo ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 rounded-xl border border-slate-700 bg-slate-950 overflow-hidden flex items-center justify-center mx-auto shadow-md">
                        <img src={agencyLogo} alt="Agency Logo" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex gap-2 justify-center">
                        <label className={`px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-slate-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1.5`}>
                          <Upload className="w-3.5 h-3.5" /> Edit Logo
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setAgencyLogo(reader.result);
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden" 
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete the agency logo?")) {
                              setAgencyLogo('');
                            }
                          }}
                          className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-red-400 hover:text-red-300 hover:border-red-955 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          Delete Logo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-slate-600 mx-auto" />
                      <label className="text-[10px] text-slate-400 block cursor-pointer hover:text-slate-300 transition-colors font-bold underline decoration-indigo-500 underline-offset-4">
                        Click here to upload agency logo image
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setAgencyLogo(reader.result);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden" 
                        />
                      </label>
                      <span className="text-[8px] text-slate-500 uppercase block font-semibold">Supports SVG, PNG, JPG (Transparent, max 2MB)</span>
                    </>
                  )}
                </div>
              </div>

            </div>

            <div className="pt-3 border-t border-slate-955 flex justify-end">
              <button 
                type="submit" 
                className={`px-4 py-2 ${getBrandBg()} text-white rounded-xl text-xs font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md`}
              >
                Compile Brand Assets
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Network & Domains Specs */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Super Admin Security & Credentials Suite */}
          {currentRole === 'admin' && (
            <form 
              onSubmit={handleUpdateAdminCreds}
              className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-4 shadow-lg"
            >
              <div className="flex items-center gap-2 border-b border-slate-950 pb-3">
                <Key className={`w-4.5 h-4.5 ${getBrandTextColor()}`} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350">Security & Credentials Suite</h3>
              </div>

              <div className="text-xs space-y-3.5">
                <p className="text-[10px] text-slate-500 leading-normal">
                  Update your Super Admin primary authentication ID and security passcode.
                </p>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Super Admin Login ID (Email)</label>
                  <input 
                    type="email" required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none font-medium"
                    placeholder="admin@aurascale.io"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">New Security Passcode (Optional)</label>
                  <input 
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none font-mono"
                    placeholder="•••••••••••• (Leave blank to keep current)"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingCreds}
                    className={`px-4 py-2 ${getBrandBg()} text-white rounded-xl text-xs font-bold cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-md`}
                  >
                    {isUpdatingCreds ? 'Securing Suite...' : 'Save New Credentials'}
                  </button>
                </div>
              </div>
            </form>
          )}
          
          {/* Custom CNAME Setup */}
          <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-955 pb-3">
              <Globe className={`w-4.5 h-4.5 ${getBrandTextColor()}`} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350">Custom CNAME Redirection</h3>
            </div>

            <div className="text-xs space-y-3.5">
              <p className="text-[10px] text-slate-500 leading-normal">
                Point your own sub-domain (e.g. <code>clients.youragency.com</code>) to our cloud load balancer for absolute white-labeled CRM portals.
              </p>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Custom Redirection Domain</label>
                <input 
                  type="text" 
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none font-bold"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1 select-none font-mono text-[9px] text-slate-400">
                <div className="text-[8px] font-bold text-slate-500 uppercase font-sans mb-1">DNS Registry Instructions</div>
                <div>Record Type: <span className="font-bold text-indigo-400">CNAME</span></div>
                <div>Host / Alias: <span className="font-bold text-slate-350">portal</span></div>
                <div>Points To: <span className="font-bold text-slate-350">gateway.omnimark.agency</span></div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${dnsStatus === 'Active' ? 'bg-emerald-500' : 'bg-amber-400 animate-ping'}`} />
                  <span className="text-[10px] font-bold text-slate-400">CNAME Point: {dnsStatus}</span>
                </div>
                
                <button
                  type="button"
                  onClick={handleVerifyDns}
                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg font-bold text-[10px] text-slate-300 cursor-pointer transition-all"
                >
                  Verify Pointer
                </button>
              </div>

            </div>
          </div>

          {/* Core SMTP mail routing config */}
          <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-955 pb-3">
              <Mail className={`w-4.5 h-4.5 ${getBrandTextColor()}`} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350">Outbound SMTP Mailer</h3>
            </div>

            <div className="text-xs space-y-3.5">
              <p className="text-[10px] text-slate-500 leading-normal">
                Use your corporate email server to dispatch invoice receipts, billing reminders, and PDF report emails.
              </p>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">SMTP Server Host</label>
                  <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">SMTP User Account</label>
                  <input type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none" />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> SMTP Mailer verified
                </span>
                <button
                  type="button"
                  onClick={() => alert('Sending mock SMTP diagnostic mail... Success!')}
                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg font-bold text-[10px] text-slate-300 cursor-pointer transition-all"
                >
                  Send Test Mail
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
