# Project: EuroPath Production Enhancement

## Architecture
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite bundler.
  - Single-Page Application (SPA) architecture with hash-synced views (`currentView`: `'public' | 'careers' | 'admin'`).
  - Public pages: Hero, Services, Language Academy, Arrival Assistance, Enquiry Wizard, Careers.
  - Admin portal: Admin Login (authentic backend authentication, session & JWT token management) and Admin Dashboard (tabbed layout: Customer Inquiries and Candidate Job Applications).
- **Backend**: Node.js, Express, ES Modules.
  - Dual-mode database persistence adapter: SQLite (`./database.sqlite`) for local development and zero-config automated testing, PostgreSQL for containerized production.
  - Authentication: Environment-configured admin credentials (`.env`), bcrypt password hashing, JWT bearer token signing & verification middleware.
  - REST API Endpoints:
    - `POST /api/auth/login` (admin credentials verification & JWT issuance)
    - `GET /api/auth/verify` (JWT validation)
    - `POST /api/enquiries` (public inquiry submission)
    - `GET /api/enquiries` (protected inquiry listing)
    - `PATCH /api/enquiries/:id/status` (protected inquiry status update)
    - `POST /api/applications` (public job application submission)
    - `GET /api/applications` (protected job applications listing with filter/search)
    - `PATCH /api/applications/:id/status` (protected application status lifecycle update)
    - `DELETE /api/applications/:id` (protected application removal)
- **Vite Proxy**: `/api` forwarded to `http://localhost:5000` for development seamlessness.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Backend ESM Syntax Fix | Fix invalid imports (`import bcrypt`, etc.) in `server/index.js` to ensure clean startup | M1 | Survey 2 & 3 |
| F2 | Dual-Engine Database Adapter | Implement SQLite (`database.sqlite`) local fallback with PostgreSQL production compatibility | M1 | Survey 2 & 3 |
| F3 | Secure Admin Authentication API | Authenticate admin against `.env` credentials with bcrypt hashing and JWT token issuance | M1 | Survey 2 & 3 |
| F4 | Protected Route Middleware | Verify JWT tokens and reject unauthenticated requests with 401/403 | M1 | Survey 2 & 3 |
| F5 | Environment Configuration Setup | Update `.env` with `ADMIN_USERNAME`, `ADMIN_PASSWORD` and create `.env.example` | M1 | Survey 2 & 3 |
| F6 | Job Applications Database Schema | Create `applications` table with id, full_name, email, phone, role, resume_link, notes, status, created_at | M1 | Survey 2 |
| F7 | Job Applications REST APIs | Implement `POST`, `GET`, `PATCH /:id/status`, `DELETE /:id` at `/api/applications` | M1 | Survey 2 |
| F8 | Admin Dashboard Applications Tab | Dedicated tab in `AdminDashboard.tsx` displaying job applications alongside customer inquiries | M3 | Survey 2 |
| F9 | Candidate Management & Status Lifecycle | Filter by role/status, inspect candidate details drawer, update status (`New`, `Reviewing`, `Shortlisted`, `Interviewed`, `Hired`, `Rejected`) | M3 | Survey 2 |
| F10 | Dedicated Careers Page Component | Create `src/components/Careers.tsx` showcasing vacancies for German trainers, visa consultants, student counselors, and European relocation coordinators | M2 | Survey 1 |
| F11 | Department/Category Filtering | Filter vacancies by department (Language Training, Immigration, Counseling, Relocation) with active counts | M2 | Survey 1 |
| F12 | Detailed Role Descriptions | Display comprehensive role cards with responsibilities, requirements, and benefits | M2 | Survey 1 |
| F13 | Interactive Job Application Form | Responsive application modal/form with validation, instant submission to `/api/applications`, and confirmation feedback | M2 | Survey 1 |
| F14 | Navigation Synchronization | Add functional Careers link to desktop/mobile Navbar, LegalFooter, and sync with URL hash | M2 | Survey 1 |
| F15 | Client Demo Credentials & Shortcuts Removal | Remove `admin`/`admin123`, auto-fill buttons, demo hints, and simulated OTP from `AdminLogin.tsx` | M3 | Survey 1 & 3 |
| F16 | Authentic Client Admin Login | Wire `AdminLogin.tsx` to `POST /api/auth/login`, store JWT in `harry_admin_token`, and handle errors gracefully | M3 | Survey 1 & 3 |
| F17 | Admin Token Lifecycle & Logout Cleanup | Pass `harry_admin_token` in `AdminDashboard.tsx` requests, purge on logout in `App.tsx` | M3 | Survey 1 & 3 |
| F18 | UI Polish & Responsive Consistency | Remove leftover placeholders, ensure responsive layout, and polish navigation | M3 | Survey 1 & 4 |
| F19 | E2E Testing Suite (Tiers 1-4) | Comprehensive opaque-box test suite for Auth, Enquiries, Applications, and Protected routes | M0 / M4 | Test Track |
| F20 | Build & Production Verification | Clean `npm run build` without TypeScript/lint errors, and 100% test pass | M4 | ACs |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | E2E Test Suite Creation | Design & write test infrastructure and comprehensive test cases (Tiers 1-4) in `tests/`, publish `TEST_READY.md` | Survey | DONE |
| M1 | Backend API & Dual Persistence Engine | Fix ESM imports, dual SQLite/PostgreSQL persistence adapter, `.env` config, JWT auth endpoints, and `/api/applications` CRUD APIs in `server/index.js` | none | DONE |
| M2 | Public Careers Page & Site Navigation | Create `Careers.tsx` (role showcase, department filtering, application submission form), integrate into `Navbar.tsx`, `LegalFooter.tsx`, and hash routing in `App.tsx` | M1 | DONE |
| M3 | Admin Portal Overhaul & Security Hardening | Strip demo credentials/OTP from `AdminLogin.tsx`, wire backend JWT login, update `AdminDashboard.tsx` with Job Applications management tab, and token lifecycle in `App.tsx` | M1, M2 | DONE |
| M4 | Final Milestone: 100% E2E Pass & Hardening | Pass 100% E2E test suite (Tiers 1-4), adversarial stress testing (Tier 5), build verification, Forensic Audit | M0, M1, M2, M3 | DONE |

