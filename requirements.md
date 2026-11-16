# Technical Requirements & Architecture Specification (`requirements.md`)

> **System Name:** Harry Global Immigration Platform (EuroPath)  
> **Repository:** `VS_Projects/EuroPath`  
> **Document Status:** Active Technical Specification  
> **Target Audience:** Software Engineers, System Architects, DevOps, and Technical Reviewers

---

## 1. System Overview & Architecture

The Harry Global Immigration platform is a full-stack web application designed for cross-border operations between Anantapur (India) and Germany. The platform provides public-facing customer onboarding, course catalog management, career application processing, an AI-powered advisory agent, and an authenticated administrative dashboard for operational staff.

### 1.1 Architectural Topology

```mermaid
graph TD
    subgraph Client ["Client Tier (Browser)"]
        SPA["React 18 Single Page App (TypeScript + Vite)"]
        SEC["Web Crypto Client (AES-256-GCM)"]
        OFFLINE["LocalStorage Offline Resilience Queue"]
        SPA --> SEC
        SPA --> OFFLINE
    end

    subgraph Gateway ["Network & Edge"]
        EDGE["Reverse Proxy / Vercel Edge Serverless"]
        CORS["CORS & Body Parser (10MB limit)"]
        DECRYPT["Transparent AES-256-GCM Decryption Middleware"]
        EDGE --> CORS --> DECRYPT
    end

    subgraph Backend ["Application Tier (Node.js / Express 5)"]
        AUTH["JWT Authentication & RBAC Middleware"]
        ENQ_API["Enquiry Management Controller"]
        APP_API["Careers & Application Controller"]
        CHAT_API["AI Advisor Engine (Claude API + Fallback)"]
        DECRYPT --> AUTH
        DECRYPT --> ENQ_API
        DECRYPT --> APP_API
        DECRYPT --> CHAT_API
    end

    subgraph DataTier ["Persistence Tier"]
        POOL["Universal Parameterized Query Abstraction"]
        PG[("PostgreSQL (Production / Neon / Supabase)")]
        SQLITE[("SQLite (Local Dev / Fallback)")]
        ENQ_API --> POOL
        APP_API --> POOL
        AUTH --> POOL
        POOL --> PG
        POOL --> SQLITE
    end

    subgraph Integrations ["External Services"]
        SMTP["Nodemailer SMTP (Gmail / Custom)"]
        WHATSAPP["WhatsApp Meta Cloud API"]
        CLAUDE["Anthropic Claude API (claude-haiku-5-5)"]
        ENQ_API --> SMTP
        ENQ_API --> WHATSAPP
        CHAT_API --> CLAUDE
    end
```

---

## 2. Frontend Specifications

### 2.1 Technology Stack

- **Runtime & Bundler:** Vite 5 with `@vitejs/plugin-react`
- **UI Framework:** React 18.3.1 (Functional components with Hooks)
- **Language:** TypeScript 5 (Strict type checking enabled)
- **Styling:** Tailwind CSS 3.4 + Autoprefixer + PostCSS
- **Iconography:** `lucide-react` (Vector icons)
- **Security Primitives:** Native Web Crypto API (SubtleCrypto)

### 2.2 Component Hierarchy & Module Breakdown

The client application is organized into dedicated functional components under `src/components/`:

| Component | Responsibility | Technical Details |
| :--- | :--- | :--- |
| `Navbar.tsx` | Global top navigation, view switching, mobile drawer | Hash router synchronization, responsive navigation, admin session status |
| `Hero.tsx` | Primary landing banner, value proposition, CTAs | Quick-scroll anchors to service modules and enquiry forms |
| `Services.tsx` | Core service catalog | Dynamic service cards: Student Visas, Chancenkarte, Family Reunion, Work Visas, Healthcare Recruitment, Schengen Visas |
| `LanguageAcademy.tsx` | German language training portal | Course levels (A1, A2, B1, B2), pricing breakdown, bundle discounts, curriculum highlights |
| `ArrivalAssistance.tsx` | Germany relocation and onboarding modules | Airport pickup coordination, accommodation search, city registration (*Anmeldung*) guidance |
| `EnquiryWizard.tsx` | Multi-step interactive service package builder | 6-step wizard, client-side validation, service selection, AES payload encryption, offline fallback |
| `Careers.tsx` | Job application and candidate recruitment portal | Vacancy listings, filter by department/role, resume file handling, candidate data submission |
| `NewsFeed.tsx` | Immigration regulatory news and updates | Client-side RSS feed parser (`/feed.xml`), news categorisation, modal readers |
| `Chatbot.tsx` | Real-time AI advisory assistant ("Clara") | Floating widget, markdown formatting, rate-limited request throttling, deterministic offline rule fallback |
| `AdminLogin.tsx` | Authenticated staff entrance | Secure credential submission, JWT storage (`sessionStorage` / `localStorage`), session renewal |
| `AdminDashboard.tsx` | Operational administration portal | Lead management pipeline, status progression, free-text search, CSV export, role-restricted actions |
| `LegalFooter.tsx` | Regulatory, privacy, terms, and contact footer | Disclaimer on visa granting authority, contact info, sitemap links |

