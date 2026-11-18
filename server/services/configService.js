import dotenv from 'dotenv';
dotenv.config();

/**
 * In-memory cache for dynamic system settings loaded from database table `system_settings`.
 * Falls back to process.env if setting is not in database.
 */
let cachedSettings = {};
let isInitialized = false;

/**
 * Default configuration keys and their environment variable mappings
 */
export const CONFIG_KEYS = {
  // Notification / SMTP settings
  EMAIL_HOST: 'EMAIL_HOST',
  EMAIL_PORT: 'EMAIL_PORT',
  EMAIL_ADMIN: 'EMAIL_ADMIN',
  EMAIL_INFO: 'EMAIL_INFO',
  EMAIL_SUPPORT: 'EMAIL_SUPPORT',
  EMAIL_INFO_USER: 'EMAIL_INFO_USER',
  EMAIL_INFO_PASS: 'EMAIL_INFO_PASS',
  EMAIL_SUPPORT_USER: 'EMAIL_SUPPORT_USER',
  EMAIL_SUPPORT_PASS: 'EMAIL_SUPPORT_PASS',
  EMAIL_ADMIN_USER: 'EMAIL_ADMIN_USER',
  EMAIL_ADMIN_PASS: 'EMAIL_ADMIN_PASS',

  // Slack webhooks
  SLACK_WEBHOOK_URL: 'SLACK_WEBHOOK_URL',
  SLACK_LEADS_WEBHOOK_URL: 'SLACK_LEADS_WEBHOOK_URL',
  SLACK_CAREERS_WEBHOOK_URL: 'SLACK_CAREERS_WEBHOOK_URL',
  SLACK_ALERTS_WEBHOOK_URL: 'SLACK_ALERTS_WEBHOOK_URL',

  // Company / Portal operational configs
  PORTAL_MAINTENANCE_MODE: 'PORTAL_MAINTENANCE_MODE',
  ADMIN_NOTIFICATION_EMAIL: 'ADMIN_NOTIFICATION_EMAIL',
  SUPPORT_PHONE: 'SUPPORT_PHONE',
  WHATSAPP_SUPPORT_NUMBER: 'WHATSAPP_SUPPORT_NUMBER'
};

/**
 * Initialize system_settings table and seed from environment variables if empty
 * @param {Function} queryFn - Database query function
 */
