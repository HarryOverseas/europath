import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, ArrowLeft, Send, ShieldAlert, Sparkles } from 'lucide-react';

export default function EnquiryWizard() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [generatedId, setGeneratedId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    whatsapp: '',
    email: '',
    city: '',
    country: 'India',
    mainServices: [] as string[],
    languageCourse: 'Not Required',
    additionalServices: [] as string[],
    intendedDestination: 'Germany',
    travelPeriod: 'Winter Intake (October)',
    consultationMethod: 'WhatsApp',
    additionalReqs: ''
  });

  const mainServiceOptions = [
    'Student Visa',
    'Spouse / Family Reunion Visa',
    'Chancenkarte (Opportunity Card)',
    'Work Visa (EU Blue Card)',
    'Tourist & Visitor Visa',
    'German Language Classes',
    'Germany Arrival Assistance'
  ];

  const languageOptions = ['A1', 'A2', 'B1', 'B2', 'Multiple Levels', 'Not Required'];

  const additionalOptions = [
    'University application assistance',
    'Document preparation & attestation',
    'CV / Statement of Purpose (SOP) assistance',
    'Visa application preparation',
    'Airport pickup coordination',
    'Accommodation assistance',
    'Local registration (Anmeldung) guidance',
    'Pre-departure orientation'
  ];

  const toggleService = (service: string) => {
    setFormData(prev => {
      const exists = prev.mainServices.includes(service);
      if (exists) {
        return { ...prev, mainServices: prev.mainServices.filter(s => s !== service) };
      } else {
        return { ...prev, mainServices: [...prev.mainServices, service] };
      }
    });
  };

  const toggleAdditional = (service: string) => {
    setFormData(prev => {
      const exists = prev.additionalServices.includes(service);
      if (exists) {
        return { ...prev, additionalServices: prev.additionalServices.filter(s => s !== service) };
      } else {
        return { ...prev, additionalServices: [...prev.additionalServices, service] };
      }
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.mobile || !formData.email) {
        alert('Please fill in your full name, mobile number, and email address.');
        return;
      }
    }
    if (step === 2 && formData.mainServices.length === 0) {
      alert('Please select at least one main service.');
      return;
    }
    setStep(prev => Math.min(prev + 1, 6));
  };

  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newId = `HGI-${Math.floor(1000 + Math.random() * 9000)}`;

    const payload = {
      id: newId,
      full_name: formData.fullName,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.mobile,
      mobile: formData.mobile,
      whatsapp: formData.whatsapp || formData.mobile,
      city: formData.city || 'Anantapur',
      country: formData.country || 'India',
      main_services: formData.mainServices,
      mainServices: formData.mainServices,
      service_interest: formData.mainServices.join(', ') || formData.languageCourse,
      language_course: formData.languageCourse,
      languageCourse: formData.languageCourse,
      additional_services: formData.additionalServices,
      additionalServices: formData.additionalServices,
      intended_destination: formData.intendedDestination,
      intendedDestination: formData.intendedDestination,
      destination_country: formData.intendedDestination || 'Germany',
      travel_period: formData.travelPeriod,
      travelPeriod: formData.travelPeriod,
      consultation_method: formData.consultationMethod,
      consultationMethod: formData.consultationMethod,
      additional_reqs: formData.additionalReqs,
      additionalReqs: formData.additionalReqs,
      message: formData.additionalReqs || formData.mainServices.join(', ') || 'Customer Enquiry',
      status: 'New',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    let confirmedId = newId;

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.id || data.enquiry_id) {
          confirmedId = data.id || data.enquiry_id;
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn('API returned non-OK status for enquiry submission:', response.status, errData);
      }
    } catch (err) {
      console.warn('Network error during enquiry API submission. Storing locally as fallback:', err);
    }

    setGeneratedId(confirmedId);

    // Backup save to localStorage for offline resilience
    try {
      const existing = localStorage.getItem('harry_global_enquiries');
      let list = [];
      if (existing) {
        try { list = JSON.parse(existing); } catch (e) {}
      }
      list.unshift({ ...payload, id: confirmedId });
      localStorage.setItem('harry_global_enquiries', JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save enquiry to localStorage:', e);
    }

    setIsSubmitting(false);
    setSubmitted(true);
  };


  return (
    <section id="enquiry" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <span className="text-brand-navy font-semibold text-sm uppercase tracking-widest bg-brand-navy/10 px-3.5 py-1.5 rounded-full">
            Start Your Application
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">
            Multi-Step Enquiry Form
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Tell us about your goals. Our expert counselors in Anantapur and Germany will review your profile and contact you with a customized quotation.
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 sm:p-12 text-center shadow-lg">
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Enquiry Submitted Successfully!</h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
              Thank you, <strong className="text-slate-900">{formData.fullName}</strong>. Your enquiry reference number is <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">{generatedId}</span>. Our team will review your requirements and reach out via WhatsApp / Email shortly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={`https://wa.me/916302951891?text=Hello%20Harry%20Global%20Immigration,%20I%20have%20submitted%20my%20enquiry.%20Reference:%20${generatedId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition shadow"
              >
                Chat on WhatsApp Now
              </a>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setStep(1);
                  setFormData({
                    fullName: '', mobile: '', whatsapp: '', email: '', city: '', country: 'India',
                    mainServices: [], languageCourse: 'Not Required', additionalServices: [],
                    intendedDestination: 'Germany', travelPeriod: 'Winter Intake (October)',
                    consultationMethod: 'WhatsApp', additionalReqs: ''
                  });
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold text-sm transition"
              >
                Submit Another Enquiry
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-10">

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                <span>Step {step} of 6</span>
                <span>{Math.round((step / 6) * 100)}% Completed</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-gold h-full transition-all duration-300"
                  style={{ width: `${(step / 6) * 100}%` }}
                ></div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>

              {/* STEP 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Step 1 — Personal Information</h3>
                    <p className="text-slate-500 text-xs mt-1">Please provide your contact details so we can reach you.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        value={formData.mobile}
                        onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Number</label>
                      <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="rahul@example.com"
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Current City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Anantapur / Hyderabad"
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Main Service */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Step 2 — Select Main Service(s)</h3>
                    <p className="text-slate-500 text-xs mt-1">You can select multiple services if needed.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mainServiceOptions.map(srv => {
                      const selected = formData.mainServices.includes(srv);
                      return (
                        <div
                          key={srv}
                          onClick={() => toggleService(srv)}
                          className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                            selected
                              ? 'bg-brand-navy text-white border-brand-navy shadow'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-sm font-semibold">{srv}</span>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            selected ? 'border-brand-gold bg-brand-gold text-brand-dark' : 'border-slate-300'
                          }`}>
                            {selected && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: Language Course */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Step 3 — Select German Language Course</h3>
                    <p className="text-slate-500 text-xs mt-1">Choose your desired German proficiency level.</p>
                  </div>

                  <div className="space-y-3">
                    {languageOptions.map(lang => (
                      <label
                        key={lang}
                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                          formData.languageCourse === lang
                            ? 'bg-brand-navy text-white border-brand-navy shadow'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-sm font-semibold">German {lang}</span>
                        <input
                          type="radio"
                          name="languageCourse"
                          checked={formData.languageCourse === lang}
                          onChange={() => setFormData({ ...formData, languageCourse: lang })}
                          className="w-4 h-4 text-brand-gold focus:ring-brand-gold"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Additional Services */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Step 4 — Select Additional Services</h3>
                    <p className="text-slate-500 text-xs mt-1">Select any add-on assistance you require.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {additionalOptions.map(opt => {
                      const selected = formData.additionalServices.includes(opt);
                      return (
                        <div
                          key={opt}
                          onClick={() => toggleAdditional(opt)}
                          className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                            selected
                              ? 'bg-brand-navy text-white border-brand-navy shadow'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xs font-semibold">{opt}</span>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            selected ? 'border-brand-gold bg-brand-gold text-brand-dark' : 'border-slate-300'
                          }`}>
                            {selected && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 5: Additional Info */}
              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Step 5 — Additional Information</h3>
                    <p className="text-slate-500 text-xs mt-1">Help us understand your timeline and preferences.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Intended Destination</label>
                      <select
                        value={formData.intendedDestination}
                        onChange={e => setFormData({ ...formData, intendedDestination: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
                      >
                        <option value="Germany">Germany</option>
                        <option value="Austria">Austria</option>
                        <option value="Switzerland">Switzerland</option>
                        <option value="Other European Country">Other European Country</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Intended Travel / Intake Period</label>
                      <select
                        value={formData.travelPeriod}
                        onChange={e => setFormData({ ...formData, travelPeriod: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
                      >
                        <option value="Immediate">Immediate</option>
                        <option value="Summer Intake (April / May)">Summer Intake (April / May)</option>
                        <option value="Winter Intake (October / November)">Winter Intake (October / November)</option>
                        <option value="Next Year">Next Year</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Consultation Method</label>
                      <select
                        value={formData.consultationMethod}
                        onChange={e => setFormData({ ...formData, consultationMethod: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Phone Call">Phone Call</option>
                        <option value="Email">Email</option>
                        <option value="In-Person (Anantapur Office)">In-Person (Anantapur Office)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Requirements / Questions</label>
                    <textarea
                      rows={3}
                      value={formData.additionalReqs}
                      onChange={e => setFormData({ ...formData, additionalReqs: e.target.value })}
                      placeholder="Share any specific details about your academic background, work experience, or questions..."
                      className="w-full bg-white border border-slate-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* STEP 6: Summary & Submit */}
              {step === 6 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Step 6 — Review & Submit Enquiry</h3>
                    <p className="text-slate-500 text-xs mt-1">Please review your details before submitting.</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-xs text-slate-400 block">Full Name</span>
                        <span className="font-semibold text-slate-800">{formData.fullName}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Contact</span>
                        <span className="font-semibold text-slate-800">{formData.mobile} ({formData.email})</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">City / Country</span>
                        <span className="font-semibold text-slate-800">{formData.city || 'Not specified'}, {formData.country}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Destination & Intake</span>
                        <span className="font-semibold text-slate-800">{formData.intendedDestination} — {formData.travelPeriod}</span>
                      </div>
                    </div>

                    <div className="pb-4 border-b border-slate-100">
                      <span className="text-xs text-slate-400 block mb-1">Selected Main Services</span>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.mainServices.length > 0 ? formData.mainServices.map(s => (
                          <span key={s} className="bg-brand-navy/10 text-brand-navy text-xs font-semibold px-2.5 py-1 rounded-md">{s}</span>
                        )) : <span className="text-xs text-slate-500 italic">None selected</span>}
                      </div>
                    </div>

                    <div className="pb-4 border-b border-slate-100">
                      <span className="text-xs text-slate-400 block mb-1">German Language Course</span>
                      <span className="font-semibold text-slate-800 text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md inline-block">German {formData.languageCourse}</span>
                    </div>

                    {formData.additionalServices.length > 0 && (
                      <div>
                        <span className="text-xs text-slate-400 block mb-1">Additional Services</span>
                        <div className="flex flex-wrap gap-1.5">
                          {formData.additionalServices.map(s => (
                            <span key={s} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-800">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
                    <p>
                      <strong>Important Notice:</strong> Submitting this enquiry does not automatically charge fees or guarantee visa approval. Staff at Harry Global Immigration will review your requirements and contact you with a formal quotation.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-200">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold text-sm flex items-center space-x-2 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                ) : (
                  <div></div>
                )}

                {step < 6 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-brand-navy hover:bg-brand-dark text-white px-8 py-3 rounded-xl font-semibold text-sm flex items-center space-x-2 transition shadow"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-8 py-3 rounded-xl font-semibold text-sm flex items-center space-x-2 transition shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Enquiry Now'}</span>
                  </button>
                )}
              </div>

            </form>

          </div>
        )}

      </div>
    </section>
  );
}
