/**
 * Slack Notification Service for Harry Overseas
 * Uses Slack Incoming Webhooks with Block Kit for rich, interactive alerts.
 * Supports channel routing:
 * - Leads & Enquiries: SLACK_LEADS_WEBHOOK_URL || SLACK_WEBHOOK_URL
 * - Job Applications:  SLACK_CAREERS_WEBHOOK_URL || SLACK_WEBHOOK_URL
 * - Security & Alerts: SLACK_ALERTS_WEBHOOK_URL || SLACK_WEBHOOK_URL
 */

/**
 * Checks whether Slack webhook is configured
 */
export function isSlackConfigured(customWebhookUrl) {
  const url = customWebhookUrl ||
              process.env.SLACK_LEADS_WEBHOOK_URL ||
              process.env.SLACK_CAREERS_WEBHOOK_URL ||
              process.env.CAREER_WEBHOOK_URL ||
              process.env.CAREERS_WEBHOOK_URL ||
              process.env.SLACK_ALERTS_WEBHOOK_URL ||
              process.env.SLACK_WEBHOOK_URL;

  if (!url || typeof url !== 'string' || !url.startsWith('https://hooks.slack.com/')) {
    return false;
  }
  return true;
}

/**
 * Sends a Block Kit payload to a Slack Webhook
 */
async function postToSlack(webhookUrl, payload) {
  if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
    return { success: false, reason: 'Slack webhook not configured or invalid URL' };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[SlackNotifier] Webhook responded with status ${res.status}: ${errText}`);
      return { success: false, status: res.status, error: errText };
    }

    return { success: true };
  } catch (err) {
    console.error('[SlackNotifier] Network error sending to Slack:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 1. Dispatch New Lead / Enquiry to Slack
 */
export async function notifySlackNewLead(lead) {
  setTimeout(async () => {
    const webhookUrl = process.env.SLACK_LEADS_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
    if (!isSlackConfigured(webhookUrl)) {
      return;
    }

    const services = lead.service_interest || lead.language_course || 'European Immigration Consultation';
    const isUrgent = lead.travel_period === 'Immediate' || (services && /nurse|nursing/i.test(services));
    const phone = lead.mobile || lead.phone || 'Not provided';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: isUrgent ? '⚡ [URGENT] New Client Enquiry Received' : '🌟 New Client Enquiry Received',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Reference:* \`#${lead.id}\`\n*Service of Interest:* *${services}*\n*Destination:* ${lead.destination_country || 'Germany'}`
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Client Name:*\n${lead.full_name}` },
          { type: 'mrkdwn', text: `*Contact Number:*\n<tel:${phone}|${phone}>` },
          { type: 'mrkdwn', text: `*Email Address:*\n<mailto:${lead.email}|${lead.email}>` },
          { type: 'mrkdwn', text: `*Location:*\n${lead.city || 'Anantapur'}, ${lead.country || 'India'}` },
          { type: 'mrkdwn', text: `*Timeline:*\n${lead.travel_period || 'Immediate'}` },
          { type: 'mrkdwn', text: `*Preferred Mode:*\n${lead.consultation_method || 'WhatsApp'}` }
        ]
      }
    ];

    if (lead.additional_reqs || lead.message) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Client Notes:*\n>${lead.additional_reqs || lead.message}`
        }
      });
    }

    // Action buttons
    const elements = [];
    if (cleanPhone) {
      elements.push({
        type: 'button',
        text: { type: 'plain_text', text: '💬 WhatsApp Client', emoji: true },
        url: `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(lead.full_name)},%20this%20is%20Harry%20Overseas%20regarding%20your%20enquiry%20%23${lead.id}`,
        style: 'primary'
      });
    }
    if (lead.email) {
      elements.push({
        type: 'button',
        text: { type: 'plain_text', text: '✉️ Send Email', emoji: true },
        url: `mailto:${lead.email}?subject=Harry%20Overseas%20Enquiry%20%23${lead.id}`
      });
    }

    if (elements.length > 0) {
      blocks.push({
        type: 'actions',
        elements
      });
    }

    const payload = {
      text: `New Lead: ${lead.full_name} (${services}) - Ref #${lead.id}`,
      blocks
    };

    const res = await postToSlack(webhookUrl, payload);
    if (res.success) {
      console.log(`[SlackNotifier] Lead notification #${lead.id} sent to Slack`);
    }
  }, 50);
}

