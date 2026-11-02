# Survey Report: Backend APIs, Database Persistence, and Admin Management (R2 & R4)

**Agent:** `teamwork_explorer_survey_2`  
**Date:** 2026-11-02  
**Target Project:** EuroPath / Harry Global Immigration (`e:\Projects\VS_Projects\EuroPath`)  
**Scope:** Requirements R2 (Job Applications Storage & Admin Management) and R4 (Website Architecture, Cleanup & Admin Views)  

---

## 1. Executive Summary

A comprehensive investigation of the EuroPath codebase was conducted, focusing on backend server architecture, database persistence, customer enquiry workflows, and admin dashboard operations.

Key discoveries include:
1. **Critical Syntax Error in Backend Entry Point:** `server/index.js` (lines 1–3) contains incomplete ESM imports (`import bcrypt`, `import jwt`, `import nodemailer`), preventing the backend server from starting under Node.js (`SyntaxError: Unexpected token 'import'`).
2. **Database Connection Mismatch:** `server/index.js` currently attempts a hardcoded connection to PostgreSQL at `localhost:5432`. However, no PostgreSQL instance runs locally in standard development, causing immediate connection failures and leaving tables uninitialized. In contrast, `package.json` already includes `sqlite3` and `.env` defines `DB_PATH=./database.sqlite`. A dual-engine database adapter (supporting SQLite for zero-config local dev/tests and PostgreSQL for Docker/production) is the optimal architectural pattern.
3. **Public Submission Disconnect:** `src/components/EnquiryWizard.tsx` (lines 99–106) writes submitted customer enquiries exclusively to browser `localStorage` (`harry_global_enquiries`) and never dispatches an HTTP `POST /api/enquiries` request to the backend.
4. **Admin Authentication Disconnect:** `src/components/AdminLogin.tsx` checks credentials via client-side hardcoded strings (`admin` / `admin123`) and stores a session object in `sessionStorage` without requesting or saving a JWT token (`harry_admin_token`). Consequently, `src/components/AdminDashboard.tsx` fails when sending requests to `http://localhost:5000/api/enquiries` with `Bearer null`, returning 401 Unauthorized.
5. **Missing Job Applications Storage & Admin View (R2):** There is currently no database table, no backend API routes (`/api/applications`), and no UI tab or component in `AdminDashboard.tsx` for managing job applications submitted via the Careers page.

---

## 2. Backend Server Analysis (`server/index.js`)

### 2.1 File Location & Configuration
- **Path:** `e:\Projects\VS_Projects\EuroPath\server\index.js` (316 lines)
- **Module System:** ES Modules (`"type": "module"` in `package.json`)
- **Port:** Configured via `process.env.PORT || 5000`

### 2.2 Syntax Errors at Lines 1–3
Lines 1–3 currently read:
```javascript
1: import bcrypt
2: import jwt
3: import nodemailer
4: import express from 'express';
5: import cors from 'cors';
6: import dotenv from 'dotenv';
7: import pg from 'pg';
```
When running `node -c server/index.js`:
```
E:\Projects\VS_Projects\EuroPath\server\index.js:2
import jwt
^^^^^^
SyntaxError: Unexpected token 'import'
```
**Required Correction:**
```javascript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
```

### 2.3 Existing API Endpoints
| Method | Path | Auth Required | Description | Current Status |
|--------|------|---------------|-------------|----------------|
| `POST` | `/api/auth/login` | No | Verifies credentials with bcrypt, issues 12h JWT | Functional once DB is connected |
| `GET` | `/api/auth/verify` | Yes (`authenticateToken`) | Validates JWT token from Authorization header | Functional |
| `GET` | `/api/enquiries` | Yes (`authenticateToken`) | Returns all enquiries, JSON-parses service arrays | Functional once DB is connected |
| `POST` | `/api/enquiries` | No | Creates new enquiry, sends email via nodemailer | Functional once DB is connected |
| `PATCH` | `/api/enquiries/:id/status` | Yes (`authenticateToken`) | Updates enquiry status (`New`, `Contacted`, etc.) | Functional once DB is connected |
| `DELETE` | `/api/enquiries/:id` | Yes (`authenticateToken`) | Deletes enquiry | Functional once DB is connected |
| `GET` | `/api/users` | Yes (Super Admin) | Lists administrative users | Functional once DB is connected |
| `POST` | `/api/users` | Yes (Super Admin) | Creates new admin user | Functional once DB is connected |
| `POST` | `/api/whatsapp/send` | Yes (`authenticateToken`) | Dispatches/simulates WhatsApp message | Functional mock |

