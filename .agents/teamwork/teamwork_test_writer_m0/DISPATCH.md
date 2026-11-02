# Dispatch to teamwork_test_writer (Milestone M0: E2E Testing Track)

## Working Directory
`e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_test_writer_m0\`

## Authoritative Files to Read
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\ORIGINAL_REQUEST.md`
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\orchestrator_1\PROJECT.md`

## Mission
Design and implement the complete opaque-box E2E test suite for EuroPath derived from user requirements and the interface contracts in `PROJECT.md`.

## Test Design Methodology & Coverage Requirements
1. **Test Infrastructure**:
   - Create test files in `tests/` directory (e.g., using Node's native test runner `node:test` and `node:assert`, executable via `node --test tests/*.test.mjs` or `npm test`).
   - Add `"test": "node --test tests/*.test.mjs"` to `package.json` if needed, or provide a standalone test runner script `tests/run_tests.mjs` that can be run with `node tests/run_tests.mjs`.
2. **Tier 1 - Feature Coverage (≥5 tests per feature)**:
   - F3/F4: Admin Auth (`POST /api/auth/login` valid, invalid password, invalid username, missing fields, token verification `GET /api/auth/verify`).
   - F4: Protected routes rejection (401 when no token, 401 when malformed token, 401 when invalid token).
   - F6/F7: Job Applications (`POST /api/applications` happy path, missing fields rejection, fetch applications with token, update status with token, delete application with token).
   - Inquiries: (`POST /api/enquiries`, fetch inquiries with token).
3. **Tier 2 - Boundary & Corner Cases (≥5 per feature)**:
   - Empty string values, whitespace-only fields, malformed email formats, special characters, max-length payloads, non-existent application IDs (404), unauthorized status transitions.
4. **Tier 3 - Cross-Feature Combinations (Pairwise)**:
   - Candidate submits application -> Admin logs in with `.env` credentials -> Admin fetches application list -> verifies candidate details -> updates candidate status -> deletes application -> verifies deletion.
   - Inquiry submitted -> Admin logs in -> inspects inquiry -> updates status.
5. **Tier 4 - Real-World Application Scenarios (≥5 application-level scenarios)**:
   - Multi-candidate recruitment flow with distinct roles (German Trainer, Visa Consultant, Student Counselor, Relocation Coordinator).
   - High-concurrency or sequential application submissions.
   - Admin session expiration / token invalidation flow.
6. **Publish Deliverables**:
   - Write all test files in `tests/`.
   - Write `e:\Projects\VS_Projects\EuroPath\TEST_INFRA.md` and `e:\Projects\VS_Projects\EuroPath\TEST_READY.md`.
   - Write `handoff.md` in your working directory and notify the orchestrator.


## 2026-11-02T14:44:56Z
Read your dispatch instructions at e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_test_writer_m0\DISPATCH.md and the authoritative request at e:\Projects\VS_Projects\EuroPath\.agents\teamwork\ORIGINAL_REQUEST.md.
Also read e:\Projects\VS_Projects\EuroPath\.agents\teamwork\orchestrator_1\PROJECT.md.
Working directory: e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_test_writer_m0\
Design and write the comprehensive E2E test suite (Tiers 1-4) in tests/, create TEST_INFRA.md and TEST_READY.md at project root, and report completion with handoff.md in your working directory. Send a message to orchestrator when complete.
