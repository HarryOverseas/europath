# EuroPath Security, Authentication, Build System & Testing Survey Report

**Date**: 2026-11-02  
**Investigator**: teamwork_explorer_survey_3  
**Focus Areas**: R3 (Secure Admin Authentication & Credentials Management), Acceptance Criteria, Build Health, and Testing Infrastructure  
**Target Repository**: `e:\Projects\VS_Projects\EuroPath`

---

## Executive Summary

An exhaustive audit of the EuroPath / Harry Global Immigration codebase was conducted, focusing on authentication mechanisms, credential security, environment variables, build health, and testing infrastructure. 

The audit revealed that **the current admin authentication is entirely cosmetic and simulated client-side**. Public users can log into the staff portal using hardcoded credentials (`admin` / `admin123`) or via visible "Auto-Fill Demo" buttons. No authentication requests are sent to the backend API (`/api/auth/login`). Meanwhile, the backend server cannot even execute due to **syntax errors in `server/index.js`** (`import bcrypt` without `from`), has no test framework installed, and suffers from a database architecture mismatch between `.env` (`DB_PATH=./database.sqlite`) and `server/index.js` (`pg` PostgreSQL pool).

The frontend production build (`npm run build`) currently compiles cleanly via Vite (15.31s), but lacks a `tsconfig.json` and typechecking script.

---

## 1. Admin Authentication & Credential Security (R3)

### 1.1 Client-Side Hardcoded Credentials & Demo Shortcuts
**File**: `src/components/AdminLogin.tsx`

| Item | Line Numbers | Current Implementation | Risk / Impact |
|---|---|---|---|
| Hardcoded credentials check | Lines 78–81 | `const isValidUser = cleanUser === 'admin' \|\| cleanUser === 'admin@harryglobal.com' \|\| cleanUser === 'staff';`<br>`const isValidPass = cleanPass === 'admin123' \|\| cleanPass === 'harry2026' \|\| cleanPass === 'admin';` | Anyone reading frontend source or entering these strings gains administrative access to the client dashboard without backend validation. |
| Auto-Fill Demo button | Lines 98–103, 293–301 | Function `fillDemoCredentials()` fills `admin` and `admin123`. A visible button with a `Sparkles` icon is rendered next to the Password label. | Exposes administrative credentials in the user interface. Violates AC: *"Hardcoded demo credentials and demo quick-fill buttons are removed from client interface and source files."* |
| Demo Admin Access Hint Card | Lines 356–363 | Card rendering:<br>`<p>Username: <code>admin</code></p>`<br>`<p>Password: <code>admin123</code></p>` | Credentials directly printed on the UI for anyone visiting the login screen. |
| Simulated 2FA with Master Bypass | Lines 38–39, 85, 188–189, 438–450 | Client generates random 6-digit number, accepts hardcoded master bypass code `'123456'`, and provides an "Auto-Fill Code" button on the UI. | Fake 2FA that provides zero actual security and leaks OTP verification shortcuts in client bundle. |
| Missing Token Storage | Lines 196–200 | Sets `localStorage.setItem('harry_admin_session', JSON.stringify(loggedInUser))` or `sessionStorage`. **Never requests or stores `harry_admin_token`**. | Disconnected from backend auth. Protected API calls that require `Bearer <token>` fail with 401/403. |

### 1.2 Frontend-to-Backend Authentication Disconnect
- **File**: `src/components/AdminDashboard.tsx` (Lines 36, 58, 82)
  ```typescript
  const token = sessionStorage.getItem('harry_admin_token') || localStorage.getItem('harry_admin_token');
  const res = await fetch('http://localhost:5000/api/enquiries', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  ```
  Because `AdminLogin.tsx` never calls `/api/auth/login` and never sets `harry_admin_token`, `token` is `null`. All protected API calls send `Authorization: Bearer null` and fail.
- **File**: `src/App.tsx` (Lines 18–37)
  `adminUser` session state is read from `harry_admin_session`. `handleLogout()` removes `harry_admin_session`, but neither stores nor manages the JWT token.

### 1.3 Backend Authentication Implementation
**File**: `server/index.js`

- **Fatal Syntax Error on Startup (Lines 1–3)**:
  ```javascript
  import bcrypt
  import jwt
  import nodemailer
  ```
  Running `node --check server/index.js` fails immediately:
  `SyntaxError: Unexpected token 'import'` at line 2.
  The server cannot start. Must be corrected to:
  ```javascript
  import bcrypt from 'bcryptjs';
  import jwt from 'jsonwebtoken';
  import nodemailer from 'nodemailer';
  ```

