import React, { useState, useEffect } from 'react';
import { secureFetch } from '../utils/secureApi';
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
  GraduationCap,
  Archive,
  Database,
  RotateCcw,
  Settings,
  UserPlus,
  Key,
  Lock,
  Sliders,
  Check,
  Server,
  Edit,
  FolderOpen,
  Plus,
  History,
  Link,
  FileCheck,
  Power,
  ShieldAlert
} from 'lucide-react';

interface AdminDashboardProps {
  adminUser?: { username: string; role: string; permissions?: string[] } | null;
  onLogout?: () => void;
}

interface UserAccount {
  id: number;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  created_at: string;
}

interface SystemConfigItem {
  key: string;
  value: string;
  hasValue: boolean;
  category: string;
  description: string;
  is_secret: boolean;
  updated_at: string;
  updated_by: string;
}

export interface LeadDocument {
  id: string;
  name: string;
  category?: string;
  required?: boolean;
  status: 'Pending' | 'Provided' | 'Verified' | 'Rejected' | string;
  drive_link?: string;
  notes?: string;
  updated_at?: string;
}

export interface StageHistoryEntry {
  id: string;
  from_status: string | null;
  to_status: string;
  comment: string;
  changed_by: string;
  changed_at: string;
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
  destination_country?: string;
  travel_period?: string;
  travelPeriod?: string;
  consultation_method?: string;
  consultationMethod?: string;
  additional_reqs?: string;
  additionalReqs?: string;
  message?: string;
  status: string;
  documents?: LeadDocument[];
  stage_history?: StageHistoryEntry[];
  is_deleted?: boolean;
  deleted_at?: string;
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
  stage_history?: StageHistoryEntry[];
  is_deleted?: boolean;
  deleted_at?: string;
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
  // Role & Permission Checks
  const isSuperAdmin = adminUser?.role === 'Super Admin';
  const userPerms = adminUser?.permissions || (isSuperAdmin ? ['*'] : []);

  const hasPerm = (perm: string) => {
    if (isSuperAdmin || userPerms.includes('*')) return true;
    return userPerms.includes(perm);
  };

  const canViewEnquiries = hasPerm('enquiries:read');
  const canViewApplications = hasPerm('applications:read');
  const canViewArchives = hasPerm('archive:read');
  const canManageUsers = isSuperAdmin || hasPerm('users:manage');
  const canManageSettings = isSuperAdmin || hasPerm('settings:manage');

  const defaultTab = canViewEnquiries ? 'enquiries' : (canViewApplications ? 'applications' : (canManageUsers ? 'users' : 'settings'));
  const [activeTab, setActiveTab] = useState<'enquiries' | 'applications' | 'archives' | 'users' | 'settings'>(defaultTab as any);

  // User Management state (Super Admin)
  const [userList, setUserList] = useState<UserAccount[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Counselor');
  const [newUserPerms, setNewUserPerms] = useState<string[]>(['enquiries:read', 'enquiries:write']);
  const [creatingUser, setCreatingUser] = useState(false);

  // Dynamic System Configs state (Super Admin)
  const [configsList, setConfigsList] = useState<SystemConfigItem[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});
  const [savingConfigs, setSavingConfigs] = useState(false);
  const [smtpDiagnostics, setSmtpDiagnostics] = useState<any>(null);
  const [testingSmtp, setTestingSmtp] = useState(false);

  // Archival state
  const [archivalStats, setArchivalStats] = useState<{
    totalArchivedEnquiries: number;
    totalArchivedApplications: number;
    lastExecution: any;
    recentLogs: any[];
  } | null>(null);
  const [archivedEnquiries, setArchivedEnquiries] = useState<any[]>([]);
  const [archivedApplications, setArchivedApplications] = useState<any[]>([]);
  const [archivalSubTab, setArchivalSubTab] = useState<'overview' | 'enquiries' | 'applications'>('overview');
  const [runningArchival, setRunningArchival] = useState(false);
  const [loadingArchives, setLoadingArchives] = useState(false);

