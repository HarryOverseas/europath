/**
 * Independent Challenger Verification Harness for Harry Overseas Recruitment Lifecycle.
 * 
 * Verifies:
 * 1. Public application submissions across all 4 advertised roles
 * 2. SQLite database verification (applications table schema & records)
 * 3. Secure Admin Authentication (.env credentials, bcrypt hash check, JWT token issuance)
 * 4. Admin applications listing, role/status filtering, and full-text search
 * 5. Complete candidate status transition lifecycle:
 *    New -> Reviewing -> Shortlisted -> Interviewed -> Hired
 *    and rejection path: New -> Reviewing -> Rejected
 * 6. Admin candidate deletion and 404 confirmation on subsequent mutations/deletions
 * 7. Negative security and boundary tests (missing fields, bad email, bad status enum, unauthenticated access)
 */

import assert from 'node:assert/strict';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin_harry_2026_secure';
const DB_PATH = process.env.DB_PATH || './database.sqlite';

console.log('='.repeat(70));
console.log('CHALLENGER 2: EMPIRICAL RECRUITMENT LIFECYCLE VERIFICATION');
console.log('='.repeat(70));
console.log(`Backend Base URL: ${BASE_URL}`);
console.log(`Database Path:   ${DB_PATH}`);
console.log(`Admin Username:  ${ADMIN_USER}`);

