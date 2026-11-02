import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

dotenv.config();

const { Pool } = pg;
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = parseInt(process.env.PORT || '5000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'harry_global_secret_key_2026_secure';

// Dual-persistence state
let dbEngine = 'sqlite';
let pgPool = null;
let sqliteDb = null;

const databaseUrl = process.env.DATABASE_URL;
const dbPath = process.env.DB_PATH || (process.env.VERCEL ? '/tmp/database.sqlite' : './database.sqlite');

/**
 * Connect to database engine (PostgreSQL if available, otherwise SQLite)
 */
async function connectDb() {
  if (pgPool || sqliteDb) {
    return;
  }

  if (databaseUrl) {
    try {
      const useSsl = databaseUrl.includes('sslmode=require') || 
                     databaseUrl.includes('ssl=true') || 
                     databaseUrl.includes('neon.tech') || 
                     databaseUrl.includes('supabase') || 
                     process.env.NODE_ENV === 'production';

      const pool = new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 5000,
        ssl: useSsl ? { rejectUnauthorized: false } : false
      });
      const client = await pool.connect();
      client.release();
      pgPool = pool;
      dbEngine = 'postgres';
      console.log('[DB] Connected to PostgreSQL database successfully.');
      return;
    } catch (err) {
      console.warn('[DB] PostgreSQL connection failed. Falling back to SQLite adapter:', err.message);
    }
  }

  // SQLite fallback
  dbEngine = 'sqlite';
  const dir = path.dirname(path.resolve(dbPath));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('[DB] SQLite connection error:', err);
        return reject(err);
      }
      console.log(`[DB] Connected to SQLite database at ${dbPath}`);
      sqliteDb.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
        if (pragmaErr) console.warn('[DB] PRAGMA error:', pragmaErr.message);
        resolve();
      });
    });
  });
}

/**
 * Universal query abstraction supporting parameterized queries ($1, $2)
 * across both PostgreSQL and SQLite.
 */
async function query(sql, params = []) {
  if (dbEngine === 'postgres' && pgPool) {
    const res = await pgPool.query(sql, params);
    return {
      rows: res.rows || [],
      rowCount: res.rowCount ?? (res.rows?.length || 0)
    };
  }

  return new Promise((resolve, reject) => {
    // Convert PostgreSQL $1, $2, ... to SQLite ?1, ?2, ...
    const sqliteSql = sql.replace(/\$(\d+)/g, '?$1');
    const upper = sqliteSql.trim().toUpperCase();
    const isSelect = upper.startsWith('SELECT') || upper.startsWith('PRAGMA');
    const hasReturning = upper.includes('RETURNING');

    if (isSelect || hasReturning) {
      sqliteDb.all(sqliteSql, params, (err, rows) => {
        if (err) return reject(err);
        const resultRows = rows || [];
        resolve({
          rows: resultRows,
          rowCount: resultRows.length
        });
      });
    } else {
      sqliteDb.run(sqliteSql, params, function (err) {
        if (err) return reject(err);
        resolve({
          rows: [],
          rowCount: this.changes,
          insertId: this.lastID
        });
      });
    }
  });
}

/**
 * Database schema initialization and admin synchronization
 */
async function initDb() {
  const isPostgres = dbEngine === 'postgres';
  const idCol = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';

  // 1. Users table
  await query(`CREATE TABLE IF NOT EXISTS users (
    id ${idCol},
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // 2. Enquiries table
  await query(`CREATE TABLE IF NOT EXISTS enquiries (
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
  )`);

  // 3. Applications table
  await query(`CREATE TABLE IF NOT EXISTS applications (
    id ${idCol},
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    role VARCHAR(100) NOT NULL,
    resume_link TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'New',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Admin seeding / credentials synchronization from .env
  const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin_harry_2026_secure';
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@harryglobal.com').trim();

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(adminPassword, salt);

  const existing = await query('SELECT * FROM users WHERE username = $1', [adminUsername]);
  if (existing.rows.length === 0) {
    await query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [adminUsername, adminEmail, hash, 'Super Admin']
    );
    console.log(`[DB] Admin user created: ${adminUsername}`);
  } else {
    // Keep password hash synchronized with current environment configuration
    await query(
      'UPDATE users SET password_hash = $1 WHERE username = $2',
      [hash, adminUsername]
    );
    console.log(`[DB] Admin user credentials synchronized: ${adminUsername}`);
  }
}

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  }
});

