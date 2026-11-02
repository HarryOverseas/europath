import React from 'react';
import { BookOpen, Check, Star, ArrowRight } from 'lucide-react';

export default function LanguageAcademy() {
  const courses = [
    {
      level: "German A1",
      duration: "2–3 months",
      fee: "₹9,999",
      popular: false,
      desc: "Beginner level. Essential for spouse reunion visas and basic daily communication in Germany.",
      features: ["Grammar & Vocabulary", "Speaking & Listening Practice", "Exam Preparation (Goethe/Telc)"]
    },
    {
      level: "German A2",
      duration: "2–3 months",
      fee: "₹11,999",
      popular: false,
      desc: "Elementary level. Understand sentences and frequently used expressions related to areas of most immediate relevance.",
      features: ["Advanced Sentence Structure", "Interactive Conversations", "Mock Tests & Evaluation"]
    },
    {
      level: "German B1",
      duration: "3–4 months",
      fee: "₹14,999",
      popular: true,
      desc: "Intermediate level. Required for many vocational training paths and professional integration.",
      features: ["Complex Grammar & Writing", "Professional Workplace German", "Extensive Speaking Drills"]
    },
    {
      level: "German B2",
      duration: "3–4 months",
      fee: "₹17,999",
      popular: false,
      desc: "Upper intermediate level. Necessary for university studies in German and specialized professional careers.",
      features: ["Academic & Technical German", "Advanced Fluency Training", "Official Certification Prep"]
    }
  ];

  const packages = [
    {
      name: "A1 + A2 Bundle",
      duration: "4–5 months",
      fee: "₹19,999",
      savings: "Save ₹2,000"
    },
    {
      name: "A1 + A2 + B1 Bundle",
      duration: "7–8 months",
      fee: "₹32,999",
      savings: "Save ₹3,997"
    },
    {
      name: "Complete Mastery (A1 to B2)",
      duration: "10–12 months",
      fee: "₹44,999",
      savings: "Save ₹7,497 (Best Value)"
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
          <span className="text-brand-navy font-semibold text-sm uppercase tracking-widest bg-brand-navy/10 px-3.5 py-1.5 rounded-full">
            Harry German Language Academy
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">
            Master German from A1 to B2
          </h2>
          <p className="text-slate-600 mt-3 text-base sm:text-lg">
            Expert trainers, structured curriculum, online & offline classes tailored for students, job seekers, and spouses.
          </p>
        </div>

        {/* Individual Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {courses.map((course, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 flex flex-col justify-between transition border ${
                course.popular
                  ? 'bg-brand-dark text-white border-brand-gold shadow-xl relative'
                  : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300'
              }`}
            >
              {course.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brand-gold text-brand-dark text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular for Jobs
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                    course.popular ? 'bg-slate-800 text-brand-gold' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {course.duration}
                  </span>
                  <span className="text-2xl font-black text-brand-gold">{course.fee}</span>
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
                    ? 'bg-brand-gold hover:bg-brand-lightGold text-brand-dark'
                    : 'bg-brand-navy hover:bg-brand-dark text-white'
                }`}
              >
                Enroll in {course.level}
              </button>
            </div>
          ))}
        </div>

        {/* Course Bundles & Pricing Table */}
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl border border-slate-800">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-brand-gold tracking-widest uppercase bg-brand-gold/10 px-3 py-1 rounded-full">
              Value Bundles
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold mt-3">Multi-Level Course Packages</h3>
            <p className="text-slate-400 text-sm mt-2">Save more when you book your complete linguistic roadmap upfront.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg, pIdx) => (
              <div key={pIdx} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-brand-gold font-semibold uppercase">{pkg.duration}</span>
                    <span className="text-xs bg-emerald-900/60 text-emerald-300 px-2.5 py-1 rounded-full font-medium">{pkg.savings}</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{pkg.name}</h4>
                  <div className="text-3xl font-extrabold text-brand-gold my-4">{pkg.fee}</div>
                </div>

                <button
                  onClick={scrollToEnquiry}
                  className="w-full bg-slate-700 hover:bg-brand-gold hover:text-brand-dark text-white py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center space-x-2"
                >
                  <span>Select Package</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center text-xs text-slate-400">
            * Note: Fees and durations are proposed estimates subject to batch schedule confirmation. Flexible weekend and weekday batches available.
          </div>
        </div>

      </div>
    </section>
  );
}
