import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle
} from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (user: { username: string; role: string }) => void;
  onCancel: () => void;
}

export default function AdminLogin({ onLoginSuccess, onCancel }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUsername = username.trim();
    const cleanPassword = password;

    if (!cleanUsername || !cleanPassword) {
      setErrorMessage('Please enter both username/email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: cleanUsername,
          password: cleanPassword
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success && data.token) {
        // Authentic JWT token and session storage
        if (rememberMe) {
          localStorage.setItem('harry_admin_token', data.token);
          localStorage.setItem('harry_admin_session', JSON.stringify(data.user));
          sessionStorage.removeItem('harry_admin_token');
          sessionStorage.removeItem('harry_admin_session');
        } else {
          sessionStorage.setItem('harry_admin_token', data.token);
          sessionStorage.setItem('harry_admin_session', JSON.stringify(data.user));
          localStorage.removeItem('harry_admin_token');
          localStorage.removeItem('harry_admin_session');
        }

        onLoginSuccess(data.user);
      } else {
        setErrorMessage(data.error || 'Invalid username or password. Please verify credentials.');
      }
    } catch (err: any) {
      console.error('Authentication request error:', err);
      setErrorMessage('Unable to reach the authentication service. Please check your connection or server status.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-900/95 relative overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-brand-navy/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-brand-gold/10 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">

        {/* Brand & Security Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-navy to-brand-dark border border-brand-gold/40 shadow-xl mb-4 relative">
            <ShieldCheck className="w-9 h-9 text-brand-gold" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Harry Global Staff Portal
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            Cross-Border Immigration & Enquiries Management
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-800/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/80">
          
          {/* Security Banner */}
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-700/60 text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <Lock className="w-4 h-4 text-brand-gold" />
              <span className="font-semibold">Secure Admin Access</span>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium">
              Encrypted API
            </span>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-start space-x-2.5 text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username or email"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-brand-gold focus:ring-brand-gold h-4 w-4"
                />
                <span>Remember this device</span>
              </label>
              <span className="text-slate-500 text-xs">Role: Staff / Admin</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-brand-gold to-amber-500 hover:from-brand-lightGold hover:to-amber-400 text-brand-dark font-bold py-3 px-4 rounded-xl text-sm shadow-lg shadow-brand-gold/10 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Staff Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Back to public website button */}
        <div className="mt-6 text-center">
          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-brand-gold transition underline underline-offset-4"
          >
            ← Back to Public Website
          </button>
        </div>

      </div>
    </div>
  );
}
