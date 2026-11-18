import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ [SEED ERROR] DATABASE_URL is required to connect to the database.');
  process.exit(1);
}

const useSsl = databaseUrl.includes('sslmode=require') ||
               databaseUrl.includes('ssl=true') ||
               databaseUrl.includes('neon.tech') ||
               databaseUrl.includes('supabase') ||
               process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 8000,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

/**
 * Harry Overseas Master Database Seeder Template
 * Seeds initial structural schema, default roles, baseline settings and configuration keys.
 *
 * NOTE FOR SECRETS & CREDENTIALS:
 * To protect production security and prevent accidental exposure in Git commits,
 * sensitive credentials (app passwords, Slack webhooks, API tokens) are populated
 * either from runtime environment variables (if provided) or updated directly
 * through the Staff Portal ("System Configs" tab) into the database.
 */
async function runSeed() {
  const client = await pool.connect();
  console.log('🚀 [DB SEED] Connected to PostgreSQL database.');

  try {
    await client.query('BEGIN');

    // 1. Ensure system_settings table schema exists
    console.log('📦 [1/4] Ensuring system_settings table schema...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        description TEXT,
        is_secret BOOLEAN DEFAULT false,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(100) DEFAULT 'seed_script'
      )
    `);

    // 2. Ensure users table and permissions schema exist
    console.log('👤 [2/4] Ensuring users table and permissions schema...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        permissions TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT '[]'`);

    // 3. Seed / Synchronize Super Admin Account
    console.log('🔑 [3/4] Ensuring default Super Admin account exists in database...');
    const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin.harryoverseas@gmail.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMeImmediately2026!';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(adminPassword, salt);
    const superAdminPerms = JSON.stringify(['*']);

    // Only insert admin if it does not exist yet to prevent overwriting modified passwords in DB
    const adminCheck = await client.query('SELECT id FROM users WHERE username = $1', [adminUsername]);
    if (adminCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO users (username, email, password_hash, role, permissions)
         VALUES ($1, $2, $3, 'Super Admin', $4)`,
        [adminUsername, adminEmail, hash, superAdminPerms]
      );
      console.log(`   ✓ Super Admin user initialized: ${adminUsername} (${adminEmail})`);
    } else {
      console.log(`   ✓ Super Admin account '${adminUsername}' already present in database (retained existing credentials).`);
    }

    // 4. Seed Baseline System Configurations & Placeholders
    console.log('⚙️ [4/4] Ensuring baseline system configuration rows in database...');
    const seedSettings = [
      // SMTP / Multi-Inbox Gmail Configurations
      { key: 'EMAIL_HOST', val: process.env.EMAIL_HOST || 'smtp.gmail.com', cat: 'email', desc: 'SMTP Host Server', secret: false },
      { key: 'EMAIL_PORT', val: process.env.EMAIL_PORT || '587', cat: 'email', desc: 'SMTP Port (587 TLS or 465 SSL)', secret: false },
      { key: 'EMAIL_ADMIN', val: process.env.EMAIL_ADMIN || 'admin.harryoverseas@gmail.com', cat: 'email', desc: 'Administrative Oversight Email', secret: false },
      { key: 'EMAIL_INFO', val: process.env.EMAIL_INFO || 'info.harryoverseas@gmail.com', cat: 'email', desc: 'Leads & Enquiries Recipient Email', secret: false },
      { key: 'EMAIL_SUPPORT', val: process.env.EMAIL_SUPPORT || 'support.harryoverseas@gmail.com', cat: 'email', desc: 'Job Applications Recipient Email', secret: false },

      { key: 'EMAIL_INFO_USER', val: process.env.EMAIL_INFO_USER || 'info.harryoverseas@gmail.com', cat: 'email', desc: 'Info Gmail SMTP Username', secret: false },
      { key: 'EMAIL_INFO_PASS', val: process.env.EMAIL_INFO_PASS || '', cat: 'email', desc: 'Info Gmail App Password (16 chars)', secret: true },

      { key: 'EMAIL_SUPPORT_USER', val: process.env.EMAIL_SUPPORT_USER || 'support.harryoverseas@gmail.com', cat: 'email', desc: 'Support Gmail SMTP Username', secret: false },
      { key: 'EMAIL_SUPPORT_PASS', val: process.env.EMAIL_SUPPORT_PASS || '', cat: 'email', desc: 'Support Gmail App Password (16 chars)', secret: true },

      { key: 'EMAIL_ADMIN_USER', val: process.env.EMAIL_ADMIN_USER || 'info.harryoverseas@gmail.com', cat: 'email', desc: 'Admin Gmail SMTP Username', secret: false },
      { key: 'EMAIL_ADMIN_PASS', val: process.env.EMAIL_ADMIN_PASS || '', cat: 'email', desc: 'Admin Gmail App Password', secret: true },

      // Slack Webhooks
      { key: 'SLACK_LEADS_WEBHOOK_URL', val: process.env.SLACK_LEADS_WEBHOOK_URL || '', cat: 'slack', desc: 'Slack Webhook for Leads & Enquiries', secret: true },
      { key: 'SLACK_CAREERS_WEBHOOK_URL', val: process.env.SLACK_CAREERS_WEBHOOK_URL || '', cat: 'slack', desc: 'Slack Webhook for Job Applications', secret: true },
      { key: 'SLACK_ALERTS_WEBHOOK_URL', val: process.env.SLACK_ALERTS_WEBHOOK_URL || '', cat: 'slack', desc: 'Slack Webhook for Security Alerts & Audit', secret: true },
      { key: 'SLACK_WEBHOOK_URL', val: process.env.SLACK_WEBHOOK_URL || '', cat: 'slack', desc: 'Fallback Slack Webhook', secret: true },

      // Support & Contact Channels
      { key: 'SUPPORT_PHONE', val: process.env.SUPPORT_PHONE || '+91 6302951891', cat: 'general', desc: 'Customer Support Helpline Number (India)', secret: false },
      { key: 'SUPPORT_PHONE_GERMANY', val: process.env.SUPPORT_PHONE_GERMANY || '+49 17670256852', cat: 'general', desc: 'Customer Support Helpline Number (Germany)', secret: false },
      { key: 'WHATSAPP_SUPPORT_NUMBER', val: process.env.WHATSAPP_SUPPORT_NUMBER || '+91 6302951891', cat: 'general', desc: 'Official WhatsApp Dispatch / Support Number', secret: false },
      { key: 'PORTAL_MAINTENANCE_MODE', val: 'false', cat: 'general', desc: 'Maintenance Mode Flag (true/false)', secret: false }
    ];

    let insertedCount = 0;
    for (const item of seedSettings) {
      // ON CONFLICT DO NOTHING: preserves any live passwords/webhooks already stored in the DB
      const res = await client.query(
        `INSERT INTO system_settings (key, value, category, description, is_secret, updated_by)
         VALUES ($1, $2, $3, $4, $5, 'seed_script')
         ON CONFLICT (key) DO UPDATE
         SET description = EXCLUDED.description,
             category = EXCLUDED.category,
             is_secret = EXCLUDED.is_secret
         WHERE system_settings.value IS NULL OR system_settings.value = ''`,
        [item.key, item.val, item.cat, item.desc, item.secret]
      );
      insertedCount++;
    }

    await client.query('COMMIT');
    console.log(`\n🎉 [SEED COMPLETE] Database schema and baseline configuration verified (${insertedCount} keys checked).`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ [SEED ERROR] Failed to seed database:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
