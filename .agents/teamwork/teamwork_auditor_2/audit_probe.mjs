import assert from 'node:assert/strict';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const BASE_URL = 'http://localhost:5000';
const DB_PATH = path.resolve(process.env.DB_PATH || './database.sqlite');
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin_harry_2026_secure';
const JWT_SECRET = process.env.JWT_SECRET || 'harry_global_secret_key_2026_secure';

console.log('--- FORENSIC AUDITOR INDEPENDENT EMPIRICAL PROBE ---');

const sqliteDb = new sqlite3.Database(DB_PATH);
const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
  sqliteDb.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows || []);
  });
});

async function main() {
  // Probe 1: Direct SQLite password inspection
  console.log('\n[Probe 1] SQLite Users Table Integrity Check:');
  const userRows = await dbAll('SELECT id, username, email, password_hash, role FROM users WHERE username = ?', [ADMIN_USER]);
  assert.equal(userRows.length, 1, 'Admin user must exist');
  const user = userRows[0];
  console.log(`  User: ${user.username}, Role: ${user.role}, Hash prefix: ${user.password_hash.substring(0, 10)}...`);
  assert.ok(bcrypt.compareSync(ADMIN_PASS, user.password_hash), 'Admin hash must match .env ADMIN_PASSWORD');
  assert.ok(!bcrypt.compareSync('admin123', user.password_hash), 'Admin hash must NOT match admin123');
  assert.ok(!bcrypt.compareSync('password', user.password_hash), 'Admin hash must NOT match password');
  console.log('  ✔ Password hashing is genuine bcrypt, matching .env and rejecting defaults.');

  // Probe 2: Auth endpoint verification with correct and incorrect credentials
  console.log('\n[Probe 2] Backend Auth Endpoint Verification:');
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USER, password: 'wrong_password_test' })
  });
  assert.equal(badLoginRes.status, 401, 'Bad password must yield 401');
  const badLoginData = await badLoginRes.json();
  assert.equal(badLoginData.success, false);
  console.log('  ✔ Bad credentials correctly returned 401 Unauthorized.');

  const goodLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS })
  });
  assert.equal(goodLoginRes.status, 200, 'Valid credentials must yield 200');
  const goodLoginData = await goodLoginRes.json();
  assert.ok(goodLoginData.token, 'Must return JWT token');
  assert.equal(goodLoginData.user.username, ADMIN_USER);
  const token = goodLoginData.token;
  const decoded = jwt.verify(token, JWT_SECRET);
  assert.equal(decoded.username, ADMIN_USER);
  console.log('  ✔ Valid login yielded verified JWT signed with JWT_SECRET.');

  // Probe 3: JWT tampering and bypass testing
  console.log('\n[Probe 3] JWT Security & Tamper Resistance:');
  const tamperedToken = token.slice(0, -6) + 'abcdef';
  const tamperedRes = await fetch(`${BASE_URL}/api/auth/verify`, {
    headers: { 'Authorization': `Bearer ${tamperedToken}` }
  });
  assert.ok(tamperedRes.status === 401 || tamperedRes.status === 403, 'Tampered token must be rejected');
  console.log(`  ✔ Tampered token rejected with HTTP ${tamperedRes.status}.`);

  const algNoneToken = jwt.sign({ username: ADMIN_USER, role: 'Super Admin' }, '', { algorithm: 'none' });
  const noneRes = await fetch(`${BASE_URL}/api/auth/verify`, {
    headers: { 'Authorization': `Bearer ${algNoneToken}` }
  });
  assert.ok(noneRes.status === 401 || noneRes.status === 403, 'alg:none token must be rejected');
  console.log(`  ✔ alg:none token rejected with HTTP ${noneRes.status}.`);

  // Probe 4: Enquiry submission and persistence check
  console.log('\n[Probe 4] Customer Enquiry Real Database Persistence:');
  const probeEnquiryId = `AUDIT-ENQ-${Date.now()}`;
  const enquiryPayload = {
    id: probeEnquiryId,
    fullName: 'Auditor Empirical Test Lead',
    email: 'auditor.lead@example.de',
    mobile: '+49 160 99887766',
    mainServices: ['Job Seeker Visa', 'German Language Classes'],
    intendedDestination: 'Germany',
    additionalReqs: 'Forensic integrity probe audit'
  };

  const enqPostRes = await fetch(`${BASE_URL}/api/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(enquiryPayload)
  });
  assert.equal(enqPostRes.status, 201, 'Enquiry submission must yield 201');
  const enqPostData = await enqPostRes.json();
  assert.equal(enqPostData.success, true);
  const confirmedEnqId = enqPostData.id || probeEnquiryId;

  // Verify in SQLite directly
  const enqDbRows = await dbAll('SELECT * FROM enquiries WHERE id = ?', [confirmedEnqId]);
  assert.equal(enqDbRows.length, 1, 'Enquiry must be found in SQLite table');
  assert.equal(enqDbRows[0].full_name, 'Auditor Empirical Test Lead');
  assert.equal(enqDbRows[0].email, 'auditor.lead@example.de');
  console.log(`  ✔ Enquiry successfully stored and verified in SQLite enquiries table (ID: ${confirmedEnqId}).`);

  // Clean up audit enquiry
  await fetch(`${BASE_URL}/api/enquiries/${confirmedEnqId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('  ✔ Enquiry cleanup completed.');

  // Probe 5: Job Application submission and persistence check
  console.log('\n[Probe 5] Job Application Real Database Persistence:');
  const appPayload = {
    full_name: 'Auditor Applicant Test',
    email: 'auditor.applicant@example.com',
    phone: '+49 171 2233445',
    role: 'German Language Trainer',
    resume_link: 'https://example.com/cv.pdf',
    notes: 'Testing real SQLite persistence and lifecycle.'
  };

  const appPostRes = await fetch(`${BASE_URL}/api/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appPayload)
  });
  assert.equal(appPostRes.status, 201, 'Application submission must yield 201');
  const appPostData = await appPostRes.json();
  assert.equal(appPostData.success, true);
  const createdAppId = appPostData.application_id;

  // Verify in SQLite directly
  const appDbRows = await dbAll('SELECT * FROM applications WHERE id = ?', [createdAppId]);
  assert.equal(appDbRows.length, 1, 'Application must exist in SQLite database');
  assert.equal(appDbRows[0].full_name, 'Auditor Applicant Test');
  assert.equal(appDbRows[0].status, 'New');
  console.log(`  ✔ Job Application successfully stored in SQLite table (ID: ${createdAppId}).`);

  // Test status mutation
  const patchRes = await fetch(`${BASE_URL}/api/applications/${createdAppId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'Interviewed' })
  });
  assert.equal(patchRes.status, 200);

  const updatedRows = await dbAll('SELECT status FROM applications WHERE id = ?', [createdAppId]);
  assert.equal(updatedRows[0].status, 'Interviewed');
  console.log('  ✔ Application status updated and verified in SQLite.');

  // Clean up audit application
  const deleteRes = await fetch(`${BASE_URL}/api/applications/${createdAppId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.equal(deleteRes.status, 200);
  console.log('  ✔ Job Application cleanup completed.');

  // Probe 6: Protected route rejection without token
  console.log('\n[Probe 6] Protected Route Rejection:');
  const unauthApps = await fetch(`${BASE_URL}/api/applications`);
  assert.equal(unauthApps.status, 401, 'Unauthenticated GET /api/applications must return 401');
  const unauthEnq = await fetch(`${BASE_URL}/api/enquiries`);
  assert.equal(unauthEnq.status, 401, 'Unauthenticated GET /api/enquiries must return 401');
  console.log('  ✔ Protected endpoints reliably reject unauthenticated calls with 401.');

  sqliteDb.close();
  console.log('\n=======================================================');
  console.log('ALL INDEPENDENT FORENSIC AUDIT PROBES PASSED (100%)');
  console.log('=======================================================');
}

main().catch(err => {
  console.error('Probe failed:', err);
  process.exit(1);
});
