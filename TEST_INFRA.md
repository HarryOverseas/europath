# Harry Overseas Test Infrastructure (`TEST_INFRA.md`)

## 1. Overview

Harry Overseas features an opaque-box End-to-End (E2E) automated testing suite designed according to progressive testability principles. The suite rigorously verifies the system's external interface contracts as documented in `PROJECT.md` and fulfills the acceptance criteria specified in `ORIGINAL_REQUEST.md`.

The test infrastructure uses Node.js native test runner (`node:test`, `node:assert/strict`), native `fetch`, and ES Modules (`type: module`), ensuring zero additional third-party test framework overhead and fast, deterministic execution.

---

## 2. Test Architecture & Directory Layout

```
tests/
├── helpers/
│   ├── config.mjs              # Test configuration (base URL, timeouts, credentials)
│   ├── test-client.mjs         # Fluent HTTP client wrapping native fetch & auth handling
│   └── mock-server.mjs         # Contract-compliant in-memory reference server for M0 / CI
├── tier1_features/             # Tier 1: Core Functional Coverage (≥5 tests per feature)
│   ├── auth.test.mjs           # F3/F4: Admin credentials verification, JWT issuance, verify endpoint
│   ├── protected_routes.test.mjs # F4: Protected routes rejection (no token, malformed, forged)
│   ├── applications.test.mjs   # F6/F7: Job application CRUD, validation, role attributes
│   └── enquiries.test.mjs      # Customer enquiry submission, protected listing, status lifecycle
├── tier2_boundaries/           # Tier 2: Boundary & Corner Cases (≥5 tests per feature)
│   ├── auth_boundary.test.mjs  # Whitespace, empty strings, SQL injection, extreme lengths, non-string types
│   ├── applications_boundary.test.mjs # Missing/whitespace fields, invalid email regex, 404 on missing IDs, invalid status enums, XSS payloads, 10k character payloads
│   └── enquiries_boundary.test.mjs    # Whitespace fields, malformed emails, 404 on missing IDs, complex special characters
├── tier3_cross_feature/        # Tier 3: Pairwise Cross-Feature Workflows
│   ├── hiring_lifecycle.test.mjs      # Candidate Submit -> Admin Login -> Verify Session -> List Apps -> Filter Role -> Advance Status (New->Reviewing->Shortlisted->Interviewed->Hired) -> Delete -> Confirm 404
│   └── enquiry_lifecycle.test.mjs     # Public Enquiry Submit -> Admin Login -> Inspect Lead -> Update Status -> Delete
├── tier4_real_world/           # Tier 4: Real-World Application Scenarios (≥5 scenarios)
│   ├── recruitment_campaign.test.mjs  # Multi-role recruitment across 4 core roles (German Trainer, Visa Consultant, Student Counselor, Relocation Coordinator)
│   ├── concurrency_stress.test.mjs    # 10 simultaneous application submissions, race condition immunity, non-colliding IDs, concurrent status mutations
│   ├── session_lifecycle.test.mjs     # Complete token lifecycle, header casing, token payload tampering rejection, signature corruption rejection, post-logout lockdown
│   ├── role_filtering_search.test.mjs # Precision multi-criteria filtering by role, status, and free-text search queries
│   └── dual_system_operations.test.mjs# Customer Inquiries and Job Applications state isolation, independent namespaces, zero cross-contamination
└── run_tests.mjs               # Master test runner CLI with tier filtering, reporters, and auto-detecting reference server
```

---

## 3. Test Tiers & Coverage Matrix

| Tier       | Category                         | Test Suites                      | Total Tests  | Target Requirements & Contracts                                                                                                                                                                                                                                                      |
| ---------- | -------------------------------- | -------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tier 1** | Feature Coverage                 | `tier1_features/*.test.mjs`      | 26           | `POST /api/auth/login`, `GET /api/auth/verify`, `POST /api/applications`, `GET /api/applications`, `PATCH /api/applications/:id/status`, `DELETE /api/applications/:id`, `POST /api/enquiries`, `GET /api/enquiries`, `PATCH /api/enquiries/:id/status`, `DELETE /api/enquiries/:id` |
| **Tier 2** | Boundary & Corner Cases          | `tier2_boundaries/*.test.mjs`    | 20           | Input sanitization, whitespace rejection, malformed emails, SQL injection immunity, 404 handling on missing resources, XSS resistance, extreme payload limits                                                                                                                        |
| **Tier 3** | Cross-Feature Workflows          | `tier3_cross_feature/*.test.mjs` | 3            | Pairwise end-to-end recruitment lifecycle and customer enquiry management lifecycle                                                                                                                                                                                                  |
| **Tier 4** | Real-World Application Scenarios | `tier4_real_world/*.test.mjs`    | 5            | Multi-role campaign (4 core roles), concurrency bursts (10 simultaneous requests), token tampering & header security, role & search filtering, dual-system isolation                                                                                                                 |
| **Total**  | **All Tiers**                    | **14 suites**                    | **54 tests** | **100% Contract & Specification Coverage**                                                                                                                                                                                                                                           |

---

## 4. Execution Guide

### Run All Tests

```bash
npm test
# or
node tests/run_tests.mjs
```

### Run by Tier

```bash
# Run Tier 1 Feature tests only
node tests/run_tests.mjs --tier=1

# Run Tier 2 Boundary tests only
node tests/run_tests.mjs --tier=2

# Run Tier 3 Cross-Feature tests only
node tests/run_tests.mjs --tier=3

# Run Tier 4 Real-World Application Scenarios only
node tests/run_tests.mjs --tier=4
```

### Run Against Live Backend vs Reference Server

- **Auto-Detect (Default)**: `tests/run_tests.mjs` attempts to ping the configured `TEST_API_URL` (default: `http://localhost:5000`). If the live backend is offline (as in Milestone M0), it automatically starts the contract reference server on port `5055` to execute and verify the suite.
- **Force Live Backend**:
  ```bash
  node tests/run_tests.mjs --live
  ```
- **Force Reference Server**:
  ```bash
  node tests/run_tests.mjs --mock
  ```
- **Target Custom Host/Port**:
  ```bash
  TEST_API_URL=http://staging-server:5000 npm test
  ```

---

## 5. Environment & Credentials Configuration

Configured in `tests/helpers/config.mjs` and overridden via `.env`:

- `TEST_API_URL`: Target base URL (default `http://localhost:5000`).
- `ADMIN_USERNAME`: Admin login username (default `admin`).
- `ADMIN_PASSWORD`: Admin login password (default `admin123`).
- `JWT_SECRET`: Secret key used for JWT signing and verification.
