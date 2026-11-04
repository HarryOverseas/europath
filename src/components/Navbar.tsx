import React, { useState } from 'react';
import { Globe, Phone, Mail, Menu, X, ShieldCheck, Lock, Unlock, LogOut } from 'lucide-react';

interface NavbarProps {
  currentView: 'public' | 'careers' | 'admin';
  setCurrentView: (view: 'public' | 'careers' | 'admin') => void;
  isAdminAuthenticated?: boolean;
  onLogout?: () => void;
}

export default function Navbar({ 
  currentView, 
  setCurrentView, 
  isAdminAuthenticated = false, 
  onLogout 
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (currentView !== 'public') {
      setCurrentView('public');
      window.location.hash = id;
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.location.hash = id;
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navigateToCareers = () => {
    setMobileMenuOpen(false);
    setCurrentView('careers');
    window.location.hash = 'careers';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPublicHome = () => {
    setMobileMenuOpen(false);
    setCurrentView('public');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 bg-brand-dark text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={navigateToPublicHome}>
            <div className="w-12 h-12 rounded-full bg-brand-gold flex items-center justify-center text-brand-dark shadow-inner">
              <Globe className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">Harry Overseas</span>
              <span className="text-xs text-brand-gold tracking-widest uppercase font-semibold">Immigration & Language</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <button onClick={() => scrollToSection('services')} className="hover:text-brand-gold transition">
              Immigration Services
            </button>
            <button onClick={() => scrollToSection('academy')} className="hover:text-brand-gold transition">
              German Academy
            </button>
            <button onClick={() => scrollToSection('arrival')} className="hover:text-brand-gold transition">
              Arrival Assistance
            </button>
            <button onClick={() => scrollToSection('enquiry')} className="hover:text-brand-gold transition">
              Enquiry Form
            </button>
            <button
              onClick={navigateToCareers}
              className={`hover:text-brand-gold transition font-medium flex items-center space-x-1.5 ${
                currentView === 'careers' ? 'text-brand-gold font-bold' : 'text-slate-200'
              }`}
            >
              <span>Careers</span>
              <span className="bg-brand-gold/20 text-brand-gold text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                Hiring
              </span>
            </button>
          </nav>

          {/* Right CTA & Admin Switch */}
          <div className="hidden md:flex items-center space-x-3">
            <a
              href="https://wa.me/916302951891?text=Hello%20Harry%20Global%20Immigration,%20I%20would%20like%20to%20enquire%20about%20Germany%20visas."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center space-x-2 shadow transition"
            >
              <span>WhatsApp Us</span>
            </a>

            <button
              onClick={() => {
                if (currentView === 'admin') {
                  setCurrentView('public');
                  window.location.hash = '';
                } else {
                  setCurrentView('admin');
                  window.location.hash = 'admin';
                }
              }}
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-1.5 border transition ${
                isAdminAuthenticated
                  ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Staff Administration Dashboard"
            >
              {isAdminAuthenticated ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-brand-gold" />
              )}
              <span>
                {currentView === 'admin' 
                  ? 'Public Site' 
                  : (isAdminAuthenticated ? 'Staff Portal (Active)' : 'Staff Portal')}
              </span>
            </button>

            {isAdminAuthenticated && onLogout && currentView === 'admin' && (
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 p-2 rounded-lg text-xs transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => {
                if (currentView === 'admin') {
                  setCurrentView('public');
                  window.location.hash = '';
                } else {
                  setCurrentView('admin');
                  window.location.hash = 'admin';
                }
              }}
              className={`px-2.5 py-1.5 rounded text-xs font-medium border ${
                isAdminAuthenticated
                  ? 'bg-emerald-950/80 border-emerald-600/70 text-emerald-300'
                  : 'bg-slate-800 text-brand-gold border-slate-700'
              }`}
            >
              {currentView === 'admin' ? 'Site' : (isAdminAuthenticated ? 'Staff ✓' : 'Staff')}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-300 hover:text-white p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-brand-dark border-t border-slate-800 px-4 pt-3 pb-5 space-y-3">
          <button
            onClick={() => scrollToSection('services')}
            className="block w-full text-left py-2 text-slate-300 hover:text-brand-gold font-medium"
          >
            Immigration Services
          </button>
          <button
            onClick={() => scrollToSection('academy')}
            className="block w-full text-left py-2 text-slate-300 hover:text-brand-gold font-medium"
          >
            German Academy
          </button>
          <button
            onClick={() => scrollToSection('arrival')}
            className="block w-full text-left py-2 text-slate-300 hover:text-brand-gold font-medium"
          >
            Arrival Assistance
          </button>
          <button
            onClick={() => scrollToSection('enquiry')}
            className="block w-full text-left py-2 text-slate-300 hover:text-brand-gold font-medium"
          >
            Enquiry Form
          </button>
          <button
            onClick={navigateToCareers}
            className={`block w-full text-left py-2 font-medium flex items-center justify-between ${
              currentView === 'careers' ? 'text-brand-gold font-bold' : 'text-slate-300 hover:text-brand-gold'
            }`}
          >
            <span>Careers & Vacancies</span>
            <span className="bg-brand-gold/20 text-brand-gold text-[10px] px-2 py-0.5 rounded-full font-bold">
              We're Hiring
            </span>
          </button>
          <div className="pt-2 space-y-2">
            <a
              href="https://wa.me/916302951891?text=Hello%20Harry%20Global%20Immigration,%20I%20would%20like%20to%20enquire%20about%20Germany%20visas."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 shadow"
            >
              <span>WhatsApp Us (+91 6302951891)</span>
            </a>

            {isAdminAuthenticated && onLogout && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of Staff Portal</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
