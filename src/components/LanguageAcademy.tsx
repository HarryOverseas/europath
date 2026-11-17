import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  Star,
  ArrowRight,
  Sparkles,
  Smartphone,
  Headphones,
  Award,
  Zap,
  ShieldCheck,
  Download,
  Flame
} from 'lucide-react';

export default function LanguageAcademy() {
  const [includeAppMap, setIncludeAppMap] = useState<Record<string, boolean>>({});

  const courses = [
    {
      level: "German A1",
      duration: "2–3 months",
      regularPrice: "₹14,999",
      appPrice: "₹1,000",
      totalWithApp: "₹15,999",
      badge: "Beginner",
      popular: false,
      desc: "Beginner level. Essential for spouse reunion visas and basic daily communication in Germany.",
      features: [
        "Grammar & Vocabulary Fundamentals",
        "Speaking & Listening Practice",
        "Goethe / Telc A1 Exam Preparation",
        "Study Material & Audio Drills",
        "Optional Lifetime App Access (+₹1,000)"
      ]
    },
    {
      level: "German A2",
      duration: "2–3 months",
      regularPrice: "₹15,999",
      appPrice: "₹3,000",
      totalWithApp: "₹18,999",
      badge: "Elementary",
      popular: false,
      desc: "Elementary level. Understand sentences and expressions related to areas of immediate relevance.",
      features: [
        "Advanced Sentence Structure",
        "Interactive Conversations",
        "Mock Tests & Evaluation",
        "Workplace Communication Basics",
        "Optional Lifetime App Access (+₹3,000)"
      ]
    },
    {
      level: "German B1",
      duration: "3–4 months",
      regularPrice: "₹17,999",
      appPrice: "₹3,000",
      totalWithApp: "₹20,999",
      badge: "Recommended",
      popular: true,
      desc: "Intermediate level. Required for nursing recruitment in Germany, vocational training (Ausbildung), and job seekers.",
      features: [
        "Complex Grammar & Writing",
        "Medical & Workplace Professional German",
        "Extensive Speaking Drills",
        "Telc / Goethe B1 Certificate Prep",
        "Optional Lifetime App Access (+₹3,000)"
      ]
    },
    {
      level: "German B2",
      duration: "3–4 months",
      regularPrice: "₹21,999",
      appPrice: "₹5,000",
      totalWithApp: "₹26,999",
      badge: "Advanced",
      popular: false,
      desc: "Upper intermediate level. Necessary for nurse license recognition (Anerkennung) and specialized university courses.",
      features: [
        "Academic & Technical German",
        "Advanced Fluency & Nuance Training",
        "Hospital & Clinical Scenarios",
        "Official B2 Certification Prep",
        "Optional Lifetime App Access (+₹5,000)"
      ]
    }
  ];

  const packages = [
    {
      name: "A1 + A2 Foundation Bundle",
      duration: "4–5 months",
      regularPrice: "₹30,999",
      appPrice: "₹3,500",
      totalWithApp: "₹34,499",
      badge: "Beginner Package",
      featured: false,
      desc: "Ideal for beginners aiming for basic fluency and spouse visa requirements."
    },
    {
      name: "A1 + A2 + B1 Complete Combo",
      duration: "7–8 months",
      regularPrice: "₹45,999",
      appPrice: "₹5,000",
      totalWithApp: "₹50,999",
      badge: "🔥 Complete Combo",
      featured: true,
      desc: "The most recommended roadmap for nurses, healthcare professionals, opportunity card applicants, and job seekers."
    },
    {
      name: "Complete Mastery (A1 to B2)",
      duration: "10–12 months",
      regularPrice: "₹67,999",
      appPrice: "₹8,000",
      totalWithApp: "₹75,999",
      badge: "Full Professional",
      featured: false,
      desc: "Comprehensive linguistic roadmap up to full clinical and university fluency."
    }
  ];

  const appAddonTiers = [
    { level: "Level A1", price: "₹1,000", note: "Beginner vocab decks, alphabet drills, audio dialogues" },
    { level: "Levels A2 & B1", price: "₹3,000 each", note: "Workplace & clinical German, Telc/Goethe simulation" },
    { level: "Level B2", price: "₹5,000", note: "Advanced medical cases, clinical dialogues, thesis writing" },
    { level: "Complete Combo (A1–B1)", price: "₹5,000 bundle", note: "All-inclusive lifetime access for 3 levels (Save ₹2,000)" }
  ];

  const scrollToEnquiry = () => {
    const el = document.getElementById('enquiry');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleAppAccess = (key: string) => {
    setIncludeAppMap(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <section id="academy" className="py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
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
          {courses.map((course, idx) => {
            const hasApp = !!includeAppMap[course.level];
            const currentPrice = hasApp ? course.totalWithApp : course.regularPrice;

            return (
              <div
                key={idx}
                className={`rounded-2xl p-6 flex flex-col justify-between transition border ${
                  course.popular
                    ? 'bg-brand-dark text-white border-brand-gold shadow-xl relative ring-2 ring-brand-gold/30'
                    : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {course.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-brand-gold to-amber-500 text-brand-dark text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow whitespace-nowrap">
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

                  {/* Pricing Box */}
                  <div className="mb-4">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl sm:text-3xl font-black text-brand-gold">{currentPrice}</span>
                    </div>
                    <span className={`text-[11px] font-medium block mt-0.5 ${hasApp ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                      {hasApp ? `Includes Course + Lifetime App (+${course.appPrice})` : 'Regular Course Fee'}
                    </span>
                  </div>

                  {/* Optional Lifetime App Addon Toggle */}
                  <div
                    onClick={() => toggleAppAccess(course.level)}
                    className={`mb-5 p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between select-none ${
                      hasApp
                        ? (course.popular ? 'bg-brand-gold/20 border-brand-gold text-brand-lightGold' : 'bg-emerald-50 border-emerald-400 text-emerald-900')
                        : (course.popular ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300')
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Smartphone className={`w-3.5 h-3.5 flex-shrink-0 ${hasApp ? (course.popular ? 'text-brand-gold' : 'text-emerald-600') : 'text-slate-400'}`} />
                      <div className="text-[11px] font-bold leading-tight">
                        Lifetime App Access <span className="font-extrabold text-brand-gold">(+{course.appPrice})</span>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                      hasApp ? (course.popular ? 'bg-brand-gold border-brand-gold text-brand-dark' : 'bg-emerald-600 border-emerald-600 text-white') : 'border-slate-300 bg-white'
                    }`}>
                      {hasApp && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mb-2">{course.level}</h3>
                  <p className={`text-xs mb-5 leading-relaxed ${course.popular ? 'text-slate-300' : 'text-slate-600'}`}>
                    {course.desc}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {course.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start space-x-2 text-xs">
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${course.popular ? 'text-brand-gold' : 'text-brand-navy'}`} />
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
            );
          })}
        </div>

        {/* FEATURE HIGHLIGHT: LIFETIME APP ACCESS SHOWCASE */}
        <div className="mb-16 bg-gradient-to-br from-slate-900 via-brand-dark to-slate-900 rounded-3xl p-8 sm:p-12 text-white border border-brand-gold/30 shadow-2xl relative overflow-hidden">
          {/* Decorative ambient background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-navy/30 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 border-b border-slate-800 pb-8">
              <div>
                <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-gold tracking-widest uppercase bg-brand-gold/10 px-3.5 py-1.5 rounded-full border border-brand-gold/30 mb-3">
                  <Smartphone className="w-3.5 h-3.5 text-brand-gold" />
                  <span>Exclusive Mobile & Web Learning App</span>
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Add Lifetime App Access to Accelerate Your Fluency
                </h3>
                <p className="text-slate-300 text-sm mt-2 max-w-2xl">
                  Get 24/7 unlimited access to our German Learning Web & Mobile App for life. Practice vocabulary, listen to audio dialogues, take mock exams, and reinforce live lessons at your own pace.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-brand-gold/40 rounded-2xl p-4 sm:p-5 flex items-center space-x-4 flex-shrink-0 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-gold to-amber-500 text-brand-dark flex items-center justify-center font-black">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Add-on Rates</div>
                  <div className="text-base font-bold text-white">Starting from <span className="text-brand-gold font-black">+₹1,000</span></div>
                  <div className="text-[11px] text-emerald-400">One-time payment &bull; Lifetime validity</div>
                </div>
              </div>
            </div>

            {/* Feature Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 hover:border-brand-gold/40 transition">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center mb-3">
                  <Headphones className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Native Audio Drills</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Listen to hundreds of everyday conversational dialogues recorded by native speakers from Berlin & Munich.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 hover:border-brand-gold/40 transition">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">5,000+ Smart Flashcards</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Spaced-repetition vocabulary trainer organized by CEFR levels from A1 basics to professional B2 terminology.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 hover:border-brand-gold/40 transition">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center mb-3">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Goethe & Telc Mock Tests</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Full-length timed practice exams matching official Goethe-Institut and Telc exam formats with instant scoring.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 hover:border-brand-gold/40 transition">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center mb-3">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Offline Access & Sync</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Download lessons, cheat-sheets, and worksheets to study seamlessly without internet on mobile or tablet.
                </p>
              </div>
            </div>

            {/* Lifetime App Addon Pricing Table */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-brand-gold mb-3">
                Official Lifetime App Access Add-on Rates by Level:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {appAddonTiers.map((tier, tIdx) => (
                  <div key={tIdx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{tier.level}</div>
                      <div className="text-lg font-black text-brand-gold mt-1">+{tier.price}</div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2 leading-snug">{tier.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Course Bundles & Pricing Table */}
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl border border-slate-800 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-10 relative z-10">
            <span className="text-xs font-bold text-brand-gold tracking-widest uppercase bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/30">
              Special Multi-Level Packages
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold mt-3">Course Bundles</h3>
            <p className="text-slate-400 text-sm mt-2">
              Book complete linguistic levels upfront to secure guaranteed batch timings and curriculum continuity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {packages.map((pkg, pIdx) => {
              const hasApp = !!includeAppMap[pkg.name];
              const displayPrice = hasApp ? pkg.totalWithApp : pkg.regularPrice;

              return (
                <div
                  key={pIdx}
                  className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ${
                    pkg.featured
                      ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-brand-gold shadow-2xl relative scale-100 md:scale-105 ring-4 ring-brand-gold/20'
                      : 'bg-slate-800/80 border border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  {pkg.featured && (
                    <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-brand-gold via-amber-400 to-amber-500 text-brand-dark text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center space-x-1 whitespace-nowrap">
                      <Sparkles className="w-3.5 h-3.5 text-brand-dark" />
                      <span>RECOMMENDED COMBO</span>
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
                        <span className="text-xs text-slate-300 font-semibold">Course Fee:</span>
                        <span className={`font-black tracking-tight ${
                          pkg.featured ? 'text-3xl sm:text-4xl text-brand-gold' : 'text-2xl text-white'
                        }`}>
                          {displayPrice}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {hasApp ? `Includes Lifetime App Access (+${pkg.appPrice})` : 'Regular Course Package'}
                      </div>

                      {/* Addon Toggle inside Package */}
                      <div
                        onClick={() => toggleAppAccess(pkg.name)}
                        className={`mt-3 p-2.5 rounded-lg border cursor-pointer transition flex items-center justify-between text-xs select-none ${
                          hasApp
                            ? 'bg-brand-gold/20 border-brand-gold text-brand-lightGold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-brand-gold" />
                          <span>Include Lifetime App (+{pkg.appPrice})</span>
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          hasApp ? 'bg-brand-gold border-brand-gold text-brand-dark' : 'border-slate-600 bg-slate-800'
                        }`}>
                          {hasApp && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
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
              );
            })}
          </div>

          <div className="mt-10 text-center text-xs text-slate-400 max-w-xl mx-auto">
            * Note: All courses include interactive live sessions, digital study materials, and Goethe / Telc exam preparation. Lifetime app access is available as an optional add-on during enrolment.
          </div>
        </div>

      </div>
    </section>
  );
}