- **Hardcoded Admin Seeding (Lines 67–77)**:
  ```javascript
  const userCountRes = await pool.query(`SELECT COUNT(*) FROM users`);
  if (parseInt(userCountRes.rows[0].count) === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    await pool.query(
      `INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      ['admin', 'admin@harryglobal.com', hash, 'Super Admin']
    );
  }
  ```
  The database seeder hardcodes `'admin'` / `'admin123'`. It does not read admin credentials or hashed passwords from environment variables.

- **Login API Endpoint (`POST /api/auth/login`, Lines 132–163)**:
  - Takes `{ username, password }`.
  - Queries `SELECT * FROM users WHERE username = $1 OR email = $1`.
  - Verifies using `bcrypt.compareSync(password, user.password_hash)`.
  - Generates JWT using `jwt.sign({ id, username, role }, JWT_SECRET, { expiresIn: '12h' })`.
  - Returns `{ token, user: { id, username, email, role } }`.
  - **Issue**: Requires a running PostgreSQL instance and `users` table seeded. Does not support direct fallback authentication against `.env` configured admin credentials (e.g. `ADMIN_USERNAME`, `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH`).

- **Token Verification (`GET /api/auth/verify`, Lines 117–127, 166–168)**:
  - Middleware `authenticateToken` validates `req.headers['authorization']` format `Bearer <token>` against `JWT_SECRET`.
  - Rejects missing tokens with 401 (`Access token required`).
  - Rejects invalid/expired tokens with 403 (`Invalid or expired token`).

---

## 2. Environment Configuration (`.env`) & Secrets Audit

### 2.1 Current `.env` File Inspection
**File**: `e:\Projects\VS_Projects\EuroPath\.env`
```ini
PORT=5000
JWT_SECRET=harry_global_secret_key_2026_secure
DB_PATH=./database.sqlite
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=admin@harryglobal.com
EMAIL_PASS=sample_app_password
WHATSAPP_API_TOKEN=sample_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=123456789
```

### 2.2 Findings & Vulnerabilities
1. **Missing Admin Credentials**: Neither `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, nor `ADMIN_PASSWORD_HASH` are present in `.env`.
2. **Missing `.env.example`**: There is no `.env.example` or template file for setup.
3. **Database Target Contradiction**:
   - `.env` defines `DB_PATH=./database.sqlite`.
   - `package.json` installs `"sqlite3": "^6.0.1"`.
   - But `server/index.js` ignores `DB_PATH` and connects to `postgresql://postgres:postgres@localhost:5432/harry_global`.
   - Network connectivity test (`Test-NetConnection -Port 5432`) failed: PostgreSQL is **not running** on localhost.
   - For standalone development and verification without requiring an external PostgreSQL daemon, the application should support SQLite or provide a database adapter that can work seamlessly with `database.sqlite` or PostgreSQL via connection string.

---

## 3. Build System, Bundler & TypeScript Health

### 3.1 Bundler & Scripts Inspection
- **File**: `package.json`
  ```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
  ```
- **Vite Configuration**: `vite.config.ts` uses `@vitejs/plugin-react`.
- **CSS**: Tailwind CSS v3 (`tailwindcss: ^3.4.1`, `postcss: ^8.4.47`, `autoprefixer: ^10.4.20`).

### 3.2 Build Verification
- Command executed: `npm run build`
- **Result**: **SUCCESS**
  - Transformed 1479 modules in 15.31s.
  - Emitted `dist/index.html` (0.65 kB), `dist/assets/index-yRFLyJAE.css` (33.20 kB), and `dist/assets/index-B7VR-uDl.js` (230.04 kB).
  - Exit code 0.

### 3.3 TypeScript Health
- **Missing `tsconfig.json`**: There is no `tsconfig.json` in the root repository.
- **Missing `typescript` binary**: `typescript` is not listed in `devDependencies` (only `@types/react`, `@types/react-dom`, `@types/express`, `@types/pg`, etc. are present).
- Vite strips TypeScript types via esbuild during `vite build` without type checking.
- Adding a standard `tsconfig.json` and adding `type-check` / `tsc --noEmit` will enforce strict type safety across components.

### 3.4 Dockerfile Flaw
- **File**: `Dockerfile` Line 6: `RUN npm install --production` followed by Line 10: `RUN npm run build`.
- Because `vite` is located in `devDependencies`, `npm install --production` will not install `vite`, causing `npm run build` to fail in Docker builds.

---