async function runChallengerSuite() {
  const sqliteDb = new sqlite3.Database(path.resolve(DB_PATH));
  const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

  const createdAppIds = [];

  try {
    // -------------------------------------------------------------
    // STEP 1: Verify Database Schema directly via SQLite PRAGMA
    // -------------------------------------------------------------
    console.log('\n[1/7] Verifying SQLite Database Schema for `applications` and `users`...');
    const tableInfo = await dbAll('PRAGMA table_info(applications)');
    assert.ok(tableInfo.length > 0, 'Table `applications` must exist in SQLite database');
    const columnNames = tableInfo.map(col => col.name);
    console.log(`  Columns found: ${columnNames.join(', ')}`);
    for (const expectedCol of ['id', 'full_name', 'email', 'phone', 'role', 'resume_link', 'notes', 'status', 'created_at']) {
      assert.ok(columnNames.includes(expectedCol), `Missing column in applications table: ${expectedCol}`);
    }

    // Verify admin credentials in users table are bcrypt-hashed (never plaintext)
    const adminRows = await dbAll('SELECT id, username, email, password_hash, role FROM users WHERE username = ?', [ADMIN_USER]);
    assert.equal(adminRows.length, 1, `Admin user '${ADMIN_USER}' must exist in database`);
    const dbAdmin = adminRows[0];
    assert.ok(dbAdmin.password_hash.startsWith('$2a$') || dbAdmin.password_hash.startsWith('$2b$'), 'Admin password must be bcrypt hashed');
    assert.notEqual(dbAdmin.password_hash, ADMIN_PASS, 'Admin password must NEVER be stored in plaintext');
    console.log('  ✔ Database schema and bcrypt password hash verified.');

    // -------------------------------------------------------------
    // STEP 2: Public Applications Submission across 4 roles
    // -------------------------------------------------------------
    console.log('\n[2/7] Submitting Job Applications via POST /api/applications for 4 roles...');
    const rolesToTest = [
      {
        full_name: 'Dr. Klaus Becker',
        email: 'klaus.becker@example.de',
        phone: '+49 170 1234567',
        role: 'German Language Trainer',
        resume_link: 'https://linkedin.com/in/klaus-becker-daf',
        notes: 'Telc & Goethe certified examiner with 8 years of DaF teaching experience.'
      },
      {
        full_name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+91 98765 43210',
        role: 'Senior Visa & Immigration Consultant',
        resume_link: 'https://linkedin.com/in/priya-sharma-germany',
        notes: 'Specialist in German Opportunity Card (Chancenkarte) and EU Blue Card filings.'
      },
      {
        full_name: 'Anand Varma',
        email: 'anand.varma@example.com',
        phone: '+91 91234 56789',
        role: 'Overseas Student Counselor',
        resume_link: 'https://drive.google.com/file/d/sample-anand-cv/view',
        notes: 'Advised 200+ students on TU9 / Uni-Assist applications and APS certificate.'
      },
      {
        full_name: 'Sophie Dubois',
        email: 'sophie.dubois@example.fr',
        phone: '+33 6 12 34 56 78',
        role: 'European Relocation & Settlement Coordinator',
        resume_link: 'https://linkedin.com/in/sophie-dubois-relocation',
        notes: 'Expert in German Anmeldung, health insurance activation, and expat housing.'
      }
    ];

    for (const applicant of rolesToTest) {
      const res = await fetch(`${BASE_URL}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicant)
      });
      assert.equal(res.status, 201, `Expected 201 Created for role ${applicant.role}, got ${res.status}`);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.application_id, 'Response must return application_id');
      createdAppIds.push({ id: body.application_id, ...applicant });
      console.log(`  ✔ Submitted: ${applicant.full_name} (${applicant.role}) -> ID: ${body.application_id}`);
    }

    // -------------------------------------------------------------
    // STEP 3: Verify Persistence in SQLite Database
    // -------------------------------------------------------------
    console.log('\n[3/7] Verifying Candidate Records in SQLite Database...');
    for (const candidate of createdAppIds) {
      const rows = await dbAll('SELECT * FROM applications WHERE id = ?', [candidate.id]);
      assert.equal(rows.length, 1, `Application ID ${candidate.id} not found in SQLite database`);
      const row = rows[0];
      assert.equal(row.full_name, candidate.full_name);
      assert.equal(row.email, candidate.email);
      assert.equal(row.phone, candidate.phone);
      assert.equal(row.role, candidate.role);
      assert.equal(row.resume_link, candidate.resume_link);
      assert.equal(row.notes, candidate.notes);
      assert.equal(row.status, 'New');
      console.log(`  ✔ DB verified: ID ${row.id} | ${row.full_name} | status='${row.status}'`);
    }

    // -------------------------------------------------------------
    // STEP 4: Admin Authentication via POST /api/auth/login
    // -------------------------------------------------------------
    console.log('\n[4/7] Authenticating Admin via POST /api/auth/login with .env credentials...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: ADMIN_USER,
        password: ADMIN_PASS
      })
    });
    assert.equal(loginRes.status, 200, `Admin login failed: ${loginRes.status}`);
    const loginBody = await loginRes.json();
    assert.equal(loginBody.success, true);
    assert.ok(loginBody.token, 'Admin login must issue JWT token');
    assert.equal(loginBody.user.username, ADMIN_USER);
    const adminToken = loginBody.token;
    console.log(`  ✔ Admin authenticated successfully. JWT issued (length: ${adminToken.length})`);

    // Verify token with GET /api/auth/verify
    const verifyRes = await fetch(`${BASE_URL}/api/auth/verify`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.equal(verifyRes.status, 200);
    const verifyBody = await verifyRes.json();
    assert.equal(verifyBody.success, true);
    assert.equal(verifyBody.user.username, ADMIN_USER);
    console.log('  ✔ Token verified via GET /api/auth/verify.');

    // -------------------------------------------------------------
    // STEP 5: Admin retrieves applications list with filtering
    // -------------------------------------------------------------
    console.log('\n[5/7] Testing Admin Applications Listing & Filtering...');
    // Unfiltered
    const listRes = await fetch(`${BASE_URL}/api/applications`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.equal(listRes.status, 200);
    const listBody = await listRes.json();
    assert.equal(listBody.success, true);
    assert.ok(Array.isArray(listBody.applications));
    assert.ok(listBody.applications.length >= 4, 'List should contain at least our 4 submitted applications');
    console.log(`  ✔ Retrieved total ${listBody.applications.length} applications`);

    // Filter by role: "German Language Trainer"
    const filterRoleRes = await fetch(`${BASE_URL}/api/applications?role=${encodeURIComponent('German Language Trainer')}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const filterRoleBody = await filterRoleRes.json();
    assert.ok(filterRoleBody.applications.length >= 1);
    for (const app of filterRoleBody.applications) {
      assert.equal(app.role.toLowerCase(), 'german language trainer');
    }
    console.log(`  ✔ Filter by role="German Language Trainer" returned ${filterRoleBody.applications.length} matching records`);

    // Search by name
    const searchRes = await fetch(`${BASE_URL}/api/applications?search=${encodeURIComponent('Priya Sharma')}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const searchBody = await searchRes.json();
    assert.ok(searchBody.applications.length >= 1);
    assert.ok(searchBody.applications.some(a => a.full_name === 'Priya Sharma'));
    console.log('  ✔ Search query ?search="Priya Sharma" verified');

    // -------------------------------------------------------------
    // STEP 6: Status Transition Lifecycle & Rejection Path
    // -------------------------------------------------------------
    console.log('\n[6/7] Transitioning Candidate Status through Lifecycle...');
    const testCandidate = createdAppIds[0]; // Dr. Klaus Becker
    const statusSequence = ['Reviewing', 'Shortlisted', 'Interviewed', 'Hired'];

    for (const targetStatus of statusSequence) {
      const patchRes = await fetch(`${BASE_URL}/api/applications/${testCandidate.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: targetStatus })
      });
      assert.equal(patchRes.status, 200, `PATCH status to ${targetStatus} failed: ${patchRes.status}`);
      const patchBody = await patchRes.json();
      assert.equal(patchBody.success, true);
      assert.equal(patchBody.status, targetStatus);

      // Verify in SQLite database
      const dbCheck = await dbAll('SELECT status FROM applications WHERE id = ?', [testCandidate.id]);
      assert.equal(dbCheck[0].status, targetStatus);
      console.log(`  ✔ Transitioned candidate ${testCandidate.id} -> '${targetStatus}' (DB verified)`);
    }

    // Test rejection lifecycle on candidate 1 (Priya Sharma)
    const rejectCandidate = createdAppIds[1];
    const rejectRes = await fetch(`${BASE_URL}/api/applications/${rejectCandidate.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Rejected' })
    });
    assert.equal(rejectRes.status, 200);
    const rejectBody = await rejectRes.json();
    assert.equal(rejectBody.status, 'Rejected');
    const dbRejectCheck = await dbAll('SELECT status FROM applications WHERE id = ?', [rejectCandidate.id]);
    assert.equal(dbRejectCheck[0].status, 'Rejected');
    console.log(`  ✔ Rejection path verified: candidate ${rejectCandidate.id} -> 'Rejected'`);

    // -------------------------------------------------------------
    // STEP 7: Candidate Deletion and 404 Confirmation
    // -------------------------------------------------------------
    console.log('\n[7/7] Deleting Candidate and Confirming 404...');
    const deleteCandidate = createdAppIds[3]; // Sophie Dubois
    const delRes = await fetch(`${BASE_URL}/api/applications/${deleteCandidate.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.equal(delRes.status, 200, `DELETE failed with status ${delRes.status}`);
    const delBody = await delRes.json();
    assert.equal(delBody.success, true);
    console.log(`  ✔ Deleted application ID ${deleteCandidate.id}`);

    // Confirm deletion in SQLite database
    const dbDelCheck = await dbAll('SELECT * FROM applications WHERE id = ?', [deleteCandidate.id]);
    assert.equal(dbDelCheck.length, 0, 'Deleted application must not exist in SQLite database');
    console.log('  ✔ Confirmed record deleted from SQLite table `applications`');

    // Confirm subsequent DELETE returns 404
    const repeatDelRes = await fetch(`${BASE_URL}/api/applications/${deleteCandidate.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.equal(repeatDelRes.status, 404, `Expected 404 for repeated delete, got ${repeatDelRes.status}`);
    console.log('  ✔ Subsequent DELETE returns 404 Not Found');

    // Confirm subsequent PATCH status returns 404
    const repeatPatchRes = await fetch(`${BASE_URL}/api/applications/${deleteCandidate.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Hired' })
    });
    assert.equal(repeatPatchRes.status, 404, `Expected 404 for patching deleted application, got ${repeatPatchRes.status}`);
    console.log('  ✔ Subsequent PATCH returns 404 Not Found');

    // -------------------------------------------------------------
    // NEGATIVE & SECURITY BOUNDARY CHECKS
    // -------------------------------------------------------------
    console.log('\n[Bonus Security & Boundary Checks]');
    // 1. Missing required field
    const badSubmit = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Incomplete Candidate', email: 'test@example.com' })
    });
    assert.equal(badSubmit.status, 400);
    console.log('  ✔ Missing phone/role rejected with 400 Bad Request');

    // 2. Invalid email format
    const badEmail = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Bad Email', email: 'not-an-email', phone: '1234567890', role: 'Trainer' })
    });
    assert.equal(badEmail.status, 400);
    console.log('  ✔ Invalid email rejected with 400 Bad Request');

    // 3. Invalid status enum
    const badStatus = await fetch(`${BASE_URL}/api/applications/${testCandidate.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'PromotedToCEO' })
    });
    assert.equal(badStatus.status, 400);
    console.log('  ✔ Invalid status enum rejected with 400 Bad Request');

    // 4. Missing Authorization header
    const unauthRes = await fetch(`${BASE_URL}/api/applications`);
    assert.equal(unauthRes.status, 401);
    console.log('  ✔ Missing Authorization header rejected with 401');

    // 5. Corrupted Bearer token
    const corruptTokenRes = await fetch(`${BASE_URL}/api/applications`, {
      headers: { 'Authorization': 'Bearer bad_corrupted_token' }
    });
    assert.ok(corruptTokenRes.status === 401 || corruptTokenRes.status === 403);
    console.log('  ✔ Corrupted Bearer token rejected with 401/403');

    console.log('\n' + '='.repeat(70));
    console.log('ALL EMPIRICAL RECRUITMENT LIFECYCLE CHECKS PASSED (100%)');
    console.log('='.repeat(70));
  } finally {
    sqliteDb.close();
  }
}

runChallengerSuite().catch(err => {
  console.error('\n[FATAL] Challenger suite failure:', err);
  process.exit(1);
});
