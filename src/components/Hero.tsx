import React from 'react';
import { Compass, GraduationCap, Plane, ArrowRight, CheckCircle, MapPin } from 'lucide-react';

export default function Hero() {
  const scrollToEnquiry = () => {
    const el = document.getElementById('enquiry');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative bg-brand-dark text-white overflow-hidden">
      {/* Background World Map Decorative Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 bg-slate-800/80 border border-brand-gold/30 px-3.5 py-1.5 rounded-full text-brand-gold text-xs sm:text-sm font-medium">
              <MapPin className="w-4 h-4 text-brand-gold" />
              <a
                href="https://maps.app.goo.gl/fYazXdmvJG33oDN28?g_st=ac"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-brand-gold"
              >
                Anantapur, AP, India & Germany Operations
              </a>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Your Global Journey <span className="text-brand-gold">Starts Here.</span>
            </h1>

            <p className="text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Expert Germany & Europe immigration consultancy, professional German language training (A1 to B2), and seamless arrival assistance managed between Germany and our Anantapur office.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <button
                onClick={scrollToEnquiry}
                className="w-full sm:w-auto bg-brand-gold hover:bg-brand-lightGold text-brand-dark font-bold px-8 py-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
              >
                <span>Start Your Enquiry</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <a
                href="https://wa.me/916302951891?text=Hello%20Harry%20Global%20Immigration,%20I%20would%20like%20to%20know%20more%20about%20your%20services."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-semibold px-8 py-4 rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition"
              >
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            {/* Key Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-800 text-center lg:text-left">
              <div>
                <p className="text-2xl font-bold text-brand-gold">100%</p>
                <p className="text-xs text-slate-400 mt-1">Transparent Guidance</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-gold">A1–B2</p>
                <p className="text-xs text-slate-400 mt-1">German Language Academy</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-gold">End-to-End</p>
                <p className="text-xs text-slate-400 mt-1">Arrival & Accommodation Support</p>
              </div>
            </div>

          </div>

          {/* Right Visual Card Column */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
              <div className="absolute -top-3 -right-3 bg-brand-gold text-brand-dark text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Germany Specialists
              </div>

              <h3 className="text-xl font-bold text-white mb-4">Our Three Core Pillars</h3>

              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                  <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold flex-shrink-0 mt-0.5">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Immigration Consultancy</h4>
                    <p className="text-xs text-slate-300 mt-0.5">Student, Spouse Reunion, Chancenkarte (Opportunity Card), Work & Tourist Visas.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                  <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold flex-shrink-0 mt-0.5">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">German Language Academy</h4>
                    <p className="text-xs text-slate-300 mt-0.5">Structured A1, A2, B1, and B2 live classes with certified trainers and exam prep.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                  <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold flex-shrink-0 mt-0.5">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Germany Arrival Assistance</h4>
                    <p className="text-xs text-slate-300 mt-0.5">Airport pickup coordination, temporary accommodation, and local registration support.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">
                  📍 <a
                    href="https://maps.app.goo.gl/fYazXdmvJG33oDN28?g_st=ac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-gold underline"
                  >
                    Office: Near JNTU University, Anantapur, AP
                  </a>
                </span>
                <span className="text-xs text-slate-300 mt-1 block font-medium">
                  📞 <a href="tel:+916302951891" className="hover:text-brand-gold">+91 6302951891</a> / <a href="tel:+4917670256852" className="hover:text-brand-gold">+49 17670256852</a>
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
