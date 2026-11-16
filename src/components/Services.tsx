import React from 'react';
import { GraduationCap, Users, Award, Briefcase, Plane, CheckCircle2, ArrowRight, HeartPulse, Stethoscope } from 'lucide-react';

export default function Services() {
  const servicesList = [
    {
      title: "Nurse Requirement in Germany",
      icon: Stethoscope,
      description: "Direct healthcare recruitment program for Indian GNM & B.Sc Registered Nurses. Lucrative salaries (€2,800 to €3,600 / ₹2.5L–₹3.2L per month), German B1/B2 training, nursing license recognition (Anerkennung), and family reunion benefits.",
      highlight: "🔥 High Demand · Free Hospital Placement",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200"
    },
    {
      title: "Germany Student Visa",
      icon: GraduationCap,
      description: "Initial profile assessment, course & public university shortlisting, APS certification guidance, university applications, blocked account setup, and visa interview preparation.",
      highlight: "Popular for Masters & Bachelors",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200"
    },
    {
      title: "Chancenkarte (Opportunity Card)",
      icon: Award,
      description: "Points-based job seeker route for skilled professionals. Qualification recognition checks, points calculation, German-format CV creation, and job hunt coaching.",
      highlight: "Fast-track Job Seeker Visa",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200"
    },
    {
      title: "Spouse & Family Reunion Visa",
      icon: Users,
      description: "Eligibility assessment, civil document attestation, application filing assistance, and mandatory Goethe A1 German language certification enrolment.",
      highlight: "Reunite with Family in Germany",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
    },
    {
      title: "Germany Work Visa (EU Blue Card)",
      icon: Briefcase,
      description: "Employment contract review, visa sponsorship documentation, recognition of professional qualifications with German authorities, and embassy appointment scheduling.",
      highlight: "For Skilled Professionals",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200"
    },
    {
      title: "Tourist & Visitor Visa Assistance",
      icon: Plane,
      description: "Schengen tourist and family visitor visa itinerary planning, flight reservations, travel insurance guidance, and financial proof documentation.",
      highlight: "Explore Europe with Ease",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-200"
    }
  ];

  const scrollToEnquiry = () => {
    const el = document.getElementById('enquiry');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="services" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-brand-navy font-semibold text-sm uppercase tracking-widest bg-brand-navy/10 px-3.5 py-1.5 rounded-full">
            Expert Consultancy & Placement
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">
            Immigration, Placement & Visa Services
          </h2>
          <p className="text-slate-600 mt-3 text-base sm:text-lg">
            Comprehensive, transparent assistance for healthcare nurses, university students, skilled job seekers, and families relocating to Germany.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesList.map((service, index) => {
            const Icon = service.icon;
            const isNurse = index === 0;
            return (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition border flex flex-col justify-between group ${
                  isNurse ? 'border-brand-gold/60 ring-2 ring-brand-gold/20 relative' : 'border-slate-200/80'
                }`}
              >
                {isNurse && (
                  <span className="absolute -top-3 left-6 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider shadow">
                    Featured Healthcare Program
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition ${
                      isNurse
                        ? 'bg-rose-50 text-rose-600 group-hover:bg-brand-gold group-hover:text-brand-dark'
                        : 'bg-brand-navy/10 text-brand-navy group-hover:bg-brand-gold group-hover:text-brand-dark'
                    }`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${service.badgeColor}`}>
                      {service.highlight}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {service.title}
                  </h3>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100">
                  <button
                    onClick={scrollToEnquiry}
                    className="text-brand-navy hover:text-brand-dark text-sm font-semibold flex items-center space-x-1 group-hover:translate-x-1 transition"
                  >
                    <span>Enquire for this service</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Callout Card for Custom / Arrival */}
          <div className="bg-gradient-to-br from-brand-dark to-brand-navy rounded-2xl p-8 text-white flex flex-col justify-between shadow-lg md:col-span-2 lg:col-span-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-xs font-semibold bg-brand-gold text-brand-dark px-3 py-1 rounded-full uppercase tracking-wider">
                  Complete Relocation Ecosystem
                </span>
                <h3 className="text-2xl font-bold mt-3 mb-2">
                  Need Help With Germany Arrival, Airport Pickup & Accommodation?
                </h3>
                <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
                  We don't just secure your visa or nursing contract—our German team assists you with airport reception, city registration (Anmeldung), German bank account setup, SIM card, and temporary housing.
                </p>
              </div>

              <div className="flex-shrink-0 w-full md:w-auto">
                <button
                  onClick={scrollToEnquiry}
                  className="w-full md:w-auto bg-brand-gold hover:bg-brand-lightGold text-brand-dark font-bold py-3.5 px-8 rounded-xl text-center transition shadow-lg"
                >
                  Book Complete Package
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