### 2.3 Client-Side Encryption & Security (`src/utils/secureApi.ts`)

To protect customer Personally Identifiable Information (PII) during transit:
- Payloads are encrypted using **AES-256-GCM** before network dispatch.
- A 12-byte cryptographically secure random Initialization Vector (IV) is generated via `window.crypto.getRandomValues()`.
- The encrypted ciphertext and 16-byte authentication tag are bundled into a Base64-encoded string submitted in the `__enc` field.
- If the browser does not support Web Crypto or encryption fails, a graceful plaintext fallback is executed with transport-layer TLS.

### 2.4 Offline Resilience & Queueing

In `EnquiryWizard.tsx` and `Careers.tsx`:
- When network connectivity fails or the backend responds with a server error, submissions are serialized and saved to `localStorage` under `harry_pending_enquiries` / `harry_pending_applications`.
- A resilient retry mechanism attempts re-dispatch once network connectivity is re-established.

---

## 3. Backend & API Specifications

### 3.1 Runtime & Framework

- **Runtime:** Node.js (ES Modules, `"type": "module"`)
- **Server Framework:** Express 5.3.0
- **Configuration Management:** `dotenv` loading `.env`
- **Port:** Configured via `PORT` (Default: `5000`)

### 3.2 Security & Middleware Stack

1. **CORS:** Configured with cross-origin headers to allow authorized client requests.
2. **Body Parser:** `express.json({ limit: '10mb' })` with support for large resume/document payloads.
3. **Transparent Decryption Middleware:** Intercepts requests containing `__enc` or `payload`, decrypts the AES-256-GCM buffer using the server's `PAYLOAD_SECRET`, and populates `req.body` transparently.
4. **JWT Verification Middleware:** Validates `Authorization: Bearer <token>` on protected routes. Enforces signature integrity, checks expiration (`exp`), and prevents algorithm-downgrade attacks (`alg: none`).
5. **Role-Based Access Control (RBAC):** Restricts administrative mutations based on user role (`Super-Admin`, `Admin`, `Counselor`).
6. **Input Sanitization & Parameterization:** All SQL queries use parameterized placeholders (`$1, $2` for Postgres / `?, ?` for SQLite) to neutralize SQL injection vulnerabilities.

### 3.3 RESTful API Endpoints

#### Authentication API
- `POST /api/auth/login`
  - **Body:** `{ "username": "admin", "password": "..." }`
  - **Success Response (200 OK):** `{ "success": true, "token": "<JWT>", "user": { "id": 1, "username": "admin", "role": "Super-Admin" } }`
  - **Error Responses:** `400 Bad Request` (missing fields), `401 Unauthorized` (invalid credentials).
- `GET /api/auth/verify`
  - **Headers:** `Authorization: Bearer <token>`
  - **Success Response (200 OK):** Current authenticated user session object.
- `POST /api/auth/logout`
  - **Headers:** `Authorization: Bearer <token>`
  - **Success Response (200 OK):** Session revocation acknowledgement.

#### Customer Enquiries API
- `POST /api/enquiries` (Public)
  - **Body:** Full customer inquiry object or AES-encrypted `__enc` bundle.
  - **Validation:** Enforces non-empty `fullName`, valid `email`, and `mobileNumber`.
  - **Success Response (201 Created):** `{ "success": true, "id": "<id>", "enquiryId": "ENQ-..." }`
- `GET /api/enquiries` (Protected - Admin)
  - **Query Params:** `status`, `search`, `page`, `limit`
  - **Success Response (200 OK):** Paginated array of customer enquiry records.
- `PATCH /api/enquiries/:id/status` (Protected - Admin)
  - **Body:** `{ "status": "Contacted" | "Counselling scheduled" | "Quotation sent" | ... }`
  - **Success Response (200 OK):** Updated enquiry record.
- `DELETE /api/enquiries/:id` (Protected - Super-Admin / Admin)
  - **Success Response (200 OK):** Deletion confirmation.

