/**
 * Tier 4 - Real-World Application Scenario: Dual Public-to-Admin Operations & State Isolation
 * Verifies that Customer Enquiries and Job Applications maintain complete
 * state isolation, independent identifiers, and non-interfering lifecycles.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { client } from '../helpers/test-client.mjs';

describe('Tier 4: Dual-System Operations & Isolation', () => {
  it('SCENARIO-5: Customer inquiries and job applications maintain independent state and lifecycles', async () => {
    const runId = Date.now();
    const auth = await client.loginAdmin();
    assert.ok(auth.token);

    // 1. Submit Customer Enquiry
    const enqRes = await client.post('/api/enquiries', {
      fullName: `Customer Lead ${runId}`,
      email: `customer.${runId}@example.com`,
      mobile: '+91 9900112233',
      mainServices: ['Visa Assistance'],
    });
    assert.equal(enqRes.status, 201);
    const enqId = enqRes.body.id;
    assert.ok(enqId);

    // 2. Submit Job Application
    const appRes = await client.post('/api/applications', {
      full_name: `Candidate ${runId}`,
      email: `candidate.${runId}@example.de`,
      phone: '+49 170 998877',
      role: 'Visa Consultant',
      notes: 'Applying for in-house immigration legal advisor position.',
    });
    assert.equal(appRes.status, 201);
    const appId = appRes.body.application_id;
    assert.ok(appId);

    // 3. Verify separation in Admin Dashboard views
    const enquiriesListRes = await client.get('/api/enquiries', { token: auth.token });
    const enqArray = Array.isArray(enquiriesListRes.body) ? enquiriesListRes.body : enquiriesListRes.body?.enquiries;
    const foundEnq = enqArray.find(e => e.id === enqId);
    assert.ok(foundEnq, 'Enquiry must be in enquiries list');

    const applicationsListRes = await client.get('/api/applications', { token: auth.token });
    const appArray = applicationsListRes.body?.applications || [];
    const foundApp = appArray.find(a => a.id === appId);
    assert.ok(foundApp, 'Application must be in applications list');

    // 4. Mutation Isolation: update application status to 'Shortlisted'
    await client.patch(`/api/applications/${appId}/status`, { status: 'Shortlisted' }, { token: auth.token });

    // Verify enquiry status is unaffected
    const checkEnqRes = await client.get('/api/enquiries', { token: auth.token });
    const checkEnqArray = Array.isArray(checkEnqRes.body) ? checkEnqRes.body : checkEnqRes.body?.enquiries;
    const recheckedEnq = checkEnqArray.find(e => e.id === enqId);
    assert.equal(recheckedEnq.status, 'New', 'Enquiry status must remain unchanged when application is modified');

    // 5. Mutation Isolation: update enquiry status to 'In Progress'
    await client.patch(`/api/enquiries/${enqId}/status`, { status: 'In Progress' }, { token: auth.token });

    // Verify application status is unaffected
    const checkAppRes = await client.get('/api/applications', { token: auth.token });
    const recheckedApp = checkAppRes.body?.applications?.find(a => a.id === appId);
    assert.equal(recheckedApp.status, 'Shortlisted', 'Application status must remain Shortlisted');

    // 6. Deletion Isolation: delete enquiry
    await client.del(`/api/enquiries/${enqId}`, { token: auth.token });

    // Verify application still exists intact
    const afterDelAppRes = await client.get('/api/applications', { token: auth.token });
    const remainingApp = afterDelAppRes.body?.applications?.find(a => a.id === appId);
    assert.ok(remainingApp, 'Application must still exist after enquiry deletion');

    // Clean up application
    await client.del(`/api/applications/${appId}`, { token: auth.token });
  });
});
