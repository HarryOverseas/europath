# Handoff Report — Explorer Survey 3: Auth, Security, Build System & Tests

- **Date**: 2026-11-02
- **Author**: teamwork_explorer_survey_3
- **Role**: explorer, survey
- **Working Directory**: `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_explorer_survey_3`
- **Handoff Type**: Hard (Task Complete)

---

## 1. Observation

### Observation 1.1: Client-Side Hardcoded Credentials & Demo Shortcuts
In `src/components/AdminLogin.tsx`:
- **Lines 78–81**:
  ```typescript
  // Accepted demo credentials: admin / admin123 or admin@harryglobal.com / harry2026!
  const isValidUser = cleanUser === 'admin' || cleanUser === 'admin@harryglobal.com' || cleanUser === 'staff';
  const isValidPass = cleanPass === 'admin123' || cleanPass === 'harry2026' || cleanPass === 'admin';
  ```
- **Lines 98–103**:
  ```typescript
  // Quick fill helper for demo convenience
  const fillDemoCredentials = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrorMessage('');
  };
  ```
- **Lines 293–301**:
  ```tsx
  <button
    type="button"
    onClick={fillDemoCredentials}
    className="text-xs text-brand-gold hover:text-brand-lightGold transition flex items-center space-x-1"
  >
    <Sparkles className="w-3 h-3" />
    <span>Auto-Fill Demo</span>
  </button>
  ```
- **Lines 356–363**:
  ```tsx
  <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-400">
    <div className="flex items-center space-x-1.5 text-brand-gold font-semibold mb-1">
      <HelpCircle className="w-3.5 h-3.5" />
      <span>Demo Admin Access</span>
    </div>
    <p>Username: <code className="text-white bg-slate-800 px-1.5 py-0.5 rounded">admin</code></p>
    <p className="mt-0.5">Password: <code className="text-white bg-slate-800 px-1.5 py-0.5 rounded">admin123</code></p>
  </div>
  ```
- **Lines 188–189**:
  ```typescript
  // Validate OTP: accept either current generated demo code or fallback master code '123456'
  if (fullEnteredOtp === generatedDemoOtp || fullEnteredOtp === '123456') {
  ```
- **Lines 438–450**:
  ```tsx
  <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-xl p-3 flex items-center justify-between">
    <div>
      <span className="text-[11px] text-brand-lightGold block">Demo Simulated Code:</span>
      <span className="text-sm font-mono font-extrabold text-white tracking-widest">{generatedDemoOtp}</span>
    </div>
    <button
      type="button"
      onClick={autofillDemoOtp}
      className="bg-brand-gold hover:bg-brand-lightGold text-brand-dark px-3 py-1.5 rounded-lg text-xs font-bold transition shadow"
    >
      Auto-Fill Code
    </button>
  </div>
  ```

### Observation 1.2: Token Disconnect Between Login and Dashboard
- In `src/components/AdminLogin.tsx` lines 196–200, the user session is stored:
  ```typescript
  if (rememberMe) {
    localStorage.setItem('harry_admin_session', JSON.stringify(loggedInUser));
  } else {
    sessionStorage.setItem('harry_admin_session', JSON.stringify(loggedInUser));
  }
  ```
  `harry_admin_token` is **never stored**.
- In `src/components/AdminDashboard.tsx` lines 36–41:
  ```typescript
  const token = sessionStorage.getItem('harry_admin_token') || localStorage.getItem('harry_admin_token');
  const res = await fetch('http://localhost:5000/api/enquiries', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  ```
  `token` resolves to `null`. Requests send `Authorization: Bearer null` and fail with 401/403.
- In `src/App.tsx` lines 32–37:
  `handleLogout` removes only `harry_admin_session`, never `harry_admin_token`.

### Observation 1.3: Server Syntax Errors & Seeding
In `server/index.js`:
- **Lines 1–3**:
  ```javascript
  1: import bcrypt
  2: import jwt
  3: import nodemailer
  ```
  Running `node --check server/index.js` outputs:
  ```
  E:\Projects\VS_Projects\EuroPath\server\index.js:2
  import jwt
  ^^^^^^
  SyntaxError: Unexpected token 'import'
  ```
- **Lines 67–77**:
  ```javascript
  const userCountRes = await pool.query(`SELECT COUNT(*) FROM users`);
  if (parseInt(userCountRes.rows[0].count) === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    await pool.query(
      `INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      ['admin', 'admin@harryglobal.com', hash, 'Super Admin']
    );
    console.log('Default admin seeded: admin / admin123');
  }
  ```
  Default admin is seeded with hardcoded credentials `admin` / `admin123`.

### Observation 1.4: Environment Configuration & Missing Files
- `.env` contents:
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
- Admin credentials (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_PASSWORD_HASH`) are **not defined** in `.env`.
- `.env.example` does not exist (`view_file` returned `The system cannot find the file specified`).
- Database target in `.env` is `DB_PATH=./database.sqlite`, but `server/index.js` connects via `pg` to PostgreSQL at port 5432.
- Running `Test-NetConnection -ComputerName localhost -Port 5432` showed `TcpTestSucceeded : False`. PostgreSQL is not active on localhost.

### Observation 1.5: Build System and TypeScript Configuration
- Running `npm run build` executed `vite build`:
  - 1479 modules transformed.
  - Output files: `dist/index.html` (0.65 kB), `dist/assets/index-yRFLyJAE.css` (33.20 kB), `dist/assets/index-B7VR-uDl.js` (230.04 kB).
  - Exit code: 0 in 15.31s.
