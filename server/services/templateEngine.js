import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getConfig } from './configService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to catalog.json
const CATALOG_PATH = path.join(__dirname, '..', 'templates', 'catalog.json');

let cachedCatalog = null;

/**
 * Loads and caches template definitions from JSON file.
 */
export function loadCatalog() {
  if (cachedCatalog) return cachedCatalog;
  try {
    const raw = fs.readFileSync(CATALOG_PATH, 'utf-8');
    cachedCatalog = JSON.parse(raw);
    return cachedCatalog;
  } catch (err) {
    console.error('[TemplateEngine] Error reading template catalog JSON:', err);
    return {};
  }
}

/**
 * Returns summary list of all available templates.
 */
export function listTemplates() {
  const catalog = loadCatalog();
  return Object.values(catalog).map(tpl => ({
    id: tpl.id,
    name: tpl.name,
    category: tpl.category,
    targetInbox: tpl.targetInbox,
    subjectTemplate: tpl.subject,
    sampleData: tpl.sampleData || {}
  }));
}

/**
 * Retrieves a single template definition by ID.
 */
export function getTemplate(templateId) {
  const catalog = loadCatalog();
  return catalog[templateId] || null;
}

/**
 * Enriches input data with smart derived placeholders.
 */
function enrichData(data = {}) {
  const enriched = { ...data };

  // 1. Derive firstName if not provided
  if (!enriched.firstName && enriched.fullName) {
    const parts = enriched.fullName.trim().split(/\s+/);
    enriched.firstName = parts[0] || 'Valued Client';
  } else if (!enriched.firstName) {
    enriched.firstName = 'Valued Client';
  }

  // 2. Clean phone / WhatsApp for wa.me links
  const rawWa = enriched.whatsapp || enriched.phone || enriched.mobile || '';
  enriched.whatsappClean = rawWa.replace(/[^0-9]/g, '');

  // 3. Defaults for common fields
  enriched.destinationCountry = enriched.destinationCountry || enriched.destination_country || enriched.intended_destination || 'Germany';
  enriched.referenceId = enriched.referenceId || enriched.id || `HGI-${Math.floor(1000 + Math.random() * 9000)}`;
  enriched.travelPeriod = enriched.travelPeriod || enriched.travel_period || 'Immediate';
  enriched.consultationMethod = enriched.consultationMethod || enriched.consultation_method || 'WhatsApp';
  enriched.year = new Date().getFullYear();
  enriched.currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // 4. Contact inboxes (read dynamically from database settings)
  enriched.emailAdmin = getConfig('EMAIL_ADMIN', 'admin.harryoverseas@gmail.com');
  enriched.emailInfo = getConfig('EMAIL_INFO', 'info.harryoverseas@gmail.com');
  enriched.emailSupport = getConfig('EMAIL_SUPPORT', 'support.harryoverseas@gmail.com');

  return enriched;
}

/**
 * Escapes HTML characters to prevent HTML/content injection in rendered emails.
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Replaces {{placeholder}} or {{placeholder || fallback}} in a string.
 * Automatically HTML-escapes interpolated dynamic values to prevent injection.
 */
function interpolate(str, data, raw = false) {
  if (typeof str !== 'string') return '';
  return str.replace(/\{\{\s*([a-zA-Z0-9_]+)(?:\s*\|\|\s*([^}]+))?\s*\}\}/g, (match, key, fallback) => {
    if (data[key] !== undefined && data[key] !== null && String(data[key]).trim() !== '') {
      const val = String(data[key]);
      return raw ? val : escapeHtml(val);
    }
    return fallback !== undefined ? fallback.trim() : '';
  });
}

/**
 * Builds responsive, high-converting branded HTML email container
 */
