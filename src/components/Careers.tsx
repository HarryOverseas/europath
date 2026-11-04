import React, { useState, useId } from 'react';
import {
  Briefcase,
  MapPin,
  Clock,
  Building2,
  CheckCircle2,
  ArrowRight,
  Search,
  Filter,
  Sparkles,
  User,
  Mail,
  Phone,
  FileText,
  Link as LinkIcon,
  X,
  AlertCircle,
  GraduationCap,
  Compass,
  Languages,
  ShieldCheck,
  Send,
  RotateCcw,
  Check
} from 'lucide-react';

export interface JobVacancy {
  id: string;
  title: string;
  roleValue: string; // matches backend role filter
  department: 'Language Training' | 'Visa & Immigration' | 'Student Counseling' | 'Relocation & Settlement';
  location: string;
  type: string;
  experience: string;
  salaryRange?: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  featured?: boolean;
}

export const VACANCIES: JobVacancy[] = [
  {
    id: 'daf-trainer',
    title: 'German Language Trainer (DaF B1-C1)',
    roleValue: 'German Language Trainer',
    department: 'Language Training',
    location: 'Berlin / Remote / Regional Offices',
    type: 'Full-time / Hybrid',
    experience: '2+ Years Teaching Experience',
    salaryRange: '€42,000 - €55,000 / year (or local competitive tier)',
    featured: true,
    summary:
      'Lead intensive and comprehensive German language instruction (A1 to C1) for healthcare professionals, engineers, and students preparing for Goethe-Zertifikat, TestDaF, and telc examinations.',
    responsibilities: [
      'Design and deliver structured curriculum for levels A1 through C1 following CEFR standards.',
      'Conduct interactive online and in-person sessions emphasizing conversational fluency, grammar precision, and exam mastery.',
      'Evaluate student progress, provide detailed constructive feedback, and administer practice examinations.',
      'Deliver specialized technical and medical German modules (Fachsprachenprüfung prep) for nurses and doctors.',
      'Collaborate with immigration counselors to align student language progression with embassy visa appointment deadlines.'
    ],
    requirements: [
      'Goethe-Zertifikat C2, DaF / DaZ degree, or native/bilingual proficiency in German.',
      'Minimum 2+ years of professional teaching experience in Goethe, TestDaF, or telc examination preparation.',
      'Proficiency with digital classroom tools, interactive multimedia learning, and LMS platforms.',
      'Strong intercultural communication skills with fluency in both German and English.',
      'Passionate about student outcomes and European integration.'
    ],
    benefits: [
      'Flexible hybrid and remote working arrangements',
      'Sponsored Goethe-Institut examiner accreditation and continuous pedagogy training',
      'Relocation assistance if transitioning to German branch offices',
      'Performance-based student exam completion bonuses'
    ]
  },
  {
    id: 'visa-consultant',
    title: 'Senior Visa & Immigration Consultant (Opportunity Card, EU Blue Card)',
    roleValue: 'Senior Visa & Immigration Consultant',
    department: 'Visa & Immigration',
    location: 'Frankfurt / Berlin / Regional Offices',
    type: 'Full-time / Hybrid',
    experience: '3+ Years Immigration Advisory',
    salaryRange: '€48,000 - €65,000 / year',
    featured: true,
    summary:
      'Guide skilled professionals, engineers, and healthcare specialists through German residency pathways including the Chancenkarte (Opportunity Card), EU Blue Card, and skilled worker recognition.',
    responsibilities: [
      'Perform detailed eligibility evaluations based on the Chancenkarte points matrix and EU Blue Card salary thresholds.',
      'Audit and assemble visa application dossiers, ZAB / Anabin degree equivalency recognitions, and professional license filings.',
      'Act as liaison with German embassies, consulates, and local Foreigners Authorities (Ausländerbehörde).',
      'Advise corporate clients and individual applicants on fast-track skilled worker procedures (Beschleunigtes Fachkräfteverfahren).',
      'Monitor updates to the German Skilled Immigration Act (Fachkräfteeinwanderungsgesetz) and ensure compliance.'
    ],
    requirements: [
      'Bachelor’s or Master’s degree in Law, International Relations, HR, or related professional field.',
      '3+ years of verifiable experience in German skilled immigration and visa case management.',
      'Deep functional understanding of Aufenthaltsgesetz, Anabin database, and German consulate requirements.',
      'Fluency in English; working knowledge of German (B1+) is a significant asset.',
      'Flawless legal document drafting and rigorous attention to detail.'
    ],
    benefits: [
      'Direct exposure to European legal immigration frameworks and corporate mobility',
      'Generous paid annual leave (30 days EU standard) and health benefits',
      'Modern tech stack with automated dossier tracking software',
      'Career advancement path toward Head of Immigration Practice'
    ]
  },
  {
    id: 'student-counselor',
    title: 'Overseas Student Counselor (German Higher Education)',
    roleValue: 'Overseas Student Counselor',
    department: 'Student Counseling',
    location: 'Anantapur / Regional Offices / Hybrid',
    type: 'Full-time / Hybrid',
    experience: '2+ Years Educational Counseling',
    salaryRange: 'Competitive Base + Performance Incentives',
    featured: false,
    summary:
      'Empower ambitious students aspiring to study at German public and private universities through personalized university selection, Uni-Assist processing, and APS certification guidance.',
    responsibilities: [
      'Provide personalized counseling on German universities (TU9, Universities of Applied Sciences), bachelor’s, and master’s programs.',
      'Guide students through APS India certification, Uni-Assist portal submissions, and direct university applications.',
      'Review and polish Statements of Purpose (SOP), Letters of Recommendation (LOR), and academic CVs.',
      'Assist with blocked account (Sperrkonto) setup, statutory student health insurance, and student visa interview readiness.',
      'Conduct educational webinars, parent briefings, and pre-departure orientations.'
    ],
    requirements: [
      'Bachelor’s degree with 2+ years of experience counseling students for European destinations (especially Germany).',
      'Comprehensive understanding of German university admissions, ECTS credit evaluation, and public vs. private tiers.',
      'High empathy, proactive listening skills, and ability to guide families through career choices.',
      'Hands-on experience with APS India certification procedures and Uni-Assist guidelines.',
      'Strong organizational skills and fluent verbal/written English.'
    ],
    benefits: [
      'Quarterly performance bonuses based on student admission achievements',
      'Comprehensive training on German university catalogs and emerging tech curricula',
      'Collaborative, high-energy counseling team environment',
      'Opportunities for European familiarization campus tours'
    ]
  },
  {
    id: 'relocation-coordinator',
    title: 'European Relocation & Settlement Coordinator',
    roleValue: 'European Relocation & Settlement Coordinator',
    department: 'Relocation & Settlement',
    location: 'Berlin / Frankfurt / Remote',
    type: 'Full-time / Hybrid',
    experience: '2+ Years European Relocation Support',
    salaryRange: '€40,000 - €52,000 / year',
    featured: false,
    summary:
      'Orchestrate post-landing arrival support and integration for expatriates, including city registration (Anmeldung), tax ID issuance, banking, and housing navigation in Germany.',
    responsibilities: [
      'Coordinate airport arrivals, temporary accommodation logistics, and local public transit onboarding.',
      'Guide clients through municipal citizen office registration (Bürgeramt Anmeldung) and tax ID (Steueridentifikationsnummer) retrieval.',
      'Support bank account openings (Girokonto) and public/private health insurance (Krankenkasse) activation.',
      'Provide neighborhood orientations, emergency contacts, local school enrollments, and German bureaucracy navigation tips.',
      'Conduct regular check-ins during the candidate’s first 90 days to ensure smooth cultural adaptation.'
    ],
    requirements: [
      'German language proficiency (minimum B2/C1) and fluent English.',
      '2+ years of on-the-ground experience living, studying, or working in Germany with intimate knowledge of civic processes.',
      'High emotional intelligence, cultural adaptability, and patience when helping newcomers.',
      'Strong multitasking abilities and proactive coordination across European and international time zones.',
      'Clean driver’s license and familiarity with German metropolitan areas.'
    ],
    benefits: [
      'Public transport ticket subscription (Deutschlandticket) covered',
      'Flexible remote schedule with client appointment stipends',
      'Rewarding impact directly welcoming international talent into German society',
      'Direct networking with German employers and expatriate networks'
    ]
  }
];

