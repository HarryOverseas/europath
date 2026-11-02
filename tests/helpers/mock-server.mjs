/**
 * Standalone Reference / Mock Server conforming to the exact Interface Contracts
 * specified in PROJECT.md.
 * 
 * Used for:
 * 1. Immediate contract verification and sanity checking in M0.
 * 2. Progressive testability before M1 live backend implementation.
 * 3. Isolated CI testing without external database dependencies.
 */

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { CONFIG } from './config.mjs';

export function createMockApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const JWT_SECRET = CONFIG.jwtSecret;
  const adminPasswordHash = bcrypt.hashSync(CONFIG.admin.password, 10);

  // In-memory state
  const state = {
    users: [
      {
        id: 1,
        username: CONFIG.admin.username,
        email: 'admin@harryglobal.com',
        password_hash: adminPasswordHash,
        role: 'Super Admin',
      },
    ],
    applications: [],
    enquiries: [],
    appIdCounter: 1,
    enquiryIdCounter: 1000,
  };

  // JWT Middleware
  function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required or invalid' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, error: 'Access token required or invalid' });
      }
      req.user = decoded;
      next();
    });
  }

  // --- Auth Endpoints ---

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password.trim()) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const user = state.users.find(u => u.username === username || u.email === username);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  });

  app.get('/api/auth/verify', authenticateToken, (req, res) => {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  });

  // --- Applications Endpoints ---

  // POST /api/applications (Public)
  app.post('/api/applications', (req, res) => {
    const { full_name, email, phone, role, resume_link, notes } = req.body || {};

    if (!full_name || !email || !phone || !role ||
        typeof full_name !== 'string' || !full_name.trim() ||
        typeof email !== 'string' || !email.trim() ||
        typeof phone !== 'string' || !phone.trim() ||
        typeof role !== 'string' || !role.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (full_name, email, phone, role)',
      });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim()) || email.includes('..')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format',
      });
    }

    const newApp = {
      id: state.appIdCounter++,
      full_name: full_name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: role.trim(),
      resume_link: resume_link ? String(resume_link).trim() : '',
      notes: notes ? String(notes).trim() : '',
      status: 'New',
      created_at: new Date().toISOString(),
    };

    state.applications.push(newApp);

    return res.status(201).json({
      success: true,
      application_id: newApp.id,
      message: 'Application submitted successfully',
    });
  });

  // GET /api/applications (Protected)
  app.get('/api/applications', authenticateToken, (req, res) => {
    let result = [...state.applications];

    const { role, status, search } = req.query;

    if (role) {
      const lowerRole = String(role).toLowerCase();
      result = result.filter(app => app.role.toLowerCase() === lowerRole);
    }

    if (status) {
      const lowerStatus = String(status).toLowerCase();
      result = result.filter(app => app.status.toLowerCase() === lowerStatus);
    }

    if (search) {
      const s = String(search).toLowerCase();
      result = result.filter(app =>
        app.full_name.toLowerCase().includes(s) ||
        app.email.toLowerCase().includes(s) ||
        app.phone.toLowerCase().includes(s) ||
        app.role.toLowerCase().includes(s) ||
        app.notes.toLowerCase().includes(s)
      );
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json({
      success: true,
      applications: result,
    });
  });

  // PATCH /api/applications/:id/status (Protected)
  app.patch('/api/applications/:id/status', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const { status } = req.body || {};
    const validStatuses = ['New', 'Reviewing', 'Shortlisted', 'Interviewed', 'Hired', 'Rejected'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const appIndex = state.applications.findIndex(a => a.id === id);
    if (appIndex === -1) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    state.applications[appIndex].status = status;

    return res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      application: state.applications[appIndex],
    });
  });

  // DELETE /api/applications/:id (Protected)
  app.delete('/api/applications/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const appIndex = state.applications.findIndex(a => a.id === id);
    if (appIndex === -1) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    state.applications.splice(appIndex, 1);

    return res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
    });
  });

  // --- Enquiries Endpoints ---

  // POST /api/enquiries (Public)
  app.post('/api/enquiries', (req, res) => {
    const lead = req.body || {};
    const fullName = lead.fullName || lead.full_name;
    const email = lead.email;
    const mobile = lead.mobile;

    if (!fullName || !email || !mobile ||
        typeof fullName !== 'string' || !fullName.trim() ||
        typeof email !== 'string' || !email.trim() ||
        typeof mobile !== 'string' || !mobile.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing required enquiry contact fields (full_name, email, mobile)',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim()) || email.includes('..')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format',
      });
    }

    const id = lead.id || `HGI-${state.enquiryIdCounter++}`;
    const newEnquiry = {
      id,
      full_name: fullName.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      whatsapp: lead.whatsapp || mobile.trim(),
      city: lead.city || 'Anantapur',
      country: lead.country || 'India',
      main_services: lead.mainServices || lead.main_services || [],
      language_course: lead.languageCourse || lead.language_course || '',
      additional_services: lead.additionalServices || lead.additional_services || [],
      intended_destination: lead.intendedDestination || lead.intended_destination || 'Germany',
      travel_period: lead.travelPeriod || lead.travel_period || 'Immediate',
      consultation_method: lead.consultationMethod || lead.consultation_method || 'WhatsApp',
      additional_reqs: lead.additionalReqs || lead.additional_reqs || '',
      status: 'New',
      created_at: new Date().toISOString(),
    };

    state.enquiries.push(newEnquiry);

    return res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      id,
      lead: newEnquiry,
    });
  });

  // GET /api/enquiries (Protected)
  app.get('/api/enquiries', authenticateToken, (req, res) => {
    const list = [...state.enquiries].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.status(200).json(list);
  });

  // PATCH /api/enquiries/:id/status (Protected)
  app.patch('/api/enquiries/:id/status', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body || {};

    const enq = state.enquiries.find(e => e.id === id);
    if (!enq) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }

    enq.status = status;
    return res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      id,
      status,
    });
  });

  // DELETE /api/enquiries/:id (Protected)
  app.delete('/api/enquiries/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const index = state.enquiries.findIndex(e => e.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }

    state.enquiries.splice(index, 1);
    return res.status(200).json({
      success: true,
      message: 'Enquiry deleted successfully',
      id,
    });
  });

  app.resetState = () => {
    state.applications = [];
    state.enquiries = [];
    state.appIdCounter = 1;
    state.enquiryIdCounter = 1000;
  };

  return app;
}

let runningServer = null;

export async function startMockServer(port = 5055) {
  if (runningServer) return runningServer;
  const app = createMockApp();
  return new Promise((resolve) => {
    runningServer = app.listen(port, () => {
      resolve(runningServer);
    });
  });
}

export async function stopMockServer() {
  if (runningServer) {
    return new Promise((resolve) => {
      runningServer.close(() => {
        runningServer = null;
        resolve();
      });
    });
  }
}