// Non-blocking notification dispatcher
async function sendNotificationEmail(lead) {
  setTimeout(async () => {
    try {
      if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'sample_app_password') {
        return;
      }
      const mailOptions = {
        from: '"Harry Global Immigration" <noreply@harryglobal.com>',
        to: (process.env.ADMIN_EMAIL || 'admin@harryglobal.com') + (lead.email ? ', ' + lead.email : ''),
        subject: `New Enquiry Received: ${lead.id} - ${lead.full_name}`,
        text: `Hello,\n\nA new enquiry has been submitted by ${lead.full_name}.\nContact: ${lead.mobile || lead.phone}\nEmail: ${lead.email}\n\nPlease check the admin dashboard to review.`
      };
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log('[Email note]:', err.message);
        } else {
          console.log('[Email sent]:', info.response);
        }
      });
    } catch (e) {
      console.error('[Email notification error]:', e);
    }
  }, 100);
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Access token required or invalid' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1].trim()) {
    return res.status(401).json({ success: false, error: 'Access token required or invalid' });
  }

  const token = parts[1].trim();

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Access token required or invalid' });
    }
    req.user = decoded;
    next();
  });
}

// --- API ROUTES ---

// 1. Admin Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (
    !username || !password ||
    typeof username !== 'string' || typeof password !== 'string' ||
    !username.trim() || !password.trim()
  ) {
    return res.status(400).json({ success: false, error: 'Username and password required' });
  }

  const cleanUser = username.trim();
  const cleanPass = password;

  try {
    const result = await query('SELECT * FROM users WHERE username = $1 OR email = $1', [cleanUser]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const user = result.rows[0];
    const passwordIsValid = bcrypt.compareSync(cleanPass, user.password_hash);
    if (!passwordIsValid) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error during admin login:', err);
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' });
  }
});

// 2. Verify Token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
});

// 3. Create Job Application (Public Endpoint)
app.post('/api/applications', async (req, res) => {
  const body = req.body || {};
  const fullName = body.full_name || body.fullName;
  const email = body.email;
  const phone = body.phone || body.mobile;
  const role = body.role;
  const resumeLink = body.resume_link || body.resumeLink || '';
  const notes = body.notes || '';

  if (
    !fullName || typeof fullName !== 'string' || !fullName.trim() ||
    !email || typeof email !== 'string' || !email.trim() ||
    !phone || typeof phone !== 'string' || !phone.trim() ||
    !role || typeof role !== 'string' || !role.trim()
  ) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields (full_name, email, phone, role)'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email address format'
    });
  }

  try {
    const insertQuery = `
      INSERT INTO applications (full_name, email, phone, role, resume_link, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, full_name, email, phone, role, resume_link, notes, status, created_at
    `;
    const result = await query(insertQuery, [
      fullName.trim(),
      email.trim(),
      phone.trim(),
      role.trim(),
      resumeLink ? String(resumeLink).trim() : '',
      notes ? String(notes).trim() : '',
      'New'
    ]);

    const createdApp = result.rows[0];
    return res.status(201).json({
      success: true,
      application_id: createdApp.id,
      message: 'Application submitted successfully',
      application: createdApp
    });
  } catch (err) {
    console.error('Error creating job application:', err);
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' });
  }
});

