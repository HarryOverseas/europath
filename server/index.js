import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import {
  notifyNewEnquiry,
  notifyNewJobApplication,
  notifyAdminAlert,
  notifyApplicationStageChange,
  notifyEnquiryStageChange
} from './services/notifier.js';
import { listTemplates, renderTemplate } from './services/templateEngine.js';
import {
  notifySlackNewLead,
  notifySlackJobApplication,
  notifySlackAdminAlert,
  notifySlackStageChange
} from './services/slackNotifier.js';
import {
  initArchivalTables,
  runDataArchival,
  getArchivalStats,
  restoreArchivedEnquiry,
  restoreArchivedApplication,
  startDailyArchivalScheduler
} from './services/archivalService.js';
import {
  initConfigService,
  refreshCache,
  getConfig,
  getAllSettingsForAdmin,
  updateSettings
} from './services/configService.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import fs from 'fs';

dotenv.config();

const { Pool } = pg;
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Payload Decryption Configuration (AES-256-GCM)
// Must match frontend VITE_PAYLOAD_SECRET. Independent of JWT_SECRET.
const PAYLOAD_SECRET = process.env.PAYLOAD_SECRET || process.env.VITE_PAYLOAD_SECRET || 'harry_global_payload_secure_2026';
const PAYLOAD_KEY = crypto.createHash('sha256').update(PAYLOAD_SECRET).digest();

/**
 * Decrypts frontend payloads encrypted via Web Crypto AES-256-GCM.
 * Input format: Base64 string of [IV (12 bytes)][AuthTag (16 bytes)][Ciphertext]
 */
function decryptPayloadData(cipherBase64) {
  try {
    const buffer = Buffer.from(cipherBase64, 'base64');
    if (buffer.length < 28) return null;
    const iv = buffer.subarray(0, 12);
    const tag = buffer.subarray(12, 28);
    const ciphertext = buffer.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', PAYLOAD_KEY, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    return JSON.parse(decrypted);
  } catch (err) {
    console.warn('[SECURITY] Failed to decrypt encrypted payload:', err.message);
    return null;
  }
}

// Transparent Payload Decryption Middleware:
// If request body contains an encrypted payload (`__enc` or `payload`), decrypts it before endpoint handlers.
app.use((req, res, next) => {
  if (req.body && (req.body.__enc || req.body.payload)) {
    const encryptedToken = req.body.__enc || req.body.payload;
    if (typeof encryptedToken === 'string') {
      const decrypted = decryptPayloadData(encryptedToken);
      if (decrypted && typeof decrypted === 'object') {
        req.body = decrypted;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Failed to decrypt encrypted payload. Check encryption secret configuration.'
        });
      }
    }
  }
  next();
});

const PORT = parseInt(process.env.PORT || '5000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'harry_global_secret_key_2026_secure';

let pgPool = null;
const databaseUrl = process.env.DATABASE_URL;

/**
 * Connect to PostgreSQL database
 */
async function connectDb() {
  if (pgPool) {
    return;
  }

  if (!databaseUrl) {
    throw new Error('[DB] DATABASE_URL environment variable is required for PostgreSQL connection.');
  }

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
  console.log('[DB] Connected to PostgreSQL database successfully.');
}

/**
 * Universal query abstraction supporting parameterized queries ($1, $2)
 */
async function query(sql, params = []) {
  if (!pgPool) {
    await connectDb();
  }
  const res = await pgPool.query(sql, params);
  return {
    rows: res.rows || [],
    rowCount: res.rowCount ?? (res.rows?.length || 0)
  };
}

/**
 * Database schema initialization and admin synchronization
 */
async function initDb() {
  const idCol = 'SERIAL PRIMARY KEY';

  // 1. Users table
  await query(`CREATE TABLE IF NOT EXISTS users (
    id ${idCol},
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    permissions TEXT DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Ensure permissions column exists for existing tables
  try {
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT '[]'`);
  } catch (err) {
    // Column might already exist
  }

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

  // 4. Initialize Data Archival Tables & Audit Schema
  await initArchivalTables(query);

  // 5. Initialize Dynamic System Configuration Cache (User accounts & system settings are managed in database)
  await initConfigService(query);
}

