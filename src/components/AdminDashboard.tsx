import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  RefreshCw,
  Trash2,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Users,
  FileText,
  ExternalLink,
  Clock,
  Sparkles,
  AlertCircle,
  X,
  Eye,
  GraduationCap
} from 'lucide-react';

interface AdminDashboardProps {
  adminUser?: { username: string; role: string } | null;
  onLogout?: () => void;
}

interface Enquiry {
  id: string;
  full_name?: string;
  fullName?: string;
  mobile?: string;
  phone?: string;
  whatsapp?: string;
  email: string;
  city?: string;
  country?: string;
  main_services?: string[] | string;
  mainServices?: string[] | string;
  service_interest?: string;
  language_course?: string;
  languageCourse?: string;
  additional_services?: string[] | string;
  additionalServices?: string[] | string;
  intended_destination?: string;
  intendedDestination?: string;
  travel_period?: string;
  travelPeriod?: string;
  consultation_method?: string;
  consultationMethod?: string;
  additional_reqs?: string;
  additionalReqs?: string;
  message?: string;
  status: string;
  created_at?: string;
  createdAt?: string;
}

interface JobApplication {
  id: number | string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  resume_link?: string;
  notes?: string;
  status: 'New' | 'Reviewing' | 'Shortlisted' | 'Interviewed' | 'Hired' | 'Rejected' | string;
  created_at?: string;
}

const CANDIDATE_ROLES = [
  'All Roles',
  'German Language Trainer',
  'Visa Consultant',
  'Student Counselor',
  'Relocation Coordinator'
];

const CANDIDATE_STATUSES = [
  'All',
  'New',
  'Reviewing',
  'Shortlisted',
  'Interviewed',
  'Hired',
  'Rejected'
];

const ENQUIRY_STATUSES = ['All', 'New', 'Contacted', 'In Progress', 'Closed'];

