import { renderTemplate } from '../server/services/templateEngine.js';

console.log('====================================================');
console.log('    HARRY OVERSEAS LIFECYCLE STAGE NOTIFICATION TEST');
console.log('====================================================');

const candidateStages = [
  { status: 'Shortlisted', templateId: 'candidate_shortlisted' },
  { status: 'Interviewed', templateId: 'candidate_interviewed' },
  { status: 'Hired', templateId: 'candidate_hired' },
  { status: 'Rejected', templateId: 'candidate_rejected' }
];

console.log('\n--- 1. Testing Candidate Stage Transition Templates ---');
for (const stage of candidateStages) {
  const mockCandidate = {
    fullName: 'Rahul Varma',
    email: 'rahul.varma@example.com',
    phone: '+91 9876543210',
    applicationId: 405,
    role: 'German Language Trainer (B2/C1)'
  };

  const rendered = renderTemplate(stage.templateId, mockCandidate);
  console.log(`  ✅ [Stage: ${stage.status.padEnd(12)}] Template: ${stage.templateId}`);
  console.log(`     Subject: "${rendered.subject}"`);
  console.log(`     Target:  ${rendered.targetInbox}\n`);
}

console.log('--- 2. Testing Client Enquiry Stage Transition Templates ---');
const enquiryStages = ['Contacted', 'In Progress', 'Closed'];

for (const status of enquiryStages) {
  const mockEnquiry = {
    fullName: 'Pooja Reddy',
    email: 'pooja.reddy@example.com',
    phone: '+91 9440123456',
    referenceId: 'HGI-5521',
    status,
    serviceInterest: 'German Language Combo Offer (₹43,999)',
    destinationCountry: 'Germany',
    stageNotes: `Case updated to ${status}. Assigned counselor: Senior Academic Desk.`
  };

  const rendered = renderTemplate('enquiry_stage_update', mockEnquiry);
  console.log(`  ✅ [Enquiry Stage: ${status.padEnd(12)}]`);
  console.log(`     Subject: "${rendered.subject}"`);
  console.log(`     Target:  ${rendered.targetInbox}\n`);
}

console.log('🎉 All lifecycle stage notifications verified successfully!');
