/**
 * Tier 2 - Boundary & Corner Cases: Customer Enquiries
 * Tests edge cases: whitespace contact fields, invalid emails, 404 on missing IDs, special characters.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { client } from '../helpers/test-client.mjs';

describe('Tier 2: Enquiries Boundary & Corner Cases', () => {
  let adminToken;

  before(async () => {
    const auth = await client.loginAdmin();
    adminToken = auth.token;
  });

  it('ENQ-BND-1: Whitespace-only contact fields return 400 Bad Request', async () => {
    const res = await client.post('/api/enquiries', {
      fullName: '    ',
      email: 'valid@example.com',
      mobile: '+91 1234567890',
    });
    assert.equal(res.status, 400, 'Whitespace fullName must be rejected');
  });

  it('ENQ-BND-2: Malformed email syntax is rejected with 400 Bad Request', async () => {
    const badEmails = ['notanemail', 'test@', '@domain.com', 'user@domain..com'];
    for (const email of badEmails) {
      const res = await client.post('/api/enquiries', {
        fullName: 'Test Lead',
        email,
        mobile: '+91 9999999999',
      });
      assert.equal(res.status, 400, `Expected 400 for bad email: "${email}"`);
    }
  });

  it('ENQ-BND-3: PATCH /api/enquiries/:id/status on non-existent enquiry returns 404', async () => {
    assert.ok(adminToken, 'Admin token required');
    const res = await client.patch('/api/enquiries/NON_EXISTENT_ENQUIRY_999/status', {
      status: 'In Progress',
    }, { token: adminToken });

    assert.equal(res.status, 404, 'Expected 404 for non-existent enquiry');
  });

  it('ENQ-BND-4: DELETE /api/enquiries/:id on non-existent enquiry returns 404', async () => {
    assert.ok(adminToken, 'Admin token required');
    const res = await client.del('/api/enquiries/NON_EXISTENT_ENQUIRY_999', { token: adminToken });

    assert.equal(res.status, 404, 'Expected 404 for deleting non-existent enquiry');
  });

  it('ENQ-BND-5: Complex nested special characters in services and additional requirements do not crash server', async () => {
    const res = await client.post('/api/enquiries', {
      fullName: 'Dr. Müller & Söhne',
      email: 'mueller.soehne@example.de',
      mobile: '+49 170 1234567',
      mainServices: ['APS Certificate Assistance', 'Opportunity Card (Chancenkarte) <>&"\''],
      additionalReqs: 'Needs expedited document apostille. €500 budget allocated.',
    });

    assert.equal(res.status, 201, 'Expected 201 Created for unicode and special character enquiry');
    assert.ok(res.body?.id);
  });

  it('ENQ-BND-6: Empty array or null values in optional fields are handled safely', async () => {
    const res = await client.post('/api/enquiries', {
      fullName: 'Minimal Lead',
      email: 'minimal@example.com',
      mobile: '+91 9888877777',
      mainServices: [],
      additionalServices: [],
      additionalReqs: '',
    });

    assert.equal(res.status, 201, 'Expected 201 Created for minimal valid payload');
    assert.ok(res.body?.id);
  });
});
