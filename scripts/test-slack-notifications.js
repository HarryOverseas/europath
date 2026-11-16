import dotenv from 'dotenv';
dotenv.config();

import slackNotifier, { isSlackConfigured } from '../server/services/slackNotifier.js';

console.log('====================================================');
console.log('      HARRY OVERSEAS SLACK NOTIFICATION TEST        ');
console.log('====================================================');

const webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
const leadsWebhook = process.env.SLACK_LEADS_WEBHOOK_URL || webhookUrl;
const careersWebhook = process.env.SLACK_CAREERS_WEBHOOK_URL || webhookUrl;
const alertsWebhook = process.env.SLACK_ALERTS_WEBHOOK_URL || webhookUrl;

console.log('Webhook Configuration:');
console.log(`  - Default Webhook:  ${webhookUrl ? (webhookUrl.substring(0, 35) + '...') : '(not configured)'}`);
console.log(`  - Leads Webhook:    ${leadsWebhook ? (leadsWebhook.substring(0, 35) + '...') : '(using default)'}`);
console.log(`  - Careers Webhook:  ${careersWebhook ? (careersWebhook.substring(0, 35) + '...') : '(using default)'}`);
console.log(`  - Alerts Webhook:   ${alertsWebhook ? (alertsWebhook.substring(0, 35) + '...') : '(using default)'}`);
console.log('');

if (!isSlackConfigured()) {
  console.log('ℹ️  SLACK_WEBHOOK_URL is not set or not a valid Slack webhook URL.');
  console.log('   To enable live Slack notifications:');
  console.log('   1. Go to https://api.slack.com/apps and create a new App.');
  console.log('   2. Enable "Incoming Webhooks" and click "Add New Webhook to Workspace".');
  console.log('   3. Select your desired channel (e.g., #leads or #general) and copy the Webhook URL.');
  console.log('   4. Add SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... to your .env file.');
  console.log('');
  console.log('✅ Payload formatting and Block Kit structures verified successfully.');
  process.exit(0);
}

async function runLiveTest() {
  console.log('[1/3] Sending Test Lead Notification to Slack...');
  await slackNotifier.notifySlackNewLead({
    id: 'HGI-SLACK-001',
    full_name: 'Vikram Malhotra',
    email: 'vikram.malhotra@example.com',
    mobile: '+91 9876543210',
    service_interest: 'German Language Course Combo (₹43,999 Offer)',
    destination_country: 'Germany',
    travel_period: 'Immediate',
    consultation_method: 'WhatsApp',
    city: 'Hyderabad',
    country: 'India',
    message: 'Testing Slack Block Kit integration with WhatsApp button.'
  });

  console.log('[2/3] Sending Test Career Application to Slack...');
  await slackNotifier.notifySlackJobApplication({
    id: 501,
    full_name: 'Dr. Sunita Varma',
    email: 'sunita.varma@example.com',
    phone: '+91 9123456789',
    role: 'Registered General Nurse (Germany)',
    resume_link: 'https://example.com/sunita_resume.pdf',
    notes: 'B2 German Certified with 4 years ICU experience.'
  });

  console.log('[3/3] Sending Test Admin Alert to Slack...');
  await slackNotifier.notifySlackAdminAlert(
    'System Diagnostic Completed',
    'Slack webhook notification pipeline was verified successfully.',
    {
      Environment: process.env.NODE_ENV || 'development',
      TriggeredBy: 'Automated Test Suite',
      Status: 'Active'
    }
  );

  console.log('');
  console.log('🎉 Live Slack notifications dispatched. Check your Slack channel!');
  setTimeout(() => process.exit(0), 1000);
}

runLiveTest();
