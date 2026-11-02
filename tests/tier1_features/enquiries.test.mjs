/**
 * Tier 1 - Feature Coverage: Customer Enquiries REST APIs
 * Authoritative Contract: PROJECT.md § Architecture (REST API Endpoints)
 * Acceptance Criteria: ORIGINAL_REQUEST.md § Job Applications Storage and Admin Management
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { client } from '../helpers/test-client.mjs';

describe('Tier 1: Customer Enquiries REST APIs', () => {
  let adminToken;

  before(async () => {
    const auth = await client.loginAdmin();
    adminToken = auth.token;
  });

  it('ENQ-T1: POST /api/enquiries creates a new enquiry with 201 Created', async () => {
    const leadPayload = {
      fullName: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      mobile: '+91 9876543210',
      whatsapp: '+91 9876543210',
      city: 'Hyderabad',
      country: 'India',
      mainServices: ['Language Training', 'Visa Assistance'],
      intendedDestination: 'Germany',
      travelPeriod: 'Within 3 months',
      consultationMethod: 'WhatsApp',
      additionalReqs: 'Interested in German B1 intensive batch',
    };

    const res = await client.post('/api/enquiries', leadPayload);
    assert.equal(res.status, 201, 'Expected 201 Created for valid enquiry submission');
    assert.ok(res.body?.id, 'Expected returned enquiry id');
  });

  it('ENQ-T2: POST /api/enquiries rejects submission with missing contact fields with 400 Bad Request', async () => {
    const res = await client.post('/api/enquiries', {
      fullName: 'Incomplete User',
      // missing email & mobile
    });

    assert.equal(res.status, 400, 'Expected 400 Bad Request when contact info is missing');
  });

  it('ENQ-T3: GET /api/enquiries with admin token returns 200 OK and list of enquiries', async () => {
    assert.ok(adminToken, 'Admin token required');
    const res = await client.get('/api/enquiries', { token: adminToken });

    assert.equal(res.status, 200, 'Expected 200 OK for authenticated GET /api/enquiries');
    const list = Array.isArray(res.body) ? res.body : res.body?.enquiries;
    assert.ok(Array.isArray(list), 'Expected enquiries list array');
  });

  it('ENQ-T4: PATCH /api/enquiries/:id/status updates enquiry status with 200 OK', async () => {
    assert.ok(adminToken, 'Admin token required');
    // Create an enquiry first
    const createRes = await client.post('/api/enquiries', {
      fullName: 'Priya Patel',
      email: 'priya.patel@example.com',
      mobile: '+91 9123456780',
    });
    const enqId = createRes.body?.id;
    assert.ok(enqId, 'Enquiry ID must be returned');

    const updateRes = await client.patch(`/api/enquiries/${enqId}/status`, {
      status: 'In Progress',
    }, { token: adminToken });

    assert.equal(updateRes.status, 200, 'Expected 200 OK for status update');
    assert.ok(updateRes.body);
  });

  it('ENQ-T5: DELETE /api/enquiries/:id removes enquiry with 200 OK', async () => {
    assert.ok(adminToken, 'Admin token required');
    // Create an enquiry first
    const createRes = await client.post('/api/enquiries', {
      fullName: 'Delete Test User',
      email: 'delete.user@example.com',
      mobile: '+91 9000000000',
    });
    const enqId = createRes.body?.id;
    assert.ok(enqId, 'Enquiry ID must be returned');

    const delRes = await client.del(`/api/enquiries/${enqId}`, { token: adminToken });
    assert.equal(delRes.status, 200, 'Expected 200 OK for enquiry deletion');
  });

  it('ENQ-T6: GET /api/enquiries rejects unauthenticated access with 401', async () => {
    const res = await client.get('/api/enquiries');
    assert.equal(res.status, 401, 'Expected 401 when unauthenticated');
  });
});
