import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, X, Send, Bot, Terminal, HelpCircle } from 'lucide-react';

export default function AICopilot({ clients, invoices, leads, brandColor = 'indigo' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 'm1', sender: 'ai', text: 'Hello! I am your OmniMark AI Copilot. I have access to your CRM databases, billing files, and live SEO graphs. How can I help you grow today?', time: 'Just now' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const getBrandBg = () => {
    switch (brandColor) {
      case 'emerald': return 'from-emerald-600 to-teal-500 bg-emerald-500';
      case 'violet': return 'from-violet-600 to-fuchsia-500 bg-violet-500';
      case 'amber': return 'from-amber-600 to-orange-500 bg-amber-500';
      default: return 'from-indigo-600 to-purple-500 bg-indigo-500';
    }
  };

  const getBrandTextColor = () => {
    switch (brandColor) {
      case 'emerald': return 'text-emerald-400';
      case 'violet': return 'text-violet-400';
      case 'amber': return 'text-amber-400';
      default: return 'text-indigo-400';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSuggestionClick = (prompt) => {
    setInput(prompt);
    sendMessage(prompt);
  };

  const sendMessage = (textToSend = input) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg = { id: `m-${Date.now()}`, sender: 'user', text: trimmed, time: 'Just now' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking and reply
    setTimeout(() => {
      let reply = "";
      const lower = trimmed.toLowerCase();

      if (lower.includes('seo') || lower.includes('traffic') || lower.includes('keywords')) {
        reply = "Based on AeroMedia Group's latest SEO data, keyword rankings grew by 18% month-over-month. Their strongest keyword is 'aerospace cloud digital marketing' (Rank #1). However, I detected 3 broken redirect patterns in their blog directory that are hurting technical indexation scores. I suggest fixing those immediately to regain the lost 4% technical score.";
      } else if (lower.includes('billing') || lower.includes('invoice') || lower.includes('revenue')) {
        const totalRevenue = invoices.reduce((acc, curr) => curr.status === 'Paid' ? acc + curr.total : acc, 0);
        const outstanding = invoices.reduce((acc, curr) => curr.status === 'Due' || curr.status === 'Overdue' ? acc + curr.total : acc, 0);
        reply = `I ran a quick ledger scan. Total Paid Invoices total ₹${totalRevenue.toLocaleString('en-IN')}. Currently, you have ₹${outstanding.toLocaleString('en-IN')} in due/overdue invoices. The largest outstanding amount is from Verdant Energy (₹5,900, Overdue). I can draft a payment reminder email if you wish!`;
      } else if (lower.includes('lead') || lower.includes('pipeline') || lower.includes('deal')) {
        const leadCount = leads.length;
        const totalValue = leads.reduce((acc, curr) => acc + curr.value, 0);
        reply = `You currently have ${leadCount} active opportunities in your CRM Pipeline. The highest-value prospect is Quantum Crypt (₹12,000, Proposal stage). Solaria Solar (₹8,000, Lead stage) is highly active. I recommend following up with Beacon Logistics today as they have been in 'Negotiating' for over 12 days.`;
      } else if (lower.includes('client') || lower.includes('customer')) {
        const activeClients = clients.filter(c => c.status === 'Active').length;
        reply = `You have ${clients.length} clients registered. ${activeClients} are currently 'Active', 1 is 'Paused' (Zenith E-Commerce), and 1 is 'Pending' (Verdant Energy). AeroMedia Group is your primary account (₹4,500/mo billing).`;
      } else if (lower.includes('suggest') || lower.includes('idea') || lower.includes('campaign')) {
        reply = "Here are 3 AI-generated campaigns for Zenith E-Commerce: \n1. Retargeting Ad copy: 'Inventory restocked! Premium gear with 15% discount code ZEN15. Next-day delivery.' \n2. SEO outreach: Partner with lifestyle travel bloggers to build backlinks for your gear categories. \n3. Email sequence: Send an automated 'unpause budget' notification with updated Q2 CTR metrics.";
      } else {
        reply = "Interesting query! I can analyze client accounts, read billing histories, or provide SEO growth suggestions. For example, try asking me 'Which invoice is overdue?' or 'How is AeroMedia Group SEO traffic performing?'";
      }

      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        time: 'Just now'
      }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating launcher button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full text-white shadow-lg bg-gradient-to-tr hover:scale-110 active:scale-95 cursor-pointer transition-all duration-300 ${getBrandBg()} ${
          brandColor === 'emerald' ? 'theme-glow-emerald' : brandColor === 'violet' ? 'theme-glow-violet' : brandColor === 'amber' ? 'theme-glow-amber' : 'theme-glow-indigo'
        }`}
      >
        {isOpen ? <X className="w-6 h-6 animate-spin" style={{ animationDuration: '0.5s' }} /> : <Sparkles className="w-6 h-6 animate-pulse" />}
      </button>

      {/* Main chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] z-50 rounded-2xl glassmorphism border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className={`p-4 bg-gradient-to-r ${getBrandBg()} flex items-center justify-between`}>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/10 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-none">OmniMark AI Copilot</h3>
                <span className="text-[10px] text-white/70 font-medium">Platform Knowledgebase Active</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/70">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {msg.sender === 'ai' && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-slate-700 text-xs bg-slate-900 ${getBrandTextColor()}`}>
                    🤖
                  </div>
                )}
                <div 
                  className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user' 
                      ? `bg-gradient-to-r text-white ${getBrandBg()} rounded-tr-none` 
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-slate-700 text-xs bg-slate-900 ${getBrandTextColor()}`}>
                  🤖
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl rounded-tl-none text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick-Suggestion Pills */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/90 flex flex-wrap gap-1.5">
              <button 
                onClick={() => handleSuggestionClick('Audit AeroMedia SEO')}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 py-1 px-2.5 rounded-full cursor-pointer flex items-center gap-1 font-medium transition-all"
              >
                🔍 Audit SEO
              </button>
              <button 
                onClick={() => handleSuggestionClick('Summarize active CRM leads')}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 py-1 px-2.5 rounded-full cursor-pointer flex items-center gap-1 font-medium transition-all"
              >
                ⚡ CRM Pipeline
              </button>
              <button 
                onClick={() => handleSuggestionClick('Find overdue invoices')}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 py-1 px-2.5 rounded-full cursor-pointer flex items-center gap-1 font-medium transition-all"
              >
                💰 Overdue Invoices
              </button>
            </div>
          )}

          {/* Input form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot anything..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700"
            />
            <button 
              type="submit" 
              className={`p-2.5 rounded-xl text-white shadow-md bg-gradient-to-tr hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center transition-all ${getBrandBg()}`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