#### Careers & Job Applications API
- `POST /api/applications` (Public)
  - **Body:** `{ "fullName": "...", "email": "...", "phone": "...", "role": "...", "experienceYears": 3, "germanLevel": "B2", "resume": "..." }`
  - **Validation:** Strict verification of email format, role enum, and mandatory contact details.
  - **Success Response (201 Created):** `{ "success": true, "applicationId": "<id>" }`
- `GET /api/applications` (Protected - Admin)
  - **Query Params:** `role`, `status`, `search`
  - **Success Response (200 OK):** List of job applications.
- `PATCH /api/applications/:id/status` (Protected - Admin)
  - **Body:** `{ "status": "New" | "Reviewing" | "Shortlisted" | "Interviewed" | "Hired" | "Rejected" }`
  - **Success Response (200 OK):** Updated candidate status.
- `DELETE /api/applications/:id` (Protected - Super-Admin)
  - **Success Response (200 OK):** Removal confirmation.

#### AI Advisory & Assistant API
- `POST /api/chat` (Public / Rate-limited)
  - **Body:** `{ "message": "What are the requirements for German Chancenkarte?", "history": [...] }`
  - **Behavior:** Queries Anthropic Claude API (`claude-haiku-5-5`) if `ANTHROPIC_API_KEY` is present. Otherwise, dispatches structured response from internal knowledge base.
  - **Success Response (200 OK):** `{ "reply": "...", "source": "claude" | "knowledge-base" }`

---

## 4. Data Models & Database Schemas

The database layer utilizes a dual-engine architecture:
1. **Production:** PostgreSQL (Hosted on Neon, Supabase, or AWS RDS) with SSL connection pooling.
2. **Local Development / Fallback:** SQLite (`database.sqlite`) initialized automatically if PostgreSQL connection string is absent.

### 4.1 Schema Definitions

#### `enquiries` Table
```sql
CREATE TABLE IF NOT EXISTS enquiries (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(50) NOT NULL,
    whatsapp_number VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    current_city VARCHAR(100),
    current_country VARCHAR(100),
    services JSONB DEFAULT '[]'::jsonb,
    language_course VARCHAR(100),
    additional_services JSONB DEFAULT '[]'::jsonb,
    intended_destination VARCHAR(100),
    intended_intake VARCHAR(100),
    consultation_method VARCHAR(50),
    additional_notes TEXT,
    status VARCHAR(50) DEFAULT 'New enquiry',
    assigned_to VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_email ON enquiries(email);
```

#### `applications` Table
```sql
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    role VARCHAR(100) NOT NULL,
    experience_years NUMERIC(4, 1) DEFAULT 0,
    german_level VARCHAR(20) DEFAULT 'None',
    resume_url TEXT,
    cover_letter TEXT,
    status VARCHAR(50) DEFAULT 'New',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applications_role ON applications(role);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
```

#### `users` Table
```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Lead Status Lifecycle

```
[New enquiry]
      │
      ▼
 [Contacted]
      │
      ▼
[Counselling scheduled]
      │
      ▼
[Documents pending]
      │
      ▼
[Quotation sent]
      │
      ▼
[Service confirmed] ──► [In progress] ──► [Completed]
                               │
                               ▼
                            [Closed]