---

## Interface Contracts

### 1. Admin Authentication Contract
- **Endpoint**: `POST /api/auth/login`
  - **Request Body**:
    ```json
    { "username": "admin", "password": "secure_password" }
    ```
  - **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "token": "<JWT_STRING>",
      "user": { "id": 1, "username": "admin", "role": "Super Admin" }
    }
    ```
  - **Failure Response (401 Unauthorized)**:
    ```json
    { "success": false, "error": "Invalid username or password" }
    ```
- **Endpoint**: `GET /api/auth/verify`
  - **Headers**: `Authorization: Bearer <JWT_STRING>`
  - **Success Response (200 OK)**:
    ```json
    { "success": true, "user": { "id": 1, "username": "admin", "role": "Super Admin" } }
    ```
  - **Failure Response (401 / 403)**:
    ```json
    { "success": false, "error": "Access token required or invalid" }
    ```

### 2. Job Applications Contract
- **Endpoint**: `POST /api/applications` (Public)
  - **Request Body**:
    ```json
    {
      "full_name": "Maria Schmidt",
      "email": "maria.schmidt@example.de",
      "phone": "+49 151 23456789",
      "role": "German Language Trainer",
      "resume_link": "https://linkedin.com/in/mariaschmidt",
      "notes": "5 years DaF teaching experience (B1-C1). Certified Goethe examiner."
    }
    ```
  - **Success Response (201 Created)**:
    ```json
    { "success": true, "application_id": 1, "message": "Application submitted successfully" }
    ```
  - **Validation Error (400 Bad Request)**:
    ```json
    { "success": false, "error": "Missing required fields (full_name, email, phone, role)" }
    ```
- **Endpoint**: `GET /api/applications` (Protected: `Bearer <token>`)
  - **Query Params**: `?role=...&status=...&search=...`
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "applications": [
        {
          "id": 1,
          "full_name": "Maria Schmidt",
          "email": "maria.schmidt@example.de",
          "phone": "+49 151 23456789",
          "role": "German Language Trainer",
          "resume_link": "https://linkedin.com/in/mariaschmidt",
          "notes": "...",
          "status": "New",
          "created_at": "2026-11-02T14:00:00Z"
        }
      ]
    }
    ```
- **Endpoint**: `PATCH /api/applications/:id/status` (Protected: `Bearer <token>`)
  - **Request Body**: `{ "status": "Shortlisted" }`
  - **Response (200 OK)**: `{ "success": true, "message": "Status updated successfully" }`
- **Endpoint**: `DELETE /api/applications/:id` (Protected: `Bearer <token>`)
  - **Response (200 OK)**: `{ "success": true, "message": "Application deleted successfully" }`

### 3. Frontend Navigation & Router Contract
- **Route State**: `currentView`: `'public' | 'careers' | 'admin'`
- **URL Hash Synchronization**:
  - `#careers` -> triggers `currentView = 'careers'`
  - `#admin` -> triggers `currentView = 'admin'`
  - `#services`, `#academy`, `#arrival`, `#enquiry` -> triggers `currentView = 'public'` and scrolls to `#<id>`
- **Storage Tokens**:
  - `harry_admin_token`: JWT string (stored in `sessionStorage` or `localStorage`)
  - `harry_admin_session`: user metadata JSON
  - On logout: remove both `harry_admin_token` and `harry_admin_session`

---

## Code Layout
- `server/index.js` — Express backend, database connection & migrations, authentication & REST API routes.
- `.env` & `.env.example` — Environment configuration for port, JWT secret, database path, admin credentials.
- `src/App.tsx` — Main application component, hash router, global view state.
- `src/components/Navbar.tsx` — Top navigation header with Careers and Staff Portal buttons.
- `src/components/LegalFooter.tsx` — Footer with Careers link in Quick Links.
- `src/components/Careers.tsx` — Dedicated Careers page component (listings, filters, role descriptions, application modal).
- `src/components/AdminLogin.tsx` — Secure admin login view (real backend auth, no demo credentials/OTP).
- `src/components/AdminDashboard.tsx` — Admin dashboard with dual tabs (Inquiries and Job Applications).
- `src/components/EnquiryWizard.tsx` — Public customer inquiry form.
- `vite.config.ts` — Vite development server and API proxy configuration.
- `tests/` — Automated test suite files.
