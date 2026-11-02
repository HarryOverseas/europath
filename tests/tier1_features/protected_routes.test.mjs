/**
 * Tier 1 - Feature Coverage: Protected Route Middleware (F4)
 * Authoritative Contract: PROJECT.md § 1. Admin Authentication Contract & § 2. Job Applications Contract
 * Acceptance Criteria: ORIGINAL_REQUEST.md § Authentication & Security (Protected admin routes and API endpoints reject unauthenticated requests)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { client } from '../helpers/test-client.mjs';

describe('Tier 1: Protected Route Middleware Security (F4)', () => {
  it('F4-SEC-1: GET /api/applications rejects request when Authorization header is missing (401)', async () => {
    const res = await client.get('/api/applications');
    assert.equal(res.status, 401, 'Must reject unauthenticated GET /api/applications with 401');
    assert.ok(res.body?.error || res.body?.success === false, 'Expected error response');
  });

  it('F4-SEC-2: GET /api/applications rejects request with empty Bearer token (401)', async () => {
    const res = await client.get('/api/applications', {
      headers: { 'Authorization': 'Bearer ' }
    });
    assert.equal(res.status, 401, 'Must reject empty Bearer token with 401');
  });

  it('F4-SEC-3: GET /api/applications rejects invalid / malformed JWT string (401 or 403)', async () => {
    const res = await client.get('/api/applications', {
      headers: { 'Authorization': 'Bearer not.a.valid.jwt.payload' }
    });
    assert.ok(res.status === 401 || res.status === 403, `Expected 401 or 403 but got ${res.status}`);
  });

  it('F4-SEC-4: PATCH /api/applications/1/status rejects unauthenticated mutation (401)', async () => {
    const res = await client.patch('/api/applications/1/status', { status: 'Shortlisted' });
    assert.equal(res.status, 401, 'Must reject unauthenticated PATCH /api/applications/:id/status with 401');
  });

  it('F4-SEC-5: DELETE /api/applications/1 rejects unauthenticated deletion (401)', async () => {
    const res = await client.del('/api/applications/1');
    assert.equal(res.status, 401, 'Must reject unauthenticated DELETE /api/applications/:id with 401');
  });

  it('F4-SEC-6: GET /api/enquiries rejects unauthenticated access (401)', async () => {
    const res = await client.get('/api/enquiries');
    assert.equal(res.status, 401, 'Must reject unauthenticated GET /api/enquiries with 401');
  });

  it('F4-SEC-7: GET /api/auth/verify rejects forged token signed with wrong secret (401 or 403)', async () => {
    // Forged token
    const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTk5LCJ1c2VybmFtZSI6ImhhY2tlciIsInJvbGUiOiJTdXBlciBBZG1pbiIsImlhdCI6MTcwMDAwMDAwMH0.fake_signature_hash_value_here';
    const res = await client.get('/api/auth/verify', { token: forgedToken });
    assert.ok(res.status === 401 || res.status === 403, `Expected 401 or 403 for forged signature, got ${res.status}`);
  });
});
