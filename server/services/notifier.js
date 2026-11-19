import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { renderTemplate } from './templateEngine.js';
import { getConfig } from './configService.js';

dotenv.config();

/**
 * Multi-Inbox Email Notification Service
 * Dynamically resolves SMTP configuration from Database (ConfigService) with fallback to .env.
 * No server restart required when credentials are updated in Admin Settings.
 *
 * Routes alerts across:
 * - admin.harryoverseas@gmail.com  (Administrative oversight, security & escalations)
 * - info.harryoverseas@gmail.com   (General leads, course admissions, visa inquiries)
 * - support.harryoverseas@gmail.com (Careers, candidate applications & applicant support)
 */

function getSmtpSettings(category = 'info') {
  const host = getConfig('EMAIL_HOST', 'smtp.gmail.com');
  const port = parseInt(getConfig('EMAIL_PORT', '587'), 10);

  const emailAdmin = getConfig('EMAIL_ADMIN', 'admin.harryoverseas@gmail.com');
  const emailInfo = getConfig('EMAIL_INFO', 'info.harryoverseas@gmail.com');
  const emailSupport = getConfig('EMAIL_SUPPORT', 'support.harryoverseas@gmail.com');

  let user = '';
  let pass = '';

  if (category === 'info') {
    user = getConfig('EMAIL_INFO_USER', emailInfo);
    pass = getConfig('EMAIL_INFO_PASS', '').trim();
  } else if (category === 'support') {
    user = getConfig('EMAIL_SUPPORT_USER', emailSupport);
    pass = getConfig('EMAIL_SUPPORT_PASS', '').trim();
  } else if (category === 'admin') {
    user = getConfig('EMAIL_ADMIN_USER', '') || getConfig('EMAIL_INFO_USER', emailInfo);
    pass = getConfig('EMAIL_ADMIN_PASS', '') || getConfig('EMAIL_INFO_PASS', '') || getConfig('EMAIL_SUPPORT_PASS', '');
    pass = pass.trim();
  }

  return { host, port, user, pass, emailAdmin, emailInfo, emailSupport };
}

/**
 * Creates dynamic transporter on demand or verifies credentials
 */