export async function initConfigService(queryFn) {
  try {
    // 1. Create table if not exists
    await queryFn(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        description TEXT,
        is_secret BOOLEAN DEFAULT false,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(100) DEFAULT 'system'
      )
    `);

    // 2. Initial seed items from process.env (only insert if key does not exist yet)
    const seedItems = [
      { key: 'EMAIL_HOST', val: process.env.EMAIL_HOST || 'smtp.gmail.com', cat: 'email', desc: 'SMTP Host Server', secret: false },
      { key: 'EMAIL_PORT', val: process.env.EMAIL_PORT || '587', cat: 'email', desc: 'SMTP Port (587 or 465)', secret: false },
      { key: 'EMAIL_ADMIN', val: process.env.EMAIL_ADMIN || 'admin.harryoverseas@gmail.com', cat: 'email', desc: 'Administrative Oversight Email', secret: false },
      { key: 'EMAIL_INFO', val: process.env.EMAIL_INFO || 'info.harryoverseas@gmail.com', cat: 'email', desc: 'Leads & Enquiries Recipient Email', secret: false },
      { key: 'EMAIL_SUPPORT', val: process.env.EMAIL_SUPPORT || 'support.harryoverseas@gmail.com', cat: 'email', desc: 'Job Applications Recipient Email', secret: false },
      
      { key: 'EMAIL_INFO_USER', val: process.env.EMAIL_INFO_USER || process.env.EMAIL_INFO || 'info.harryoverseas@gmail.com', cat: 'email', desc: 'Info Gmail SMTP Username', secret: false },
      { key: 'EMAIL_INFO_PASS', val: process.env.EMAIL_INFO_PASS || process.env.EMAIL_PASS || '', cat: 'email', desc: 'Info Gmail App Password (16 chars)', secret: true },
      
      { key: 'EMAIL_SUPPORT_USER', val: process.env.EMAIL_SUPPORT_USER || process.env.EMAIL_SUPPORT || 'support.harryoverseas@gmail.com', cat: 'email', desc: 'Support Gmail SMTP Username', secret: false },
      { key: 'EMAIL_SUPPORT_PASS', val: process.env.EMAIL_SUPPORT_PASS || process.env.EMAIL_PASS || '', cat: 'email', desc: 'Support Gmail App Password (16 chars)', secret: true },

      { key: 'EMAIL_ADMIN_USER', val: process.env.EMAIL_ADMIN_USER || '', cat: 'email', desc: 'Admin Gmail SMTP Username (Optional)', secret: false },
      { key: 'EMAIL_ADMIN_PASS', val: process.env.EMAIL_ADMIN_PASS || '', cat: 'email', desc: 'Admin Gmail App Password (Optional)', secret: true },

      { key: 'SLACK_WEBHOOK_URL', val: process.env.SLACK_WEBHOOK_URL || '', cat: 'slack', desc: 'Primary Slack Incoming Webhook URL', secret: true },
      { key: 'SLACK_LEADS_WEBHOOK_URL', val: process.env.SLACK_LEADS_WEBHOOK_URL || '', cat: 'slack', desc: 'Slack Webhook for Leads & Enquiries', secret: true },
      { key: 'SLACK_CAREERS_WEBHOOK_URL', val: process.env.SLACK_CAREERS_WEBHOOK_URL || process.env.CAREER_WEBHOOK_URL || '', cat: 'slack', desc: 'Slack Webhook for Job Applications', secret: true },
      { key: 'SLACK_ALERTS_WEBHOOK_URL', val: process.env.SLACK_ALERTS_WEBHOOK_URL || '', cat: 'slack', desc: 'Slack Webhook for Security Alerts & Audit', secret: true },

      { key: 'SUPPORT_PHONE', val: '+91 80080 00000', cat: 'general', desc: 'Customer Support Helpline Number', secret: false },
      { key: 'WHATSAPP_SUPPORT_NUMBER', val: '+91 99999 99999', cat: 'general', desc: 'Official WhatsApp Dispatch / Support Number', secret: false },
      { key: 'PORTAL_MAINTENANCE_MODE', val: 'false', cat: 'general', desc: 'Maintenance Mode Flag (true/false)', secret: false }
    ];

    for (const item of seedItems) {
      if (item.val) {
        await queryFn(
          `INSERT INTO system_settings (key, value, category, description, is_secret, updated_by)
           VALUES ($1, $2, $3, $4, $5, 'system_init')
           ON CONFLICT (key) DO NOTHING`,
          [item.key, item.val, item.cat, item.desc, item.secret]
        );
      }
    }

    // 3. Load all rows into memory cache
    await refreshCache(queryFn);
    isInitialized = true;
    console.log(`[ConfigService] Initialized with ${Object.keys(cachedSettings).length} dynamic database settings.`);
  } catch (err) {
    console.error('[ConfigService] Error initializing system settings table:', err);
  }
}

/**
 * Reloads all settings from the database into memory cache
 * @param {Function} queryFn
 */
export async function refreshCache(queryFn) {
  try {
    const res = await queryFn('SELECT key, value, category, description, is_secret, updated_at, updated_by FROM system_settings');
    const newCache = {};
    for (const row of res.rows) {
      newCache[row.key] = {
        value: row.value,
        category: row.category,
        description: row.description,
        is_secret: row.is_secret,
        updated_at: row.updated_at,
        updated_by: row.updated_by
      };
    }
    cachedSettings = newCache;
    return cachedSettings;
  } catch (err) {
    console.error('[ConfigService] Failed to reload settings cache:', err);
    return cachedSettings;
  }
}

/**
 * Get a configuration value dynamically (Database -> process.env fallback -> defaultValue fallback)
 * @param {string} key
 * @param {string} defaultValue
 * @returns {string}
 */
export function getConfig(key, defaultValue = '') {
  if (cachedSettings[key] && cachedSettings[key].value !== undefined && cachedSettings[key].value !== null) {
    return cachedSettings[key].value;
  }
  if (process.env[key] !== undefined && process.env[key] !== null) {
    return process.env[key];
  }
  return defaultValue;
}

/**
 * Get all configurations safe for admin portal view (mask secrets)
 * @returns {Array}
 */
export function getAllSettingsForAdmin() {
  const result = [];
  for (const [key, item] of Object.entries(cachedSettings)) {
    result.push({
      key,
      value: item.is_secret && item.value ? '••••••••••••••••' : item.value,
      hasValue: !!item.value,
      category: item.category,
      description: item.description,
      is_secret: item.is_secret,
      updated_at: item.updated_at,
      updated_by: item.updated_by
    });
  }
  return result;
}

/**
 * Update one or more settings in database and immediately update cache without restart
 * @param {Object} updates - { KEY: 'new_value' }
 * @param {string} updatedBy - username of admin
 * @param {Function} queryFn - database query function
 */
export async function updateSettings(updates, updatedBy, queryFn) {
  if (!updates || typeof updates !== 'object') return false;

  for (const [key, val] of Object.entries(updates)) {
    if (typeof val === 'string' && val.trim() !== '') {
      // Don't overwrite secret with masked placeholder
      if (val.includes('••••')) {
        continue;
      }
      await queryFn(
        `INSERT INTO system_settings (key, value, updated_at, updated_by)
         VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
         ON CONFLICT (key) DO UPDATE 
         SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP, updated_by = EXCLUDED.updated_by`,
        [key, val.trim(), updatedBy || 'Super Admin']
      );
    }
  }

  // Refresh in-memory cache instantly
  await refreshCache(queryFn);
  return true;
}
