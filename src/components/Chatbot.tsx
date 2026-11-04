import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
}

const QUICK_REPLIES = [
  'What services do you offer?',
  'How do I apply for a German visa?',
  'Tell me about language courses',
  'Contact information',
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "👋 Hi! I'm Harry, your virtual immigration assistant. I can help you with visa information, language courses, arrival support, and more. How can I assist you today?",
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

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.text }));

      const res = await fetch(`${API_BASE}/api/chat`, {
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
          text: data.reply || 'Sorry, I could not process that. Please try again.',
          ts: Date.now(),
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: "I'm having trouble connecting right now. Please reach us directly at +91 6302951891 or +49 17670256852. We're happy to help!",
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
      {/* Floating button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full shadow-lg flex items-center justify-center
          transition-all duration-300
          ${open
            ? 'bg-slate-700 hover:bg-slate-800'
            : 'bg-amber-500 hover:bg-amber-600'
          }
        `}
      >
        {open
          ? <X size={24} className="text-white" />
          : <MessageCircle size={26} className="text-white" />
        }
        {!open && !hasInteracted && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white animate-ping" />
        )}
      </button>

      {/* Chat window */}
      <div
        className={`
          fixed bottom-24 right-6 z-50
          w-[340px] sm:w-[380px]
          flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200
          transition-all duration-300 origin-bottom-right
          ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Harry Overseas chat assistant"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-t-2xl">
          <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Bot size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">Harry Assistant</p>
            <p className="text-slate-400 text-xs">Harry Overseas Immigration</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 text-xs font-medium">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div
          className="overflow-y-auto p-4 space-y-3"
          style={{ maxHeight: 340 }}
        >
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 self-end
                  ${msg.role === 'user' ? 'bg-amber-500' : 'bg-slate-200'}
                `}
              >
                {msg.role === 'user'
                  ? <User size={14} className="text-white" />
                  : <Bot size={14} className="text-slate-600" />
                }
              </div>
              {/* Bubble */}
              <div
                className={`
                  max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words
                  ${msg.role === 'user'
                    ? 'bg-amber-500 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'
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
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-slate-600" />
              </div>
              <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick replies — show only before first interaction */}
        {!hasInteracted && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs px-2.5 py-1.5 rounded-full border border-amber-400 text-amber-600 hover:bg-amber-500 hover:text-white transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="px-3 pb-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-300 transition-all mt-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none min-w-0"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-600 transition-colors flex-shrink-0"
            >
              {loading
                ? <Loader2 size={14} className="animate-spin" />
                : <Send size={14} />
              }
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-1.5">Harry Overseas AI · Always here to help</p>
        </div>
      </div>
    </>
  );
}