  // Enquiries state
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState('All');
  const [enquirySearchTerm, setEnquirySearchTerm] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);

  // Active sub-tab inside selected Enquiry detail drawer
  const [enquiryDetailTab, setEnquiryDetailTab] = useState<'info' | 'documents' | 'history'>('info');

  // Lead Editing State
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [leadEditForm, setLeadEditForm] = useState<{
    full_name: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    service_interest: string;
    language_course: string;
    destination_country: string;
    travel_period: string;
    consultation_method: string;
    message: string;
  }>({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    service_interest: '',
    language_course: '',
    destination_country: '',
    travel_period: '',
    consultation_method: '',
    message: ''
  });
  const [savingLeadEdit, setSavingLeadEdit] = useState(false);

  // Document Editing State
  const [leadDocs, setLeadDocs] = useState<LeadDocument[]>([]);
  const [savingDocs, setSavingDocs] = useState(false);
  const [newCustomDocName, setNewCustomDocName] = useState('');
  const [newCustomDocCategory, setNewCustomDocCategory] = useState('Custom / Other');

  // Stage Transition Modal State (Mandatory comment enforcement)
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [stageTargetType, setStageTargetType] = useState<'enquiry' | 'application'>('enquiry');
  const [stageTargetId, setStageTargetId] = useState<string | number>('');
  const [stageTargetName, setStageTargetName] = useState('');
  const [stagePrevStatus, setStagePrevStatus] = useState('');
  const [stageNewStatus, setStageNewStatus] = useState('');
  const [stageComment, setStageComment] = useState('');
  const [submittingStageChange, setSubmittingStageChange] = useState(false);

  // Candidate detail tab
  const [appDetailTab, setAppDetailTab] = useState<'info' | 'history'>('info');

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
    if (canViewEnquiries) {
      loadEnquiries();
    }
    if (canViewApplications) {
      loadApplications();
    }
    if (canManageUsers) {
      loadUsers();
    }
    if (canManageSettings) {
      loadConfigs();
    }
  }, []);

  // Update default permissions when changing new user role in form
  const handleRoleSelectionChange = (newRole: string) => {
    setNewUserRole(newRole);
    switch (newRole) {
      case 'Super Admin':
        setNewUserPerms(['*']);
        break;
      case 'Operations Manager':
        setNewUserPerms(['enquiries:read', 'enquiries:write', 'applications:read', 'applications:write', 'archive:read']);
        break;
      case 'Counselor':
        setNewUserPerms(['enquiries:read', 'enquiries:write']);
        break;
      case 'Recruiter':
        setNewUserPerms(['applications:read', 'applications:write']);
        break;
      case 'Auditor':
      case 'Viewer':
        setNewUserPerms(['enquiries:read', 'applications:read', 'archive:read']);
        break;
      default:
        setNewUserPerms(['enquiries:read']);
    }
  };

  const togglePermission = (perm: string) => {
    if (newUserPerms.includes('*')) {
      setNewUserPerms([perm]);
      return;
    }
    if (newUserPerms.includes(perm)) {
      setNewUserPerms(newUserPerms.filter(p => p !== perm));
    } else {
      setNewUserPerms([...newUserPerms, perm]);
    }
  };

  // --- USERS MANAGEMENT (SUPER ADMIN) ---
  const loadUsers = async () => {
    setLoadingUsers(true);
    const token = getAuthToken();
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserUsername.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      showNotice('Please provide username, email, and password.');
      return;
    }
    setCreatingUser(true);
    const token = getAuthToken();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUserUsername.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role: newUserRole,
          permissions: newUserPerms
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotice(`User '${newUserUsername}' created with role '${newUserRole}'`);
        setNewUserUsername('');
        setNewUserEmail('');
        setNewUserPassword('');
        handleRoleSelectionChange('Counselor');
        loadUsers();
      } else {
        showNotice(`Failed to create user: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      showNotice(`Error creating user: ${err.message}`);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete staff account '${username}'?`)) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showNotice(`User '${username}' deleted.`);
        loadUsers();
      } else {
        showNotice(data.error || 'Failed to delete user');
      }
    } catch (err: any) {
      showNotice(`Error deleting user: ${err.message}`);
    }
  };

  // --- SYSTEM CONFIGURATIONS (DATABASE BACKED) ---
  const loadConfigs = async () => {
    setLoadingConfigs(true);
    const token = getAuthToken();
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const settings = data.settings || [];
        setConfigsList(settings);
        const formObj: Record<string, string> = {};
        for (const s of settings) {
          formObj[s.key] = s.is_secret && s.hasValue ? '' : s.value;
        }
        setConfigForm(formObj);
      }
    } catch (err) {
      console.warn('Failed to load configs:', err);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfigs(true);
    const token = getAuthToken();
    try {
      const payload: Record<string, string> = {};
      for (const [k, v] of Object.entries(configForm)) {
        if (v !== undefined && v !== null && v.trim() !== '') {
          payload[k] = v.trim();
        }
      }

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ settings: payload })
      });
      const data = await res.json();
      if (res.ok) {
        showNotice('Settings saved directly to database. Active immediately without restart!');
        if (data.settings) {
          setConfigsList(data.settings);
        }
      } else {
        showNotice(data.error || 'Failed to save settings');
      }
    } catch (err: any) {
      showNotice(`Error saving settings: ${err.message}`);
    } finally {
      setSavingConfigs(false);
    }
  };

  const handleTestSmtpLive = async () => {
    setTestingSmtp(true);
    setSmtpDiagnostics(null);
    const token = getAuthToken();
    try {
      const res = await fetch('/api/admin/settings/test-smtp', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.results) {
        setSmtpDiagnostics(data.results);
        const infoOk = data.results.info?.connected;
        const supportOk = data.results.support?.connected;
        if (infoOk && supportOk) {
          showNotice('All Multi-Inbox SMTP connections verified successfully!');
        } else {
          showNotice(`SMTP Diagnostics: Info: ${infoOk ? 'OK' : 'Error'}, Support: ${supportOk ? 'OK' : 'Error'}`);
        }
      }
    } catch (err: any) {
      showNotice(`Test failed: ${err.message}`);
    } finally {
      setTestingSmtp(false);
    }
  };

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

  // Open stage change modal (enforces comment requirement)
  const initiateStageChange = (
    type: 'enquiry' | 'application',
    id: string | number,
    name: string,
    currentStatus: string,
    targetStatus: string
  ) => {
    if (currentStatus === targetStatus) return;
    setStageTargetType(type);
    setStageTargetId(id);
    setStageTargetName(name);
    setStagePrevStatus(currentStatus);
    setStageNewStatus(targetStatus);
    setStageComment('');
    setStageModalOpen(true);
  };

  const handleConfirmStageChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageComment.trim()) {
      showNotice('Please enter a comment. A comment is strictly required to change stages.');
      return;
    }
    setSubmittingStageChange(true);
    const token = getAuthToken();

    try {
      if (stageTargetType === 'enquiry') {
        const res = await secureFetch(`/api/enquiries/${stageTargetId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: stageNewStatus, comment: stageComment.trim() })
        });
        const data = await res.json();
        if (res.ok) {
          showNotice(`Enquiry #${stageTargetId} stage updated to "${stageNewStatus}"`);
          if (data.enquiry) {
            setEnquiries(prev => prev.map(enq => enq.id === stageTargetId ? { ...enq, ...data.enquiry } : enq));
            if (selectedEnquiry && selectedEnquiry.id === stageTargetId) {
              setSelectedEnquiry(data.enquiry);
            }
          } else {
            loadEnquiries();
          }
          setStageModalOpen(false);
        } else {
          showNotice(data.error || 'Failed to update enquiry status');
        }
      } else {
        const res = await secureFetch(`/api/applications/${stageTargetId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: stageNewStatus, comment: stageComment.trim() })
        });
        const data = await res.json();
        if (res.ok) {
          showNotice(`Candidate #${stageTargetId} stage updated to "${stageNewStatus}"`);
          if (data.application) {
            setApplications(prev => prev.map(a => String(a.id) === String(stageTargetId) ? { ...a, ...data.application } : a));
            if (selectedApplication && String(selectedApplication.id) === String(stageTargetId)) {
              setSelectedApplication(data.application);
            }
          } else {
            loadApplications();
          }
          setStageModalOpen(false);
        } else {
          showNotice(data.error || 'Failed to update application status');
        }
      }
    } catch (err: any) {
      showNotice(`Error updating status: ${err.message}`);
    } finally {
      setSubmittingStageChange(false);
    }
  };

  // Helper to open edit lead form
  const handleStartEditLead = (lead: Enquiry) => {
    setLeadEditForm({
      full_name: lead.full_name || lead.fullName || '',
      email: lead.email || '',
      phone: lead.mobile || lead.phone || '',
      city: lead.city || 'Anantapur',
      country: lead.country || 'India',
      service_interest: lead.service_interest || (Array.isArray(lead.main_services) ? lead.main_services.join(', ') : String(lead.main_services || '')),
      language_course: lead.language_course || lead.languageCourse || '',
      destination_country: lead.destination_country || lead.intended_destination || lead.intendedDestination || 'Germany',
      travel_period: lead.travel_period || lead.travelPeriod || 'Immediate',
      consultation_method: lead.consultation_method || lead.consultationMethod || 'WhatsApp',
      message: lead.message || lead.additional_reqs || lead.additionalReqs || ''
    });
    setIsEditingLead(true);
  };

  const handleSaveLeadEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    setSavingLeadEdit(true);
    const token = getAuthToken();

    try {
      const res = await secureFetch(`/api/enquiries/${selectedEnquiry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(leadEditForm)
      });
      const data = await res.json();
      if (res.ok && data.enquiry) {
        showNotice(`Lead details saved for #${selectedEnquiry.id}`);
        setEnquiries(prev => prev.map(enq => enq.id === selectedEnquiry.id ? { ...enq, ...data.enquiry } : enq));
        setSelectedEnquiry(data.enquiry);
        setIsEditingLead(false);
      } else {
        showNotice(data.error || 'Failed to save lead details');
      }
    } catch (err: any) {
      showNotice(`Error saving lead: ${err.message}`);
    } finally {
      setSavingLeadEdit(false);
    }
  };

  // Synchronize document checklist state when selected enquiry changes
  useEffect(() => {
    if (selectedEnquiry) {
      const docs = selectedEnquiry.documents || [];
      setLeadDocs(Array.isArray(docs) ? docs : []);
    } else {
      setLeadDocs([]);
      setIsEditingLead(false);
    }
  }, [selectedEnquiry?.id]);

  // Document item mutation helpers
  const handleUpdateDocField = (docId: string, field: keyof LeadDocument, value: any) => {
    setLeadDocs(prev => prev.map(doc => doc.id === docId ? { ...doc, [field]: value } : doc));
  };

  const handleAddCustomDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomDocName.trim()) {
      showNotice('Please enter document title');
      return;
    }
    const newDoc: LeadDocument = {
      id: `custom-doc-${Date.now()}`,
      name: newCustomDocName.trim(),
      category: newCustomDocCategory.trim() || 'Custom / Extra',
      required: false,
      status: 'Pending',
      drive_link: '',
      notes: ''
    };
    setLeadDocs(prev => [...prev, newDoc]);
    setNewCustomDocName('');
    showNotice(`Added "${newDoc.name}" to document list. Remember to click "Save Documents".`);
  };

  const handleRemoveDoc = (docId: string) => {
    setLeadDocs(prev => prev.filter(d => d.id !== docId));
  };

  const handleSaveDocuments = async () => {
    if (!selectedEnquiry) return;
    setSavingDocs(true);
    const token = getAuthToken();

    try {
      const res = await secureFetch(`/api/enquiries/${selectedEnquiry.id}/documents`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ documents: leadDocs })
      });
      const data = await res.json();
      if (res.ok) {
        showNotice(`Documents updated for lead #${selectedEnquiry.id}`);
        setEnquiries(prev => prev.map(enq => enq.id === selectedEnquiry.id ? { ...enq, documents: leadDocs } : enq));
        setSelectedEnquiry(prev => prev ? { ...prev, documents: leadDocs } : null);
      } else {
        showNotice(data.error || 'Failed to save documents');
      }
    } catch (err: any) {
      showNotice(`Error saving documents: ${err.message}`);
    } finally {
      setSavingDocs(false);
    }
  };

  const deleteEnquiry = async (id: string) => {
    if (!confirm(`Move enquiry #${id} to Trash (soft delete)? You can restore it anytime.`)) {
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
        showNotice(`Enquiry #${id} moved to Trash`);
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

  const deleteApplication = async (id: number | string) => {
    if (!confirm(`Move candidate application #${id} to Trash (soft delete)? You can restore it anytime.`)) {
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
        showNotice(`Candidate #${id} moved to Trash`);
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

  const loadArchivalData = async () => {
    setLoadingArchives(true);
    const token = getAuthToken();
    try {
      const [statsRes, enqRes, appRes] = await Promise.all([
        fetch('/api/admin/archive/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/archive/enquiries', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/archive/applications', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (statsRes.ok) {
        const d = await statsRes.json();
        setArchivalStats(d.stats);
      }
      if (enqRes.ok) {
        const d = await enqRes.json();
        setArchivedEnquiries(d.enquiries || []);
      }
      if (appRes.ok) {
        const d = await appRes.json();
        setArchivedApplications(d.applications || []);
      }
    } catch (err) {
      console.warn('Error loading archival data:', err);
    } finally {
      setLoadingArchives(false);
    }
  };

  const triggerManualArchival = async () => {
    if (runningArchival) return;
    setRunningArchival(true);
    const token = getAuthToken();
    try {
      const res = await fetch('/api/admin/archive/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ daysThreshold: 90 })
      });
      const data = await res.json();
      if (res.ok) {
        showNotice(`Archival completed! Enquiries: ${data.result.enquiriesArchived}, Candidates: ${data.result.applicationsArchived}`);
        await loadArchivalData();
        await loadEnquiries();
        await loadApplications();
      } else {
        showNotice(`Archival failed: ${data.error || 'Server error'}`);
      }
    } catch (e: any) {
      showNotice(`Network error running archival: ${e.message}`);
    } finally {
      setRunningArchival(false);
    }
  };

  const handleRestoreEnquiry = async (id: string) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/admin/archive/restore/enquiry/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showNotice(`Enquiry #${id} restored to active enquiries`);
        await loadArchivalData();
        await loadEnquiries();
      }
    } catch {
      showNotice('Failed to restore enquiry');
    }
  };

  const handleRestoreApplication = async (id: number | string) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/admin/archive/restore/application/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showNotice(`Candidate #${id} restored to active applications`);
        await loadArchivalData();
        await loadApplications();
      }
    } catch {
      showNotice('Failed to restore application');
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'enquiries') {
      loadEnquiries();
    } else if (activeTab === 'applications') {
      loadApplications();
    } else if (activeTab === 'archives') {
      loadArchivalData();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'settings') {
      loadConfigs();
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
              Harry Overseas Operations Dashboard
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
          <div className="flex flex-wrap items-center gap-2 bg-slate-200/80 p-1.5 rounded-2xl w-fit">
            {canViewEnquiries && (
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
            )}

            {canViewApplications && (
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
            )}

            {canViewArchives && (
              <button
                onClick={() => {
                  setActiveTab('archives');
                  setSelectedEnquiry(null);
                  setSelectedApplication(null);
                  loadArchivalData();
                }}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
                  activeTab === 'archives'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Archive className="w-4 h-4 text-emerald-600" />
                <span>Data Archive</span>
                {archivalStats && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === 'archives' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-300/70 text-slate-600'
                  }`}>
                    {archivalStats.totalArchivedEnquiries + archivalStats.totalArchivedApplications}
                  </span>
                )}
              </button>
            )}

            {canManageUsers && (
              <button
                onClick={() => {
                  setActiveTab('users');
                  setSelectedEnquiry(null);
                  setSelectedApplication(null);
                  loadUsers();
                }}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
                  activeTab === 'users'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Team & Access (RBAC)</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === 'users' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-300/70 text-slate-600'
                }`}>
                  {userList.length}
                </span>
              </button>
            )}

            {canManageSettings && (
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setSelectedEnquiry(null);
                  setSelectedApplication(null);
                  loadConfigs();
                }}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
                  activeTab === 'settings'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4 text-brand-navy" />
                <span>System Configs</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {activeTab === 'enquiries' 
              ? `Showing ${filteredEnquiries.length} of ${enquiries.length} enquiries`
              : activeTab === 'applications'
                ? `Showing ${filteredApplications.length} of ${applications.length} candidates`
                : `Cold Storage: ${archivalStats ? (archivalStats.totalArchivedEnquiries + archivalStats.totalArchivedApplications) : 0} archived records`}
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
                    {/* Header with Title and Tabs */}
                    <div className="flex items-start justify-between pb-3 border-b border-slate-200 mb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-brand-navy">{selectedEnquiry.id}</span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeColor(selectedEnquiry.status)}`}>
                            {selectedEnquiry.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedEnquiry.full_name || selectedEnquiry.fullName}</h3>
                      </div>
                      <div className="flex items-center space-x-1">
                        {!isEditingLead && (
                          <button
                            onClick={() => handleStartEditLead(selectedEnquiry)}
                            className="text-brand-navy hover:text-brand-dark p-1.5 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                            title="Edit Lead Information"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedEnquiry(null);
                            setIsEditingLead(false);
                          }}
                          className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1 hover:bg-slate-100 rounded-lg transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-tab navigation: Info vs Documents vs History */}
                    <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
                      <button
                        onClick={() => { setEnquiryDetailTab('info'); setIsEditingLead(false); }}
                        className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1 ${
                          enquiryDetailTab === 'info' && !isEditingLead
                            ? 'bg-white text-brand-navy shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Lead Info</span>
                      </button>
                      <button
                        onClick={() => { setEnquiryDetailTab('documents'); setIsEditingLead(false); }}
                        className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1 ${
                          enquiryDetailTab === 'documents'
                            ? 'bg-white text-brand-navy shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Docs & Drive ({leadDocs.length})</span>
                      </button>
                      <button
                        onClick={() => { setEnquiryDetailTab('history'); setIsEditingLead(false); }}
                        className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1 ${
                          enquiryDetailTab === 'history'
                            ? 'bg-white text-brand-navy shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Stage History ({selectedEnquiry.stage_history?.length || 0})</span>
                      </button>
                    </div>

                    {/* EDIT LEAD MODAL / FORM */}
                    {isEditingLead ? (
                      <form onSubmit={handleSaveLeadEdit} className="space-y-3 text-xs">
                        <div className="bg-amber-50 text-amber-900 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
                          <span className="font-semibold">Editing Lead Details</span>
                          <button
                            type="button"
                            onClick={() => setIsEditingLead(false)}
                            className="text-amber-700 hover:underline font-bold"
                          >
                            Cancel
                          </button>
                        </div>

                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={leadEditForm.full_name}
                            onChange={e => setLeadEditForm({ ...leadEditForm, full_name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Email *</label>
                            <input
                              type="email"
                              required
                              value={leadEditForm.email}
                              onChange={e => setLeadEditForm({ ...leadEditForm, email: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Phone / WhatsApp *</label>
                            <input
                              type="text"
                              required
                              value={leadEditForm.phone}
                              onChange={e => setLeadEditForm({ ...leadEditForm, phone: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">City</label>
                            <input
                              type="text"
                              value={leadEditForm.city}
                              onChange={e => setLeadEditForm({ ...leadEditForm, city: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Country</label>
                            <input
                              type="text"
                              value={leadEditForm.country}
                              onChange={e => setLeadEditForm({ ...leadEditForm, country: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Service Interest / Pathway</label>
                          <input
                            type="text"
                            value={leadEditForm.service_interest}
                            onChange={e => setLeadEditForm({ ...leadEditForm, service_interest: e.target.value })}
                            placeholder="e.g., Student Visa, German Language Classes, Nursing Pathway"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Language Level</label>
                            <input
                              type="text"
                              value={leadEditForm.language_course}
                              onChange={e => setLeadEditForm({ ...leadEditForm, language_course: e.target.value })}
                              placeholder="e.g., A1, A2, B1, B2"
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Intended Destination</label>
                            <input
                              type="text"
                              value={leadEditForm.destination_country}
                              onChange={e => setLeadEditForm({ ...leadEditForm, destination_country: e.target.value })}
                              placeholder="e.g., Germany"
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Target Intake / Period</label>
                            <input
                              type="text"
                              value={leadEditForm.travel_period}
                              onChange={e => setLeadEditForm({ ...leadEditForm, travel_period: e.target.value })}
                              placeholder="e.g., Winter 2026, Immediate"
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Consultation Preference</label>
                            <select
                              value={leadEditForm.consultation_method}
                              onChange={e => setLeadEditForm({ ...leadEditForm, consultation_method: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                            >
                              <option value="WhatsApp">WhatsApp</option>
                              <option value="Phone Call">Phone Call</option>
                              <option value="Google Meet">Google Meet</option>
                              <option value="In-Person Office">In-Person Office</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Notes & Requirements</label>
                          <textarea
                            rows={3}
                            value={leadEditForm.message}
                            onChange={e => setLeadEditForm({ ...leadEditForm, message: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                          />
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                          <button
                            type="submit"
                            disabled={savingLeadEdit}
                            className="flex-1 bg-brand-navy hover:bg-brand-dark text-white font-bold py-2 rounded-xl transition shadow"
                          >
                            {savingLeadEdit ? 'Saving...' : 'Save Lead Changes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingLead(false)}
                            className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : enquiryDetailTab === 'info' ? (
                      /* TAB A: STANDARD LEAD INFO */
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
                              {selectedEnquiry.destination_country || selectedEnquiry.intended_destination || selectedEnquiry.intendedDestination || 'Germany'} ({selectedEnquiry.travel_period || selectedEnquiry.travelPeriod || 'Immediate'})
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs text-slate-400 block mb-1">Selected Main Services</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(Array.isArray(selectedEnquiry.main_services || selectedEnquiry.mainServices)
                              ? (selectedEnquiry.main_services || selectedEnquiry.mainServices as string[])
                              : [String(selectedEnquiry.service_interest || selectedEnquiry.main_services || selectedEnquiry.mainServices || '')]
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

                        {/* Status Update Controls with Mandatory Comment Popup */}
                        <div className="pt-4 border-t border-slate-200">
                          <label className="block text-xs font-semibold text-slate-700 mb-2">
                            Update Lead Stage (Requires Comment)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {['New', 'Contacted', 'In Progress', 'Closed'].map(st => (
                              <button
                                key={st}
                                onClick={() => initiateStageChange(
                                  'enquiry',
                                  selectedEnquiry.id,
                                  selectedEnquiry.full_name || selectedEnquiry.fullName || selectedEnquiry.id,
                                  selectedEnquiry.status,
                                  st
                                )}
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
                    ) : enquiryDetailTab === 'documents' ? (
                      /* TAB B: DIGITAL DOCUMENT CHECKLIST & GOOGLE/ONE DRIVE LINKS */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">Digital Document Checklist</h4>
                            <p className="text-[11px] text-slate-500">
                              Direct cloud links (Google Drive, OneDrive). No local storage needed.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleSaveDocuments}
                            disabled={savingDocs}
                            className="bg-brand-navy hover:bg-brand-dark text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm"
                          >
                            {savingDocs ? 'Saving...' : 'Save Documents'}
                          </button>
                        </div>

                        {/* Document List */}
                        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                          {leadDocs.map((doc, idx) => (
                            <div key={doc.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-bold text-slate-800">{doc.name}</span>
                                    {doc.required && (
                                      <span className="text-[10px] bg-rose-100 text-rose-700 font-semibold px-1.5 py-0.2 rounded">
                                        Mandatory
                                      </span>
                                    )}
                                    {doc.category && (
                                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                                        {doc.category}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <select
                                    value={doc.status || 'Pending'}
                                    onChange={e => handleUpdateDocField(doc.id, 'status', e.target.value)}
                                    className={`text-[11px] font-bold rounded-lg px-2 py-1 border focus:outline-none ${
                                      doc.status === 'Verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                      doc.status === 'Provided' ? 'bg-sky-100 text-sky-800 border-sky-300' :
                                      doc.status === 'Rejected' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                                      'bg-amber-100 text-amber-800 border-amber-300'
                                    }`}
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Provided">Provided</option>
                                    <option value="Verified">Verified</option>
                                    <option value="Rejected">Rejected</option>
                                  </select>
                                  {!doc.required && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDoc(doc.id)}
                                      className="text-slate-400 hover:text-rose-600 p-1"
                                      title="Remove document requirement"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Drive link input */}
                              <div className="flex items-center space-x-2">
                                <div className="relative flex-1">
                                  <Link className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                                  <input
                                    type="url"
                                    placeholder="OneDrive / Google Drive Shareable Link..."
                                    value={doc.drive_link || ''}
                                    onChange={e => handleUpdateDocField(doc.id, 'drive_link', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2 py-1 text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                                  />
                                </div>
                                {doc.drive_link ? (
                                  <a
                                    href={doc.drive_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-brand-navy hover:bg-brand-dark text-white text-xs px-2.5 py-1 rounded-lg flex items-center space-x-1 shrink-0"
                                    title="Open Document in Cloud Drive"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Open</span>
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic shrink-0">No Link</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Custom Document Form */}
                        <form onSubmit={handleAddCustomDoc} className="bg-slate-100 p-3 rounded-xl border border-slate-200 space-y-2">
                          <span className="text-xs font-bold text-slate-700 block">Add Custom / Extra Document</span>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="Document Title (e.g. Birth Certificate, Marriage Cert)..."
                              value={newCustomDocName}
                              onChange={e => setNewCustomDocName(e.target.value)}
                              className="col-span-2 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-navy"
                            />
                            <input
                              type="text"
                              placeholder="Category (e.g. Civil, Financial)"
                              value={newCustomDocCategory}
                              onChange={e => setNewCustomDocCategory(e.target.value)}
                              className="col-span-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-navy"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center space-x-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Document Slot</span>
                          </button>
                        </form>
                      </div>
                    ) : (
                      /* TAB C: AUDIT TRAIL / HISTORICAL STAGE CHANGES */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <h4 className="text-xs font-bold text-slate-800">Historical Stage Change Log</h4>
                          <span className="text-[11px] text-slate-500">
                            Strict audit log with required transition comments
                          </span>
                        </div>

                        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                          {selectedEnquiry.stage_history && selectedEnquiry.stage_history.length > 0 ? (
                            selectedEnquiry.stage_history.map((entry, idx) => (
                              <div key={entry.id || idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1.5 font-bold">
                                    {entry.from_status ? (
                                      <>
                                        <span className="text-slate-500">{entry.from_status}</span>
                                        <span className="text-slate-400">→</span>
                                        <span className="text-brand-navy">{entry.to_status}</span>
                                      </>
                                    ) : (
                                      <span className="text-brand-navy">{entry.to_status} (Initial)</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {entry.changed_at ? new Date(entry.changed_at).toLocaleString() : 'N/A'}
                                  </span>
                                </div>
                                <p className="text-slate-700 bg-white p-2 rounded border border-slate-100 whitespace-pre-wrap">
                                  "{entry.comment}"
                                </p>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  Recorded by: <span className="text-slate-600 font-semibold">{entry.changed_by || 'Staff'}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-slate-400 text-xs">
                              No prior stage transitions recorded.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-6 border-t border-slate-200 flex items-center justify-between">
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

                    {/* Candidate Sub-tab navigation: Info vs Stage History */}
                    <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
                      <button
                        onClick={() => setAppDetailTab('info')}
                        className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1 ${
                          appDetailTab === 'info'
                            ? 'bg-white text-brand-navy shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Profile & CV</span>
                      </button>
                      <button
                        onClick={() => setAppDetailTab('history')}
                        className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1 ${
                          appDetailTab === 'history'
                            ? 'bg-white text-brand-navy shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Stage History ({selectedApplication.stage_history?.length || 0})</span>
                      </button>
                    </div>

                    {appDetailTab === 'info' ? (
                      /* Candidate Details Content */
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

                        {/* Status Update Lifecycle Controls with Mandatory Comment Popup */}
                        <div className="pt-4 border-t border-slate-200">
                          <label className="block text-xs font-semibold text-slate-700 mb-2">
                            Candidate Status Lifecycle (Requires Comment)
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {['New', 'Reviewing', 'Shortlisted', 'Interviewed', 'Hired', 'Rejected'].map(st => (
                              <button
                                key={st}
                                onClick={() => initiateStageChange(
                                  'application',
                                  selectedApplication.id,
                                  selectedApplication.full_name,
                                  selectedApplication.status,
                                  st
                                )}
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
                    ) : (
                      /* Candidate Stage History */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <h4 className="text-xs font-bold text-slate-800">Candidate Stage Change Audit</h4>
                          <span className="text-[11px] text-slate-500">All status transitions</span>
                        </div>

                        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                          {selectedApplication.stage_history && selectedApplication.stage_history.length > 0 ? (
                            selectedApplication.stage_history.map((entry, idx) => (
                              <div key={entry.id || idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1.5 font-bold">
                                    <span className="text-slate-500">{entry.from_status || 'Initial'}</span>
                                    <span className="text-slate-400">→</span>
                                    <span className="text-brand-navy">{entry.to_status}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {entry.changed_at ? new Date(entry.changed_at).toLocaleString() : 'N/A'}
                                  </span>
                                </div>
                                <p className="text-slate-700 bg-white p-2 rounded border border-slate-100 whitespace-pre-wrap">
                                  "{entry.comment}"
                                </p>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  Staff reviewer: <span className="text-slate-600 font-semibold">{entry.changed_by || 'HR'}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-slate-400 text-xs">
                              No prior stage transitions recorded.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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

        {/* ======================================================== */}
        {/* TAB 3: DATA ARCHIVE VIEW (90+ DAYS RETENTION)            */}
        {/* ======================================================== */}
        {activeTab === 'archives' && (
          <div className="space-y-6">
            {/* Top Archival Policy Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Daily Automated Archival Active
                    </span>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      Retention Policy: 90 Days
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    Automated Data Archival & Cold Storage
                  </h3>
                  <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                    Customer enquiries and job candidate records older than 90 days are automatically migrated from active operational tables into historical archive tables daily at 02:00 AM off-peak. Backups are exported as immutable JSON snapshots in the <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">/archives</code> filesystem directory.
                  </p>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0">
                  <button
                    onClick={loadArchivalData}
                    disabled={loadingArchives}
                    className="p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
                    title="Refresh Archive Data"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingArchives ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={triggerManualArchival}
                    disabled={runningArchival}
                    className="bg-brand-navy hover:bg-brand-dark text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition flex items-center space-x-2 disabled:opacity-50"
                  >
                    {runningArchival ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-gold" />
                        <span>Running Archival...</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-3.5 h-3.5 text-brand-gold" />
                        <span>Run 90-Day Archival Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* KPI Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">Archived Enquiries</span>
                    <MessageCircle className="w-4 h-4 text-brand-navy" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {archivalStats?.totalArchivedEnquiries ?? 0}
                  </div>
                  <span className="text-[11px] text-slate-500">Records &gt; 90 days old</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">Archived Candidates</span>
                    <Briefcase className="w-4 h-4 text-brand-gold" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {archivalStats?.totalArchivedApplications ?? 0}
                  </div>
                  <span className="text-[11px] text-slate-500">Past job applications</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">Last Execution</span>
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-2 truncate">
                    {archivalStats?.lastExecution ? new Date(archivalStats.lastExecution.executed_at).toLocaleString() : 'Pending'}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    {archivalStats?.lastExecution?.status || 'Scheduled at 02:00 AM'}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">Storage Engine</span>
                    <Database className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-2">
                    PostgreSQL + JSON
                  </div>
                  <span className="text-[11px] text-slate-500">Disk snapshots in /archives</span>
                </div>
              </div>
            </div>

            {/* Sub-Tabs for Archive View */}
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setArchivalSubTab('overview')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  archivalSubTab === 'overview'
                    ? 'bg-brand-navy text-white shadow'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                Execution Audit Logs ({archivalStats?.recentLogs?.length || 0})
              </button>

              <button
                onClick={() => setArchivalSubTab('enquiries')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  archivalSubTab === 'enquiries'
                    ? 'bg-brand-navy text-white shadow'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                Archived Enquiries ({archivedEnquiries.length})
              </button>

              <button
                onClick={() => setArchivalSubTab('applications')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  archivalSubTab === 'applications'
                    ? 'bg-brand-navy text-white shadow'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                Archived Candidates ({archivedApplications.length})
              </button>
            </div>

            {/* SUB-VIEW 1: AUDIT LOGS */}
            {archivalSubTab === 'overview' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-800">
                  Recent Archival Executions & Audit Trail
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-4">Execution Time</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Retention Threshold</th>
                        <th className="p-4">Enquiries Moved</th>
                        <th className="p-4">Candidates Moved</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {archivalStats?.recentLogs && archivalStats.recentLogs.length > 0 ? (
                        archivalStats.recentLogs.map((log: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="p-4 font-mono font-semibold text-slate-700">
                              {new Date(log.executed_at).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full font-bold ${
                                log.execution_type === 'automated' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {log.execution_type}
                              </span>
                            </td>
                            <td className="p-4 text-slate-600 font-semibold">{log.days_threshold} Days</td>
                            <td className="p-4 font-bold text-slate-800">{log.enquiries_archived}</td>
                            <td className="p-4 font-bold text-slate-800">{log.applications_archived}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full font-bold ${
                                log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 max-w-xs truncate" title={log.details}>
                              {log.details || 'Archived per policy'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            No archival runs recorded yet. Click "Run 90-Day Archival Now" to execute.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: ARCHIVED ENQUIRIES */}
            {archivalSubTab === 'enquiries' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">Archived Enquiries ({archivedEnquiries.length})</span>
                  <span className="text-xs text-slate-400">Records older than 90 days</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">Client Name</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Service Interest</th>
                        <th className="p-4">Original Date</th>
                        <th className="p-4">Archived At</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {archivedEnquiries.length > 0 ? (
                        archivedEnquiries.map((enq: any) => (
                          <tr key={enq.id} className="hover:bg-slate-50/80">
                            <td className="p-4 font-mono font-bold text-brand-navy">{enq.id}</td>
                            <td className="p-4 font-bold text-slate-900">{enq.full_name}</td>
                            <td className="p-4 text-slate-600">
                              <div>{enq.mobile || enq.phone}</div>
                              <div className="text-[11px] text-slate-400">{enq.email}</div>
                            </td>
                            <td className="p-4 text-slate-700">{enq.service_interest || 'N/A'}</td>
                            <td className="p-4 text-slate-500 font-mono">
                              {enq.created_at ? new Date(enq.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="p-4 text-slate-500 font-mono">
                              {enq.archived_at ? new Date(enq.archived_at).toLocaleString() : 'N/A'}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleRestoreEnquiry(enq.id)}
                                className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold hover:bg-emerald-100 transition"
                                title="Restore to active enquiries"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            No archived enquiries found. All active enquiries are currently under 90 days old.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: ARCHIVED APPLICATIONS */}
            {archivalSubTab === 'applications' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">Archived Job Candidates ({archivedApplications.length})</span>
                  <span className="text-xs text-slate-400">Records older than 90 days</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">Candidate</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Applied Role</th>
                        <th className="p-4">Original Date</th>
                        <th className="p-4">Archived At</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {archivedApplications.length > 0 ? (
                        archivedApplications.map((app: any) => (
                          <tr key={app.id} className="hover:bg-slate-50/80">
                            <td className="p-4 font-mono font-bold text-slate-400">#{app.id}</td>
                            <td className="p-4 font-bold text-slate-900">{app.full_name}</td>
                            <td className="p-4 text-slate-600">
                              <div>{app.phone}</div>
                              <div className="text-[11px] text-slate-400">{app.email}</div>
                            </td>
                            <td className="p-4">
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getRoleBadgeColor(app.role)}`}>
                                {app.role}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 font-mono">
                              {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="p-4 text-slate-500 font-mono">
                              {app.archived_at ? new Date(app.archived_at).toLocaleString() : 'N/A'}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleRestoreApplication(app.id)}
                                className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold hover:bg-emerald-100 transition"
                                title="Restore to active job applications"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            No archived candidates found. All current candidate applications are under 90 days old.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: TEAM & ACCESS MANAGEMENT (RBAC) ─── */}
        {activeTab === 'users' && canManageUsers && (
          <div className="space-y-8 animate-fade-in">
            {/* Add User Form Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Add Staff Account & Permissions</h2>
                  <p className="text-xs text-slate-500">Create login credentials and grant role-based access directly to database</p>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUserUsername}
                      onChange={e => setNewUserUsername(e.target.value)}
                      placeholder="e.g. counselor_anantapur"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={e => setNewUserEmail(e.target.value)}
                      placeholder="e.g. staff@harryoverseas.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={newUserPassword}
                      onChange={e => setNewUserPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Staff Role *
                    </label>
                    <select
                      value={newUserRole}
                      onChange={e => handleRoleSelectionChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white font-semibold text-slate-800"
                    >
                      <option value="Counselor">Counselor (Enquiries Only)</option>
                      <option value="Recruiter">Recruiter (Job Applications Only)</option>
                      <option value="Operations Manager">Operations Manager (Enquiries + Candidates + Archives)</option>
                      <option value="Viewer">Viewer / Auditor (Read-only)</option>
                      <option value="Super Admin">Super Admin (Full Unrestricted Access)</option>
                    </select>
                  </div>
                </div>

                {/* Granular Permission Toggles */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Granular Access Permissions</span>
                    </span>
                    {newUserPerms.includes('*') && (
                      <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                        Full Administrator Authority (*)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {[
                      { key: 'enquiries:read', label: 'View Enquiries' },
                      { key: 'enquiries:write', label: 'Update Enquiry Status' },
                      { key: 'enquiries:delete', label: 'Delete Enquiries' },
                      { key: 'applications:read', label: 'View Candidate CVs' },
                      { key: 'applications:write', label: 'Update Application Status' },
                      { key: 'applications:delete', label: 'Delete Applications' },
                      { key: 'archive:read', label: 'View 90+ Day Archives' },
                      { key: 'archive:write', label: 'Trigger Archival & Restore' }
                    ].map(p => {
                      const isChecked = newUserPerms.includes('*') || newUserPerms.includes(p.key);
                      return (
                        <label
                          key={p.key}
                          onClick={() => togglePermission(p.key)}
                          className={`flex items-center space-x-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={newUserRole === 'Super Admin'}
                            readOnly
                            className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                          <span>{p.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md flex items-center space-x-2 transition disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{creatingUser ? 'Creating Account...' : 'Create Staff Member'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900">Configured Portal Accounts</h3>
                  <p className="text-xs text-slate-500">Active accounts authorized to access Staff Portal modules</p>
                </div>
                <button
                  onClick={loadUsers}
                  className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                  title="Reload users"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50/70 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Assigned Permissions</th>
                      <th className="p-4">Created Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userList.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900 flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold uppercase">
                            {u.username.substring(0, 2)}
                          </div>
                          <span>{u.username}</span>
                        </td>
                        <td className="p-4 text-slate-600 font-mono text-xs">{u.email}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                            u.role === 'Super Admin'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : u.role === 'Operations Manager'
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                : u.role === 'Counselor'
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : u.role === 'Recruiter'
                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {u.permissions?.includes('*') ? (
                              <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                                Full System Access (*)
                              </span>
                            ) : (
                              u.permissions?.map((p, idx) => (
                                <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                  {p}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-xs">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4 text-right">
                          {u.role !== 'Super Admin' && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-50 rounded-lg transition"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 5: SYSTEM CONFIGS (DATABASE BACKED, NO RESTART NEEDED) ─── */}
        {activeTab === 'settings' && canManageSettings && (
          <div className="space-y-8 animate-fade-in">
            {/* Header info */}
            <div className="bg-gradient-to-r from-brand-navy to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <Sliders className="w-6 h-6 text-brand-gold" />
                <h2 className="text-xl font-extrabold tracking-tight">Database-Backed Dynamic System Settings</h2>
              </div>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                All credentials, email configurations, and Slack webhooks are securely stored in the PostgreSQL database.
                Updating values here takes effect immediately in the runtime engine <strong>without requiring any server reboot</strong>.
              </p>
            </div>

            <form onSubmit={handleSaveConfigs} className="space-y-6">
              {/* Email & SMTP Settings Group */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-brand-navy" />
                    <h3 className="font-extrabold text-slate-900">Multi-Inbox Gmail SMTP Configuration</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestSmtpLive}
                    disabled={testingSmtp}
                    className="text-xs font-bold px-3 py-1.5 bg-brand-navy text-white rounded-lg hover:bg-slate-800 transition flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingSmtp ? 'animate-spin' : ''}`} />
                    <span>{testingSmtp ? 'Testing Live...' : 'Verify SMTP Live'}</span>
                  </button>
                </div>

                {smtpDiagnostics && (
                  <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="font-bold text-slate-800 mb-2">Diagnostic Results:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        smtpDiagnostics.info?.connected ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}>
                        <span>Info Inbox ({smtpDiagnostics.info?.user || 'info'}):</span>
                        <span className="font-bold">{smtpDiagnostics.info?.connected ? 'Connected (OK)' : (smtpDiagnostics.info?.error || 'Failed')}</span>
                      </div>
                      <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        smtpDiagnostics.support?.connected ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}>
                        <span>Support Inbox ({smtpDiagnostics.support?.user || 'support'}):</span>
                        <span className="font-bold">{smtpDiagnostics.support?.connected ? 'Connected (OK)' : (smtpDiagnostics.support?.error || 'Failed')}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">EMAIL_INFO_USER (Leads Recipient & Sender)</label>
                    <input
                      type="text"
                      value={configForm['EMAIL_INFO_USER'] || ''}
                      onChange={e => setConfigForm({ ...configForm, EMAIL_INFO_USER: e.target.value })}
                      placeholder="info.harryoverseas@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-navy text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      EMAIL_INFO_PASS (Google 16-char App Password)
                    </label>
                    <input
                      type="password"
                      value={configForm['EMAIL_INFO_PASS'] || ''}
                      onChange={e => setConfigForm({ ...configForm, EMAIL_INFO_PASS: e.target.value })}
                      placeholder="Enter new 16-char password to update"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-navy text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">EMAIL_SUPPORT_USER (Candidate Submissions)</label>
                    <input
                      type="text"
                      value={configForm['EMAIL_SUPPORT_USER'] || ''}
                      onChange={e => setConfigForm({ ...configForm, EMAIL_SUPPORT_USER: e.target.value })}
                      placeholder="support.harryoverseas@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-navy text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      EMAIL_SUPPORT_PASS (Google 16-char App Password)
                    </label>
                    <input
                      type="password"
                      value={configForm['EMAIL_SUPPORT_PASS'] || ''}
                      onChange={e => setConfigForm({ ...configForm, EMAIL_SUPPORT_PASS: e.target.value })}
                      placeholder="Enter new 16-char password to update"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-navy text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Slack Webhooks Group */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-slate-100">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-slate-900">Real-Time Slack Webhook Routing</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">SLACK_LEADS_WEBHOOK_URL</label>
                    <input
                      type="password"
                      value={configForm['SLACK_LEADS_WEBHOOK_URL'] || ''}
                      onChange={e => setConfigForm({ ...configForm, SLACK_LEADS_WEBHOOK_URL: e.target.value })}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-navy text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">SLACK_CAREERS_WEBHOOK_URL</label>
                    <input
                      type="password"
                      value={configForm['SLACK_CAREERS_WEBHOOK_URL'] || ''}
                      onChange={e => setConfigForm({ ...configForm, SLACK_CAREERS_WEBHOOK_URL: e.target.value })}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-navy text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">SLACK_ALERTS_WEBHOOK_URL</label>
                    <input
                      type="password"
                      value={configForm['SLACK_ALERTS_WEBHOOK_URL'] || ''}
                      onChange={e => setConfigForm({ ...configForm, SLACK_ALERTS_WEBHOOK_URL: e.target.value })}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-navy text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Maintenance Mode & Operations Control */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-slate-100">
                  <Power className="w-5 h-5 text-amber-500" />
                  <h3 className="font-extrabold text-slate-900">Operations & Maintenance Mode Control</h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900">PORTAL_MAINTENANCE_MODE</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          (configForm['PORTAL_MAINTENANCE_MODE'] || 'false').toLowerCase() === 'true'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {(configForm['PORTAL_MAINTENANCE_MODE'] || 'false').toLowerCase() === 'true' ? 'MAINTENANCE ACTIVE' : 'LIVE / NORMAL'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 max-w-xl">
                        When active, public enquiry and candidate submissions display a polite maintenance notice and are temporarily paused while administrators retain full access.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfigForm({ ...configForm, PORTAL_MAINTENANCE_MODE: 'false' })}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                          (configForm['PORTAL_MAINTENANCE_MODE'] || 'false').toLowerCase() !== 'true'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Normal (Live)
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfigForm({ ...configForm, PORTAL_MAINTENANCE_MODE: 'true' })}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                          (configForm['PORTAL_MAINTENANCE_MODE'] || 'false').toLowerCase() === 'true'
                            ? 'bg-amber-600 text-white border-amber-600 shadow'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Maintenance Mode
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">SUPPORT_PHONE</label>
                      <input
                        type="text"
                        value={configForm['SUPPORT_PHONE'] || ''}
                        onChange={e => setConfigForm({ ...configForm, SUPPORT_PHONE: e.target.value })}
                        placeholder="+91 6302951891"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-navy text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">WHATSAPP_SUPPORT_NUMBER</label>
                      <input
                        type="text"
                        value={configForm['WHATSAPP_SUPPORT_NUMBER'] || ''}
                        onChange={e => setConfigForm({ ...configForm, WHATSAPP_SUPPORT_NUMBER: e.target.value })}
                        placeholder="+91 6302951891"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-navy text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={loadConfigs}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={savingConfigs}
                  className="bg-brand-navy hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md flex items-center space-x-2 transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingConfigs ? 'Updating Database...' : 'Save Changes to Database'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Developer & System Caretaker Footer Badge */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Platform Status: Fully Operational</span>
            <span className="text-slate-300">•</span>
            <span>Multi-Inbox SMTP & Slack Realtime Webhooks Active</span>
          </div>

          <div className="flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm text-[11px]">
            <span className="text-slate-500">System Architect & Caretaker:</span>
            <strong className="text-brand-navy font-bold">Yathin</strong>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Lead Support & Engineering
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MANDATORY STAGE CHANGE COMMENT CONFIRMATION MODAL         */}
        {/* ======================================================== */}
        {stageModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200 mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-brand-navy/10 text-brand-navy rounded-xl">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Confirm Stage Transition
                    </h3>
                    <p className="text-xs text-slate-500">
                      Target: <span className="font-semibold text-slate-700">{stageTargetName}</span> ({stageTargetType === 'enquiry' ? 'Lead' : 'Candidate'})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStageModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmStageChange} className="space-y-4">
                {/* Transition Direction Indicator */}
                <div className="flex items-center justify-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Stage</span>
                    <span className="font-bold text-slate-700">{stagePrevStatus || 'Initial'}</span>
                  </div>
                  <span className="text-slate-400 font-bold text-base">→</span>
                  <div className="text-center">
                    <span className="text-[10px] text-brand-navy uppercase font-semibold block">Target Stage</span>
                    <span className="font-bold text-brand-navy">{stageNewStatus}</span>
                  </div>
                </div>

                {/* Mandatory Comment Area */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                      <span>Reason / Transition Justification</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Strictly mandatory for audit</span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={stageComment}
                    onChange={e => setStageComment(e.target.value)}
                    placeholder="Enter thorough reasoning for this stage change (e.g., 'Initial consultation completed via WhatsApp, documents checklist requested', 'Interview scheduled for Friday with senior panel')..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-navy"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    This note will be permanently logged in the audit trail alongside your staff username and timestamp.
                  </span>
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setStageModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingStageChange || !stageComment.trim()}
                    className="px-5 py-2 bg-brand-navy hover:bg-brand-dark text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{submittingStageChange ? 'Updating...' : 'Confirm Stage Change'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