export default function AdminDashboard({ adminUser, onLogout }: AdminDashboardProps) {
  // Navigation tab: 'enquiries' | 'applications'
  const [activeTab, setActiveTab] = useState<'enquiries' | 'applications'>('enquiries');

  // Enquiries state
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState('All');
  const [enquirySearchTerm, setEnquirySearchTerm] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);

  // Job Applications state
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [appRoleFilter, setAppRoleFilter] = useState('All Roles');
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [loadingApps, setLoadingApps] = useState(true);

  // Status feedback toast
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Helper to obtain stored JWT bearer token
  const getAuthToken = (): string => {
    return sessionStorage.getItem('harry_admin_token') || localStorage.getItem('harry_admin_token') || '';
  };

  // Session termination helper on 401/403
  const handleAuthError = () => {
    sessionStorage.removeItem('harry_admin_token');
    localStorage.removeItem('harry_admin_token');
    sessionStorage.removeItem('harry_admin_session');
    localStorage.removeItem('harry_admin_session');
    if (onLogout) {
      onLogout();
    }
  };

  // Initial data loading
  useEffect(() => {
    loadEnquiries();
    loadApplications();
  }, []);

  // --- ENQUIRIES API CALLS ---
  const loadEnquiries = async () => {
    setLoadingEnquiries(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/enquiries', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401 || res.status === 403) {
        handleAuthError();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.enquiries || []);
        setEnquiries(list);
        try {
          localStorage.setItem('harry_global_enquiries', JSON.stringify(list));
        } catch (e) {}
      } else {
        fallbackLoadEnquiries();
      }
    } catch (e) {
      console.warn('Network error or server offline. Reading enquiries from local storage:', e);
      fallbackLoadEnquiries();
    } finally {
      setLoadingEnquiries(false);
    }
  };

  const fallbackLoadEnquiries = () => {
    try {
      const local = localStorage.getItem('harry_global_enquiries');
      if (local) {
        setEnquiries(JSON.parse(local));
      }
    } catch (e) {
      console.error('Failed reading local enquiries:', e);
    }
  };

  const updateEnquiryStatus = async (id: string, newStatus: string) => {
    // Optimistic update
    setEnquiries(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, status: newStatus } : e);
      try { localStorage.setItem('harry_global_enquiries', JSON.stringify(updated)); } catch (err) {}
      return updated;
    });

    if (selectedEnquiry && selectedEnquiry.id === id) {
      setSelectedEnquiry(prev => prev ? { ...prev, status: newStatus } : null);
    }

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/enquiries/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.status === 401 || res.status === 403) {
        handleAuthError();
        return;
      }

      if (res.ok) {
        showNotice(`Enquiry ${id} updated to "${newStatus}"`);
      }
    } catch (e) {
      console.warn('Network error updating enquiry status on server, kept in local state:', e);
      showNotice(`Enquiry ${id} updated locally`);
    }
  };

  const deleteEnquiry = async (id: string) => {
    if (!confirm(`Are you sure you want to delete enquiry ${id}?`)) {
      return;
    }

    setEnquiries(prev => {
      const updated = prev.filter(e => e.id !== id);
      try { localStorage.setItem('harry_global_enquiries', JSON.stringify(updated)); } catch (err) {}
      return updated;
    });

    if (selectedEnquiry && selectedEnquiry.id === id) {
      setSelectedEnquiry(null);
    }

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/enquiries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401 || res.status === 403) {
        handleAuthError();
        return;
      }

      if (res.ok) {
        showNotice(`Enquiry ${id} deleted`);
      }
    } catch (e) {
      console.warn('Network error deleting enquiry on server:', e);
    }
  };

  // --- JOB APPLICATIONS API CALLS ---
  const loadApplications = async () => {
    setLoadingApps(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401 || res.status === 403) {
        handleAuthError();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const list = data.applications || (Array.isArray(data) ? data : []);
        setApplications(list);
        try {
          localStorage.setItem('harry_global_job_applications', JSON.stringify(list));
        } catch (e) {}
      } else {
        fallbackLoadApplications();
      }
    } catch (e) {
      console.warn('Network error or server offline. Reading applications from local storage:', e);
      fallbackLoadApplications();
    } finally {
      setLoadingApps(false);
    }
  };

  const fallbackLoadApplications = () => {
    try {
      const local = localStorage.getItem('harry_global_job_applications');
      if (local) {
        setApplications(JSON.parse(local));
      }
    } catch (e) {
      console.error('Failed reading local job applications:', e);
    }
  };

  const updateApplicationStatus = async (id: number | string, newStatus: string) => {
    // Optimistic state update
    setApplications(prev => {
      const updated = prev.map(a => String(a.id) === String(id) ? { ...a, status: newStatus } : a);
      try { localStorage.setItem('harry_global_job_applications', JSON.stringify(updated)); } catch (err) {}
      return updated;
    });

    if (selectedApplication && String(selectedApplication.id) === String(id)) {
      setSelectedApplication(prev => prev ? { ...prev, status: newStatus } : null);
    }

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/applications/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.status === 401 || res.status === 403) {
        handleAuthError();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.application) {
          setApplications(prev => prev.map(a => String(a.id) === String(id) ? { ...a, ...data.application } : a));
        }
        showNotice(`Candidate status updated to "${newStatus}"`);
      }
    } catch (e) {
      console.warn('Network error updating application status on server, kept in local state:', e);
      showNotice(`Candidate status updated locally`);
    }
  };

  const deleteApplication = async (id: number | string) => {
    if (!confirm('Are you sure you want to delete this job application? This action cannot be undone.')) {
      return;
    }

    setApplications(prev => {
      const updated = prev.filter(a => String(a.id) !== String(id));
      try { localStorage.setItem('harry_global_job_applications', JSON.stringify(updated)); } catch (err) {}
      return updated;
    });

    if (selectedApplication && String(selectedApplication.id) === String(id)) {
      setSelectedApplication(null);
    }

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401 || res.status === 403) {
        handleAuthError();
        return;
      }

      if (res.ok) {
        showNotice('Application deleted successfully');
      }
    } catch (e) {
      console.warn('Network error deleting application on server:', e);
    }
  };

  // --- FILTERING & COMPUTATIONS ---
  const filteredEnquiries = enquiries.filter(e => {
    const matchStatus = enquiryStatusFilter === 'All' || e.status === enquiryStatusFilter;
    const search = enquirySearchTerm.trim().toLowerCase();
    const matchSearch = !search ||
      (e.full_name && e.full_name.toLowerCase().includes(search)) ||
      (e.fullName && e.fullName.toLowerCase().includes(search)) ||
      (e.mobile && e.mobile.includes(search)) ||
      (e.email && e.email.toLowerCase().includes(search)) ||
      (e.id && e.id.toLowerCase().includes(search));
    return matchStatus && matchSearch;
  });

  const filteredApplications = applications.filter(app => {
    const matchRole = appRoleFilter === 'All Roles' || app.role.toLowerCase() === appRoleFilter.toLowerCase();
    const matchStatus = appStatusFilter === 'All' || app.status.toLowerCase() === appStatusFilter.toLowerCase();
    const search = appSearchTerm.trim().toLowerCase();
    const matchSearch = !search ||
      (app.full_name && app.full_name.toLowerCase().includes(search)) ||
      (app.email && app.email.toLowerCase().includes(search)) ||
      (app.phone && app.phone.toLowerCase().includes(search)) ||
      (app.role && app.role.toLowerCase().includes(search)) ||
      (app.notes && app.notes.toLowerCase().includes(search)) ||
      String(app.id).toLowerCase().includes(search);
    return matchRole && matchStatus && matchSearch;
  });

  // KPI Metrics for Job Applications
  const totalCandidates = applications.length;
  const countNew = applications.filter(a => a.status === 'New').length;
  const countReviewing = applications.filter(a => a.status === 'Reviewing').length;
  const countShortlisted = applications.filter(a => a.status === 'Shortlisted').length;
  const countInterviewed = applications.filter(a => a.status === 'Interviewed').length;
  const countHired = applications.filter(a => a.status === 'Hired').length;

  // Role badge color helper
  const getRoleBadgeColor = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('language') || r.includes('german') || r.includes('trainer')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (r.includes('visa') || r.includes('immigration')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (r.includes('counselor') || r.includes('student')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (r.includes('relocation') || r.includes('arrival')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  // Status badge color helper
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Reviewing':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Shortlisted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Interviewed':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Hired':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Contacted':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'In Progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Closed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'enquiries') {
      loadEnquiries();
    } else {
      loadApplications();
    }
  };

  return (
    <div className="py-10 bg-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Status Toast Notice */}
        {actionNotice && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-brand-gold/40 flex items-center space-x-2 text-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-slate-300">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-brand-gold text-brand-dark text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Staff Portal
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>JWT Authenticated</span>
              </span>
              {adminUser && (
                <span className="text-xs font-medium text-slate-600 flex items-center space-x-1 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                  <UserCheck className="w-3.5 h-3.5 text-brand-navy" />
                  <span>{adminUser.username} ({adminUser.role})</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              EuroPath Operations Dashboard
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Cross-Border Immigration Services & European Recruitment Management (Anantapur & Germany)
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 flex items-center space-x-2 shadow-sm transition"
              title="Refresh current view"
            >
              <RefreshCw className={`w-4 h-4 text-brand-navy ${loadingEnquiries || loadingApps ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2.5 rounded-xl text-sm font-semibold border border-rose-200 flex items-center space-x-1.5 shadow-sm transition"
                title="Log out of Staff Portal"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabbed Navigation Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2 bg-slate-200/80 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => {
                setActiveTab('enquiries');
                setSelectedApplication(null);
              }}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
                activeTab === 'enquiries'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageCircle className="w-4 h-4 text-brand-navy" />
              <span>Customer Enquiries</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'enquiries' ? 'bg-brand-navy/10 text-brand-navy' : 'bg-slate-300/70 text-slate-600'
              }`}>
                {enquiries.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('applications');
                setSelectedEnquiry(null);
              }}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
                activeTab === 'applications'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4 text-brand-gold" />
              <span>Job Applications</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'applications' ? 'bg-amber-100 text-amber-800' : 'bg-slate-300/70 text-slate-600'
              }`}>
                {applications.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {activeTab === 'enquiries' 
              ? `Showing ${filteredEnquiries.length} of ${enquiries.length} enquiries`
              : `Showing ${filteredApplications.length} of ${applications.length} candidates`}
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: CUSTOMER ENQUIRIES VIEW                           */}
        {/* ======================================================== */}
        {activeTab === 'enquiries' && (
          <div>
            {/* Enquiry Filters & Search */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={enquirySearchTerm}
                  onChange={e => setEnquirySearchTerm(e.target.value)}
                  placeholder="Search by name, phone, email or ID..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                {ENQUIRY_STATUSES.map(status => (
                  <button
                    key={status}
                    onClick={() => setEnquiryStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      enquiryStatusFilter === status
                        ? 'bg-brand-navy text-white shadow'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status} ({status === 'All' ? enquiries.length : enquiries.filter(e => e.status === status).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Enquiries Table & Detail View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Enquiries Table */}
              <div className={`${selectedEnquiry ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all duration-300`}>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="p-4">Ref ID / Name</th>
                          <th className="p-4">Contact</th>
                          <th className="p-4">Services</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {loadingEnquiries ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500">
                              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-navy" />
                              Loading enquiries from database...
                            </td>
                          </tr>
                        ) : filteredEnquiries.length > 0 ? filteredEnquiries.map(enq => (
                          <tr
                            key={enq.id}
                            onClick={() => setSelectedEnquiry(enq)}
                            className={`cursor-pointer transition hover:bg-slate-50 ${
                              selectedEnquiry?.id === enq.id ? 'bg-brand-navy/5' : ''
                            }`}
                          >
                            <td className="p-4">
                              <span className="font-mono text-xs font-bold text-brand-navy block">{enq.id}</span>
                              <span className="font-bold text-slate-900">{enq.full_name || enq.fullName}</span>
                              <span className="text-xs text-slate-400 block">{enq.created_at || enq.createdAt}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-xs font-medium text-slate-700 block">{enq.mobile || enq.phone}</span>
                              <span className="text-xs text-slate-500">{enq.email}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {(Array.isArray(enq.main_services || enq.mainServices)
                                  ? (enq.main_services || enq.mainServices as string[])
                                  : [String(enq.main_services || enq.mainServices || '')]
                                ).filter(Boolean).slice(0, 2).map((s: string) => (
                                  <span key={s} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(enq.status)}`}>
                                {enq.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEnquiry(enq);
                                }}
                                className="text-brand-navy hover:text-brand-dark text-xs font-semibold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500">
                              No customer enquiries matching your filter criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Enquiry Detail Panel */}
              {selectedEnquiry && (
                <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                      <div>
                        <span className="text-xs font-mono font-bold text-brand-navy">{selectedEnquiry.id}</span>
                        <h3 className="text-xl font-bold text-slate-900">{selectedEnquiry.full_name || selectedEnquiry.fullName}</h3>
                      </div>
                      <button
                        onClick={() => setSelectedEnquiry(null)}
                        className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1 hover:bg-slate-100 rounded-lg transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-slate-400 block">Mobile</span>
                          <a href={`tel:${selectedEnquiry.mobile || selectedEnquiry.phone}`} className="font-semibold text-brand-navy hover:underline">
                            {selectedEnquiry.mobile || selectedEnquiry.phone}
                          </a>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 block">WhatsApp</span>
                          <a
                            href={`https://wa.me/${(selectedEnquiry.whatsapp || selectedEnquiry.mobile || '').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-emerald-700 hover:underline flex items-center space-x-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </a>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-slate-400 block">Email Address</span>
                        <a href={`mailto:${selectedEnquiry.email}`} className="font-semibold text-brand-navy hover:underline">
                          {selectedEnquiry.email}
                        </a>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-slate-400 block">Location</span>
                          <span className="font-semibold text-slate-800">
                            {selectedEnquiry.city || 'Anantapur'}, {selectedEnquiry.country || 'India'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 block">Destination & Intake</span>
                          <span className="font-semibold text-slate-800">
                            {selectedEnquiry.intended_destination || selectedEnquiry.intendedDestination || 'Germany'} ({selectedEnquiry.travel_period || selectedEnquiry.travelPeriod || '2026'})
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-slate-400 block mb-1">Selected Main Services</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(selectedEnquiry.main_services || selectedEnquiry.mainServices)
                            ? (selectedEnquiry.main_services || selectedEnquiry.mainServices as string[])
                            : [String(selectedEnquiry.main_services || selectedEnquiry.mainServices || '')]
                          ).filter(Boolean).map((s: string) => (
                            <span key={s} className="bg-brand-navy/10 text-brand-navy text-xs font-semibold px-2.5 py-1 rounded-md">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {(selectedEnquiry.language_course || selectedEnquiry.languageCourse) && (
                        <div>
                          <span className="text-xs text-slate-400 block mb-1">German Language Course</span>
                          <span className="font-semibold text-slate-800 text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md inline-block">
                            German {selectedEnquiry.language_course || selectedEnquiry.languageCourse}
                          </span>
                        </div>
                      )}

                      {(selectedEnquiry.additional_reqs || selectedEnquiry.additionalReqs || selectedEnquiry.message) && (
                        <div>
                          <span className="text-xs text-slate-400 block">Additional Notes</span>
                          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-1 whitespace-pre-wrap">
                            {selectedEnquiry.additional_reqs || selectedEnquiry.additionalReqs || selectedEnquiry.message}
                          </p>
                        </div>
                      )}

                      {/* Status Update Controls */}
                      <div className="pt-4 border-t border-slate-200">
                        <label className="block text-xs font-semibold text-slate-700 mb-2">Update Enquiry Status</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['New', 'Contacted', 'In Progress', 'Closed'].map(st => (
                            <button
                              key={st}
                              onClick={() => updateEnquiryStatus(selectedEnquiry.id, st)}
                              className={`py-2 rounded-xl text-xs font-semibold transition ${
                                selectedEnquiry.status === st
                                  ? 'bg-brand-dark text-white shadow'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between">
                    <button
                      onClick={() => deleteEnquiry(selectedEnquiry.id)}
                      className="text-red-600 hover:text-red-700 text-xs font-semibold flex items-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Enquiry</span>
                    </button>
                    <span className="text-xs text-slate-400">
                      Created: {selectedEnquiry.created_at || selectedEnquiry.createdAt}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: JOB APPLICATIONS VIEW                             */}
        {/* ======================================================== */}
        {activeTab === 'applications' && (
          <div>
            {/* Top KPI Metrics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
              {/* Total Candidates */}
              <div 
                onClick={() => { setAppStatusFilter('All'); setAppRoleFilter('All Roles'); }}
                className={`cursor-pointer rounded-2xl p-4 border transition shadow-sm ${
                  appStatusFilter === 'All' ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold opacity-75">Total Applicants</span>
                  <Users className="w-4 h-4 text-brand-gold" />
                </div>
                <div className="text-2xl font-extrabold tracking-tight">{totalCandidates}</div>
                <span className="text-[11px] opacity-70">All submissions</span>
              </div>

              {/* New */}
              <div 
                onClick={() => setAppStatusFilter('New')}
                className={`cursor-pointer rounded-2xl p-4 border transition shadow-sm ${
                  appStatusFilter === 'New' ? 'bg-sky-600 text-white border-sky-700' : 'bg-white text-slate-800 border-slate-200 hover:border-sky-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold opacity-75">New</span>
                  <Sparkles className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-extrabold tracking-tight">{countNew}</div>
                <span className="text-[11px] opacity-70">Awaiting review</span>
              </div>

              {/* Reviewing */}
              <div 
                onClick={() => setAppStatusFilter('Reviewing')}
                className={`cursor-pointer rounded-2xl p-4 border transition shadow-sm ${
                  appStatusFilter === 'Reviewing' ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold opacity-75">Reviewing</span>
                  <Eye className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold tracking-tight">{countReviewing}</div>
                <span className="text-[11px] opacity-70">Under evaluation</span>
              </div>

              {/* Shortlisted */}
              <div 
                onClick={() => setAppStatusFilter('Shortlisted')}
                className={`cursor-pointer rounded-2xl p-4 border transition shadow-sm ${
                  appStatusFilter === 'Shortlisted' ? 'bg-purple-600 text-white border-purple-700' : 'bg-white text-slate-800 border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold opacity-75">Shortlisted</span>
                  <CheckCircle2 className="w-4 h-4 text-purple-300" />
                </div>
                <div className="text-2xl font-extrabold tracking-tight">{countShortlisted}</div>
                <span className="text-[11px] opacity-70">Ready for interview</span>
              </div>

              {/* Interviewed */}
              <div 
                onClick={() => setAppStatusFilter('Interviewed')}
                className={`cursor-pointer rounded-2xl p-4 border transition shadow-sm ${
                  appStatusFilter === 'Interviewed' ? 'bg-cyan-600 text-white border-cyan-700' : 'bg-white text-slate-800 border-slate-200 hover:border-cyan-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold opacity-75">Interviewed</span>
                  <Calendar className="w-4 h-4 text-cyan-300" />
                </div>
                <div className="text-2xl font-extrabold tracking-tight">{countInterviewed}</div>
                <span className="text-[11px] opacity-70">Completed rounds</span>
              </div>

              {/* Hired */}
              <div 
                onClick={() => setAppStatusFilter('Hired')}
                className={`cursor-pointer rounded-2xl p-4 border transition shadow-sm ${
                  appStatusFilter === 'Hired' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold opacity-75">Hired</span>
                  <GraduationCap className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="text-2xl font-extrabold tracking-tight">{countHired}</div>
                <span className="text-[11px] opacity-70">Recruited staff</span>
              </div>
            </div>

            {/* Candidate Filters & Search */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-8 space-y-4">
              {/* Row 1: Search & Role Filters */}
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative w-full lg:w-96">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={appSearchTerm}
                    onChange={e => setAppSearchTerm(e.target.value)}
                    placeholder="Search candidate name, email, phone, role, notes..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
                  />
                </div>

                {/* Role Pills */}
                <div className="flex items-center space-x-1.5 w-full lg:w-auto overflow-x-auto pb-1">
                  {CANDIDATE_ROLES.map(role => (
                    <button
                      key={role}
                      onClick={() => setAppRoleFilter(role)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                        appRoleFilter === role
                          ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {role} {role !== 'All Roles' && `(${applications.filter(a => a.role === role).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Status Pills */}
              <div className="flex items-center space-x-2 overflow-x-auto pt-2 border-t border-slate-100 pb-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                  Status:
                </span>
                {CANDIDATE_STATUSES.map(st => (
                  <button
                    key={st}
                    onClick={() => setAppStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                      appStatusFilter === st
                        ? 'bg-slate-800 text-white border-slate-800 shadow'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st} {st !== 'All' && `(${applications.filter(a => a.status === st).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Applications Table & Detail Drawer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Table List */}
              <div className={`${selectedApplication ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all duration-300`}>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="p-4">Candidate / ID</th>
                          <th className="p-4">Role</th>
                          <th className="p-4">Contact</th>
                          <th className="p-4">Resume</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {loadingApps ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500">
                              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-gold" />
                              Loading job applications...
                            </td>
                          </tr>
                        ) : filteredApplications.length > 0 ? filteredApplications.map(app => (
                          <tr
                            key={app.id}
                            onClick={() => setSelectedApplication(app)}
                            className={`cursor-pointer transition hover:bg-slate-50 ${
                              selectedApplication?.id === app.id ? 'bg-brand-gold/5' : ''
                            }`}
                          >
                            <td className="p-4">
                              <span className="font-mono text-xs font-bold text-slate-400 block">#{app.id}</span>
                              <span className="font-bold text-slate-900 block">{app.full_name}</span>
                              <span className="text-xs text-slate-400 block">
                                {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Recent'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(app.role)}`}>
                                {app.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="text-xs font-medium text-slate-700 block">{app.phone}</span>
                              <span className="text-xs text-slate-500 block">{app.email}</span>
                              <div className="flex items-center space-x-2 mt-1">
                                <a
                                  href={`tel:${app.phone}`}
                                  onClick={e => e.stopPropagation()}
                                  title="Direct phone call"
                                  className="text-[11px] text-brand-navy hover:underline flex items-center space-x-0.5"
                                >
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>Call</span>
                                </a>
                                <span className="text-slate-300">•</span>
                                <a
                                  href={`https://wa.me/${app.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  title="WhatsApp Chat"
                                  className="text-[11px] text-emerald-600 hover:underline flex items-center space-x-0.5"
                                >
                                  <MessageCircle className="w-3 h-3 text-emerald-500" />
                                  <span>WhatsApp</span>
                                </a>
                              </div>
                            </td>
                            <td className="p-4">
                              {app.resume_link ? (
                                <a
                                  href={app.resume_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="inline-flex items-center space-x-1 text-xs text-brand-navy font-semibold hover:underline bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Resume</span>
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400 italic">None</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(app.status)}`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end space-x-1.5" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => setSelectedApplication(app)}
                                  className="text-brand-navy hover:text-brand-dark text-xs font-semibold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                                >
                                  Inspect
                                </button>
                                <button
                                  onClick={() => deleteApplication(app.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete candidate"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500">
                              No candidate applications found matching the selected filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Candidate Details Drawer / Inspection Panel */}
              {selectedApplication && (
                <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between pb-4 border-b border-slate-200 mb-6">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono text-xs font-bold text-slate-400">#{selectedApplication.id}</span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgeColor(selectedApplication.status)}`}>
                            {selectedApplication.status}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{selectedApplication.full_name}</h3>
                        <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getRoleBadgeColor(selectedApplication.role)}`}>
                          {selectedApplication.role}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedApplication(null)}
                        className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1 hover:bg-slate-100 rounded-lg transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Candidate Details Content */}
                    <div className="space-y-4 text-sm">
                      {/* Contact Card */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-medium">Direct Phone</span>
                          <div className="flex items-center space-x-2">
                            <a
                              href={`tel:${selectedApplication.phone}`}
                              className="text-xs font-semibold text-brand-navy hover:underline flex items-center space-x-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{selectedApplication.phone}</span>
                            </a>
                            <a
                              href={`https://wa.me/${selectedApplication.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2 py-0.5 rounded flex items-center space-x-1 transition"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <span className="text-xs text-slate-500 font-medium">Email Address</span>
                          <a
                            href={`mailto:${selectedApplication.email}`}
                            className="text-xs font-semibold text-brand-navy hover:underline flex items-center space-x-1"
                          >
                            <Mail className="w-3 h-3" />
                            <span>{selectedApplication.email}</span>
                          </a>
                        </div>
                      </div>

                      {/* Resume / Portfolio Link */}
                      <div>
                        <span className="text-xs text-slate-500 font-semibold block mb-1">
                          Resume / Professional Portfolio Link
                        </span>
                        {selectedApplication.resume_link ? (
                          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div className="truncate mr-2">
                              <span className="text-xs text-slate-700 truncate block font-mono">
                                {selectedApplication.resume_link}
                              </span>
                            </div>
                            <a
                              href={selectedApplication.resume_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 bg-brand-navy hover:bg-brand-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-sm transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open</span>
                            </a>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                            No external resume link was provided by candidate.
                          </p>
                        )}
                      </div>

                      {/* Candidate Notes / Experience / Cover Letter */}
                      <div>
                        <span className="text-xs text-slate-500 font-semibold block mb-1">
                          Candidate Notes / Teaching & Immigration Experience
                        </span>
                        <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                          {selectedApplication.notes || 'No additional notes provided.'}
                        </div>
                      </div>

                      {/* Status Update Lifecycle Controls */}
                      <div className="pt-4 border-t border-slate-200">
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Candidate Status Lifecycle
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['New', 'Reviewing', 'Shortlisted', 'Interviewed', 'Hired', 'Rejected'].map(st => (
                            <button
                              key={st}
                              onClick={() => updateApplicationStatus(selectedApplication.id, st)}
                              className={`py-2 rounded-xl text-xs font-bold transition border ${
                                selectedApplication.status === st
                                  ? 'bg-brand-dark text-white border-brand-dark shadow'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between">
                    <button
                      onClick={() => deleteApplication(selectedApplication.id)}
                      className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center space-x-1 p-1 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Application</span>
                    </button>
                    <span className="text-xs text-slate-400">
                      Applied: {selectedApplication.created_at ? new Date(selectedApplication.created_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
