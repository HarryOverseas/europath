import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import LanguageAcademy from './components/LanguageAcademy';
import ArrivalAssistance from './components/ArrivalAssistance';
import EnquiryWizard from './components/EnquiryWizard';
import Careers from './components/Careers';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import LegalFooter from './components/LegalFooter';
import Chatbot from './components/Chatbot';
import { AlertTriangle, Wrench } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'public' | 'careers' | 'admin'>('public');
  const [adminUser, setAdminUser] = useState<{ username: string; role: string } | null>(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Poll or check maintenance status on mount
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.maintenance === 'boolean') {
            setIsMaintenanceMode(data.maintenance);
          }
        }
      } catch (err) {
        // Quiet fail, default to false
      }
    };
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync view state with URL hash on mount & hash changes
  useEffect(() => {
    const syncViewFromHash = () => {
      const hash = (window.location.hash || '').toLowerCase();
      if (hash === '#careers') {
        setCurrentView('careers');
      } else if (hash === '#admin') {
        setCurrentView('admin');
      } else if (hash === '#services' || hash === '#academy' || hash === '#arrival' || hash === '#enquiry') {
        setCurrentView('public');
        const targetId = hash.replace('#', '');
        setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (hash === '' || hash === '#') {
        // If hash cleared back to root, return to public view
        setCurrentView(prev => (prev === 'admin' ? prev : 'public'));
      }
    };

    syncViewFromHash();
    window.addEventListener('hashchange', syncViewFromHash);
    return () => window.removeEventListener('hashchange', syncViewFromHash);
  }, []);

  // Check stored session on mount
  useEffect(() => {
    const session = sessionStorage.getItem('harry_admin_session') || localStorage.getItem('harry_admin_session');
    if (session) {
      try {
        setAdminUser(JSON.parse(session));
      } catch (e) {
        console.error('Failed to parse admin session', e);
      }
    }
  }, []);

  const handleLoginSuccess = (user: { username: string; role: string }) => {
    setAdminUser(user);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('harry_admin_session');
    localStorage.removeItem('harry_admin_session');
    sessionStorage.removeItem('harry_admin_token');
    localStorage.removeItem('harry_admin_token');
    setAdminUser(null);
    setCurrentView('public');
    window.location.hash = '';
  };

  const handleNavigate = (view: 'public' | 'careers' | 'admin', sectionId?: string) => {
    setCurrentView(view);
    if (view === 'careers') {
      window.location.hash = 'careers';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'admin') {
      window.location.hash = 'admin';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (sectionId) {
        window.location.hash = sectionId;
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        window.location.hash = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-brand-gold selection:text-white">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isAdminAuthenticated={!!adminUser}
        onLogout={handleLogout}
      />

      {/* Global Maintenance Banner when PORTAL_MAINTENANCE_MODE is active */}
      {isMaintenanceMode && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs sm:text-sm font-semibold py-2.5 px-4 shadow-sm border-b border-amber-800 flex items-center justify-center space-x-2.5 sticky top-0 z-50 animate-fade-in">
          <Wrench className="w-4 h-4 animate-pulse shrink-0" />
          <span>
            <strong>Scheduled System Maintenance:</strong> Online enquiry & candidate application submissions are temporarily in read-only / maintenance mode. For urgent consultations, please contact us directly on WhatsApp (+91 6302951891).
          </span>
        </div>
      )}

      {currentView === 'public' && (
        <main className="flex-grow">
          <Hero />
          <Services />
          <LanguageAcademy />
          <ArrivalAssistance />
          <EnquiryWizard />
        </main>
      )}

      {currentView === 'careers' && (
        <main className="flex-grow">
          <Careers />
        </main>
      )}

      {currentView === 'admin' && (
        <main className="flex-grow">
          {adminUser ? (
            <AdminDashboard adminUser={adminUser} onLogout={handleLogout} />
          ) : (
            <AdminLogin
              onLoginSuccess={handleLoginSuccess}
              onCancel={() => {
                setCurrentView('public');
                window.location.hash = '';
              }}
            />
          )}
        </main>
      )}

      <LegalFooter onNavigate={handleNavigate} />
      <Chatbot />
    </div>
  );
}