function buildHtmlDocument({ title, subtitle, badge, badgeType, salutation, intro, sectionsHtml, ctaHtml, footerNote, data }) {
  const badgeClass = badgeType === 'urgent'
    ? 'background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca;'
    : 'background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6; }
    .wrapper { width: 100%; background-color: #f1f5f9; padding: 30px 12px; }
    .card { max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0a192f 0%, #172a45 100%); padding: 32px 28px; text-align: center; border-bottom: 3px solid #d4af37; }
    .logo-text { color: #d4af37; font-size: 24px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; margin: 0 0 6px 0; }
    .logo-sub { color: #94a3b8; font-size: 13px; margin: 0; letter-spacing: 0.5px; }
    .content { padding: 36px 30px; }
    .badge { display: inline-block; padding: 5px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .title { font-size: 22px; font-weight: 800; color: #0a192f; margin: 0 0 6px 0; }
    .subtitle { font-size: 14px; color: #64748b; margin: 0 0 24px 0; }
    .salutation { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 12px 0; }
    .intro { font-size: 15px; color: #334155; margin: 0 0 24px 0; }
    .table-container { width: 100%; margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .data-table th, .data-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-align: left; }
    .data-table th { background-color: #f8fafc; color: #475569; font-weight: 600; width: 38%; }
    .data-table td { color: #0f172a; }
    .highlight-card { background-color: #f8fafc; border-left: 4px solid #d4af37; border-radius: 0 8px 8px 0; padding: 18px 20px; margin: 24px 0; }
    .highlight-title { font-size: 14px; font-weight: 700; color: #0a192f; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .highlight-list { margin: 0; padding-left: 20px; font-size: 14px; color: #334155; }
    .highlight-list li { margin-bottom: 8px; }
    .cta-container { text-align: center; margin: 32px 0 20px 0; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b89628 100%); color: #0a192f !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(212,175,55,0.3); text-transform: uppercase; letter-spacing: 0.5px; }
    .footer-note { font-size: 13px; color: #64748b; font-style: italic; text-align: center; margin: 20px 0 0 0; }
    .footer { background-color: #f8fafc; padding: 28px 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; line-height: 1.6; }
    .footer-links a { color: #0a192f; font-weight: 600; text-decoration: none; margin: 0 6px; }
    @media only screen and (max-width: 480px) {
      .content { padding: 24px 18px; }
      .data-table th, .data-table td { padding: 10px 12px; font-size: 13px; }
      .title { font-size: 19px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo-text">Harry Overseas</div>
        <div class="logo-sub">European Immigration &bull; German Language Academy</div>
      </div>
      <div class="content">
        ${badge ? `<div class="badge" style="${badgeClass}">${badge}</div>` : ''}
        <h1 class="title">${title}</h1>
        ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        ${salutation ? `<div class="salutation">${salutation}</div>` : ''}
        ${intro ? `<div class="intro">${intro}</div>` : ''}
        ${sectionsHtml}
        ${ctaHtml}
        ${footerNote ? `<div class="footer-note">${footerNote}</div>` : ''}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0;"><strong>Harry Overseas Immigration & Language Academy</strong></p>
        <p style="margin: 0 0 8px 0;">📍 Head Office: Anantapur, Andhra Pradesh, India &bull; 📍 Germany Desk: Frankfurt am Main</p>
        <p style="margin: 0 0 10px 0;">📞 +91 6302951891 (India) &bull; 📞 +49 17670256852 (Germany)</p>
        <div class="footer-links">
          <a href="mailto:${data.emailInfo || 'info.harryoverseas@gmail.com'}">General Inquiries</a> |
          <a href="mailto:${data.emailSupport || 'support.harryoverseas@gmail.com'}">Careers & Support</a> |
          <a href="mailto:${data.emailAdmin || 'admin.harryoverseas@gmail.com'}">Admin Desk</a>
        </div>
        <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 11px;">
          &copy; ${data.year || new Date().getFullYear()} Harry Overseas. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Compiles a JSON template into final email artifacts:
 * - subject (personalized)
 * - html (responsive branded email)
 * - text (plain text version for text-only clients)
 * - preheader (email preview snippet)
 */
export function renderTemplate(templateId, inputData = {}) {
  const catalog = loadCatalog();
  const tpl = catalog[templateId];

  if (!tpl) {
    throw new Error(`[TemplateEngine] Unknown template ID '${templateId}'. Available: ${Object.keys(catalog).join(', ')}`);
  }

  // Merge defaults from sampleData + provided inputData
  const data = enrichData({ ...(tpl.sampleData || {}), ...inputData });

  // 1. Interpolate subject, title, subtitle, salutation, intro
  const subject = interpolate(tpl.subject, data);
  const preheader = interpolate(tpl.preheader || '', data);
  const title = interpolate(tpl.title, data);
  const subtitle = interpolate(tpl.subtitle || '', data);
  const salutation = interpolate(tpl.salutation || '', data);
  const intro = interpolate(tpl.intro || '', data);
  const badge = interpolate(tpl.badge || '', data);
  const footerNote = interpolate(tpl.footerNote || '', data);

  // 2. Render Sections
  let sectionsHtml = '';
  let plainTextSections = '';

  if (Array.isArray(tpl.sections)) {
    for (const section of tpl.sections) {
      if (section.type === 'details_table' && Array.isArray(section.fields)) {
        let rowsHtml = '';
        plainTextSections += `\n--- ${section.heading || 'Details'} ---\n`;
        for (const field of section.fields) {
          const fieldLabel = interpolate(field.label, data);
          const fieldValue = interpolate(field.value, data);
          rowsHtml += `<tr><th>${fieldLabel}</th><td>${fieldValue}</td></tr>`;
          plainTextSections += `${fieldLabel}: ${fieldValue.replace(/<[^>]+>/g, '')}\n`;
        }
        sectionsHtml += `
          <div class="table-container">
            <table class="data-table">
              ${rowsHtml}
            </table>
          </div>
        `;
      } else if (section.type === 'highlight_box' && Array.isArray(section.items)) {
        const boxTitle = interpolate(section.title || '', data);
        let itemsHtml = '';
        plainTextSections += `\n* ${boxTitle} *\n`;
        for (const item of section.items) {
          const itemText = interpolate(item, data);
          itemsHtml += `<li>${itemText}</li>`;
          plainTextSections += `- ${itemText.replace(/<[^>]+>/g, '')}\n`;
        }
        sectionsHtml += `
          <div class="highlight-card">
            ${boxTitle ? `<div class="highlight-title">${boxTitle}</div>` : ''}
            <ul class="highlight-list">
              ${itemsHtml}
            </ul>
          </div>
        `;
      }
    }
  }

  // 3. Render Call to Action
  let ctaHtml = '';
  let ctaPlain = '';
  if (tpl.callToAction && tpl.callToAction.label && tpl.callToAction.url) {
    const ctaLabel = interpolate(tpl.callToAction.label, data);
    const ctaUrl = interpolate(tpl.callToAction.url, data);
    ctaHtml = `
      <div class="cta-container">
        <a href="${ctaUrl}" target="_blank" class="cta-btn">${ctaLabel}</a>
      </div>
    `;
    ctaPlain = `\n[ ${ctaLabel} ]: ${ctaUrl}\n`;
  }

  // 4. Wrap HTML
  const html = buildHtmlDocument({
    title,
    subtitle,
    badge,
    badgeType: tpl.badgeType || 'gold',
    salutation,
    intro,
    sectionsHtml,
    ctaHtml,
    footerNote,
    data
  });

  // 5. Build Plain Text Version
  const text = `
HARRY OVERSEAS IMMIGRATION & GERMAN LANGUAGE ACADEMY
----------------------------------------------------
${title}
${subtitle ? subtitle + '\n' : ''}
${salutation}

${intro.replace(/<[^>]+>/g, '')}
${plainTextSections}
${ctaPlain}
${footerNote ? '\n' + footerNote + '\n' : ''}
----------------------------------------------------
Contact us:
India: +91 6302951891 | Germany: +49 17670256852
Email: info.harryoverseas@gmail.com
Website: https://harryoverseas.com
  `.trim();

  return {
    templateId: tpl.id,
    templateName: tpl.name,
    category: tpl.category,
    targetInbox: tpl.targetInbox,
    subject,
    preheader,
    html,
    text,
    data
  };
}

export default {
  loadCatalog,
  listTemplates,
  getTemplate,
  renderTemplate
};