export function getTransporter(category = 'info') {
  const { host, port, user, pass } = getSmtpSettings(category);
  if (!user || !pass || pass === 'sample_app_password' || pass === 'your_16_char_google_app_password') {
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

/**
 * Checks if at least one SMTP inbox is configured
 */
export function isSmtpConfigured(category = 'info') {
  const transporter = getTransporter(category);
  return !!transporter;
}

/**
 * 1. NOTIFY NEW ENQUIRY (Routed to info.harryoverseas@gmail.com)
 */
export async function notifyNewEnquiry(lead) {
  setTimeout(async () => {
    try {
      const transporter = getTransporter('info');
      const { user, emailInfo, emailAdmin } = getSmtpSettings('info');

      if (!transporter) {
        console.log(`[Notifier Note]: SMTP credentials not configured for info. Lead #${lead.id} email skipped.`);
        return;
      }

      const services = lead.service_interest || lead.language_course || 'European Immigration Consultation';
      const isUrgent = lead.travel_period === 'Immediate' || (services && /nurse|nursing/i.test(services));

      const leadData = {
        fullName: lead.full_name,
        email: lead.email,
        phone: lead.mobile || lead.phone,
        whatsapp: lead.whatsapp || lead.mobile || lead.phone,
        city: lead.city || 'Anantapur',
        country: lead.country || 'India',
        referenceId: lead.id,
        serviceInterest: services,
        destinationCountry: lead.destination_country || lead.intended_destination || 'Germany',
        travelPeriod: lead.travel_period || 'Immediate',
        consultationMethod: lead.consultation_method || 'WhatsApp',
        notes: lead.additional_reqs || lead.message || 'No additional notes provided.',
        urgencyFlag: isUrgent ? ' [URGENT]' : ''
      };

      // 1. Dispatch Internal Team Alert
      const internalEmail = renderTemplate('admin_lead_alert', leadData);
      const ccList = isUrgent ? [emailAdmin] : [];

      await transporter.sendMail({
        from: `"Harry Overseas Leads" <${user}>`,
        to: emailInfo,
        cc: ccList.length > 0 ? ccList.join(', ') : undefined,
        replyTo: lead.email,
        subject: internalEmail.subject,
        html: internalEmail.html,
        text: internalEmail.text
      });
      console.log(`[Notifier] Lead alert #${lead.id} sent to ${emailInfo}${ccList.length ? ` (CC: ${ccList.join(', ')})` : ''}`);

      // 2. Dispatch Personalized Client Welcome
      if (lead.email && lead.email.includes('@')) {
        let clientTemplateId = 'welcome_lead';
        if (/nurse|nursing|healthcare/i.test(services)) {
          clientTemplateId = 'nurse_pathway_welcome';
        } else if (/language|course|german|a1|a2|b1|combo/i.test(services)) {
          clientTemplateId = 'course_enrolment';
          leadData.courseName = lead.language_course || services;
          leadData.regularPrice = '₹45,999';
          leadData.batchStartDate = 'Upcoming Monday';
          leadData.classSchedule = 'Mon - Fri | Interactive Batches';
          leadData.trainingMode = 'Live Online (Zoom) / In-Person (Anantapur)';
          leadData.feeStatus = 'Enquiry Registered';
          leadData.instructorName = 'Certified Faculty & Native Speakers';
        }

        const clientEmail = renderTemplate(clientTemplateId, leadData);

        await transporter.sendMail({
          from: `"Harry Overseas Advisory" <${user}>`,
          to: lead.email,
          replyTo: emailInfo,
          subject: clientEmail.subject,
          html: clientEmail.html,
          text: clientEmail.text
        });
        console.log(`[Notifier] Personalized '${clientTemplateId}' email delivered to ${lead.email}`);
      }
    } catch (err) {
      console.error('[Notifier Error - Enquiry Notification]:', err.message);
    }
  }, 100);
}

/**
 * 2. NOTIFY NEW JOB APPLICATION (Routed to support.harryoverseas@gmail.com)
 */
export async function notifyNewJobApplication(application) {
  setTimeout(async () => {
    try {
      const transporter = getTransporter('support');
      const { user, emailSupport } = getSmtpSettings('support');

      if (!transporter) {
        console.log(`[Notifier Note]: SMTP credentials not configured for support. Application #${application.id} email skipped.`);
        return;
      }

      const appData = {
        fullName: application.full_name,
        email: application.email,
        phone: application.phone,
        applicationId: application.id,
        role: application.role,
        resumeLink: application.resume_link || 'Not provided',
        notes: application.notes || 'None provided'
      };

      // 1. Dispatch Internal Recruiter Notification
      const recruiterEmail = renderTemplate('support_career_alert', appData);
      await transporter.sendMail({
        from: `"Harry Overseas Careers" <${user}>`,
        to: emailSupport,
        replyTo: application.email,
        subject: recruiterEmail.subject,
        html: recruiterEmail.html,
        text: recruiterEmail.text
      });
      console.log(`[Notifier] Job application alert #${application.id} delivered to ${emailSupport}`);

      // 2. Dispatch Candidate Confirmation Receipt
      if (application.email && application.email.includes('@')) {
        const candidateEmail = renderTemplate('job_applicant_receipt', appData);
        await transporter.sendMail({
          from: `"Harry Overseas Careers Team" <${user}>`,
          to: application.email,
          replyTo: emailSupport,
          subject: candidateEmail.subject,
          html: candidateEmail.html,
          text: candidateEmail.text
        });
        console.log(`[Notifier] Candidate confirmation email delivered to ${application.email}`);
      }
    } catch (err) {
      console.error('[Notifier Error - Application Notification]:', err.message);
    }
  }, 100);
}

/**
 * 3. NOTIFY ADMIN ALERT (Security & Escalations)
 */
export async function notifyAdminAlert(alertTitle, alertMessage, metadata = {}) {
  setTimeout(async () => {
    try {
      const transporter = getTransporter('admin') || getTransporter('info') || getTransporter('support');
      const { user, emailAdmin } = getSmtpSettings('admin');

      if (!transporter) return;

      const metaHtml = Object.entries(metadata)
        .map(([k, v]) => `<tr><td style="padding:6px;font-weight:bold;color:#1e3a8a;border-bottom:1px solid #e2e8f0">${k}</td><td style="padding:6px;border-bottom:1px solid #e2e8f0">${v}</td></tr>`)
        .join('');

      await transporter.sendMail({
        from: `"Harry Overseas Security & System" <${user}>`,
        to: emailAdmin,
        subject: `⚠️ [System Alert] ${alertTitle} - Harry Overseas`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:8px;padding:20px;background:#ffffff">
            <h2 style="color:#b91c1c;margin-top:0">System Notice: ${alertTitle}</h2>
            <p style="color:#334155;font-size:15px;line-height:1.5">${alertMessage}</p>
            ${metaHtml ? `<table style="width:100%;border-collapse:collapse;margin-top:15px">${metaHtml}</table>` : ''}
            <p style="color:#64748b;font-size:12px;margin-top:20px;border-top:1px solid #e2e8f0;padding-top:10px">Harry Overseas Global Security Operations</p>
          </div>
        `
      });
      console.log(`[Notifier] Security alert '${alertTitle}' dispatched to ${emailAdmin}`);
    } catch (err) {
      console.error('[Notifier Error - Admin Alert]:', err.message);
    }
  }, 100);
}

/**
 * 4. NOTIFY CANDIDATE STAGE CHANGE
 */
export async function notifyApplicationStageChange(application, newStatus) {
  setTimeout(async () => {
    try {
      const transporter = getTransporter('support');
      const { user, emailSupport } = getSmtpSettings('support');

      if (!transporter || !application.email) return;

      const candidateData = {
        fullName: application.full_name,
        role: application.role,
        applicationId: application.id,
        currentStage: newStatus,
        status: newStatus
      };

      // Select specific candidate update template based on stage
      let templateId = 'candidate_shortlisted';
      const statusLower = (newStatus || '').toLowerCase();
      if (statusLower.includes('shortlist')) {
        templateId = 'candidate_shortlisted';
      } else if (statusLower.includes('interview')) {
        templateId = 'candidate_interviewed';
      } else if (statusLower.includes('hire') || statusLower.includes('offer') || statusLower.includes('select')) {
        templateId = 'candidate_hired';
      } else if (statusLower.includes('reject') || statusLower.includes('decline') || statusLower.includes('closed')) {
        templateId = 'candidate_rejected';
      }

      const candidateEmail = renderTemplate(templateId, candidateData);
      await transporter.sendMail({
        from: `"Harry Overseas Recruitment Team" <${user}>`,
        to: application.email,
        replyTo: emailSupport,
        subject: candidateEmail.subject,
        html: candidateEmail.html,
        text: candidateEmail.text
      });
      console.log(`[Notifier] Candidate stage update (${newStatus} -> ${templateId}) delivered to ${application.email}`);
    } catch (err) {
      console.error('[Notifier Error - Application Stage Change]:', err.message);
    }
  }, 100);
}

/**
 * 5. NOTIFY ENQUIRY STAGE CHANGE
 */
export async function notifyEnquiryStageChange(enquiry, prevStatus, newStatus, stageNotes = '') {
  setTimeout(async () => {
    try {
      const transporter = getTransporter('info');
      const { user, emailInfo } = getSmtpSettings('info');

      if (!transporter || !enquiry.email) return;

      const stageEmail = renderTemplate('enquiry_stage_update', {
        fullName: enquiry.full_name,
        referenceId: enquiry.id,
        serviceInterest: enquiry.service_interest || enquiry.language_course || 'European Migration',
        destinationCountry: enquiry.destination_country || enquiry.intended_destination || 'Germany',
        status: newStatus,
        prevStatus,
        stageNotes: stageNotes || 'Your counselor is actively processing your case documentation.'
      });

      await transporter.sendMail({
        from: `"Harry Overseas Advisory" <${user}>`,
        to: enquiry.email,
        replyTo: emailInfo,
        subject: stageEmail.subject,
        html: stageEmail.html,
        text: stageEmail.text
      });
      console.log(`[Notifier] Client enquiry stage email (${newStatus}) sent to ${enquiry.email}`);
    } catch (err) {
      console.error('[Notifier Error - Enquiry Stage Change]:', err.message);
    }
  }, 100);
}

/**
 * Test SMTP connection diagnostics dynamically
 */
export async function verifySmtpConnection() {
  const results = {};
  
  const infoTransporter = getTransporter('info');
  const { user: infoUser } = getSmtpSettings('info');
  if (infoTransporter) {
    try {
      await infoTransporter.verify();
      results.info = { connected: true, user: infoUser };
    } catch (e) {
      results.info = { connected: false, error: e.message, user: infoUser };
    }
  } else {
    results.info = { connected: false, reason: 'Credentials not configured' };
  }

  const supportTransporter = getTransporter('support');
  const { user: supportUser } = getSmtpSettings('support');
  if (supportTransporter) {
    try {
      await supportTransporter.verify();
      results.support = { connected: true, user: supportUser };
    } catch (e) {
      results.support = { connected: false, error: e.message, user: supportUser };
    }
  } else {
    results.support = { connected: false, reason: 'Credentials not configured' };
  }

  return results;
}

export default {
  notifyNewEnquiry,
  notifyNewJobApplication,
  notifyAdminAlert,
  notifyApplicationStageChange,
  notifyEnquiryStageChange,
  verifySmtpConnection,
  getTransporter
};