export const DEPARTMENTS = [
  'All Departments',
  'Language Training',
  'Visa & Immigration',
  'Student Counseling',
  'Relocation & Settlement'
] as const;

export type DepartmentType = (typeof DEPARTMENTS)[number];

interface ApplicationFormData {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  resumeLink: string;
  notes: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  resumeLink?: string;
}

export default function Careers() {
  const [selectedDept, setSelectedDept] = useState<DepartmentType>('All Departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVacancyForModal, setSelectedVacancyForModal] = useState<JobVacancy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<ApplicationFormData>({
    fullName: '',
    email: '',
    phone: '',
    role: VACANCIES[0].roleValue,
    resumeLink: '',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedRefId, setSubmittedRefId] = useState<string>('');
  const [serverNotice, setServerNotice] = useState<string | null>(null);

  // Open Application Modal pre-populated with vacancy
  const handleApplyClick = (vacancy?: JobVacancy) => {
    if (vacancy) {
      setSelectedVacancyForModal(vacancy);
      setFormData(prev => ({
        ...prev,
        role: vacancy.roleValue
      }));
    } else {
      setSelectedVacancyForModal(null);
    }
    setFormErrors({});
    setSubmissionSuccess(false);
    setServerNotice(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVacancyForModal(null);
    setSubmissionSuccess(false);
    setFormErrors({});
    setServerNotice(null);
  };

  // Field validation
  const validateField = (name: keyof ApplicationFormData, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters.';
        return undefined;
      case 'email':
        if (!value.trim()) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address (e.g., name@domain.com).';
        }
        return undefined;
      case 'phone':
        if (!value.trim()) return 'Phone number is required.';
        if (value.trim().replace(/[\s\-\+\(\)]/g, '').length < 6) {
          return 'Please enter a valid phone number with digits.';
        }
        return undefined;
      case 'role':
        if (!value.trim()) return 'Please select a target role.';
        return undefined;
      case 'resumeLink':
        if (value.trim() && !/^https?:\/\/.+/i.test(value.trim())) {
          return 'Please enter a valid URL beginning with http:// or https://';
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const handleInputChange = (field: keyof ApplicationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateAll = (): boolean => {
    const errors: FormErrors = {};
    errors.fullName = validateField('fullName', formData.fullName);
    errors.email = validateField('email', formData.email);
    errors.phone = validateField('phone', formData.phone);
    errors.role = validateField('role', formData.role);
    errors.resumeLink = validateField('resumeLink', formData.resumeLink);

    // Clean undefined keys
    Object.keys(errors).forEach(key => {
      if (!errors[key as keyof FormErrors]) {
        delete errors[key as keyof FormErrors];
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    setIsSubmitting(true);
    setServerNotice(null);

    const generatedId = `REF-HG-${Math.floor(100000 + Math.random() * 900000)}`;

    const payload = {
      full_name: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: formData.role.trim(),
      resume_link: formData.resumeLink.trim() || undefined,
      notes: formData.notes.trim() || undefined
    };

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const confirmedId = data.application_id ? `APP-${data.application_id}` : generatedId;

        // Offline / Resilient LocalStorage Backup (Mandatory requirement R1 / M2)
        try {
          const existingStorage = localStorage.getItem('harry_global_job_applications');
          let applicationsList: any[] = [];
          if (existingStorage) {
            try {
              applicationsList = JSON.parse(existingStorage);
              if (!Array.isArray(applicationsList)) applicationsList = [];
            } catch {
              applicationsList = [];
            }
          }

          const localRecord = {
            id: confirmedId,
            full_name: payload.full_name,
            email: payload.email,
            phone: payload.phone,
            role: payload.role,
            resume_link: payload.resume_link || '',
            notes: payload.notes || '',
            status: 'New',
            created_at: new Date().toISOString(),
            synced: true
          };

          applicationsList.unshift(localRecord);
          localStorage.setItem('harry_global_job_applications', JSON.stringify(applicationsList));
        } catch (storageErr) {
          console.error('Failed writing to localStorage backup', storageErr);
        }

        setSubmittedRefId(confirmedId);
        setSubmissionSuccess(true);
        setServerNotice(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Server rejected application (${response.status}). Please check your details.`;
        setServerNotice(errorMsg);
      }
    } catch (err) {
      console.warn('Network offline or backend endpoint unreachable', err);
      setServerNotice('Unable to connect to server. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      role: selectedVacancyForModal ? selectedVacancyForModal.roleValue : VACANCIES[0].roleValue,
      resumeLink: '',
      notes: ''
    });
    setFormErrors({});
    setSubmissionSuccess(false);
    setServerNotice(null);
  };

  // Filter vacancies
  const filteredVacancies = VACANCIES.filter(vacancy => {
    const matchesDept = selectedDept === 'All Departments' || vacancy.department === selectedDept;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesDept;

    const matchesSearch =
      vacancy.title.toLowerCase().includes(query) ||
      vacancy.department.toLowerCase().includes(query) ||
      vacancy.location.toLowerCase().includes(query) ||
      vacancy.summary.toLowerCase().includes(query) ||
      vacancy.responsibilities.some(r => r.toLowerCase().includes(query)) ||
      vacancy.requirements.some(req => req.toLowerCase().includes(query));

    return matchesDept && matchesSearch;
  });

  // Calculate count per department
  const getDeptCount = (dept: DepartmentType) => {
    if (dept === 'All Departments') return VACANCIES.length;
    return VACANCIES.filter(v => v.department === dept).length;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Hero Banner */}
      <section className="bg-brand-dark text-white relative overflow-hidden py-16 sm:py-24 border-b border-slate-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-brand-gold/20 border border-brand-gold/40 text-brand-gold px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>We Are Hiring — Join Our Team</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Build Your Career in{' '}
              <span className="text-brand-gold">European Immigration</span> & Language Education
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
              Harry Overseas Immigration and German Academy connects talent, students, and skilled professionals with life-changing European opportunities. We are seeking passionate trainers, legal advisors, counselors, and relocation specialists to join our offices in Berlin, Frankfurt, and India.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-3.5 py-2 rounded-xl">
                <Building2 className="w-4 h-4 text-brand-gold" />
                <span>Germany & India Presence</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-3.5 py-2 rounded-xl">
                <Clock className="w-4 h-4 text-brand-gold" />
                <span>Hybrid & Flexible Roles</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-3.5 py-2 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-brand-gold" />
                <span>CEFR & AufenthG Specialized</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="sticky top-20 z-40 bg-white/95 backdrop-blur shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Department Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {DEPARTMENTS.map(dept => {
                const count = getDeptCount(dept);
                const isActive = selectedDept === dept;
                return (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2 ${
                      isActive
                        ? 'bg-brand-navy text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <span>{dept}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-brand-gold text-brand-dark' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input & Reset */}
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative flex-grow md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search role, skills, keywords..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-brand-navy bg-slate-50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {(selectedDept !== 'All Departments' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedDept('All Departments');
                    setSearchQuery('');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2.5 py-2 flex items-center space-x-1 border border-rose-200 bg-rose-50 rounded-xl transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Main Vacancies List */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Results Info */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Open Positions ({filteredVacancies.length})
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Find your ideal position and apply online directly in less than 2 minutes.
            </p>
          </div>

          <button
            onClick={() => handleApplyClick()}
            className="hidden sm:inline-flex items-center space-x-2 bg-brand-gold hover:bg-brand-lightGold text-brand-dark px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow transition"
          >
            <span>General Application</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Empty State */}
        {filteredVacancies.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm max-w-xl mx-auto my-12">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Matching Vacancies Found</h3>
            <p className="text-sm text-slate-600 mb-6">
              We couldn’t find any active listings matching your current department or search filter.
            </p>
            <button
              onClick={() => {
                setSelectedDept('All Departments');
                setSearchQuery('');
              }}
              className="bg-brand-navy text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-800 transition shadow"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Vacancy Cards Grid */}
        <div className="space-y-8">
          {filteredVacancies.map(vacancy => {
            return (
              <article
                key={vacancy.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden relative"
              >
                {/* Header Strip */}
                <div className="p-6 sm:p-8 border-b border-slate-100">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider bg-brand-navy/10 text-brand-navy px-3 py-1 rounded-full">
                          {vacancy.department}
                        </span>
                        {vacancy.featured && (
                          <span className="text-xs font-bold uppercase tracking-wider bg-brand-gold/20 text-brand-gold px-3 py-1 rounded-full flex items-center space-x-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Urgent Hire</span>
                          </span>
                        )}
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                          {vacancy.type}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-slate-900 leading-snug">
                        {vacancy.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs sm:text-sm text-slate-600">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-4 h-4 text-brand-gold flex-shrink-0" />
                          <span>{vacancy.location}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-4 h-4 text-brand-gold flex-shrink-0" />
                          <span>{vacancy.experience}</span>
                        </div>
                        {vacancy.salaryRange && (
                          <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
                            <Briefcase className="w-4 h-4 flex-shrink-0" />
                            <span>{vacancy.salaryRange}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start lg:self-center">
                      <button
                        onClick={() => handleApplyClick(vacancy)}
                        className="bg-brand-navy hover:bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md hover:shadow-lg transition"
                      >
                        <span>Apply For This Role</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
                    {vacancy.summary}
                  </p>
                </div>

                {/* Details Breakdown: Responsibilities & Requirements */}
                <div className="p-6 sm:p-8 bg-slate-50/60 grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Responsibilities */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-brand-navy inline-block" />
                      <span>Key Responsibilities</span>
                    </h4>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                      {vacancy.responsibilities.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-brand-gold inline-block" />
                      <span>Requirements & Qualifications</span>
                    </h4>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                      {vacancy.requirements.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Benefits Snippet */}
                    <div className="mt-5 pt-4 border-t border-slate-200">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Perks & Highlights
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {vacancy.benefits.map((b, bIdx) => (
                          <span
                            key={bIdx}
                            className="bg-white border border-slate-200 text-slate-700 text-[11px] font-medium px-2.5 py-1 rounded-lg"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 bg-gradient-to-r from-brand-dark to-brand-navy rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-2xl font-bold">Don’t See an Exact Match?</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              We are constantly expanding our European services. Submit an open talent application and our recruitment team will reach out when a suitable position opens.
            </p>
          </div>
          <button
            onClick={() => handleApplyClick()}
            className="bg-brand-gold hover:bg-brand-lightGold text-brand-dark px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition whitespace-nowrap"
          >
            Submit Open Application
          </button>
        </div>

      </main>

      {/* Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl relative my-8 overflow-hidden border border-slate-200 animate-in fade-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-brand-dark text-white px-6 sm:px-8 py-6 flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold text-brand-gold uppercase tracking-wider block mb-1">
                  EuroPath Careers
                </span>
                <h3 className="text-xl sm:text-2xl font-bold leading-tight">
                  {selectedVacancyForModal ? selectedVacancyForModal.title : 'Job Application'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
                title="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
              {submissionSuccess ? (
                /* Success Feedback Card */
                <div className="py-6 text-center space-y-6">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h4 className="text-2xl font-bold text-slate-900">Application Received!</h4>
                    <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                      Thank you, <strong className="text-slate-900">{formData.fullName}</strong>. Your application for <span className="font-semibold text-brand-navy">{formData.role}</span> has been logged into our hiring pipeline.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto text-left space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Application Reference:</span>
                      <span className="font-mono font-bold text-brand-navy bg-slate-200 px-2.5 py-1 rounded text-xs">
                        {submittedRefId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Position:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[180px]">{formData.role}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Notification sent to:</span>
                      <span className="font-medium text-slate-800">{formData.email}</span>
                    </div>
                  </div>

                  {/* Next steps timeline */}
                  <div className="border-t border-slate-200 pt-6 text-left">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                      Next Steps in Selection
                    </h5>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 text-xs">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-[10px]">
                          1
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">Profile Screening (2-3 Business Days)</p>
                          <p className="text-slate-500">Our recruitment team reviews your CV, qualifications, and pedagogical / legal background.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 text-xs">
                        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-[10px]">
                          2
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">Initial Video Interview</p>
                          <p className="text-slate-500">A 30-minute introductory conversation to discuss role expectations and mutual fit.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 text-xs">
                        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-[10px]">
                          3
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">Offer & Onboarding</p>
                          <p className="text-slate-500">Formal contract preparation, remote setup or relocation planning.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {serverNotice && (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                      {serverNotice}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={handleResetForm}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition"
                    >
                      Submit Another Application
                    </button>
                    <button
                      onClick={handleCloseModal}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-navy text-white font-bold text-xs hover:bg-slate-900 transition shadow"
                    >
                      Return to Job Listings
                    </button>
                  </div>
                </div>
              ) : (
                /* Application Form */
                <form onSubmit={handleSubmitApplication} noValidate className="space-y-5">
                  
                  {serverNotice && (
                    <div className="flex items-start space-x-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                      <span>{serverNotice}</span>
                    </div>
                  )}

                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Target Vacancy / Role <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.role}
                        onChange={e => handleInputChange('role', e.target.value)}
                        className={`w-full text-xs sm:text-sm border rounded-xl px-3.5 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-navy ${
                          formErrors.role ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                        }`}
                      >
                        <option value="German Language Trainer">German Language Trainer (DaF B1-C1)</option>
                        <option value="Senior Visa & Immigration Consultant">Senior Visa & Immigration Consultant (Opportunity Card, EU Blue Card)</option>
                        <option value="Overseas Student Counselor">Overseas Student Counselor (German Higher Education)</option>
                        <option value="European Relocation & Settlement Coordinator">European Relocation & Settlement Coordinator</option>
                        <option value="Visa Consultant">Visa Consultant (General Advisory)</option>
                        <option value="Student Counselor">Student Counselor (Study Abroad)</option>
                        <option value="European Relocation Coordinator">European Relocation Coordinator (Landing Support)</option>
                        <option value="General Application">General / Speculative Talent Application</option>
                      </select>
                    </div>
                    {formErrors.role && (
                      <p className="text-xs text-rose-500 mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{formErrors.role}</span>
                      </p>
                    )}
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g., Maria Schmidt or Ramesh Rao"
                        value={formData.fullName}
                        onChange={e => handleInputChange('fullName', e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-navy ${
                          formErrors.fullName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {formErrors.fullName && (
                      <p className="text-xs text-rose-500 mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{formErrors.fullName}</span>
                      </p>
                    )}
                  </div>

                  {/* Contact Grid: Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          placeholder="candidate@example.de"
                          value={formData.email}
                          onChange={e => handleInputChange('email', e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-navy ${
                            formErrors.email ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                          }`}
                        />
                      </div>
                      {formErrors.email && (
                        <p className="text-xs text-rose-500 mt-1 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{formErrors.email}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Phone / WhatsApp <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="+49 151 23456789 or +91 9876543210"
                          value={formData.phone}
                          onChange={e => handleInputChange('phone', e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-navy ${
                            formErrors.phone ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                          }`}
                        />
                      </div>
                      {formErrors.phone && (
                        <p className="text-xs text-rose-500 mt-1 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{formErrors.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Resume / Portfolio Link */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Resume Link / LinkedIn / Portfolio URL
                    </label>
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/yourprofile or Google Drive link"
                        value={formData.resumeLink}
                        onChange={e => handleInputChange('resumeLink', e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-navy ${
                          formErrors.resumeLink ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {formErrors.resumeLink ? (
                      <p className="text-xs text-rose-500 mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{formErrors.resumeLink}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Provide a public link to your CV, LinkedIn profile, or portfolio dossier.
                      </p>
                    )}
                  </div>

                  {/* Notes / Cover Letter */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Cover Note / Relevant Qualifications
                    </label>
                    <div className="relative">
                      <textarea
                        rows={3}
                        placeholder="Briefly highlight your teaching experience, CEFR levels taught, visa case experience, or why you want to join EuroPath..."
                        value={formData.notes}
                        onChange={e => handleInputChange('notes', e.target.value)}
                        className="w-full p-3.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-navy"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-brand-navy hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold py-3.5 rounded-2xl text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg transition"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Submitting Application...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Application</span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-slate-500 text-center mt-2.5">
                      By submitting, you agree to our recruitment data processing policy and candidate confidentiality.
                    </p>
                  </div>

                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