- `tsconfig.json` is missing from the project root.
- Running `npx tsc --version` failed (`npm warn exec The following package was not found and will be installed: tsc@2.0.4`). `typescript` is not installed in `devDependencies`.

### Observation 1.6: Testing Infrastructure
- Running search for test files (`*test*`, `*spec*`) outside `node_modules` returned **0 results**.
- In `package.json`, `scripts` only contains `"dev"`, `"build"`, `"preview"`. There is no `"test"` script.
- No testing libraries (`vitest`, `jest`, `supertest`) are installed.

---

## 2. Logic Chain

1. **Client-side authentication is purely fictional (Supported by Obs 1.1, 1.2)**:
   The UI evaluates credentials against in-memory JavaScript string literals (`admin`, `admin123`, `harry2026`) and checks simulated 2FA against a client-generated number or master bypass `'123456'`. It never contacts `POST /api/auth/login`. Consequently, no real security boundary exists on the client.

2. **Backend API is inoperable in its current state (Supported by Obs 1.3, 1.4)**:
   Due to incomplete ES module import statements on lines 1–3 (`import bcrypt` without `from 'bcryptjs'`, etc.), the Node runtime crashes with `SyntaxError` before executing any route. Furthermore, `server/index.js` expects PostgreSQL at `localhost:5432` which is offline, while `.env` and `package.json` indicate SQLite was intended for local usage.

3. **Data access breaks between client and server (Supported by Obs 1.1, 1.2, 1.3)**:
   `AdminDashboard` attempts to pass `Bearer <token>` to fetch `/api/enquiries`. Since `AdminLogin` only writes `harry_admin_session` and never acquires or writes `harry_admin_token`, all protected API requests fail. Concurrently, public enquiries submitted via `EnquiryWizard.tsx` are stored only in `localStorage`, never reaching the database.

4. **Build and Test Gaps (Supported by Obs 1.5, 1.6)**:
   While Vite generates static bundles successfully, there is no typechecker (`tsc`) or linter in the build pipeline, nor any automated tests to verify authentication or application submission endpoints as required by the Acceptance Criteria.

---

## 3. Caveats

- We did not start a Docker container to test PostgreSQL (`docker-compose up`) because explorer agents are restricted to read-only investigation and verification checks.
- We did not write or modify source code during this survey phase.
- We confirmed Node.js version is v24.13.0, which natively supports `node:test` and `node:assert`, meaning automated verification scripts can be executed without strictly requiring new external test binaries if minimal dependencies are preferred.

---

## 4. Conclusion

To achieve production-grade status and satisfy R3 and the project Acceptance Criteria:
1. **Remove all client-side authentication shortcuts**: Delete `fillDemoCredentials`, hardcoded demo hints, client credential comparison, and dummy OTP from `AdminLogin.tsx`.
2. **Implement true backend authentication**:
   - Repair `server/index.js` ESM imports.
   - Configure admin credentials via `.env` (`ADMIN_USERNAME`, `ADMIN_PASSWORD` / `ADMIN_PASSWORD_HASH`).
   - Implement `POST /api/auth/login` to authenticate against `.env` and/or database users with bcrypt.
   - Issue JWT tokens signed with `JWT_SECRET`.
3. **Bridge Frontend Session with JWT**:
   - Have `AdminLogin.tsx` POST credentials to `/api/auth/login`.
   - Store the returned JWT token as `harry_admin_token` in `sessionStorage` / `localStorage`.
   - Pass the token in all `AdminDashboard.tsx` requests.
   - Update `App.tsx` logout to purge all stored tokens and sessions.
4. **Support Local Database Persistence**:
   - Provide a SQLite fallback or dual-mode database adapter in `server/index.js` referencing `DB_PATH=./database.sqlite` so local development and test runners can execute without external PostgreSQL containers.
   - Add a `job_applications` table to store candidate applications (R2).
5. **Establish Test & Build Infrastructure**:
   - Add a root `tsconfig.json`.
   - Add automated verification tests for `/api/auth/login`, `/api/auth/verify`, protected route rejection, and job application submission (`/api/applications`).
   - Add `"test"` and `"server"` scripts in `package.json`.

---

## 5. Verification Method

To independently verify all findings in this report, execute the following commands in powershell from `e:\Projects\VS_Projects\EuroPath`:

1. **Verify Backend Syntax Error**:
   ```powershell
   node --check server/index.js
   ```
   *Expected outcome*: Exits with code 1 and `SyntaxError: Unexpected token 'import'` on line 2.

2. **Verify Hardcoded Credentials in Source**:
   Inspect lines 78–81, 98–103, 293–301, 356–363 in `src/components/AdminLogin.tsx`.

3. **Verify Build Health**:
   ```powershell
   npm run build
   ```
   *Expected outcome*: Vite compiles cleanly (`dist/` generated, exit code 0).

4. **Verify Database Port Status**:
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 5432
   ```
   *Expected outcome*: `TcpTestSucceeded : False`.

5. **Verify Absence of Test Framework**:
   Inspect `package.json` `scripts` and search for test files.

**Invalidation Conditions**:
- If `node --check server/index.js` exits with code 0 without errors, the syntax bug observation is invalidated.
- If `AdminLogin.tsx` contains an HTTP `fetch('/api/auth/login')` call, the client-side simulation finding is invalidated.
