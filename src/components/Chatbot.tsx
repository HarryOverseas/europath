import React, { useState, useRef, useEffect } from 'react';
import { secureFetch } from '../utils/secureApi';
import { MessageCircle, X, Send, User, Loader2, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
}

// Professional AI Counselor / Advisor Avatar Image
const AI_GIRL_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80";

const QUICK_REPLIES = [
  'German Course Fees (A1–Combo)',
  'Nurse Requirement in Germany',
  'German Language Courses (A1–B2)',
  'Germany Student & Job Visas',
  'Contact Anantapur Office',
];

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "👋 Hallo! I'm Clara, your Harry Overseas AI Advisor.\n\nI can help you with our German Language Courses (A1–B1 Combo at ₹45,999), Nurse Requirement in Germany, Student Visas, Opportunity Cards (Chancenkarte), and Arrival Support. How can I assist you today?",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setHasInteracted(true);
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      ts: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Provide immediate helpful responses for key topics
    const lower = trimmed.toLowerCase();
    let instantReply: string | null = null;

    if (lower.includes('combo') || lower.includes('fee') || lower.includes('price') || lower.includes('pricing') || lower.includes('cost')) {
      instantReply = "📚 German Language Academy Regular Fees:\n\n• A1 Level: ₹14,999\n• A2 Level: ₹15,999\n• B1 Level: ₹17,999\n\n⭐ Complete German Combo (A1 + A2 + B1):\n₹45,999\n\nFlexible weekday and weekend batches available with study materials and Goethe / Telc exam preparation. Would you like to reserve a seat?";
    } else if (lower.includes('nurse') || lower.includes('nursing') || lower.includes('hospital') || lower.includes('healthcare')) {
      instantReply = "🏥 Nurse Requirement in Germany:\n\nGermany is actively recruiting GNM & B.Sc Registered Nurses with:\n• European Salary: €2,800 to €3,600 / month (approx. ₹2.5L to ₹3.2L)\n• Free hospital placement assistance & contract sponsorship\n• Adaptation training for full German nursing license (Anerkennung)\n• Full family reunion rights for spouse & children\n\nWe provide complete B1/B2 German language training and credential recognition filing. Would you like our healthcare counselor to contact you?";
    } else if (lower.includes('youtube') || lower.includes('instagram') || lower.includes('social') || lower.includes('video')) {
      instantReply = "📱 Connect with Harry Overseas on Social Media:\n\n• YouTube: https://youtube.com/@harryoverseas?si=NfLVoDQIQXjMhmvL\n• Instagram: @harryoverseas (https://instagram.com/harryoverseas)\n\nSubscribe to watch student visa success stories, German language lessons, and Germany arrival guides!";
    } else if (lower.includes('contact') || lower.includes('office') || lower.includes('address') || lower.includes('phone') || lower.includes('anantapur')) {
      instantReply = "📍 Harry Overseas Immigration Office:\n\n• Address: Near JNTU University, Anantapur, Andhra Pradesh, India\n• Phone: +91 6302951891 / +49 17670256852 (Germany Operations)\n• Email: info.harryoverseas@gmail.com\n\nYou can also click the 'WhatsApp Us' button anytime to chat directly with our senior advisors!";
    }

    if (instantReply) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: instantReply!,
            ts: Date.now(),
          },
        ]);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.text }));

      const res = await secureFetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (!res.ok) throw new Error('Server error');
      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: data.reply || 'Thank you for reaching out! Please feel free to ask about our German courses, visa guidance, or nurse recruitment.',
          ts: Date.now(),
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: "I'm always here to help! For immediate consultation, WhatsApp us at +91 6302951891 or call our Germany helpline at +49 17670256852.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating button with AI Girl Photo */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3">
        {!open && !hasInteracted && (
          <button
            onClick={() => setOpen(true)}
            className="hidden sm:flex items-center space-x-2 bg-slate-900/95 text-white px-3.5 py-2 rounded-2xl shadow-xl border border-brand-gold/40 text-xs font-semibold hover:border-brand-gold transition-all animate-bounce"
            style={{ animationDuration: '3s' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
            <span>Ask Clara · AI Advisor</span>
          </button>
        )}

        <button
          onClick={() => setOpen(prev => !prev)}
          aria-label={open ? 'Close chat' : 'Open chat with Clara'}
          className={`
            relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center
            transition-all duration-300 transform hover:scale-105
            ${open
              ? 'bg-slate-800 text-white border-2 border-slate-700'
              : 'bg-gradient-to-tr from-brand-navy to-brand-dark border-2 border-brand-gold ring-4 ring-brand-gold/20'
            }
          `}
        >
          {open ? (
            <X size={24} className="text-white" />
          ) : (
            <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              {!avatarError ? (
                <img
                  src={AI_GIRL_AVATAR}
                  alt="Clara AI Girl Advisor"
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-brand-gold to-amber-500 flex items-center justify-center text-brand-dark font-bold text-lg">
                  👩‍💼
                </div>
              )}
              {/* Online status indicator */}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
            </div>
          )}

          {!open && !hasInteracted && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 ring-2 ring-white animate-ping" />
          )}
        </button>
      </div>

      {/* Chat window */}
      <div
        className={`
          fixed bottom-24 right-6 z-50
          w-[350px] sm:w-[400px]
          flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200
          transition-all duration-300 origin-bottom-right overflow-hidden
          ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Harry Overseas Clara AI Assistant"
      >
        {/* Header with AI Girl Portrait */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-brand-dark via-slate-900 to-brand-navy text-white border-b border-brand-gold/30">
          <div className="flex items-center space-x-3">
            <div className="relative w-11 h-11 rounded-full border-2 border-brand-gold overflow-hidden shadow flex-shrink-0 bg-slate-800">
              {!avatarError ? (
                <img
                  src={AI_GIRL_AVATAR}
                  alt="Clara AI Advisor"
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-amber-500 flex items-center justify-center text-xl">
                  👩‍💼
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
            </div>

            <div>
              <div className="flex items-center space-x-1.5">
                <h4 className="font-bold text-sm text-white">Clara</h4>
                <span className="bg-brand-gold/20 text-brand-gold text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider border border-brand-gold/30">
                  AI Advisor
                </span>
              </div>
              <p className="text-[11px] text-slate-300">Harry Overseas Immigration & Language</p>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages Body */}
        <div
          className="overflow-y-auto p-4 space-y-3 bg-slate-50/70"
          style={{ maxHeight: 350, minHeight: 260 }}
        >
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              {msg.role === 'assistant' ? (
                <div className="w-7 h-7 rounded-full overflow-hidden border border-brand-gold/50 flex-shrink-0 self-end shadow-sm">
                  {!avatarError ? (
                    <img
                      src={AI_GIRL_AVATAR}
                      alt="Clara"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-brand-gold flex items-center justify-center text-[10px]">
                      👩‍💼
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-navy flex items-center justify-center flex-shrink-0 self-end shadow-sm text-white">
                  <User size={14} />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`
                  max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm
                  ${msg.role === 'user'
                    ? 'bg-brand-navy text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
                  }
                `}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-2 items-end">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-brand-gold/50 flex-shrink-0">
                <img
                  src={AI_GIRL_AVATAR}
                  alt="Clara"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl rounded-bl-none flex gap-1.5 items-center shadow-sm">
                <span className="w-2 h-2 rounded-full bg-brand-gold animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-brand-gold animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-brand-gold animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex flex-wrap gap-1.5">
          {QUICK_REPLIES.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 text-slate-700 bg-slate-50 hover:bg-brand-navy hover:text-white hover:border-brand-navy transition-all"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="p-3 bg-white border-t border-slate-100">
          <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus-within:border-brand-gold focus-within:ring-2 focus-within:ring-brand-gold/20 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Clara about visas, courses, nursing..."
              disabled={loading}
              className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none min-w-0"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="w-8 h-8 rounded-lg bg-brand-gold hover:bg-brand-lightGold text-brand-dark font-bold flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 mt-1.5">
            <span>Harry Overseas AI Assistant</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Online 24/7
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
