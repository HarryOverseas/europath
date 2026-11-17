import React, { useState, useRef, useEffect } from 'react';
import { secureFetch } from '../utils/secureApi';
import { MessageCircle, X, Send, User, Loader2, Sparkles, CheckCircle2, ShieldCheck, Phone, Mail, MapPin, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
}

interface RegisteredUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  interest: string;
  city?: string;
}

// Professional AI Counselor / Advisor Avatar Image
const AI_GIRL_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80";

const QUICK_REPLIES = [
  'German Course Fees (A1–Combo)',
  '📱 Lifetime App Access (+₹1,000–₹5,000)',
  'Nurse Requirement in Germany',
  'German Language Courses (A1–B2)',
  'Germany Student & Job Visas',
  'Contact Anantapur Office',
];

const INTEREST_OPTIONS = [
  'German Language Courses (A1–B2 & Combo)',
  '📱 German Academy + Lifetime App Access',
  '🏥 Germany Nurse Pathway & Hospital Placement',
  '🎓 Germany Student Visa & Admissions',
  '💼 Opportunity Card (Chancenkarte) / Job Seeker',
  '📍 General Immigration Consultation'
];

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regInterest, setRegInterest] = useState(INTEREST_OPTIONS[0]);
  const [regCity, setRegCity] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "👋 Hallo! I'm Clara, your Harry Overseas AI Advisor.\n\nTo provide verified course fees, official German visa guides, and ensure our counselors track your inquiry, please take 10 seconds to complete your registration below.",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const regFormRef = useRef<HTMLDivElement>(null);

  // Load existing registration from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('europath_chat_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id && parsed?.fullName && parsed?.phone) {
          setRegisteredUser(parsed);
          setMessages([
            {
              id: 'welcome-registered',
              role: 'assistant',
              text: `👋 Willkommen zurück, ${parsed.fullName}! I'm Clara, your AI Advisor.\n\nYour session is connected to inquiry #${parsed.id}. You can ask about our German Courses (A1–B1 Combo at ₹45,999), Lifetime App Access (+₹1,000–₹5,000), Nurse Recruitment in Germany, or Student Visas. How can I assist you today?`,
              ts: Date.now(),
            }
          ]);
        }
      }
    } catch (err) {
      console.warn('Could not read user registration from storage:', err);
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, registeredUser]);

  // Focus input when chat opens
  useEffect(() => {
    if (open && registeredUser) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, registeredUser]);

  // Log activity to backend database
  const logActivity = async (enquiryId: string, topic: string) => {
    try {
      await secureFetch(`${API_BASE}/api/chat/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enquiryId, topic, activity: `Checked: ${topic}` }),
      });
    } catch {
      // Background non-critical tracking
    }
  };

  // Submit registration form
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const nameTrimmed = regName.trim();
    const phoneTrimmed = regPhone.trim();
    const emailTrimmed = regEmail.trim();

    if (!nameTrimmed) {
      setRegError('Please enter your full name');
      return;
    }

    if (!phoneTrimmed || phoneTrimmed.replace(/[^0-9]/g, '').length < 8) {
      setRegError('Please enter a valid 10-digit mobile or WhatsApp number');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      setRegError('Please enter a valid email address');
      return;
    }

    setRegSubmitting(true);
    try {
      const payload = {
        fullName: nameTrimmed,
        email: emailTrimmed,
        phone: phoneTrimmed,
        whatsapp: phoneTrimmed,
        city: regCity.trim() || 'Anantapur',
        country: 'India',
        mainServices: ['AI Chatbot Registration', regInterest],
        serviceInterest: regInterest,
        languageCourse: regInterest.includes('German') ? 'A1-B1 Combo' : '',
        additionalServices: [
          'Clara AI Chatbot Lead',
          regInterest.includes('App') ? 'Lifetime App Access Inquiry' : 'Interactive Chatbot Consultation'
        ],
        intendedDestination: 'Germany',
        message: `[AI Chatbot Registered Lead - Clara]\n• Name: ${nameTrimmed}\n• WhatsApp: ${phoneTrimmed}\n• Email: ${emailTrimmed}\n• Primary Interest: ${regInterest}\n• Location: ${regCity.trim() || 'Anantapur, AP'}\n\n[Chat Activity & Checked Topics]:\n• ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}: User registered via Clara AI Chatbot`
      };

      const res = await secureFetch(`${API_BASE}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Registration failed. Please check your inputs and try again.');
      }

      const data = await res.json();
      const enquiryId = data.id || data.enquiry_id || `HGI-${Math.floor(1000 + Math.random() * 9000)}`;

      const userObj: RegisteredUser = {
        id: enquiryId,
        fullName: nameTrimmed,
        email: emailTrimmed,
        phone: phoneTrimmed,
        interest: regInterest,
        city: regCity.trim() || 'Anantapur'
      };

      try {
        localStorage.setItem('europath_chat_user', JSON.stringify(userObj));
      } catch (e) {
        console.warn('Storage save error:', e);
      }

      setRegisteredUser(userObj);

      const welcomeMsg: Message = {
        id: `reg-success-${Date.now()}`,
        role: 'assistant',
        text: `🎉 Willkommen, ${nameTrimmed}! Your consultation profile is registered (#${enquiryId}).\n\nI have unlocked our full knowledge base for you. You can check our German Language Academy fees (A1–B1 Combo at ₹45,999), Lifetime App Access (+₹1,000–₹5,000), Nurse recruitment, or ask me any question!`,
        ts: Date.now()
      };

      setMessages(prev => [...prev, welcomeMsg]);

      // If user had clicked a quick reply or typed a message before registering, trigger it now!
      if (pendingAction) {
        const actionToRun = pendingAction;
        setPendingAction(null);
        setTimeout(() => {
          sendMessageWithUser(actionToRun, userObj);
        }, 300);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setRegError(msg);
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleSwitchUser = () => {
    localStorage.removeItem('europath_chat_user');
    setRegisteredUser(null);
    setRegName('');
    setRegPhone('');
    setRegEmail('');
    setRegCity('');
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        text: "👋 Hallo! Please register below to start a new consultation session with Clara.",
        ts: Date.now(),
      }
    ]);
  };

  const sendMessageWithUser = async (text: string, user: RegisteredUser) => {
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

    // Track checked action in background database
    logActivity(user.id, trimmed);

    // Provide immediate helpful responses for key topics
    const lower = trimmed.toLowerCase();
    let instantReply: string | null = null;

    if (lower.includes('combo') || lower.includes('fee') || lower.includes('price') || lower.includes('pricing') || lower.includes('cost')) {
      instantReply = "📚 German Language Academy Regular Fees:\n\n• A1 Level: ₹14,999\n• A2 Level: ₹15,999\n• B1 Level: ₹17,999\n• B2 Level: ₹21,999\n\n⭐ Complete German Combo (A1 + A2 + B1):\n₹45,999\n\n📱 Optional Lifetime App Access Add-on:\n• A1: +₹1,000 | A2/B1: +₹3,000 each | B2: +₹5,000\n• Complete Combo (A1–B1): +₹5,000 bundle rate\n\nFlexible weekday and weekend batches available with study materials and Goethe / Telc exam preparation. Would you like our team to reserve your seat?";
    } else if (lower.includes('app') || lower.includes('lifetime') || lower.includes('mobile')) {
      instantReply = "📱 Lifetime German Learning App Access Add-on:\n\nEnjoy 24/7 lifetime access to our self-paced learning portal & mobile app (native audio drills, 5,000+ smart vocabulary flashcards, and official Goethe/Telc mock exams):\n\n• A1 Level: +₹1,000 extra\n• A2 Level: +₹3,000 extra\n• B1 Level: +₹3,000 extra\n• B2 Level: +₹5,000 extra\n• Complete Combo (A1–B1): +₹5,000 bundle rate\n\nYou can select this optional upgrade anytime during course enrolment!";
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
        .filter(m => !m.id.startsWith('welcome'))
        .map(m => ({ role: m.role, content: m.text }));

      const res = await secureFetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history, enquiryId: user.id }),
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

  const sendMessage = (text: string) => {
    if (!registeredUser) {
      // Must intake registration first
      setPendingAction(text);
      setRegError('Please complete your quick registration above so our team can track what you check!');
      regFormRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    sendMessageWithUser(text, registeredUser);
  };

  const handleQuickReplyClick = (reply: string) => {
    if (!registeredUser) {
      setPendingAction(reply);
      // Preselect interest based on quick reply
      if (reply.includes('App')) setRegInterest('📱 German Academy + Lifetime App Access');
      else if (reply.includes('Course') || reply.includes('Combo') || reply.includes('German')) setRegInterest('German Language Courses (A1–B2 & Combo)');
      else if (reply.includes('Nurse')) setRegInterest('🏥 Germany Nurse Pathway & Hospital Placement');
      else if (reply.includes('Visa')) setRegInterest('🎓 Germany Student Visa & Admissions');

      setRegError(`Please register your details below to check "${reply}"`);
      regFormRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    sendMessage(reply);
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
          fixed bottom-24 right-4 sm:right-6 z-50
          w-[calc(100vw-2rem)] sm:w-[420px] max-w-[420px]
          flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200
          transition-all duration-300 origin-bottom-right overflow-hidden
          ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Harry Overseas Clara AI Assistant"
      >
        {/* Header with AI Girl Portrait */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-dark via-slate-900 to-brand-navy text-white border-b border-brand-gold/30">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-full border-2 border-brand-gold overflow-hidden shadow flex-shrink-0 bg-slate-800">
              {!avatarError ? (
                <img
                  src={AI_GIRL_AVATAR}
                  alt="Clara AI Advisor"
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-amber-500 flex items-center justify-center text-lg">
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
              <p className="text-[11px] text-slate-300">Harry Overseas Immigration & Academy</p>
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

        {/* Registered User Status Banner */}
        {registeredUser && (
          <div className="bg-emerald-50 border-b border-emerald-100 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-emerald-800">
            <div className="flex items-center space-x-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="truncate">
                Registered: <strong className="font-semibold">{registeredUser.fullName}</strong> ({registeredUser.id})
              </span>
            </div>
            <button
              onClick={handleSwitchUser}
              className="text-slate-500 hover:text-slate-800 font-semibold underline flex items-center space-x-0.5 ml-2 flex-shrink-0"
              title="Change User / Start Fresh Registration"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Change</span>
            </button>
          </div>
        )}

        {/* Messages Body */}
        <div
          className="overflow-y-auto p-4 space-y-3 bg-slate-50/70"
          style={{ maxHeight: 380, minHeight: 280 }}
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
                  max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm
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

          {/* Mandatory Registration Form Card if Unregistered */}
          {!registeredUser && (
            <div
              ref={regFormRef}
              className="mt-3 bg-white border-2 border-brand-gold/50 rounded-2xl p-4 shadow-md transition-all"
            >
              <div className="flex items-center space-x-2 text-brand-dark mb-2">
                <div className="w-6 h-6 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-dark">
                  <CheckCircle2 className="w-4 h-4 text-brand-gold" />
                </div>
                <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                  Quick Registration (Required to Chat)
                </h5>
              </div>

              <p className="text-[11px] text-slate-500 mb-3">
                Register once to unlock instant fees, lifetime app pricing, and track your inquiry with our counselors.
              </p>

              {regError && (
                <div className="mb-3 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] font-medium">
                  {regError}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      WhatsApp / Mobile *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full text-xs pl-8 pr-2 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="rahul@example.com"
                        className="w-full text-xs pl-8 pr-2 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    What are you looking for? *
                  </label>
                  <select
                    value={regInterest}
                    onChange={e => setRegInterest(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none"
                  >
                    {INTEREST_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Your City (Optional)
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={regCity}
                      onChange={e => setRegCity(e.target.value)}
                      placeholder="e.g. Anantapur / Hyderabad / Bangalore"
                      className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 hover:from-brand-lightGold hover:to-amber-300 text-brand-dark font-bold text-xs shadow transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {regSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Registering with Clara...</span>
                    </>
                  ) : (
                    <>
                      <span>Start Consultation & Unlock Chat</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

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
              onClick={() => handleQuickReplyClick(q)}
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
              placeholder={registeredUser ? "Ask Clara about visas, courses, nursing..." : "Complete registration above to chat..."}
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