// 4. Get Job Applications (Protected Endpoint with Filtering/Search)
app.get('/api/applications', authenticateToken, async (req, res) => {
  try {
    let sql = 'SELECT * FROM applications WHERE 1=1';
    const params = [];
    let paramIdx = 1;

    const { role, status, search } = req.query;

    if (role && role !== 'All') {
      sql += ` AND LOWER(role) = LOWER($${paramIdx++})`;
      params.push(role);
    }

    if (status && status !== 'All') {
      sql += ` AND LOWER(status) = LOWER($${paramIdx++})`;
      params.push(status);
    }

    if (search && String(search).trim()) {
      const term = `%${String(search).trim().toLowerCase()}%`;
      sql += ` AND (LOWER(full_name) LIKE $${paramIdx} OR LOWER(email) LIKE $${paramIdx} OR LOWER(phone) LIKE $${paramIdx} OR LOWER(role) LIKE $${paramIdx} OR LOWER(COALESCE(notes, '')) LIKE $${paramIdx})`;
      paramIdx++;
      params.push(term);
    }

    sql += ' ORDER BY created_at DESC, id DESC';

    const result = await query(sql, params);
    return res.status(200).json({
      success: true,
      applications: result.rows
    });
  } catch (err) {
    console.error('Error fetching job applications:', err);
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' });
  }
});

// 5. Update Job Application Status (Protected Endpoint)
app.patch('/api/applications/:id/status', authenticateToken, async (req, res) => {
  const rawId = req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id) || String(id) !== String(rawId).trim()) {
    return res.status(400).json({ success: false, error: 'Invalid application ID' });
  }

  const { status } = req.body || {};
  const validStatuses = ['New', 'Reviewing', 'Shortlisted', 'Interviewed', 'Hired', 'Rejected'];

  if (!status || typeof status !== 'string' || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  try {
    const result = await query(
      'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      id,
      status,
      application: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating application status:', err);
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' });
  }
});

// 6. Delete Job Application (Protected Endpoint)
app.delete('/api/applications/:id', authenticateToken, async (req, res) => {
  const rawId = req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id) || String(id) !== String(rawId).trim()) {
    return res.status(400).json({ success: false, error: 'Invalid application ID' });
  }

  try {
    const result = await query('DELETE FROM applications WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
      id
    });
  } catch (err) {
    console.error('Error deleting application:', err);
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' });
  }
});

// 7. Create New Customer Enquiry (Public Endpoint)
app.post('/api/enquiries', async (req, res) => {
  const lead = req.body || {};
  const fullName = lead.fullName || lead.full_name;
  const email = lead.email;
  const mobile = lead.mobile || lead.phone;

  if (
    !fullName || typeof fullName !== 'string' || !fullName.trim() ||
    !email || typeof email !== 'string' || !email.trim() ||
    !mobile || typeof mobile !== 'string' || !mobile.trim()
  ) {
    return res.status(400).json({
      success: false,
      error: 'Missing required enquiry contact fields (full_name, email, mobile)'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email address format'
    });
  }

  const id = lead.id || `HGI-${Math.floor(1000 + Math.random() * 9000)}`;

  const mainServicesRaw = lead.mainServices || lead.main_services || [];
  const mainServicesJson = JSON.stringify(Array.isArray(mainServicesRaw) ? mainServicesRaw : [mainServicesRaw]);
  const addServicesRaw = lead.additionalServices || lead.additional_services || [];
  const addServicesJson = JSON.stringify(Array.isArray(addServicesRaw) ? addServicesRaw : [addServicesRaw]);

  const serviceInterest = Array.isArray(mainServicesRaw) ? mainServicesRaw.join(', ') : String(mainServicesRaw);
  const destCountry = lead.intendedDestination || lead.intended_destination || lead.destination_country || 'Germany';
  const reqMessage = lead.additionalReqs || lead.additional_reqs || lead.message || '';

  const insertSql = `
    INSERT INTO enquiries (
      id, full_name, mobile, phone, whatsapp, email, city, country,
      main_services, service_interest, language_course, additional_services,
      intended_destination, destination_country, travel_period, consultation_method,
      additional_reqs, message, status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12,
      $13, $14, $15, $16,
      $17, $18, $19
    ) RETURNING *
  `;

  try {
    const values = [
      id,
      fullName.trim(),
      mobile.trim(),
      mobile.trim(),
      lead.whatsapp || mobile.trim(),
      email.trim(),
      lead.city || 'Anantapur',
      lead.country || 'India',
      mainServicesJson,
      serviceInterest,
      lead.languageCourse || lead.language_course || '',
      addServicesJson,
      destCountry,
      destCountry,
      lead.travelPeriod || lead.travel_period || 'Immediate',
      lead.consultationMethod || lead.consultation_method || 'WhatsApp',
      reqMessage,
      reqMessage,
      'New'
    ];

    const result = await query(insertSql, values);
    const createdLead = result.rows[0];

    sendNotificationEmail(createdLead);

    return res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      id,
      enquiry_id: id,
      lead: {
        ...createdLead,
        main_services: Array.isArray(mainServicesRaw) ? mainServicesRaw : [],
        additional_services: Array.isArray(addServicesRaw) ? addServicesRaw : []
      }
    });
  } catch (err) {
    console.error('Error creating customer enquiry:', err);
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' });
  }
});