---

## 3. Database Architecture & Persistence Strategy

### 3.1 Current State & Discrepancies
- **Configuration in `.env`:**
  ```env
  PORT=5000
  JWT_SECRET=harry_global_secret_key_2026_secure
  DB_PATH=./database.sqlite
  EMAIL_HOST=smtp.gmail.com
  ...
  ```
  Notice: `.env` specifies `DB_PATH=./database.sqlite`, not `DATABASE_URL`.
- **Configuration in `docker-compose.yml`:**
  ```yaml
  environment:
    - PORT=5000
    - DATABASE_URL=postgresql://postgres:postgres@db:5432/harry_global
  ```
- **Dependencies in `package.json`:**
  Both `"pg": "^8.23.1"` and `"sqlite3": "^6.0.1"` are present in `dependencies`.
- **Runtime Problem:**
  `server/index.js` currently defaults to:
  ```javascript
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/harry_global',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  ```
  In local development on Windows, PostgreSQL is not running. As a result, `pool.connect` outputs connection error `ECONNREFUSED 127.0.0.1:5432` and crashes or fails all subsequent database queries.

### 3.2 Recommended Architectural Solution: Dual-Engine Database Adapter
To achieve production reliability both locally and in deployed containers, the backend should use a unified database interface:
1. If `process.env.DATABASE_URL` is configured and starts with `postgresql://` or `postgres://`, connect via `pg.Pool`.
2. Otherwise (or as a local fallback), initialize SQLite using `process.env.DB_PATH || './database.sqlite'`.

A lightweight unified query interface:
```javascript
// Database abstraction exposing a uniform query(sql, params) method:
// - Returns { rows: Array }
// - Automatically handles parameter binding ($1, $2 for Postgres, converted to ? for SQLite)
```

### 3.3 Database Table Schemas

#### 1. Users Table (`users`)
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY, -- or INTEGER PRIMARY KEY AUTOINCREMENT in SQLite
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Enquiries Table (`enquiries`)
```sql
CREATE TABLE IF NOT EXISTS enquiries (
  id VARCHAR(50) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(50) NOT NULL,
  whatsapp VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  country VARCHAR(100),
  main_services TEXT,
  language_course VARCHAR(50),
  additional_services TEXT,
  intended_destination VARCHAR(100),
  travel_period VARCHAR(100),
  consultation_method VARCHAR(50),
  additional_reqs TEXT,
  status VARCHAR(50) DEFAULT 'New',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Job Applications Table (`applications`) — (New for R2)
```sql
CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(50) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  role VARCHAR(100) NOT NULL,
  experience VARCHAR(50),
  resume_url TEXT,
  cover_letter TEXT,
  status VARCHAR(50) DEFAULT 'New',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Customer Enquiries Data Flow Analysis

### 4.1 Form Submission (`src/components/EnquiryWizard.tsx`)
In `EnquiryWizard.tsx` lines 87–109:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const newId = `HGI-${Math.floor(1000 + Math.random() * 9000)}`;
  setGeneratedId(newId);

  const newEnquiry = {
    id: newId,
    ...formData,
    status: 'New',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };

  // Currently ONLY saves to localStorage!
  const existing = localStorage.getItem('harry_global_enquiries');
  let list = [];
  if (existing) {
    try { list = JSON.parse(existing); } catch (e) {}
  }
  list.unshift(newEnquiry);
  localStorage.setItem('harry_global_enquiries', JSON.stringify(list));

  setSubmitted(true);
};
```
**Fix Required:**
Update `handleSubmit` to call `POST /api/enquiries` with a fallback to `localStorage` if offline, ensuring real persistence in the backend database.

### 4.2 Querying & Status Updates in `AdminDashboard.tsx`
`AdminDashboard.tsx` already contains methods:
- `loadEnquiries()` (lines 33–54): Calls `GET http://localhost:5000/api/enquiries`
- `updateStatus(id, newStatus)` (lines 56–77): Calls `PATCH http://localhost:5000/api/enquiries/${id}/status`
- `deleteEnquiry(id)` (lines 79–100): Calls `DELETE http://localhost:5000/api/enquiries/${id}`

These methods are well-structured, but suffer from two issues:
1. Hardcoded `http://localhost:5000` (fails if port changes or in production build).
2. Missing valid JWT token due to mock login in `AdminLogin.tsx`.

---

## 5. Job Applications Storage & Backend APIs (Requirement R2)

