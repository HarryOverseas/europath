import React, { useState } from 'react';
import { Globe, Phone, Mail, MapPin, ShieldAlert } from 'lucide-react';

interface LegalFooterProps {
  onNavigate?: (view: 'public' | 'careers' | 'admin', sectionId?: string) => void;
}

export default function LegalFooter({ onNavigate }: LegalFooterProps = {}) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <footer className="bg-brand-dark text-white border-t border-slate-800">

      {/* Top Footer with Contact & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center text-brand-dark">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white block">Harry Overseas</span>
                <span className="text-[10px] text-brand-gold tracking-widest uppercase font-semibold">Immigration & Language</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Your trusted partner for Germany visa consultancy, German language training (A1-B2), and arrival assistance. Managed between Germany and Anantapur.
            </p>
          </div>

          {/* Contact Column */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-brand-gold">Contact Office</h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                <span>Near JNTU University, Anantapur, Andhra Pradesh, India</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-brand-gold flex-shrink-0" />
                <a href="tel:+916302951891" className="hover:text-white">+91 6302951891</a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-brand-gold flex-shrink-0" />
                <a href="mailto:hkrishna014@gmail.com" className="hover:text-white">hkrishna014@gmail.com</a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-brand-gold">Quick Links</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('public', 'services');
                    } else {
                      window.location.hash = 'services';
                    }
                  }}
                  className="hover:text-brand-gold transition text-left"
                >
                  Immigration Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('public', 'academy');
                    } else {
                      window.location.hash = 'academy';
                    }
                  }}
                  className="hover:text-brand-gold transition text-left"
                >
                  German Language Academy
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('public', 'arrival');
                    } else {
                      window.location.hash = 'arrival';
                    }
                  }}
                  className="hover:text-brand-gold transition text-left"
                >
                  Arrival Assistance
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('public', 'enquiry');
                    } else {
                      window.location.hash = 'enquiry';
                    }
                  }}
                  className="hover:text-brand-gold transition text-left"
                >
                  Enquiry Form
                </button>
              </li>
              <li>
                <a
                  href="/feed.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-gold transition text-left flex items-center space-x-1"
                >
                  <span>RSS Feed (XML)</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Policies */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-brand-gold">Legal & Policies</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><button onClick={() => setActiveModal('privacy')} className="hover:text-brand-gold transition text-left">Privacy Policy</button></li>
              <li><button onClick={() => setActiveModal('terms')} className="hover:text-brand-gold transition text-left">Terms & Conditions</button></li>
              <li><button onClick={() => setActiveModal('refund')} className="hover:text-brand-gold transition text-left">Refund & Cancellation Policy</button></li>
              <li><button onClick={() => setActiveModal('disclaimer')} className="hover:text-brand-gold transition text-left">Visa Consultancy Disclaimer</button></li>
            </ul>
          </div>

        </div>

        {/* Disclaimer Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-400 space-y-2">
          <p>
            <strong>Disclaimer:</strong> Harry Overseas Immigration is an independent consultancy and language training provider. Visa decisions are solely at the discretion of the respective embassies and government authorities. We do not guarantee visa approvals.
          </p>
          <p>© {new Date().getFullYear()} Harry Overseas Immigration. All rights reserved. • Tagline: Your Global Journey Starts Here.</p>
        </div>
      </div>

      {/* Modal Popup for Legal Policies */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto shadow-2xl relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-6">
              <h3 className="text-xl font-bold text-slate-900 capitalize">
                {activeModal === 'privacy' && 'Privacy Policy'}
                {activeModal === 'terms' && 'Terms & Conditions'}
                {activeModal === 'refund' && 'Refund & Cancellation Policy'}
                {activeModal === 'disclaimer' && 'Visa Consultancy Disclaimer'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              {activeModal === 'privacy' && (
                <>
                  <p>At Harry Overseas Immigration, we respect your privacy and protect your personal information with strict confidentiality.</p>
                  <p><strong>Information Collection:</strong> We collect contact details, academic background, and visa preferences solely for the purpose of immigration assessment and language training enrolment.</p>
                  <p><strong>Data Security:</strong> Your data is stored securely and never sold or shared with unauthorized third parties.</p>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <p>By engaging Harry Overseas Immigration for consultancy or German language courses, you agree to provide accurate and authentic documents.</p>
                  <p><strong>Service Scope:</strong> We provide expert guidance, document checklists, application preparation, and language instruction. Final visa outcomes rest entirely with government immigration authorities.</p>
                </>
              )}

              {activeModal === 'refund' && (
                <>
                  <p><strong>Consultancy Fees:</strong> Service fees paid for consultancy or language training are subject to our service agreement terms.</p>
                  <p><strong>Non-Refundable Government Fees:</strong> Visa application fees, embassy fees, and third-party charges paid directly to authorities are strictly non-refundable.</p>
                </>
              )}

              {activeModal === 'disclaimer' && (
                <>
                  <p>Harry Overseas Immigration operates independently and is not an official branch of any German or European government embassy.</p>
                  <p>We provide professional guidance, application preparation, and language training. No consultancy can guarantee visa issuance, as approvals are decided solely by visa officers based on individual applicant credentials.</p>
                </>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200 text-right">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-brand-navy text-white px-6 py-2.5 rounded-xl font-semibold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </footer>
  );
}