## 4. Testing Infrastructure Survey

### 4.1 Existing Testing Framework
- **Test files**: **0** found (`find_by_name` for `*test*` and `*spec*` returned zero results outside node_modules).
- **Test packages**: None installed (neither `vitest`, `jest`, `mocha`, `supertest`, nor `playwright`).
- **NPM scripts**: No `"test"` script exists in `package.json`.

### 4.2 Automated Testing Requirements (ACs & R3)
To fulfill the acceptance criteria:
> *"Automated tests or verification scripts are provided and pass, verifying authentication and application submission endpoints."*

The test suite must cover:

1. **Authentication API Tests**:
   - `POST /api/auth/login` with missing username/password returns HTTP 400.
   - `POST /api/auth/login` with invalid credentials returns HTTP 401.
   - `POST /api/auth/login` with valid `.env` credentials returns HTTP 200, JWT token, and user payload.
   - `GET /api/auth/verify` without token returns HTTP 401.
   - `GET /api/auth/verify` with invalid token returns HTTP 403.
   - `GET /api/auth/verify` with valid JWT token returns HTTP 200 and user payload.
   - Protected routes (`GET /api/enquiries`, `GET /api/applications`) reject unauthenticated requests with HTTP 401/403.

2. **Careers / Job Application API Tests (R2)**:
   - `POST /api/applications` (or `/api/careers/apply`) with valid candidate details returns HTTP 201 and application reference ID.
   - `POST /api/applications` with missing required fields (name, email, phone, role) returns HTTP 400.
   - `GET /api/applications` rejects unauthenticated requests with HTTP 401.
   - `GET /api/applications` with valid admin JWT returns HTTP 200 and lists submitted job applications.
   - `PATCH /api/applications/:id/status` updates candidate application status.

3. **Recommended Test Tooling**:
   - Install `vitest` (or use Node.js built-in `node:test` runner).
   - Add `"test": "vitest run"` or `"test": "node --test tests/*.test.js"` to `package.json`.
   - Provide an end-to-end verification script (`npm run verify:all` or `tests/verify-endpoints.js`) that tests the entire flow programmatically.

---

## 5. Architectural Recommendations & Implementation Plan

### Phase 1: Environment & Server Repair
1. Fix ESM imports in `server/index.js` (`import bcrypt from 'bcryptjs'`, `import jwt from 'jsonwebtoken'`, `import nodemailer from 'nodemailer'`).
2. Update `.env` and create `.env.example` with:
   - `ADMIN_USERNAME=admin`
   - `ADMIN_EMAIL=admin@harryglobal.com`
   - `ADMIN_PASSWORD=...` (or `ADMIN_PASSWORD_HASH=...`)
   - `JWT_SECRET=...`
3. Add dual database support (SQLite fallback via `DB_PATH` or PostgreSQL via `DATABASE_URL`) so the server runs locally out of the box without requiring external Docker services.
4. Add `job_applications` table to the database initialization schema.
5. Add scripts to `package.json`:
   - `"server": "node server/index.js"`
   - `"test": "node --test tests/*.test.js"` (or Vitest)

### Phase 2: Secure Backend Authentication & APIs
1. Update `POST /api/auth/login`:
   - Authenticate against configured `.env` credentials (with bcrypt password comparison) or the database `users` table.
   - Generate secure JWT token containing user identity and expiration.
2. Implement Careers & Job Applications APIs:
   - `POST /api/applications` (Public submission with validation)
   - `GET /api/applications` (Admin-only, protected by `authenticateToken`)
   - `PATCH /api/applications/:id/status` (Admin-only)

### Phase 3: Client Authentication Modernization
1. Refactor `AdminLogin.tsx`:
   - Remove hardcoded credentials (`admin`/`admin123`/`harry2026`).
   - Remove "Auto-Fill Demo" button and demo helper card.
   - Remove simulated client-side OTP and master bypass code `123456`.
   - Submit real login request to `POST /api/auth/login`.
   - Store received JWT token in `sessionStorage` (`harry_admin_token`) or `localStorage`.
2. Update `AdminDashboard.tsx`:
   - Include Bearer token in all API requests.
   - Add tab/view for "Job Applications" alongside "Enquiries".
3. Update `App.tsx` and `Navbar.tsx`:
   - Ensure clean token lifecycle on logout (`harry_admin_token` + `harry_admin_session`).
   - Add Careers navigation links.

### Phase 4: Automated Testing & Verification
1. Implement automated test suite verifying all endpoints.
2. Verify `npm run build` and test scripts pass cleanly.
