import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ [SEED ERROR] DATABASE_URL is not defined in .env');
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

async function runSeed() {
  const client = await pool.connect();
  console.log('🚀 [DB SEED] Connected to PostgreSQL database.');

  try {
    await client.query('BEGIN');

    // 1. Ensure system_settings table exists
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

    // 2. Ensure users table and permissions column exist
    console.log('👤 [2/4] Ensuring users table and permissions column...');
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

    // 3. Seed / Update Super Admin
    console.log('🔑 [3/4] Seeding/Updating Super Admin account...');
    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin_harry_2026_secure';
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin.harryoverseas@gmail.com').trim();
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(adminPassword, salt);
    const superAdminPerms = JSON.stringify(['*']);

    await client.query(
      `INSERT INTO users (username, email, password_hash, role, permissions)
       VALUES ($1, $2, $3, 'Super Admin', $4)
       ON CONFLICT (username) DO UPDATE 
       SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = 'Super Admin', permissions = EXCLUDED.permissions`,
      [adminUsername, adminEmail, hash, superAdminPerms]
    );
    console.log(`   ✓ Super Admin synced: ${adminUsername} (${adminEmail})`);

    // 4. Seed / Update system_settings from environment variables
    console.log('⚙️ [4/4] Seeding system configurations into system_settings...');
    const seedSettings = [
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

      { key: 'SUPPORT_PHONE', val: '+91 6302951891', cat: 'general', desc: 'Customer Support Helpline Number', secret: false },
      { key: 'WHATSAPP_SUPPORT_NUMBER', val: '+91 6302951891', cat: 'general', desc: 'Official WhatsApp Dispatch / Support Number', secret: false },
      { key: 'PORTAL_MAINTENANCE_MODE', val: 'false', cat: 'general', desc: 'Maintenance Mode Flag (true/false)', secret: false }
    ];

    let insertedCount = 0;
    for (const item of seedSettings) {
      if (item.val) {
        await client.query(
          `INSERT INTO system_settings (key, value, category, description, is_secret, updated_by)
           VALUES ($1, $2, $3, $4, $5, 'seed_script')
           ON CONFLICT (key) DO UPDATE
           SET value = EXCLUDED.value,
               category = EXCLUDED.category,
               description = EXCLUDED.description,
               is_secret = EXCLUDED.is_secret,
               updated_at = CURRENT_TIMESTAMP,
               updated_by = 'seed_script'`,
          [item.key, item.val, item.cat, item.desc, item.secret]
        );
        insertedCount++;
        console.log(`   ✓ [${item.cat}] ${item.key} -> ${item.secret ? '••••••••' : item.val}`);
      }
    }

    await client.query('COMMIT');
    console.log(`\n🎉 [SEED COMPLETE] Successfully seeded ${insertedCount} system configuration rows and synchronized Super Admin.`);
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
