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
  if (isInitialized) {
    return;
  }
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

    // 2. Load all rows into memory cache
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
