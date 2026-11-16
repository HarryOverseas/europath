import React from 'react';
import { BookOpen, Check, Star, ArrowRight, Sparkles, Tag } from 'lucide-react';

export default function LanguageAcademy() {
  const courses = [
    {
      level: "German A1",
      duration: "2–3 months",
      regularPrice: "₹14,999",
      badge: "Beginner",
      popular: false,
      desc: "Beginner level. Essential for spouse reunion visas and basic daily communication in Germany.",
      features: ["Grammar & Vocabulary Fundamentals", "Speaking & Listening Practice", "Goethe / Telc A1 Exam Preparation", "Study Material & Audio Drills"]
    },
    {
      level: "German A2",
      duration: "2–3 months",
      regularPrice: "₹15,999",
      badge: "Elementary",
      popular: false,
      desc: "Elementary level. Understand sentences and expressions related to areas of immediate relevance.",
      features: ["Advanced Sentence Structure", "Interactive Conversations", "Mock Tests & Evaluation", "Workplace Communication Basics"]
    },
    {
      level: "German B1",
      duration: "3–4 months",
      regularPrice: "₹17,999",
      badge: "Recommended",
      popular: true,
      desc: "Intermediate level. Required for nursing recruitment in Germany, vocational training (Ausbildung), and job seekers.",
      features: ["Complex Grammar & Writing", "Medical & Workplace Professional German", "Extensive Speaking Drills", "Telc / Goethe B1 Certificate Prep"]
    },
    {
      level: "German B2",
      duration: "3–4 months",
      regularPrice: "₹21,999",
      badge: "Advanced",
      popular: false,
      desc: "Upper intermediate level. Necessary for nurse license recognition (Anerkennung) and specialized university courses.",
      features: ["Academic & Technical German", "Advanced Fluency & Nuance Training", "Hospital & Clinical Scenarios", "Official B2 Certification Prep"]
    }
  ];

  const packages = [
    {
      name: "A1 + A2 Foundation Bundle",
      duration: "4–5 months",
      regularPrice: "₹30,999",
      badge: "Beginner Package",
      featured: false,
      desc: "Ideal for beginners aiming for basic fluency and spouse visa requirements."
    },
    {
      name: "A1 + A2 + B1 Complete Combo",
      duration: "7–8 months",
      regularPrice: "₹45,999",
      badge: "🔥 Complete Combo",
      featured: true,
      desc: "The most recommended roadmap for nurses, healthcare professionals, opportunity card applicants, and job seekers."
    },
    {
      name: "Complete Mastery (A1 to B2)",
      duration: "10–12 months",
      regularPrice: "₹67,999",
      badge: "Full Professional",
      featured: false,
      desc: "Comprehensive linguistic roadmap up to full clinical and university fluency."
    }
  ];

  const scrollToEnquiry = () => {
    const el = document.getElementById('enquiry');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="academy" className="py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-brand-navy font-semibold text-sm uppercase tracking-widest bg-brand-navy/10 px-3.5 py-1.5 rounded-full inline-flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
            <span>Harry Overseas German Language Academy</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">
            Master German from A1 to B2
          </h2>
          <p className="text-slate-600 mt-3 text-base sm:text-lg">
            Certified native & experienced Indian trainers, structured curriculum, online & offline batches tailored for nurses, students, job seekers, and spouses.
          </p>
        </div>

        {/* Individual Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {courses.map((course, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 flex flex-col justify-between transition border ${
                course.popular
                  ? 'bg-brand-dark text-white border-brand-gold shadow-xl relative ring-2 ring-brand-gold/30'
                  : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {course.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-brand-gold to-amber-500 text-brand-dark text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                  Most Popular for Jobs & Nurses
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                    course.popular ? 'bg-slate-800 text-brand-gold' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {course.duration}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                    course.popular ? 'bg-brand-gold/20 text-brand-lightGold' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {course.badge}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl sm:text-3xl font-black text-brand-gold">{course.regularPrice}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Regular Course Fee</span>
                </div>

                <h3 className="text-xl font-bold mb-2">{course.level}</h3>
                <p className={`text-xs mb-6 leading-relaxed ${course.popular ? 'text-slate-300' : 'text-slate-600'}`}>
                  {course.desc}
                </p>

                <ul className="space-y-2.5 mb-6">
                  {course.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start space-x-2 text-xs">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${course.popular ? 'text-brand-gold' : 'text-brand-navy'}`} />
                      <span className={course.popular ? 'text-slate-200' : 'text-slate-700'}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={scrollToEnquiry}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition ${
                  course.popular
                    ? 'bg-gradient-to-r from-brand-gold to-amber-400 hover:from-brand-lightGold hover:to-amber-300 text-brand-dark font-bold shadow-md'
                    : 'bg-brand-navy hover:bg-brand-dark text-white'
                }`}
              >
                Enroll in {course.level}
              </button>
            </div>
          ))}
        </div>

        {/* Course Bundles & Pricing Table */}
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl border border-slate-800 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-10 relative z-10">
            <span className="text-xs font-bold text-brand-gold tracking-widest uppercase bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/30">
              Special Multi-Level Packages
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold mt-3">Course Bundles & Special Offers</h3>
            <p className="text-slate-400 text-sm mt-2">Book complete linguistic levels upfront to secure maximum fee discounts and guaranteed batch timings.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {packages.map((pkg, pIdx) => (
              <div
                key={pIdx}
                className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ${
                  pkg.featured
                    ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-brand-gold shadow-2xl relative scale-100 md:scale-105 ring-4 ring-brand-gold/20'
                    : 'bg-slate-800/80 border border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {pkg.featured && (
                  <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-brand-gold via-amber-400 to-amber-500 text-brand-dark text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-brand-dark" />
                    <span>SPECIAL COMBO OFFER</span>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-brand-gold font-semibold uppercase">{pkg.duration}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      pkg.featured ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {pkg.badge}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-2">{pkg.name}</h4>
                  <p className="text-xs text-slate-400 mb-4">{pkg.desc}</p>

                  <div className="my-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-300 font-semibold">Regular Fee:</span>
                      <span className={`font-black tracking-tight ${
                        pkg.featured ? 'text-3xl sm:text-4xl text-brand-gold' : 'text-2xl text-white'
                      }`}>
                        {pkg.regularPrice}
                      </span>
                    </div>
                    {pkg.featured && (
                      <div className="mt-2 text-center bg-brand-gold/20 text-brand-lightGold text-[11px] font-bold py-1 rounded-md border border-brand-gold/30">
                        ₹45,999 Complete Combo Package (A1 + A2 + B1)
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={scrollToEnquiry}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center space-x-2 mt-4 ${
                    pkg.featured
                      ? 'bg-gradient-to-r from-brand-gold to-amber-400 hover:from-brand-lightGold hover:to-amber-300 text-brand-dark shadow-lg shadow-brand-gold/20'
                      : 'bg-slate-700 hover:bg-brand-gold hover:text-brand-dark text-white'
                  }`}
                >
                  <span>Select {pkg.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center text-xs text-slate-400 max-w-xl mx-auto">
            * Note: All fee offers are valid for upcoming online and offline batches at our Anantapur Center & online cohorts. Study material, mock exams, and certification prep included.
          </div>
        </div>

      </div>
    </section>
  );
}
