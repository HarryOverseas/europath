/**
 * Tier 1 - Feature Coverage: Job Applications REST APIs (F6, F7)
 * Authoritative Contract: PROJECT.md § 2. Job Applications Contract
 * Acceptance Criteria: ORIGINAL_REQUEST.md § Job Applications Storage and Admin Management
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { client } from '../helpers/test-client.mjs';

describe('Tier 1: Job Applications REST APIs (F6, F7)', () => {
  let adminToken;

  before(async () => {
    const auth = await client.loginAdmin();
    adminToken = auth.token;
  });

  it('F7-T1: POST /api/applications creates a new application with 201 Created and returns application_id', async () => {
    const candidatePayload = {
      full_name: 'Maria Schmidt',
      email: 'maria.schmidt@example.de',
      phone: '+49 151 23456789',
      role: 'German Language Trainer',
      resume_link: 'https://linkedin.com/in/mariaschmidt',
      notes: '5 years DaF teaching experience (B1-C1). Certified Goethe examiner.',
    };

    const res = await client.post('/api/applications', candidatePayload);

    assert.equal(res.status, 201, 'Expected 201 Created for valid job application submission');
    assert.equal(res.body?.success, true, 'Expected success: true');
    assert.ok(res.body?.application_id, 'Expected returned application_id');
  });

  it('F7-T2: POST /api/applications rejects submission missing full_name with 400 Bad Request', async () => {
    const res = await client.post('/api/applications', {
      email: 'anna@example.com',
      phone: '+49 123456',
      role: 'Visa Consultant',
    });

    assert.equal(res.status, 400, 'Expected 400 Bad Request when full_name is omitted');
    assert.equal(res.body?.success, false);
    assert.ok(res.body?.error);
  });

  it('F7-T3: POST /api/applications rejects submission missing email with 400 Bad Request', async () => {
    const res = await client.post('/api/applications', {
      full_name: 'Lukas Weber',
      phone: '+49 123456',
      role: 'Visa Consultant',
    });

    assert.equal(res.status, 400, 'Expected 400 Bad Request when email is omitted');
    assert.equal(res.body?.success, false);
    assert.ok(res.body?.error);
  });

  it('F7-T4: POST /api/applications rejects submission missing role with 400 Bad Request', async () => {
    const res = await client.post('/api/applications', {
      full_name: 'Lukas Weber',
      email: 'lukas@example.de',
      phone: '+49 123456',
    });

    assert.equal(res.status, 400, 'Expected 400 Bad Request when role is omitted');
    assert.equal(res.body?.success, false);
    assert.ok(res.body?.error);
  });

  it('F7-T5: GET /api/applications with admin token returns 200 OK and applications list', async () => {
    assert.ok(adminToken, 'Admin token required');
    const res = await client.get('/api/applications', { token: adminToken });

    assert.equal(res.status, 200, 'Expected 200 OK for authenticated GET /api/applications');
    assert.equal(res.body?.success, true);
    assert.ok(Array.isArray(res.body?.applications), 'Expected applications array in response');
  });

  it('F7-T6: PATCH /api/applications/:id/status updates status with 200 OK', async () => {
    assert.ok(adminToken, 'Admin token required');
    // First create an application to update
    const createRes = await client.post('/api/applications', {
      full_name: 'Stefan Meyer',
      email: 'stefan.meyer@example.de',
      phone: '+49 987654321',
      role: 'Student Counselor',
      notes: 'Experienced counselor',
    });
    const appId = createRes.body?.application_id;
    assert.ok(appId, 'Application must be created first');

    const updateRes = await client.patch(`/api/applications/${appId}/status`, {
      status: 'Shortlisted',
    }, { token: adminToken });

    assert.equal(updateRes.status, 200, 'Expected 200 OK for valid status update');
    assert.equal(updateRes.body?.success, true);
    assert.ok(updateRes.body?.message);
  });

  it('F7-T7: DELETE /api/applications/:id removes application with 200 OK', async () => {
    assert.ok(adminToken, 'Admin token required');
    // First create an application to delete
    const createRes = await client.post('/api/applications', {
      full_name: 'Test Deletion Candidate',
      email: 'delete.me@example.de',
      phone: '+49 000000000',
      role: 'European Relocation Coordinator',
    });
    const appId = createRes.body?.application_id;
    assert.ok(appId, 'Application must be created first');

    const delRes = await client.del(`/api/applications/${appId}`, { token: adminToken });
    assert.equal(delRes.status, 200, 'Expected 200 OK for application deletion');
    assert.equal(delRes.body?.success, true);
  });
});