### 5.1 Application Data Model
The job application form on the Careers page will collect:
- `full_name`: Candidate's full name (required)
- `email`: Candidate's email address (required)
- `phone`: Mobile / contact number (required)
- `role`: Job title applied for (required, selected from available positions: German Language Trainer, Visa Consultant, Student Counselor, European Relocation Coordinator)
- `experience`: Candidate experience level (e.g., '0–1 years', '1–3 years', '3–5 years', '5+ years')
- `resume_url`: Document URL, portfolio link, or qualifications text
- `cover_letter`: Candidate notes / statement of motivation
- `status`: Default `'New'`. Allowed transitions: `'New'` → `'Reviewing'` → `'Shortlisted'` → `'Interviewed'` → `'Hired'` (or `'Rejected'`)
- `created_at`: Server timestamp

### 5.2 Required Endpoints in `server/index.js`

#### 1. Submit Application (`POST /api/applications`) — Public
- **Request Body:**
  ```json
  {
    "full_name": "Priya Sharma",
    "email": "priya.sharma@example.com",
    "phone": "+91 98765 43210",
    "role": "German Language Trainer",
    "experience": "3-5 years",
    "resume_url": "https://linkedin.com/in/priyasharma-german",
    "cover_letter": "Certified B2/C1 trainer with 4 years experience preparing students for Goethe-Zertifikat."
  }
  ```
- **Validation:**
  - `full_name`, `email`, `phone`, `role` must not be empty.
  - Generates unique ID: `APP-${Math.floor(1000 + Math.random() * 9000)}` or timestamp-based.
- **Action:** Inserts into `applications` table.
- **Notification:** Optional asynchronous email notification via Nodemailer to `admin@harryglobal.com` and confirmation email to candidate.
- **Response (201 Created):**
  ```json
  {
    "message": "Application submitted successfully",
    "id": "APP-4821",
    "application": { ... }
  }
  ```

#### 2. Get All Applications (`GET /api/applications`) — Protected (`authenticateToken`)
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Query Options:** Optional `?status=New` or `?role=...`
- **Action:** `SELECT * FROM applications ORDER BY created_at DESC`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "APP-4821",
      "full_name": "Priya Sharma",
      "email": "priya.sharma@example.com",
      "phone": "+91 98765 43210",
      "role": "German Language Trainer",
      "experience": "3-5 years",
      "resume_url": "https://linkedin.com/in/priyasharma-german",
      "cover_letter": "Certified B2/C1 trainer...",
      "status": "New",
      "created_at": "2026-11-02 14:20:00"
    }
  ]
  ```

#### 3. Update Application Status (`PATCH /api/applications/:id/status`) — Protected (`authenticateToken`)
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Request Body:** `{ "status": "Reviewing" }`
- **Action:** Validates status in `['New', 'Reviewing', 'Shortlisted', 'Interviewed', 'Rejected', 'Hired']`. Updates row where `id = $id`.
- **Response (200 OK):** `{ "message": "Status updated successfully", "id": "APP-4821", "status": "Reviewing" }`

#### 4. Delete Application (`DELETE /api/applications/:id`) — Protected (`authenticateToken`)
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Action:** Deletes row where `id = $id`.
- **Response (200 OK):** `{ "message": "Application deleted successfully", "id": "APP-4821" }`

---

## 6. Admin Dashboard Architecture & UI Integration (R2 & R4)

### 6.1 Current Architecture (`src/components/AdminDashboard.tsx`)
`AdminDashboard.tsx` is currently dedicated entirely to customer enquiries:
- Single view without section navigation.
- Header showing status badge ("Staff Portal", "2FA Verified"), refresh button, and logout button.
- Status filters: `['All', 'New', 'Contacted', 'In Progress', 'Closed']`.
- Search filter: by name, phone, email, or ID.
- Split-screen table and slide-in detail inspector.

### 6.2 Proposed Tabbed Dashboard Structure
To integrate Job Applications alongside Customer Enquiries cleanly without clutter:
```
+-----------------------------------------------------------------------------------+
|  [Staff Portal] [2FA Verified]  admin@harryglobal.com (Administrator)             |
|  Harry Global Administration Portal                                               |
|  Coordinate operations between Anantapur (AP, India) & Germany                    |
|                                                     [Refresh] [Sign Out]          |
+-----------------------------------------------------------------------------------+
|  [ TAB 1: Customer Enquiries (12) ]    [ TAB 2: Job Applications (5) ]            |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  If Tab 1 active:                                                                 |
|    - Search inquiries                                                             |
|    - Status filter: All | New | Contacted | In Progress | Closed                  |
|    - Enquiries Data Table                                                         |
|    - Selected Enquiry Detail Drawer (Contact, Services, Language, Status change)  |
|                                                                                   |
|  If Tab 2 active:                                                                 |
|    - KPI Metric Badges: [Total: 5] [New: 2] [Shortlisted: 1] [Hired: 1]           |
|    - Search candidate / role / contact                                            |
|    - Status filter: All | New | Reviewing | Shortlisted | Interviewed | Rejected  |
|    - Role filter: All Roles | Language Trainer | Visa Consultant | Counselor | ...|
|    - Job Applications Data Table:                                                 |
|        [Ref ID / Date] [Candidate Name & Exp] [Role] [Contact] [Status] [Action]  |
|    - Selected Application Detail Drawer:                                          |
|        - Candidate header & contact links (Phone, WhatsApp direct chat, Email)    |
|        - Applied Role & Years of Experience                                       |
|        - Resume / Portfolio Link / Document Notes                                 |
|        - Cover Letter / Motivation notes                                          |
|        - Interactive Status Workflow buttons (New -> Reviewing -> Shortlisted ...) |
|        - Delete Application button                                                |
+-----------------------------------------------------------------------------------+
```

### 6.3 Admin Authentication Token Synchronization (R3 & R4)
In `AdminLogin.tsx` (lines 191–202):
- When login succeeds, it currently stores:
  `{ username: 'admin@harryglobal.com', role: 'Administrator' }` in `sessionStorage.getItem('harry_admin_session')`.
- It never stores `harry_admin_token`!
- When `AdminLogin` is updated to authenticate via `POST /api/auth/login`, it will receive:
  `{ token: "jwt_token_here", user: { username: "admin", role: "Super Admin" } }`.
- It must store:
  `sessionStorage.setItem('harry_admin_token', data.token)`
  `sessionStorage.setItem('harry_admin_session', JSON.stringify(data.user))`
- Then `AdminDashboard.tsx` can read `sessionStorage.getItem('harry_admin_token')` and include it in all Authorization headers (`Bearer ${token}`).

---

## 7. Website Architecture, Vite Proxy & Clean-up (R4)

### 7.1 Vite Dev Server Proxy Configuration
Currently, frontend components call `http://localhost:5000/api/...` with hardcoded origins. This causes issues if the backend runs on a different port, fails in production static hosting, and triggers browser CORS preflight checks.