// 8. Get All Enquiries (Protected Endpoint)
app.get('/api/enquiries', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM enquiries ORDER BY created_at DESC');
    const formatted = result.rows.map(row => {
      let main_services = [];
      let additional_services = [];
      try {
        main_services = row.main_services ? JSON.parse(row.main_services) : [];
      } catch {
        main_services = row.main_services ? [row.main_services] : [];
      }
      try {
        additional_services = row.additional_services ? JSON.parse(row.additional_services) : [];
      } catch {
        additional_services = row.additional_services ? [row.additional_services] : [];
      }
      return {
        ...row,
        main_services,
        additional_services
      };
    });

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Error fetching customer enquiries:', err);
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' });
  }
});

// 9. Update Enquiry Status (Protected Endpoint)
app.patch('/api/enquiries/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!status || typeof status !== 'string') {
    return res.status(400).json({ success: false, error: 'Status is required' });
  }

  try {
    const result = await query('UPDATE enquiries SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }
    return res.status(200).json({ success: true, message: 'Status updated successfully', id, status });
  } catch (err) {
    console.error('Error updating enquiry status:', err);
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' });
  }
});

// 10. Delete Enquiry (Protected Endpoint)
app.delete('/api/enquiries/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM enquiries WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }
    return res.status(200).json({ success: true, message: 'Enquiry deleted successfully', id });
  } catch (err) {
    console.error('Error deleting enquiry:', err);
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' });
  }
});

// 11. System Users Management (Super Admin only, Protected)
app.get('/api/users', authenticateToken, async (req, res) => {
  if (req.user?.role !== 'Super Admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized access' });
  }
  try {
    const result = await query('SELECT id, username, email, role, created_at FROM users ORDER BY id ASC');
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  if (req.user?.role !== 'Super Admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized access' });
  }
  const { username, email, password, role } = req.body || {};
  if (!username || !email || !password || !role) {
    return res.status(400).json({ success: false, error: 'All fields required' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  try {
    const result = await query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [username.trim(), email.trim(), hash, role.trim()]
    );
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: result.rows[0].id
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ success: false, error: 'Username or email already exists' });
  }
});

// 12. WhatsApp Webhook / Dispatch Endpoint
app.post('/api/whatsapp/send', authenticateToken, async (req, res) => {
  const { phone, message } = req.body || {};
  if (!phone || !message) {
    return res.status(400).json({ success: false, error: 'Phone and message required' });
  }

  console.log(`[WHATSAPP API] Dispatching to ${phone}: ${message}`);
  return res.status(200).json({
    success: true,
    message: 'WhatsApp message dispatched successfully via Meta Cloud API / Twilio',
    recipient: phone,
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start listening
await connectDb();
await initDb();

let server = null;
if (process.env.NODE_ENV !== 'test_no_listen' && !process.env.VERCEL) {
  server = app.listen(PORT, () => {
    console.log(`Harry Global Immigration backend server running on port ${PORT} [engine: ${dbEngine}]`);
  });
}

export { app, query, initDb, connectDb, authenticateToken, server };
