import React from 'react';
import { GraduationCap, Users, Award, Briefcase, Plane, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Services() {
  const servicesList = [
    {
      title: "Germany Student Visa",
      icon: GraduationCap,
      description: "Initial profile assessment, course & university shortlisting, APS guidance, university applications, financial documentation, and interview preparation.",
      highlight: "Popular for Masters & Bachelors"
    },
    {
      title: "Spouse & Family Reunion Visa",
      icon: Users,
      description: "Eligibility assessment, civil document attestation, application form assistance, and mandatory A1 German language course enrolment where required.",
      highlight: " Reunite with family in Germany"
    },
    {
      title: "Chancenkarte (Opportunity Card)",
      icon: Award,
      description: "Points-based job seeker visa assistance. Qualification recognition checks, points calculation, CV formatting, and job hunt strategy.",
      highlight: "Fast-track job seeker route"
    },
    {
      title: "Germany Work Visa (EU Blue Card)",
      icon: Briefcase,
      description: "Employment contract review, visa sponsorship documentation, recognition of professional qualifications, and embassy appointment preparation.",
      highlight: "For skilled professionals"
    },
    {
      title: "Tourist & Visitor Visa Assistance",
      icon: Plane,
      description: "Schengen tourist visa itinerary planning, hotel bookings, travel insurance guidance, and financial proof documentation.",
      highlight: "Explore Europe with ease"
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
            Expert Consultancy
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">
            Immigration & Visa Services
          </h2>
          <p className="text-slate-600 mt-3 text-base sm:text-lg">
            Comprehensive, transparent assistance for students, professionals, and families moving to Germany.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesList.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition border border-slate-200/80 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-brand-navy/10 text-brand-navy flex items-center justify-center group-hover:bg-brand-gold group-hover:text-brand-dark transition">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-medium bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
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
          <div className="bg-gradient-to-br from-brand-dark to-brand-navy rounded-2xl p-8 text-white flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-xs font-semibold bg-brand-gold text-brand-dark px-3 py-1 rounded-full uppercase tracking-wider">
                All-in-One Support
              </span>
              <h3 className="text-2xl font-bold mt-4 mb-3">
                Need Help With Arrival & Accommodation?
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                We don't just secure your visa—we help you settle down in Germany with airport pickup, temporary housing assistance, and local registration guidance.
              </p>
            </div>

            <div className="pt-6">
              <button
                onClick={scrollToEnquiry}
                className="w-full bg-brand-gold hover:bg-brand-lightGold text-brand-dark font-bold py-3 px-4 rounded-xl text-center transition shadow"
              >
                Book Complete Package
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
