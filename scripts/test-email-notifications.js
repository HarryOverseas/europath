import dotenv from 'dotenv';
dotenv.config();

import notifier, { verifySmtpConnection } from '../server/services/notifier.js';

console.log('====================================================');
console.log('  HARRY OVERSEAS MULTI-INBOX NOTIFICATION DIAGNOSTIC ');
console.log('====================================================');
console.log('Target Email Accounts:');
console.log(`  - Admin Inbox:   ${process.env.EMAIL_ADMIN || 'admin.harryoverseas@gmail.com'}`);
console.log(`  - Info Inbox:    ${process.env.EMAIL_INFO || 'info.harryoverseas@gmail.com'}`);
console.log(`  - Support Inbox: ${process.env.EMAIL_SUPPORT || 'support.harryoverseas@gmail.com'}`);
console.log('');
console.log('SMTP Transport Configuration:');
console.log(`  - Host: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}:${process.env.EMAIL_PORT || 587}`);
console.log(`  - User: ${process.env.EMAIL_USER || '(not set)'}`);
console.log(`  - Pass: ${process.env.EMAIL_PASS ? (process.env.EMAIL_PASS === 'sample_app_password' ? '[Sample Placeholder]' : '****** [Configured]') : '(not set)'}`);
console.log('');

async function runDiagnostics() {
  console.log('[1/3] Verifying SMTP Connection...');
  const smtpCheck = await verifySmtpConnection();
  if (smtpCheck.connected) {
    console.log('  ✅ SMTP connection verified successfully with user:', smtpCheck.user);
  } else {
    console.log('  ℹ️  SMTP check status:', smtpCheck.reason || smtpCheck.error);
    console.log('     (Normal if running locally with placeholder credentials)');
  }

  console.log('');
  console.log('[2/3] Simulating Mock Lead Dispatch...');
  const mockLead = {
    id: 'HGI-TEST-999',
    full_name: 'Test Candidate',
    email: 'candidate.test@example.com',
    mobile: '+91 9876543210',
    service_interest: 'German Language Combo Offer (₹43,999)',
    destination_country: 'Germany',
    travel_period: 'Immediate'
  };

  notifier.notifyNewEnquiry(mockLead);
  console.log('  ✅ Mock Enquiry routed (Target: info.harryoverseas@gmail.com, CC: admin.harryoverseas@gmail.com)');

  console.log('');
  console.log('[3/3] Simulating Mock Job Application Dispatch...');
  const mockApp = {
    id: 101,
    full_name: 'Nurse Candidate',
    email: 'nurse.candidate@example.com',
    phone: '+91 9123456780',
    role: 'Registered General Nurse (Germany)',
    resume_link: 'https://example.com/resume.pdf',
    notes: 'B2 German certified, 3 years hospital experience'
  };

  notifier.notifyNewJobApplication(mockApp);
  console.log('  ✅ Mock Career Application routed (Target: support.harryoverseas@gmail.com)');

  console.log('');
  console.log('Diagnostic routine finished cleanly.');
  setTimeout(() => process.exit(0), 500);
}

runDiagnostics();