/**
 * Dispatches raw JSON payload to generic custom webhook if configured (e.g. ATS, CRM, Zapier)
 */
async function dispatchGenericCareerWebhook(application) {
  const genericUrl = process.env.CAREER_WEBHOOK_URL || process.env.CAREERS_WEBHOOK_URL;
  if (!genericUrl || typeof genericUrl !== 'string' || !genericUrl.startsWith('http')) {
    return;
  }
  // If it's already a Slack webhook, it is handled by postToSlack
  if (genericUrl.startsWith('https://hooks.slack.com/')) {
    return;
  }

  try {
    const payload = {
      event: 'career_application.created',
      timestamp: new Date().toISOString(),
      application: {
        id: application.id,
        full_name: application.full_name,
        email: application.email,
        phone: application.phone,
        role: application.role,
        resume_link: application.resume_link || '',
        notes: application.notes || '',
        status: application.status || 'New',
        created_at: application.created_at || new Date().toISOString()
      }
    };

    const res = await fetch(genericUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      console.log(`[CareerWebhook] Generic webhook dispatched successfully to ${genericUrl.substring(0, 30)}...`);
    } else {
      console.warn(`[CareerWebhook] Generic webhook responded with status ${res.status}`);
    }
  } catch (err) {
    console.error('[CareerWebhook] Error dispatching generic webhook:', err.message);
  }
}

/**
 * 2. Dispatch Job Application to Slack & Career Webhooks
 */
export async function notifySlackJobApplication(application) {
  setTimeout(async () => {
    // 1. Generic ATS/CRM Webhook (if non-Slack CAREER_WEBHOOK_URL is set)
    dispatchGenericCareerWebhook(application);

    // 2. Slack Block Kit Webhook
    const webhookUrl = process.env.SLACK_CAREERS_WEBHOOK_URL ||
                       process.env.CAREER_WEBHOOK_URL ||
                       process.env.CAREERS_WEBHOOK_URL ||
                       process.env.SLACK_WEBHOOK_URL;

    if (!isSlackConfigured(webhookUrl)) {
      return;
    }

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '💼 New Career Application Submitted',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Application ID:* \`#${application.id}\`\n*Role Applied For:* *${application.role}*`
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Candidate Name:*\n${application.full_name}` },
          { type: 'mrkdwn', text: `*Role:*\n${application.role}` },
          { type: 'mrkdwn', text: `*Email:*\n<mailto:${application.email}|${application.email}>` },
          { type: 'mrkdwn', text: `*Phone:*\n<tel:${application.phone}|${application.phone}>` }
        ]
      }
    ];

    if (application.notes) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Candidate Statement:*\n>${application.notes}`
        }
      });
    }

    const elements = [];
    if (application.resume_link && application.resume_link.startsWith('http')) {
      elements.push({
        type: 'button',
        text: { type: 'plain_text', text: '📄 View Resume', emoji: true },
        url: application.resume_link,
        style: 'primary'
      });
    }
    elements.push({
      type: 'button',
      text: { type: 'plain_text', text: '✉️ Contact Candidate', emoji: true },
      url: `mailto:${application.email}?subject=Harry%20Overseas%20Application%20%23${application.id}`
    });

    blocks.push({
      type: 'actions',
      elements
    });

    const payload = {
      text: `New Career Application: ${application.full_name} for ${application.role} (#${application.id})`,
      blocks
    };

    const res = await postToSlack(webhookUrl, payload);
    if (res.success) {
      console.log(`[SlackNotifier] Career application #${application.id} sent to Slack`);
    }
  }, 50);
}

/**
 * 3. Dispatch Admin & Security Alerts to Slack
 */
export async function notifySlackAdminAlert(subject, message, details = {}) {
  setTimeout(async () => {
    const webhookUrl = process.env.SLACK_ALERTS_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
    if (!isSlackConfigured(webhookUrl)) {
      return;
    }

    const detailFields = Object.entries(details).map(([key, val]) => ({
      type: 'mrkdwn',
      text: `*${key}:*\n${typeof val === 'object' ? JSON.stringify(val) : val}`
    }));

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🛡️ Security Alert: ${subject}`,
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${message}\n_Timestamp: ${new Date().toISOString()}_`
        }
      }
    ];

    if (detailFields.length > 0) {
      blocks.push({
        type: 'divider'
      });
      blocks.push({
        type: 'section',
        fields: detailFields.slice(0, 8)
      });
    }

    const payload = {
      text: `[Admin Security Alert] ${subject}: ${message}`,
      blocks
    };

    const res = await postToSlack(webhookUrl, payload);
    if (res.success) {
      console.log(`[SlackNotifier] Admin alert dispatched to Slack: ${subject}`);
    }
  }, 50);
}