**Solution:** In `vite.config.ts`, add a proxy:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
```
With this configuration, all frontend API calls can use relative URLs (`/api/enquiries`, `/api/applications`, `/api/auth/login`).

### 7.2 Static Asset Production Hosting
In production, `server/index.js` can serve the compiled `dist/` directory:
```javascript
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});
```
This enables single-container deployment via Docker (`docker-compose up`) or standalone Node.js deployment.

### 7.3 Removal of Dummy Data and Placeholders (R4)
public public and admin UI elements:
1. `AdminLogin.tsx`: Remove "Auto-Fill Demo", "Demo Admin Access" card (`admin` / `admin123`), and mock 2FA auto-fill box.
2. `AdminDashboard.tsx`: Ensure clean zero-state messaging when no applications or enquiries exist in the database, with refresh capability and error handling.
3. Clean error alerts and responsive design across mobile and desktop.

---

## 8. Verification & Test Plan

1. **Backend Server Syntax & Startup Check:**
   - Run `node -c server/index.js` -> Must exit with code 0.
   - Run `node server/index.js` in background or test script -> Must start without syntax error, bind to port 5000, and initialize database tables (`users`, `enquiries`, `applications`).
2. **API Endpoint Integration Testing:**
   - Execute verification script testing:
     - `POST /api/auth/login` (admin authentication with valid and invalid credentials).
     - `POST /api/enquiries` (public enquiry creation).
     - `GET /api/enquiries` (authenticated retrieval).
     - `POST /api/applications` (public job application submission).
     - `GET /api/applications` (authenticated application retrieval).
     - `PATCH /api/applications/:id/status` (status updates).
     - `DELETE /api/applications/:id` (deletion).
3. **Frontend Build Check:**
   - Run `npm run build` -> Must succeed with zero TypeScript or bundling errors.
4. **Admin Dashboard Interactive Verification:**
   - Verify tab navigation between "Customer Enquiries" and "Job Applications".
   - Verify status filtering, searching, and detail inspection drawer.