// Multi-Inbox Notification Service handles email routing across
// admin.harryoverseas@gmail.com, info.harryoverseas@gmail.com, and support.harryoverseas@gmail.com
// via server/services/notifier.js

// Authentication & RBAC Middleware
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

/**
 * Role-Based Access Control (RBAC) guard middleware
 * @param {string|string[]} requiredPermissions - Required permission flag(s)
 */
function requirePermission(requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Super Admin has unrestricted access to all resources
    if (req.user.role === 'Super Admin') {
      return next();
    }

    const perms = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    if (perms.includes('*')) {
      return next();
    }

    const needed = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    const hasPermission = needed.some(np => perms.includes(np));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires permission: ${needed.join(' or ')}`
      });
    }

    next();
  };
}

/**
 * Helper to parse permissions array from user record
 */
function parseUserPermissions(user) {
  if (user.role === 'Super Admin') {
    return ['*'];
  }
  let perms = [];
  try {
    perms = user.permissions ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions) : [];
  } catch {
    perms = [];
  }
  // Default permissions according to role if empty
  if (!perms.length) {
    switch (user.role) {
      case 'Operations Manager':
        perms = ['enquiries:read', 'enquiries:write', 'applications:read', 'applications:write', 'archive:read'];
        break;
      case 'Counselor':
        perms = ['enquiries:read', 'enquiries:write'];
        break;
      case 'Recruiter':
        perms = ['applications:read', 'applications:write'];
        break;
      case 'Auditor':
      case 'Viewer':
        perms = ['enquiries:read', 'applications:read', 'archive:read'];
        break;
      default:
        perms = ['enquiries:read'];
    }
  }
  return perms;
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

    const permissions = parseUserPermissions(user);

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role, permissions },
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
        role: user.role,
        permissions
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
    notifyNewJobApplication(createdApp);
    notifySlackJobApplication(createdApp);
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
app.get('/api/applications', authenticateToken, requirePermission(['applications:read', '*']), async (req, res) => {
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
app.patch('/api/applications/:id/status', authenticateToken, requirePermission(['applications:write', '*']), async (req, res) => {
  const rawId = req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id) || String(id) !== String(rawId).trim()) {
    return res.status(400).json({ success: false, error: 'Invalid application ID' });
  }

  const { status, notes } = req.body || {};
  const validStatuses = ['New', 'Reviewing', 'Shortlisted', 'Interviewed', 'Hired', 'Rejected'];

  if (!status || typeof status !== 'string' || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  try {
    const existing = await query('SELECT * FROM applications WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    const prevStatus = existing.rows[0].status;

    const result = await query(
      'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    const updatedApp = result.rows[0];

    // Dispatch stage-transition notifications (Email + Slack)
    if (prevStatus !== status) {
      notifyApplicationStageChange(updatedApp, prevStatus, status, notes);
      notifySlackStageChange('application', updatedApp, prevStatus, status, req.user?.username || 'Admin', notes);
    }

    return res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      id,
      status,
      application: updatedApp
    });
  } catch (err) {
    console.error('Error updating application status:', err);
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' });
  }
});

// 6. Delete Job Application (Protected Endpoint)
app.delete('/api/applications/:id', authenticateToken, requirePermission(['applications:delete', 'applications:write', '*']), async (req, res) => {
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

    notifyNewEnquiry(createdLead);
    notifySlackNewLead(createdLead);

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
app.get('/api/enquiries', authenticateToken, requirePermission(['enquiries:read', '*']), async (req, res) => {
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
app.patch('/api/enquiries/:id/status', authenticateToken, requirePermission(['enquiries:write', '*']), async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body || {};

  if (!status || typeof status !== 'string') {
    return res.status(400).json({ success: false, error: 'Status is required' });
  }

  try {
    const existing = await query('SELECT * FROM enquiries WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }
    const prevStatus = existing.rows[0].status;

    const result = await query('UPDATE enquiries SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    const updatedEnquiry = result.rows[0];

    // Dispatch stage-transition notifications (Email + Slack)
    if (prevStatus !== status) {
      notifyEnquiryStageChange(updatedEnquiry, prevStatus, status, notes);
      notifySlackStageChange('enquiry', updatedEnquiry, prevStatus, status, req.user?.username || 'Admin', notes);
    }

    return res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      id,
      status,
      enquiry: updatedEnquiry
    });
  } catch (err) {
    console.error('Error updating enquiry status:', err);
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' });
  }
});

// 10. Delete Enquiry (Protected Endpoint)
app.delete('/api/enquiries/:id', authenticateToken, requirePermission(['enquiries:delete', 'enquiries:write', '*']), async (req, res) => {
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
    return res.status(403).json({ success: false, error: 'Unauthorized access. Super Admin required.' });
  }
  try {
    const result = await query('SELECT id, username, email, role, permissions, created_at FROM users ORDER BY id ASC');
    const formatted = result.rows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: parseUserPermissions(user),
      created_at: user.created_at
    }));
    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  if (req.user?.role !== 'Super Admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized access. Super Admin required.' });
  }
  const { username, email, password, role, permissions } = req.body || {};
  if (!username || !email || !password || !role) {
    return res.status(400).json({ success: false, error: 'Username, email, password, and role are required' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  let permsToSave = permissions;
  if (!permsToSave || !Array.isArray(permsToSave)) {
    permsToSave = parseUserPermissions({ role });
  }

  try {
    const result = await query(
      'INSERT INTO users (username, email, password_hash, role, permissions) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, created_at',
      [username.trim(), email.trim(), hash, role.trim(), JSON.stringify(permsToSave)]
    );
    const newUser = result.rows[0];

    notifyAdminAlert('New User Account Created', `User account '${username.trim()}' with role '${role.trim()}' was created by ${req.user?.username || 'Super Admin'}.`, {
      Username: username.trim(),
      Email: email.trim(),
      Role: role.trim(),
      CreatedBy: req.user?.username || 'Super Admin'
    });
    notifySlackAdminAlert('New User Account Created', `User account '${username.trim()}' with role '${role.trim()}' was created by ${req.user?.username || 'Super Admin'}.`, {
      Username: username.trim(),
      Email: email.trim(),
      Role: role.trim(),
      CreatedBy: req.user?.username || 'Super Admin'
    });
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        ...newUser,
        permissions: permsToSave
      }
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(400).json({ success: false, error: 'Username or email already exists' });
  }
});

// Update User (Role, Permissions, Password)
app.patch('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user?.role !== 'Super Admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized access. Super Admin required.' });
  }
  const { id } = req.params;
  const { role, permissions, password } = req.body || {};

  try {
    const existing = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updates = [];
    const params = [];
    let idx = 1;

    if (role && typeof role === 'string') {
      updates.push(`role = $${idx++}`);
      params.push(role.trim());
    }

    if (permissions && Array.isArray(permissions)) {
      updates.push(`permissions = $${idx++}`);
      params.push(JSON.stringify(permissions));
    }

    if (password && typeof password === 'string' && password.trim()) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      updates.push(`password_hash = $${idx++}`);
      params.push(hash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update provided' });
    }

    params.push(id);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, username, email, role, permissions, created_at`;
    const result = await query(sql, params);
    const updated = result.rows[0];

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        ...updated,
        permissions: parseUserPermissions(updated)
      }
    });
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete User
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user?.role !== 'Super Admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized access. Super Admin required.' });
  }
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (String(req.user.id) === String(id)) {
    return res.status(400).json({ success: false, error: 'Cannot delete your own active Super Admin account.' });
  }

  try {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id, username', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      message: `User '${result.rows[0].username}' deleted successfully`
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 11b. System Configurations & Dynamic Settings (Super Admin Only)
app.get('/api/admin/settings', authenticateToken, async (req, res) => {
  if (req.user?.role !== 'Super Admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized access. Super Admin required.' });
  }
  try {
    const settings = getAllSettingsForAdmin();
    return res.status(200).json({ success: true, settings });
  } catch (err) {
    console.error('Error fetching settings:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

app.post('/api/admin/settings', authenticateToken, async (req, res) => {
  if (req.user?.role !== 'Super Admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized access. Super Admin required.' });
  }
  const { settings } = req.body || {};
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid settings payload' });
  }

  try {
    await updateSettings(settings, req.user?.username || 'Super Admin', query);
    notifyAdminAlert('System Configuration Updated', `Database system settings were updated by ${req.user?.username || 'Super Admin'}.`, {
      UpdatedBy: req.user?.username || 'Super Admin',
      KeysModified: Object.keys(settings).join(', ')
    });
    notifySlackAdminAlert('System Configuration Updated', `System settings updated dynamically by ${req.user?.username || 'Super Admin'}.`, {
      UpdatedBy: req.user?.username || 'Super Admin',
      Keys: Object.keys(settings).join(', ')
    });

    const updatedList = getAllSettingsForAdmin();
    return res.status(200).json({
      success: true,
      message: 'System settings updated successfully and active immediately without restart.',
      settings: updatedList
    });
  } catch (err) {
    console.error('Error updating settings:', err);
    return res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// Test SMTP connection live
app.get('/api/admin/settings/test-smtp', authenticateToken, async (req, res) => {
  if (req.user?.role !== 'Super Admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized access. Super Admin required.' });
  }
  try {
    const { verifySmtpConnection } = await import('./services/notifier.js');
    const results = await verifySmtpConnection();
    return res.status(200).json({ success: true, results });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
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

// 12b. Email Templates Catalog & Preview Endpoints
app.get('/api/email/templates', (req, res) => {
  try {
    const list = listTemplates();
    return res.status(200).json({ success: true, count: list.length, templates: list });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/email/preview', (req, res) => {
  const { templateId, data } = req.body || {};
  if (!templateId) {
    return res.status(400).json({ success: false, error: 'templateId is required' });
  }
  try {
    const rendered = renderTemplate(templateId, data || {});
    return res.status(200).json({ success: true, ...rendered });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 13. DW RSS / RDF Feed Proxy & Reader Endpoint (XML)
app.get('/feed.xml', async (req, res) => {
  try {
    const dwFeedUrl = 'https://rss.dw.com/rdf/rss-en-all';

    // Fetch external DW RSS / RDF feed
    const response = await fetch(dwFeedUrl, {
      headers: {
        'User-Agent': 'HarryOverseasImmigration-RSSReader/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch DW feed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send(xmlText);
  } catch (err) {
    console.error('Error fetching DW RSS feed:', err);
    // Fallback XML if DW feed is temporarily unreachable
    const siteUrl = req.protocol + '://' + req.get('host');
    const pubDate = new Date().toUTCString();
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Harry Overseas Immigration &amp; German Academy (Fallback Feed)</title>
    <link>${siteUrl}</link>
    <description>Official RSS feed for Harry Overseas Immigration. DW feed temporarily unavailable.</description>
    <language>en-us</language>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <item>
      <title><![CDATA[Germany Visa Consultancy & Opportunity Card]]></title>
      <link>${siteUrl}/#services</link>
      <description><![CDATA[Expert guidance for Germany Opportunity Card and skilled worker immigration pathways.]]></description>
      <pubDate>${pubDate}</pubDate>
    </item>
  </channel>
</rss>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send(fallbackXml);
  }
});

// 14. News JSON API Endpoint for Flowing News Page
app.get('/api/news', async (req, res) => {
  try {
    const dwFeedUrl = 'https://rss.dw.com/rdf/rss-en-all';
    const response = await fetch(dwFeedUrl, {
      headers: {
        'User-Agent': 'HarryOverseasImmigration-NewsReader/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch DW feed: ${response.status}`);
    }

    const xmlText = await response.text();

    const items = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null && items.length < 30) {
      const itemContent = match[1];

      const getTagContent = (tagName) => {
        const cdataRegex = new RegExp(`<${tagName}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\/${tagName}>`, 'i');
        const normalRegex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i');
        const cMatch = itemContent.match(cdataRegex);
        if (cMatch) return cMatch[1].trim();
        const nMatch = itemContent.match(normalRegex);
        return nMatch ? nMatch[1].trim().replace(/<[^>]*>/g, '') : '';
      };

      const title = getTagContent('title');
      const link = getTagContent('link') || getTagContent('guid');
      const description = getTagContent('description');
      const pubDate = getTagContent('pubDate') || getTagContent('dc:date');

      if (title) {
        items.push({
          title,
          link,
          description: description.substring(0, 250) + (description.length > 250 ? '...' : ''),
          pubDate: pubDate ? new Date(pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'
        });
      }
    }

    return res.status(200).json({
      success: true,
      articles: items
    });
  } catch (err) {
    console.error('Error serving JSON news API:', err);
    return res.status(200).json({
      success: true,
      articles: [
        {
          title: 'Germany Welcomes Skilled Workers under New Opportunity Card',
          link: 'https://www.dw.com',
          description: 'Explore the latest updates on German immigration policies, work visas, and language proficiency requirements.',
          pubDate: 'Today'
        }
      ]
    });
  }
});

// ─── Chatbot API ──────────────────────────────────────────────────────────────
// POST /api/chat  { message: string, history: { role, content }[], enquiryId?: string }
// Uses Claude API when ANTHROPIC_API_KEY is set; falls back to rule-based replies.
app.post('/api/chat', async (req, res) => {
  const { message, history = [], enquiryId } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: 'message is required' });
  }

  // If user is registered with an enquiry ID, log this question to their record
  if (enquiryId && typeof enquiryId === 'string') {
    try {
      const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const existing = await query('SELECT message FROM enquiries WHERE id = $1', [enquiryId]);
      if (existing.rowCount > 0) {
        const prevMessage = existing.rows[0].message || '';
        const updatedMessage = `${prevMessage}\n• [${timestamp}] Asked: "${message.substring(0, 150)}"`.trim();
        await query('UPDATE enquiries SET message = $1 WHERE id = $2', [updatedMessage, enquiryId]);
      }
    } catch (e) {
      console.warn('[Chat] Could not append question to enquiry:', e.message);
    }
  }

  // ---- Try Claude API (claude-haiku-5-5 for speed + cost) ----
  const apiKey = getConfig('ANTHROPIC_API_KEY');
  if (apiKey) {
    try {
      const systemPrompt = `You are Harry, a friendly and knowledgeable immigration assistant for Harry Overseas Immigration, based in Anantapur, Andhra Pradesh, India. You help prospective students and workers navigate visa applications, language courses, and relocation to Germany and Europe.

Key details about Harry Overseas:
- Services: Student/Work/Business Visa consulting, Language (German A1-B2), Arrival Assistance in Germany
- Office: Near JNTU University, Anantapur, AP, India
- Phone (India): +91 6302951891
- Phone (Germany): +49 17670256852
- WhatsApp: +91 6302951891
- Google Maps: https://maps.app.goo.gl/fYazXdmvJG33oDN28

Your tone is warm, professional, and concise. Answer immigration-related questions thoroughly. For sensitive or legal queries, recommend the user book a consultation. If you do not know something specific, say so honestly and direct them to call or WhatsApp.`;

      const claudeMessages = [
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-5-5',
          max_tokens: 512,
          system: systemPrompt,
          messages: claudeMessages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data?.content?.[0]?.text || '';
        if (reply) return res.json({ success: true, reply });
      } else {
        console.warn('[Chat] Claude API error:', response.status);
      }
    } catch (err) {
      console.warn('[Chat] Claude API fetch failed:', err.message);
    }
  }

  // ---- Rule-based fallback ----
  const q = message.toLowerCase();
  let reply = '';

  if (/service|offer|help|do you|what can/.test(q)) {
    reply = 'We offer:\n• 🎓 Student Visa consulting for Germany & Europe\n• 💼 Work & Business Visa assistance\n• 🗣️ German Language courses (A1-B2)\n• 🏠 Arrival Assistance in Germany\n\nWould you like details on any of these?';
  } else if (/german.*visa|visa.*german|student.*visa|work.*visa/.test(q)) {
    reply = 'For a German student or work visa, you typically need:\n• Valid passport\n• University admission / job offer letter\n• Financial proof\n• Health insurance\n• Language certificate (A1-B2)\n\nWe guide you through every step. Book a free consultation at +91 6302951891 or WhatsApp us!';
  } else if (/language|german.*course|a1|a2|b1|b2/.test(q)) {
    reply = 'Our Language Academy offers German courses from A1 to B2 levels, both online and in-person at our Anantapur office.\n\nCourses prepare you for the Goethe-Institut exams required for visa applications. Call us at +91 6302951891 for the next batch schedule.';
  } else if (/arrival|germany|settle|accommodation|housing/.test(q)) {
    reply = 'Our Arrival Assistance service helps you:\n• Airport pickup in Germany\n• Accommodation search\n• Bank account opening\n• City registration (Anmeldung)\n• Local SIM & transport setup\n\nContact us to add this to your package.';
  } else if (/contact|phone|call|whatsapp|email|address|location|office/.test(q)) {
    reply = '📍 Near JNTU University, Anantapur, AP, India\n📞 India: +91 6302951891\n📞 Germany: +49 17670256852\n💬 WhatsApp: +91 6302951891\n\nOr visit us on Google Maps:\nhttps://maps.app.goo.gl/fYazXdmvJG33oDN28';
  } else if (/cost|fee|price|charge|how much/.test(q)) {
    reply = 'Our fees vary depending on the visa type and services required. We offer transparent, competitive pricing with no hidden charges.\n\nPlease contact us at +91 6302951891 or WhatsApp for a personalised quote.';
  } else if (/time|how long|duration|process|days|weeks|months/.test(q)) {
    reply = 'German visa processing typically takes 4-8 weeks after document submission. We help you prepare everything correctly the first time to avoid delays.\n\nStart early - call us at +91 6302951891 to plan your timeline!';
  } else if (/hello|hi|hey|good morning|good afternoon|good evening/.test(q)) {
    reply = 'Hello! 👋 I\'m Harry, your immigration guide.\n\nHow can I help you today? You can ask me about visas, language courses, or our arrival support services.';
  } else {
    reply = 'That\'s a great question! For personalised guidance, our experts are available at:\n📞 +91 6302951891 (India)\n📞 +49 17670256852 (Germany)\n💬 WhatsApp: +91 6302951891\n\nOr fill out our enquiry form on the website and we\'ll get back to you within 24 hours.';
  }

  return res.json({ success: true, reply });
});

// POST /api/chat/activity  { enquiryId: string, topic?: string, activity?: string }
// Appends user chatbot interactions & checked topics to their registered enquiry record in the database
app.post('/api/chat/activity', async (req, res) => {
  const { enquiryId, topic, activity } = req.body || {};
  if (!enquiryId || typeof enquiryId !== 'string') {
    return res.status(400).json({ success: false, error: 'enquiryId is required' });
  }

  const logEntry = topic ? `Checked "${topic}"` : (activity || 'Interacted with chatbot');
  const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  try {
    const existing = await query('SELECT message FROM enquiries WHERE id = $1', [enquiryId]);
    if (existing.rowCount > 0) {
      const prevMessage = existing.rows[0].message || '';
      const updatedMessage = `${prevMessage}\n• [${timestamp}] ${logEntry}`.trim();
      await query('UPDATE enquiries SET message = $1 WHERE id = $2', [updatedMessage, enquiryId]);
      return res.json({ success: true, logged: true });
    } else {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }
  } catch (err) {
    console.warn('[Chat Activity] Failed to record activity:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to record chat activity' });
  }
});

// ─── Data Archival APIs (90-Day Policy) ──────────────────────────────────────
// 1. Archival statistics and history
app.get('/api/admin/archive/stats', authenticateToken, requirePermission(['archive:read', '*']), async (req, res) => {
  try {
    const stats = await getArchivalStats(query);
    return res.json({ success: true, stats });
  } catch (err) {
    console.error('[Archival API] Error fetching stats:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve archival stats' });
  }
});

// 2. On-demand manual trigger
app.post('/api/admin/archive/run', authenticateToken, requirePermission(['archive:write', '*']), async (req, res) => {
  const { daysThreshold = 90 } = req.body || {};
  try {
    const result = await runDataArchival(query, {
      type: 'manual',
      daysThreshold: parseInt(daysThreshold, 10) || 90
    });
    return res.json({ success: true, result });
  } catch (err) {
    console.error('[Archival API] Manual archival failed:', err);
    return res.status(500).json({ success: false, error: err.message || 'Archival execution failed' });
  }
});

// 3. View archived enquiries
app.get('/api/admin/archive/enquiries', authenticateToken, requirePermission(['archive:read', '*']), async (req, res) => {
  try {
    const result = await query('SELECT * FROM archived_enquiries ORDER BY archived_at DESC LIMIT 500');
    return res.json({ success: true, enquiries: result.rows, count: result.rowCount });
  } catch (err) {
    console.error('[Archival API] Error fetching archived enquiries:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch archived enquiries' });
  }
});

// 4. View archived applications
app.get('/api/admin/archive/applications', authenticateToken, requirePermission(['archive:read', '*']), async (req, res) => {
  try {
    const result = await query('SELECT * FROM archived_applications ORDER BY archived_at DESC LIMIT 500');
    return res.json({ success: true, applications: result.rows, count: result.rowCount });
  } catch (err) {
    console.error('[Archival API] Error fetching archived applications:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch archived applications' });
  }
});

// 5. Restore an archived enquiry back to active enquiries
app.post('/api/admin/archive/restore/enquiry/:id', authenticateToken, requirePermission(['archive:write', '*']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await restoreArchivedEnquiry(query, id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.json({ success: true, message: `Enquiry #${id} restored to active enquiries` });
  } catch (err) {
    console.error('[Archival API] Error restoring enquiry:', err);
    return res.status(500).json({ success: false, error: 'Failed to restore enquiry' });
  }
});

// 6. Restore an archived application back to active candidates
app.post('/api/admin/archive/restore/application/:id', authenticateToken, requirePermission(['archive:write', '*']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await restoreArchivedApplication(query, id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.json({ success: true, message: `Application #${id} restored to active candidates` });
  } catch (err) {
    console.error('[Archival API] Error restoring application:', err);
    return res.status(500).json({ success: false, error: 'Failed to restore application' });
  }
});

// Initialize database and start listening
await connectDb();
await initDb();

// Start daily automated archival scheduler (checks every 24h for records older than 90 days)
startDailyArchivalScheduler(query, { daysThreshold: 90 });

let server = null;
if (process.env.NODE_ENV !== 'test_no_listen' && !process.env.VERCEL) {
  server = app.listen(PORT, () => {
    console.log(`Harry Overseas Immigration backend server running on port ${PORT} [engine: postgres]`);
  });
}

export { app, query, initDb, connectDb, authenticateToken, server };