```

---

## 5. Security & Verification Standards

### 5.1 Threat Mitigation Matrix

| Threat Category | Mitigation Vector | Implementation Point |
| :--- | :--- | :--- |
| **SQL Injection** | Strict query parameterization (`$1, $2` / `?, ?`) | Database abstraction layer (`query()` function) |
| **Cross-Site Scripting (XSS)** | React JSX auto-escaping + server-side string sanitation | UI rendering & boundary validators |
| **Credential Compromise** | Bcrypt password hashing (salt rounds = 10) | User management controller |
| **Session Hijacking / Forgery** | Signed JWTs with short validity + secret rotation support | JWT middleware (`jsonwebtoken`) |
| **Man-in-the-Middle (MitM)** | TLS/HTTPS enforcement + AES-256-GCM payload encryption | Client `secureApi.ts` & Server decryption |
| **Denial of Service (DoS)** | 10MB JSON body limit + rate throttling | Express middleware |
| **Data Pollution** | Strict schema validation on mandatory fields | API route entry guards |

### 5.2 Cross-Border Data Privacy Compliance

- **Principle of Minimization:** Only data required for visa eligibility and regulatory processing is gathered.
- **Administrative Access Logs:** Administrative actions, status updates, and deletions are audit-logged.
- **Data Export & Deletion:** Endpoints support customer data deletion requests in alignment with European GDPR and Indian data protection directives.

---

## 6. Automated Testing Infrastructure

The project includes an opaque-box automated test runner built on native Node.js primitives (`node:test`, `node:assert/strict`) with zero external test runner dependencies.

### 6.1 Test Suite Organization (`tests/`)

```
tests/
├── helpers/
│   ├── config.mjs               # Dynamic test environment configuration
│   ├── test-client.mjs          # Fluent HTTP test client with auth abstraction
│   └── mock-server.mjs          # In-memory contract-compliant reference server
├── tier1_features/              # Tier 1: Functional Feature Coverage (26 tests)
│   ├── applications.test.mjs    # Job application CRUD & validation
│   ├── auth.test.mjs            # Authentication, JWT issuance, verification
│   ├── enquiries.test.mjs       # Enquiry submission and admin lifecycle
│   └── protected_routes.test.mjs# Route protection and header validation
├── tier2_boundaries/            # Tier 2: Boundary & Corner Cases (20 tests)
│   ├── applications_boundary.test.mjs # 10k payloads, whitespace, invalid formats
│   ├── auth_boundary.test.mjs   # Injection strings, extreme passwords
│   └── enquiries_boundary.test.mjs    # Malformed emails, null safety
├── tier3_cross_feature/         # Tier 3: Pairwise Workflows (3 suites)
│   ├── enquiry_lifecycle.test.mjs     # Submission -> Auth -> Update -> Deletion
│   └── hiring_lifecycle.test.mjs      # Candidate Flow -> Screening -> Decision
├── tier4_real_world/            # Tier 4: Real-World Scenarios (5 suites)
│   ├── concurrency_stress.test.mjs    # High-concurrency burst tests
│   ├── dual_system_operations.test.mjs# State isolation between enquiries & apps
│   ├── recruitment_campaign.test.mjs  # Multi-role recruitment verification
│   ├── role_filtering_search.test.mjs # Multi-parameter database queries
│   └── session_lifecycle.test.mjs     # Token tampering & header manipulation
├── tier5_adversarial/           # Tier 5: Adversarial & Attack Surface Tests
│   └── adversarial_stress.test.mjs    # Prototype pollution, SQLi payloads, alg:none
└── run_tests.mjs                # Test runner CLI orchestrator
```

### 6.2 Running Tests

```bash
# Execute full test suite (auto-detects live backend or starts reference mock)
npm test

# Run specific tier
node tests/run_tests.mjs --tier=1
node tests/run_tests.mjs --tier=2
node tests/run_tests.mjs --tier=3
node tests/run_tests.mjs --tier=4
node tests/run_tests.mjs --tier=5

# Force live backend execution
node tests/run_tests.mjs --live
```

---

## 7. Environment Configuration & Deployment

### 7.1 Environment Variables Reference (`.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Node.js HTTP server port | `5000` |
| `JWT_SECRET` | Secret key for signing and verifying JWT tokens | `harry_global_secret_key_2026_secure` |
| `PAYLOAD_SECRET` | 256-bit key for AES-256-GCM payload encryption | `harry_global_payload_secure_2026` |
| `DATABASE_URL` | PostgreSQL connection string (SSL required) | `postgresql://user:pass@ep-host.neon.tech/neondb?sslmode=require` |
| `DB_PATH` | Path to local SQLite database (dev fallback) | `./database.sqlite` |
| `ADMIN_USERNAME` | Super-admin seed username | `admin` |
| `ADMIN_PASSWORD` | Super-admin seed password | `secure_password` |
| `ADMIN_EMAIL` | Administrative contact email | `admin@harryglobal.com` |
| `EMAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP server port | `587` |
| `EMAIL_USER` | SMTP username / sender address | `admin@harryglobal.com` |
| `EMAIL_PASS` | SMTP application password | `app_password` |
| `WHATSAPP_API_TOKEN`| Meta Cloud API bearer token | `token_string` |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Cloud API verified sender ID | `123456789` |
| `ANTHROPIC_API_KEY`| Anthropic API key for Claude chatbot | `sk-ant-api03-...` |

### 7.2 Local Development Commands

```bash
# Install frontend and backend dependencies
npm install

# Start Vite client development server (port 5173)
npm run dev

# Start Express backend server (port 5000)
npm run server

# Build client production assets into dist/
npm run build

# Preview production build locally
npm run preview

# Run automated end-to-end verification suite
npm test
```

### 7.3 Deployment Targets

- **Frontend & Edge API:** Configured for Vercel deployment via `vercel.json` with client asset caching and API routing to serverless handlers.
- **Containerization:** Production Docker image via `Dockerfile` and multi-service orchestration via `docker-compose.yml`.
- **Database Provisioning:** Automated database schema migration script (`scripts/migrate-to-postgres.js`).
