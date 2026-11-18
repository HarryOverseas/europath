import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { renderTemplate } from './templateEngine.js';

dotenv.config();

/**
 * Multi-Inbox Email Notification Service
 * Routes alerts across:
 * - admin.harryoverseas@gmail.com  (Administrative oversight, security & escalations)
 * - info.harryoverseas@gmail.com   (General leads, course admissions, visa inquiries)
 * - support.harryoverseas@gmail.com (Careers, candidate applications & applicant support)
 */

const EMAIL_ADMIN = process.env.EMAIL_ADMIN || 'admin.harryoverseas@gmail.com';
const EMAIL_INFO = process.env.EMAIL_INFO || 'info.harryoverseas@gmail.com';
const EMAIL_SUPPORT = process.env.EMAIL_SUPPORT || 'support.harryoverseas@gmail.com';

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10);

// Specialized account credentials for Multi-Inbox
const INFO_USER = process.env.EMAIL_INFO_USER || process.env.EMAIL_USER || EMAIL_INFO;
const INFO_PASS = (process.env.EMAIL_INFO_PASS || process.env.EMAIL_PASS || '').trim();

const SUPPORT_USER = process.env.EMAIL_SUPPORT_USER || process.env.EMAIL_USER || EMAIL_SUPPORT;
const SUPPORT_PASS = (process.env.EMAIL_SUPPORT_PASS || process.env.EMAIL_PASS || '').trim();

// Administrative inbox uses info or support credentials as fallback if dedicated pass not specified
const ADMIN_USER = process.env.EMAIL_ADMIN_USER || INFO_USER;
const ADMIN_PASS = (process.env.EMAIL_ADMIN_PASS || INFO_PASS || SUPPORT_PASS || '').trim();

function createTransporter(user, pass) {
  if (!user || !pass || pass === 'sample_app_password' || pass === 'your_16_char_google_app_password') {
    return null;
  }
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,
    auth: { user, pass }
  });
}

// Dedicated transporters per business inbox
const infoTransporter = createTransporter(INFO_USER, INFO_PASS);
const supportTransporter = createTransporter(SUPPORT_USER, SUPPORT_PASS);
const adminTransporter = createTransporter(ADMIN_USER, ADMIN_PASS) || infoTransporter || supportTransporter;

/**
 * Checks if at least one SMTP inbox is configured
 */
function isSmtpConfigured(category = 'info') {
  if (category === 'support') return !!supportTransporter;
  if (category === 'admin') return !!adminTransporter;
  return !!infoTransporter;
}

/**
 * 1. NOTIFY NEW ENQUIRY (Routed to info.harryoverseas@gmail.com)
 * Automatically CCs admin.harryoverseas@gmail.com if enquiry is urgent or nursing-related.
 * Sends a personalized, branded welcome/receipt to the client based on their service category.
 */
