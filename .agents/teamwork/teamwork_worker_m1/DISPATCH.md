# Dispatch to teamwork_worker_m1 (Milestone M1: Backend API & Dual Persistence Engine)

## Working Directory
`e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_worker_m1\`

## Authoritative Files to Read
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\ORIGINAL_REQUEST.md`
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\orchestrator_1\PROJECT.md`
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_explorer_survey_2\handoff.md`
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_explorer_survey_3\handoff.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## File Ownership
- You EXCLUSIVELY own:
  - `server/index.js`
  - `.env`
  - `.env.example`
  - `package.json` (for scripts/dependencies)
- DO NOT edit `src/*` or `tests/*`.

## Requirements to Implement
1. Fix syntax error in `server/index.js` lines 1-3 (`import bcrypt from 'bcryptjs'`, `import jwt from 'jsonwebtoken'`, `import nodemailer from 'nodemailer'`).
2. Implement dual-engine persistence adapter in `server/index.js`:
   - Connect to PostgreSQL if `process.env.DATABASE_URL` is provided.
   - Otherwise (or if PostgreSQL is offline), connect to SQLite using `sqlite3` at `process.env.DB_PATH || './database.sqlite'`.
   - Provide a clean query abstraction so parameterized queries (`$1, $2` or `?, ?`) execute reliably on both SQLite and PostgreSQL.
   - Initialize tables on startup:
     - `users` (id, username, email, password_hash, role, created_at)
     - `enquiries` (id, full_name, email, phone, service_interest, destination_country, message, status, created_at)
     - `applications` (id, full_name, email, phone, role, resume_link, notes, status, created_at)
3. Admin Authentication & Security (R3):
   - Support `ADMIN_USERNAME` and `ADMIN_PASSWORD` from `.env` (default password must NOT be `admin123`; e.g., `admin_harry_2026_secure`).
   - Hash password with bcrypt.
   - `POST /api/auth/login`: authenticate against `.env` / database users. If match, sign and return JWT (`harry_admin_token`) with 24h expiration. If mismatch, return 401 `{ success: false, error: 'Invalid username or password' }`.
   - `GET /api/auth/verify`: return 200 with user payload if JWT valid.
   - `authenticateToken` middleware: reject missing or invalid token with 401/403.
4. Job Applications Endpoints (R2):
   - `POST /api/applications`: public submission with input validation (`full_name`, `email`, `phone`, `role`). Store in database with status `'New'`. Return 201 `{ success: true, application_id, message: 'Application submitted successfully' }`.
   - `GET /api/applications`: protected by `authenticateToken`. Return `{ success: true, applications: [...] }` with optional filtering by role/status/search.
   - `PATCH /api/applications/:id/status`: protected by `authenticateToken`. Update status (`New`, `Reviewing`, `Shortlisted`, `Interviewed`, `Hired`, `Rejected`).
   - `DELETE /api/applications/:id`: protected by `authenticateToken`. Delete application.
5. Inquiries Endpoints:
   - Ensure `POST /api/enquiries`, `GET /api/enquiries` (protected), `PATCH /api/enquiries/:id/status` (protected) operate seamlessly with the dual database adapter.
6. Environment files:
   - Ensure `.env` has `PORT=5000`, `JWT_SECRET=harry_global_secret_key_2026_secure`, `DB_PATH=./database.sqlite`, `ADMIN_USERNAME=admin`, `ADMIN_PASSWORD=admin_harry_2026_secure`.
   - Create `.env.example` with clear documentation.
   - In `package.json`, add `"server": "node server/index.js"` script.

## Verification
- Run `node --check server/index.js` to verify zero syntax errors.
- Test server startup and query execution with a verification command.
- Document exact verification commands and outputs in `handoff.md`.


## 2026-11-02T14:46:08Z
Read your dispatch instructions at e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_worker_m1\DISPATCH.md and the authoritative request at e:\Projects\VS_Projects\EuroPath\.agents\teamwork\ORIGINAL_REQUEST.md.
Also read e:\Projects\VS_Projects\EuroPath\.agents\teamwork\orchestrator_1\PROJECT.md.
Working directory: e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_worker_m1\
Implement Milestone 1 (Backend API & Dual Persistence Engine), verify syntax and execution, and write handoff.md in your working directory. Send a message to orchestrator when complete.
