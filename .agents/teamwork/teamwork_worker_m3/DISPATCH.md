# Dispatch to teamwork_worker_m3 (Milestone M3: Admin Portal Overhaul & Security Hardening)

## Working Directory
`e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_worker_m3\`

## Authoritative Files to Read
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\ORIGINAL_REQUEST.md`
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\orchestrator_1\PROJECT.md`
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_explorer_survey_2\handoff.md`
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_explorer_survey_3\handoff.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## File Ownership
- You EXCLUSIVELY own:
  - `src/components/AdminLogin.tsx`
  - `src/components/AdminDashboard.tsx`
  - `vite.config.ts` (for `/api` proxy configuration)
- DO NOT edit `src/components/Careers.tsx`, `src/components/Navbar.tsx`, `src/components/LegalFooter.tsx`, `src/App.tsx`, or `server/*`.

## Requirements to Implement (R2, R3, R4)
1. Overhaul `src/components/AdminLogin.tsx`:
   - Completely remove all hardcoded credentials (`admin` / `admin123` / `harry2026`) and client-side password checks.
   - Completely remove "Auto-Fill Demo" button, credentials hint card, simulated OTP generator, and demo bypass codes (`123456`).
   - Connect login form to `POST /api/auth/login` via `fetch('/api/auth/login', ...)`.
   - On successful authentication (200):
     - Store the received JWT token in `sessionStorage.setItem('harry_admin_token', data.token)` (or `localStorage` if `rememberMe`).
     - Store session user in `sessionStorage.setItem('harry_admin_session', JSON.stringify(data.user))`.
     - Invoke `onLoginSuccess(data.user)`.
   - On error: display authentic error feedback ("Invalid username or password" or backend message).
2. Overhaul `src/components/AdminDashboard.tsx`:
   - Introduce a tabbed navigation header:
     - Tab 1: "Customer Enquiries" (existing inquiries management).
     - Tab 2: "Job Applications" (new candidate applications management view).
   - In "Job Applications" view:
     - Top KPI metrics: Total Candidates, New, Reviewing, Shortlisted, Interviewed, Hired.
     - Role filter pills (All Roles, German Language Trainer, Visa Consultant, Student Counselor, Relocation Coordinator).
     - Status filter pills (All, New, Reviewing, Shortlisted, Interviewed, Hired, Rejected).
     - Search input (filter by candidate name, email, phone, or notes).
     - Applications table / list with candidate details, role badge, contact info (Email, Phone with quick WhatsApp/Call links), resume link, status badge, submission date, and actions.
     - Candidate Details Drawer / Modal: full notes, resume link, status update controls (`PATCH /api/applications/:id/status`), and delete action (`DELETE /api/applications/:id`).
   - Token & API Synchronization:
     - In all API requests (`/api/enquiries` and `/api/applications`), include `Authorization: Bearer ${token}` using `harry_admin_token`.
     - If a 401/403 status is encountered, clear tokens and redirect to login (`onLogout()`).
     - Offline / resilient fallback: support reading from `localStorage.getItem('harry_global_job_applications')` if network is offline.
3. Update `vite.config.ts`:
   - Configure proxy for `/api` pointing to `http://localhost:5000` so development requests route seamlessly.
4. Verification:
   - Run `npm run build` to verify clean build without TypeScript or bundling errors.
   - Write handoff report with exact verification evidence to `handoff.md`.


## 2026-11-02T15:05:07Z
Read your dispatch instructions at e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_worker_m3\DISPATCH.md and the authoritative request at e:\Projects\VS_Projects\EuroPath\.agents\teamwork\ORIGINAL_REQUEST.md.
Also read e:\Projects\VS_Projects\EuroPath\.agents\teamwork\orchestrator_1\PROJECT.md.
Working directory: e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_worker_m3\
Implement Milestone 3 (Admin Portal Overhaul, Secure Backend Login, Job Applications Management View in Dashboard, and Vite Proxy), verify build with `npm run build`, and write handoff.md in your working directory. Send a message to orchestrator when complete.
