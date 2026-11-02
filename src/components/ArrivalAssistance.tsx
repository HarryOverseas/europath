import React from 'react';
import { Plane, Home, FileText, CheckCircle } from 'lucide-react';

export default function ArrivalAssistance() {
  const items = [
    {
      title: "Airport Pickup Coordination",
      icon: Plane,
      desc: "Receive structured guidance on arriving in Germany, connecting with local transport, and reaching your destination safely."
    },
    {
      title: "Accommodation Assistance",
      icon: Home,
      desc: "Guidance on finding temporary student housing, shared apartments (WG), and navigating rental agreements in Germany."
    },
    {
      title: "Local Documentation Guidance",
      icon: FileText,
      desc: "Assistance with mandatory German bureaucratic steps including city registration (Anmeldung), health insurance setup, and opening a blocked/bank account."
    }
  ];

  return (
    <section id="arrival" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-brand-navy font-semibold text-sm uppercase tracking-widest bg-brand-navy/10 px-3.5 py-1.5 rounded-full">
            Soft Landings
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">
            Germany Arrival Assistance
          </h2>
          <p className="text-slate-600 mt-3 text-base sm:text-lg">
            We ensure you are never left stranded upon landing in Germany. From airport coordination to housing and local registration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-brand-gold/10 text-brand-dark flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-brand-gold" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center space-x-2 text-xs text-emerald-700 font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Included in arrival packages</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