export async function notifyNewEnquiry(lead) {
  setTimeout(async () => {
    try {
      if (!isSmtpConfigured('info')) {
        console.log(`[Notifier Note]: SMTP credentials not fully configured in .env for info. Enquiry notification skipped for lead #${lead.id}.`);
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

      // 1. Dispatch Internal Team Alert (via admin_lead_alert JSON template)
      const internalEmail = renderTemplate('admin_lead_alert', leadData);
      const ccList = isUrgent ? [EMAIL_ADMIN] : [];

      await infoTransporter.sendMail({
        from: `"Harry Overseas Leads" <${INFO_USER}>`,
        to: EMAIL_INFO,
        cc: ccList.length > 0 ? ccList.join(', ') : undefined,
        replyTo: lead.email,
        subject: internalEmail.subject,
        html: internalEmail.html,
        text: internalEmail.text
      });
      console.log(`[Notifier] Lead alert #${lead.id} sent to ${EMAIL_INFO}${ccList.length ? ` (CC: ${ccList.join(', ')})` : ''}`);

      // 2. Dispatch Personalized Client Welcome / Receipt
      if (lead.email && lead.email.includes('@')) {
        let clientTemplateId = 'welcome_lead';

        // Select specialized template if client selected nursing or language academy
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

        await infoTransporter.sendMail({
          from: `"Harry Overseas Advisory" <${INFO_USER}>`,
          to: lead.email,
          replyTo: EMAIL_INFO,
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
 * Career candidate submissions, CV reviews, and recruitment team communications.
 */
export async function notifyNewJobApplication(application) {
  setTimeout(async () => {
    try {
      if (!isSmtpConfigured('support')) {
        console.log(`[Notifier Note]: SMTP credentials not configured in .env for support. Application notification skipped for application #${application.id}.`);
        return;
      }

      const appData = {
        fullName: application.full_name,
        email: application.email,
        phone: application.phone,
        applicationId: application.id,
        role: application.role,
        resumeLink: application.resume_link || 'Not provided',
        notes: application.notes || 'No statement provided'
      };

      // 1. Dispatch Support Team Alert (via support_career_alert JSON template)
      const internalEmail = renderTemplate('support_career_alert', appData);

      await supportTransporter.sendMail({
        from: `"Harry Overseas Recruitment" <${SUPPORT_USER}>`,
        to: EMAIL_SUPPORT,
        replyTo: application.email,
        subject: internalEmail.subject,
        html: internalEmail.html,
        text: internalEmail.text
      });
      console.log(`[Notifier] Career application #${application.id} routed to ${EMAIL_SUPPORT}`);

      // 2. Dispatch Confirmation Receipt to Applicant (via job_applicant_receipt JSON template)
      if (application.email && application.email.includes('@')) {
        const applicantEmail = renderTemplate('job_applicant_receipt', appData);

        await supportTransporter.sendMail({
          from: `"Harry Overseas Careers" <${SUPPORT_USER}>`,
          to: application.email,
          replyTo: EMAIL_SUPPORT,
          subject: applicantEmail.subject,
          html: applicantEmail.html,
          text: applicantEmail.text
        });
        console.log(`[Notifier] Applicant receipt delivered to ${application.email}`);
      }
    } catch (err) {
      console.error('[Notifier Error - Job Application]:', err.message);
    }
  }, 100);
}

/**
 * 3. NOTIFY ADMIN ALERT (Routed to admin.harryoverseas@gmail.com)
 * Administrative events, security warnings, user creations, and critical system logs.
 */
export async function notifyAdminAlert(subject, message, details = {}) {
  setTimeout(async () => {
    try {
      if (!isSmtpConfigured('admin')) return;

      const alertData = {
        eventTitle: subject,
        eventDescription: message,
        actor: details.CreatedBy || details.actor || 'System / Admin',
        ipAddress: details.ipAddress || 'Internal Action',
        timestamp: new Date().toUTCString(),
        ...details
      };

      const adminEmail = renderTemplate('admin_security_alert', alertData);

      await adminTransporter.sendMail({
        from: `"Harry Overseas Security" <${ADMIN_USER}>`,
        to: EMAIL_ADMIN,
        subject: adminEmail.subject,
        html: adminEmail.html,
        text: adminEmail.text
      });
      console.log(`[Notifier] Admin security alert dispatched to ${EMAIL_ADMIN}`);
    } catch (err) {
      console.error('[Notifier Error - Admin Alert]:', err.message);
    }
  }, 100);
}

/**
 * 4. NOTIFY CANDIDATE STAGE CHANGE (Shortlisted, Interviewed, Hired, Rejected)
 */
export async function notifyApplicationStageChange(application, previousStatus, newStatus, customNotes = '') {
  setTimeout(async () => {
    try {
      if (!isSmtpConfigured('support') || !application.email || !application.email.includes('@')) {
        return;
      }

      // Map new status to appropriate email template
      let templateId = null;
      if (newStatus === 'Shortlisted') templateId = 'candidate_shortlisted';
      else if (newStatus === 'Interviewed') templateId = 'candidate_interviewed';
      else if (newStatus === 'Hired') templateId = 'candidate_hired';
      else if (newStatus === 'Rejected') templateId = 'candidate_rejected';

      if (!templateId) return;

      const appData = {
        fullName: application.full_name,
        email: application.email,
        phone: application.phone,
        applicationId: application.id,
        role: application.role,
        stageNotes: customNotes
      };

      const stageEmail = renderTemplate(templateId, appData);

      await supportTransporter.sendMail({
        from: `"Harry Overseas Careers" <${SUPPORT_USER}>`,
        to: application.email,
        replyTo: EMAIL_SUPPORT,
        subject: stageEmail.subject,
        html: stageEmail.html,
        text: stageEmail.text
      });
      console.log(`[Notifier] Candidate stage email (${newStatus}) sent to ${application.email}`);
    } catch (err) {
      console.error('[Notifier Error - Candidate Stage Change]:', err.message);
    }
  }, 100);
}

/**
 * 5. NOTIFY CLIENT ENQUIRY STAGE CHANGE (Contacted, In Progress, Closed)
 */
export async function notifyEnquiryStageChange(enquiry, previousStatus, newStatus, customNotes = '') {
  setTimeout(async () => {
    try {
      if (!isSmtpConfigured('info') || !enquiry.email || !enquiry.email.includes('@')) {
        return;
      }

      const services = enquiry.service_interest || enquiry.language_course || 'European Immigration Consultation';
      const leadData = {
        fullName: enquiry.full_name,
        email: enquiry.email,
        phone: enquiry.mobile || enquiry.phone,
        referenceId: enquiry.id,
        status: newStatus,
        serviceInterest: services,
        destinationCountry: enquiry.destination_country || enquiry.intended_destination || 'Germany',
        stageNotes: customNotes || `Your consultation case has been transitioned from ${previousStatus || 'New'} to ${newStatus}.`
      };

      const stageEmail = renderTemplate('enquiry_stage_update', leadData);

      await infoTransporter.sendMail({
        from: `"Harry Overseas Advisory" <${INFO_USER}>`,
        to: enquiry.email,
        replyTo: EMAIL_INFO,
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
 * Test SMTP connection diagnostics
 */
export async function verifySmtpConnection() {
  const results = {};
  if (infoTransporter) {
    try {
      await infoTransporter.verify();
      results.info = { connected: true, user: INFO_USER };
    } catch (e) {
      results.info = { connected: false, error: e.message };
    }
  } else {
    results.info = { connected: false, reason: 'Credentials not configured' };
  }

  if (supportTransporter) {
    try {
      await supportTransporter.verify();
      results.support = { connected: true, user: SUPPORT_USER };
    } catch (e) {
      results.support = { connected: false, error: e.message };
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
  verifySmtpConnection
};
