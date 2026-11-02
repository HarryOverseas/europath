/**
 * Tier 2 - Boundary & Corner Cases: Job Applications
 * Tests edge cases: whitespace-only, malformed emails, 404 on non-existent IDs,
 * invalid status enum values, XSS payloads, extreme payload lengths.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { client } from '../helpers/test-client.mjs';

describe('Tier 2: Applications Boundary & Corner Cases', () => {
  let adminToken;

  before(async () => {
    const auth = await client.loginAdmin();
    adminToken = auth.token;
  });

  it('APP-BND-1: Whitespace-only required fields are rejected with 400 Bad Request', async () => {
    const res = await client.post('/api/applications', {
      full_name: '   ',
      email: 'valid@example.de',
      phone: '+49 111111',
      role: 'German Language Trainer',
    });
    assert.equal(res.status, 400, 'Whitespace full_name must be rejected');
    assert.equal(res.body?.success, false);
  });

  it('APP-BND-2: Malformed email syntax is rejected with 400 Bad Request', async () => {
    const malformedEmails = ['plainaddress', '@missinguser.com', 'user@domain', 'user @domain.com'];
    for (const email of malformedEmails) {
      const res = await client.post('/api/applications', {
        full_name: 'Test Candidate',
        email,
        phone: '+49 12345678',
        role: 'Visa Consultant',
      });
      assert.equal(res.status, 400, `Expected 400 for malformed email: "${email}"`);
      assert.equal(res.body?.success, false);
    }
  });

  it('APP-BND-3: PATCH /api/applications/:id/status on non-existent ID returns 404 Not Found', async () => {
    assert.ok(adminToken, 'Admin token required');
    const res = await client.patch('/api/applications/99999999/status', {
      status: 'Shortlisted',
    }, { token: adminToken });

    assert.equal(res.status, 404, 'Must return 404 for non-existent application ID');
    assert.equal(res.body?.success, false);
  });

  it('APP-BND-4: DELETE /api/applications/:id on non-existent ID returns 404 Not Found', async () => {
    assert.ok(adminToken, 'Admin token required');
    const res = await client.del('/api/applications/99999999', { token: adminToken });

    assert.equal(res.status, 404, 'Must return 404 for non-existent application ID on deletion');
    assert.equal(res.body?.success, false);
  });

  it('APP-BND-5: PATCH /api/applications/:id/status rejects invalid status enum with 400 Bad Request', async () => {
    assert.ok(adminToken, 'Admin token required');
    // First create a candidate
    const createRes = await client.post('/api/applications', {
      full_name: 'Status Test Candidate',
      email: 'status.test@example.de',
      phone: '+49 555555',
      role: 'Student Counselor',
    });
    const appId = createRes.body?.application_id;
    assert.ok(appId);

    const invalidStatuses = ['MegaHired', 'UnknownStatus', '', 12345, null];
    for (const badStatus of invalidStatuses) {
      const res = await client.patch(`/api/applications/${appId}/status`, {
        status: badStatus,
      }, { token: adminToken });
      assert.equal(res.status, 400, `Expected 400 for invalid status: "${badStatus}"`);
      assert.equal(res.body?.success, false);
    }
  });

  it('APP-BND-6: Malformed / non-numeric ID parameter returns 400 or 404 without crashing', async () => {
    assert.ok(adminToken, 'Admin token required');
    const res = await client.patch('/api/applications/invalid-string-id/status', {
      status: 'Shortlisted',
    }, { token: adminToken });

    assert.ok(res.status === 400 || res.status === 404, `Expected 400 or 404 for string ID, got ${res.status}`);
    assert.notEqual(res.status, 500, 'Must not throw 500 Internal Server Error');
  });

  it('APP-BND-7: XSS payloads in candidate notes and name do not crash server', async () => {
    const xssPayload = '<script>alert("XSS")</script><img src="x" onerror="alert(1)">';
    const res = await client.post('/api/applications', {
      full_name: `Candidate ${xssPayload}`,
      email: 'xss.candidate@example.de',
      phone: '+49 333333',
      role: 'European Relocation Coordinator',
      notes: xssPayload,
    });

    assert.equal(res.status, 201, 'Expected 201 Created while safely sanitizing/storing XSS payload');
    assert.ok(res.body?.application_id);
  });

  it('APP-BND-8: Extreme size text in notes (10,000 characters) is handled gracefully', async () => {
    const massiveNotes = 'Extensive teaching credentials: '.padEnd(10000, 'DaF-Goethe-');
    const res = await client.post('/api/applications', {
      full_name: 'Maximalist Candidate',
      email: 'max.candidate@example.de',
      phone: '+49 777777',
      role: 'German Language Trainer',
      notes: massiveNotes,
    });

    assert.equal(res.status, 201, 'Expected 201 Created for large notes payload');
    assert.ok(res.body?.application_id);
  });
});
