import sqlite3 from 'sqlite3';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { Pool } = pg;

const dbPath = process.env.DB_PATH || './database.sqlite';
const databaseUrl = process.env.DATABASE_URL;

console.log('====================================================');
console.log('   EuroPath: SQLite to PostgreSQL Migration Tool');
console.log('====================================================\n');

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL is not defined in your .env file.');
  console.error('Please set your Supabase or PostgreSQL connection string in .env:');
  console.error('DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require\n');
  process.exit(1);
}

const sqliteFullPath = path.resolve(dbPath);
if (!fs.existsSync(sqliteFullPath)) {
  console.error(`❌ Error: SQLite database not found at "${sqliteFullPath}"`);
  process.exit(1);
}

console.log(`📁 Source SQLite:      ${sqliteFullPath}`);
const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
console.log(`🐘 Target PostgreSQL:  ${maskedUrl}\n`);

// Helper to wrap SQLite queries in promises
function sqliteAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function runMigration() {
  // 1. Connect to SQLite
  const sqliteDb = new sqlite3.Database(sqliteFullPath, sqlite3.OPEN_READONLY);
  console.log('✓ Connected to source SQLite database.');

  // 2. Connect to PostgreSQL
  const useSsl = databaseUrl.includes('sslmode=require') || 
                 databaseUrl.includes('ssl=true') || 
                 databaseUrl.includes('neon.tech') || 
                 databaseUrl.includes('supabase') || 
                 process.env.NODE_ENV === 'production';

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
    ssl: useSsl ? { rejectUnauthorized: false } : false
  });

  let client;
  try {
    client = await pool.connect();
    console.log('✓ Connected to target PostgreSQL database.\n');
  } catch (connErr) {
    console.error('\n❌ Could not connect to PostgreSQL database:', connErr.message);
    if (databaseUrl.includes('supabase.co')) {
      console.log('\n💡 Supabase Tip:');
      console.log('Direct hostnames like "db.[ref].supabase.co" often require IPv6.');
      console.log('If your network does not support IPv6, use the Supabase Connection Pooler URI (IPv4 compatible):');
      console.log('1. Go to Supabase Dashboard -> Project Settings -> Database -> Connection string');
      console.log('2. Select "Connection Pooling" (Session or Transaction mode, port 5432 or 6543)');
      console.log('3. Copy the URI (it will look like: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require)');
    }
    sqliteDb.close();
    await pool.end();
    process.exit(1);
  }

  try {
    // 3. Ensure target schema tables exist
    console.log('🔨 Ensuring target schema tables exist in PostgreSQL...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id VARCHAR(50) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        mobile VARCHAR(50),
        phone VARCHAR(50),
        whatsapp VARCHAR(50),
        email VARCHAR(255) NOT NULL,
        city VARCHAR(100),
        country VARCHAR(100),
        main_services TEXT,
        service_interest TEXT,
        language_course VARCHAR(50),
        additional_services TEXT,
        intended_destination VARCHAR(100),
        destination_country VARCHAR(100),
        travel_period VARCHAR(100),
        consultation_method VARCHAR(50),
        additional_reqs TEXT,
        message TEXT,
        status VARCHAR(50) DEFAULT 'New',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        role VARCHAR(100) NOT NULL,
        resume_link TEXT,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'New',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Schema verified.\n');

    // 4. Migrate Users
    console.log('👤 Migrating users table...');
    let users = [];
    try {
      users = await sqliteAll(sqliteDb, 'SELECT * FROM users');
    } catch (e) {
      console.warn('  ⚠️ Note: No users table in SQLite, skipping.');
    }

    let usersMigrated = 0;
    for (const u of users) {
      await client.query(`
        INSERT INTO users (id, username, email, password_hash, role, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (username) DO UPDATE SET
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role;
      `, [u.id, u.username, u.email, u.password_hash, u.role, u.created_at || new Date()]);
      usersMigrated++;
    }
    console.log(`  ✓ Users migrated: ${usersMigrated} records.`);

    // Reset sequence for users
    if (usersMigrated > 0) {
      await client.query(`
        SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
      `);
    }

    // 5. Migrate Enquiries
    console.log('\n📋 Migrating enquiries table...');
    let enquiries = [];
    try {
      enquiries = await sqliteAll(sqliteDb, 'SELECT * FROM enquiries');
    } catch (e) {
      console.warn('  ⚠️ Note: No enquiries table in SQLite, skipping.');
    }

    let enquiriesMigrated = 0;
    for (const enq of enquiries) {
      await client.query(`
        INSERT INTO enquiries (
          id, full_name, mobile, phone, whatsapp, email, city, country,
          main_services, service_interest, language_course, additional_services,
          intended_destination, destination_country, travel_period,
          consultation_method, additional_reqs, message, status, created_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15,
          $16, $17, $18, $19, $20
        )
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          mobile = EXCLUDED.mobile,
          phone = EXCLUDED.phone,
          whatsapp = EXCLUDED.whatsapp,
          email = EXCLUDED.email,
          city = EXCLUDED.city,
          country = EXCLUDED.country,
          main_services = EXCLUDED.main_services,
          service_interest = EXCLUDED.service_interest,
          language_course = EXCLUDED.language_course,
          additional_services = EXCLUDED.additional_services,
          intended_destination = EXCLUDED.intended_destination,
          destination_country = EXCLUDED.destination_country,
          travel_period = EXCLUDED.travel_period,
          consultation_method = EXCLUDED.consultation_method,
          additional_reqs = EXCLUDED.additional_reqs,
          message = EXCLUDED.message,
          status = EXCLUDED.status;
      `, [
        enq.id,
        enq.full_name,
        enq.mobile || null,
        enq.phone || null,
        enq.whatsapp || null,
        enq.email,
        enq.city || null,
        enq.country || null,
        enq.main_services || null,
        enq.service_interest || null,
        enq.language_course || null,
        enq.additional_services || null,
        enq.intended_destination || null,
        enq.destination_country || null,
        enq.travel_period || null,
        enq.consultation_method || null,
        enq.additional_reqs || null,
        enq.message || null,
        enq.status || 'New',
        enq.created_at || new Date()
      ]);
      enquiriesMigrated++;
    }
    console.log(`  ✓ Enquiries migrated: ${enquiriesMigrated} records.`);

    // 6. Migrate Job Applications
    console.log('\n💼 Migrating applications table...');
    let applications = [];
    try {
      applications = await sqliteAll(sqliteDb, 'SELECT * FROM applications');
    } catch (e) {
      console.warn('  ⚠️ Note: No applications table in SQLite, skipping.');
    }

    let applicationsMigrated = 0;
    for (const app of applications) {
      await client.query(`
        INSERT INTO applications (
          id, full_name, email, phone, role, resume_link, notes, status, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          role = EXCLUDED.role,
          resume_link = EXCLUDED.resume_link,
          notes = EXCLUDED.notes,
          status = EXCLUDED.status;
      `, [
        app.id,
        app.full_name,
        app.email,
        app.phone,
        app.role,
        app.resume_link || null,
        app.notes || null,
        app.status || 'New',
        app.created_at || new Date()
      ]);
      applicationsMigrated++;
    }
    console.log(`  ✓ Applications migrated: ${applicationsMigrated} records.`);

    // Reset sequence for applications
    if (applicationsMigrated > 0) {
      await client.query(`
        SELECT setval(pg_get_serial_sequence('applications', 'id'), COALESCE((SELECT MAX(id) FROM applications), 1));
      `);
    }

    console.log('\n====================================================');
    console.log('🎉 Migration completed successfully!');
    console.log(`   - Users:        ${usersMigrated}`);
    console.log(`   - Enquiries:    ${enquiriesMigrated}`);
    console.log(`   - Applications: ${applicationsMigrated}`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ Migration failed with error:', err);
    process.exit(1);
  } finally {
    sqliteDb.close();
    client.release();
    await pool.end();
  }
}

runMigration();