/**
 * 4. Dispatch Stage / Status Lifecycle Update to Slack
 */
export async function notifySlackStageChange(type, item, previousStatus, newStatus, actor = 'Admin', notes = '') {
  setTimeout(async () => {
    const isEnquiry = type === 'enquiry';
    const webhookUrl = isEnquiry
      ? (process.env.SLACK_LEADS_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL)
      : (process.env.SLACK_CAREERS_WEBHOOK_URL || process.env.CAREER_WEBHOOK_URL || process.env.CAREERS_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL);

    if (!isSlackConfigured(webhookUrl)) {
      return;
    }

    const name = item.full_name || item.fullName || 'Record';
    const id = item.id;
    const roleOrService = item.role || item.service_interest || item.language_course || 'Immigration Consultation';
    const phone = item.phone || item.mobile || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: isEnquiry ? '🔄 Client Enquiry Stage Progress' : '🔄 Candidate Status Transition',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${name}* (#${id}) transitioned from \`${previousStatus || 'New'}\` ➔ *${newStatus}*`
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Previous Status:*\n${previousStatus || 'New'}` },
          { type: 'mrkdwn', text: `*New Status:*\n*${newStatus}*` },
          { type: 'mrkdwn', text: `*Subject / Role:*\n${roleOrService}` },
          { type: 'mrkdwn', text: `*Updated By:*\n${actor || 'Admin Portal'}` }
        ]
      }
    ];

    if (notes) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Stage Notes:*\n>${notes}`
        }
      });
    }

    const elements = [];
    if (cleanPhone) {
      elements.push({
        type: 'button',
        text: { type: 'plain_text', text: '💬 WhatsApp', emoji: true },
        url: `https://wa.me/${cleanPhone}`,
        style: 'primary'
      });
    }
    if (item.email) {
      elements.push({
        type: 'button',
        text: { type: 'plain_text', text: '✉️ Send Email', emoji: true },
        url: `mailto:${item.email}`
      });
    }

    if (elements.length > 0) {
      blocks.push({
        type: 'actions',
        elements
      });
    }

    const payload = {
      text: `[Stage Update] ${name} is now ${newStatus} (Updated by ${actor})`,
      blocks
    };

    const res = await postToSlack(webhookUrl, payload);
    if (res.success) {
      console.log(`[SlackNotifier] Stage update for #${id} (${newStatus}) sent to Slack`);
    }
  }, 50);
}

/**
 * 5. Dispatch Data Archival Summary to Slack
 */
export async function notifySlackArchivalSummary({
  enquiriesCount = 0,
  applicationsCount = 0,
  daysThreshold = 90,
  type = 'automated'
} = {}) {
  const webhookUrl = process.env.SLACK_ALERTS_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (!isSlackConfigured(webhookUrl)) return;

  const totalArchived = enquiriesCount + applicationsCount;
  const isAutomated = type === 'automated';

  const payload = {
    text: `📦 [Data Archival] ${isAutomated ? 'Daily Automated' : 'Manual'} Archival Completed: ${totalArchived} records archived (${daysThreshold}+ days old)`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📦 Data Archival Report (${daysThreshold}+ Days)`,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Execution:*\n${isAutomated ? '⏰ Daily Automated Scheduler' : '👤 Manual Admin Execution'}` },
          { type: 'mrkdwn', text: `*Threshold:*\nOlder than ${daysThreshold} Days` },
          { type: 'mrkdwn', text: `*Archived Enquiries:*\n\`${enquiriesCount}\` records` },
          { type: 'mrkdwn', text: `*Archived Candidates:*\n\`${applicationsCount}\` records` }
        ]
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `🗄️ *Harry Overseas Compliance & Data Retention Engine* • ${new Date().toLocaleString()}` }
        ]
      }
    ]
  };

  const res = await postToSlack(webhookUrl, payload);
  if (res.success) {
    console.log(`[SlackNotifier] Archival summary alert dispatched to Slack.`);
  }
}

export default {
  isSlackConfigured,
  notifySlackNewLead,
  notifySlackJobApplication,
  notifySlackAdminAlert,
  notifySlackStageChange,
  notifySlackArchivalSummary
};
