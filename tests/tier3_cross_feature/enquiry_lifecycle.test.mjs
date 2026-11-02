/**
 * Tier 3 - Cross-Feature Combinations: Customer Enquiry Lifecycle
 * Tests pairwise interaction across Public Enquiry Submission -> Admin Auth -> Enquiry Listing -> Status Mutation -> Deletion.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { client } from '../helpers/test-client.mjs';

describe('Tier 3: Customer Enquiry Lifecycle Workflow', () => {
  it('CROSS-ENQ-1: Public enquiry submit -> Admin auth -> inspect -> update status -> delete', async () => {
    // 1. Submit customer enquiry
    const uniqueEmail = `enquiry.lead.${Date.now()}@example.com`;
    const leadData = {
      fullName: 'Vikram Mehta',
      email: uniqueEmail,
      mobile: '+91 9820012345',
      whatsapp: '+91 9820012345',
      city: 'Mumbai',
      country: 'India',
      mainServices: ['Opportunity Card (Chancenkarte)', 'German Language Course'],
      intendedDestination: 'Germany',
      travelPeriod: 'Within 6 months',
      consultationMethod: 'Google Meet',
      additionalReqs: 'Bachelor of Engineering in Computer Science with 4 years experience.',
    };

    const submitRes = await client.post('/api/enquiries', leadData);
    assert.equal(submitRes.status, 201, 'Enquiry submission must succeed with 201');
    const enqId = submitRes.body?.id;
    assert.ok(enqId, 'Enquiry ID must be returned');

    // 2. Admin logs in
    const auth = await client.loginAdmin();
    assert.ok(auth.token, 'Admin login must succeed');

    // 3. Admin fetches enquiry list and locates lead
    const listRes = await client.get('/api/enquiries', { token: auth.token });
    assert.equal(listRes.status, 200);
    const list = Array.isArray(listRes.body) ? listRes.body : listRes.body?.enquiries;
    const lead = list?.find(e => e.id === enqId || e.email === uniqueEmail);
    assert.ok(lead, 'Submitted enquiry must be present in admin listing');
    assert.equal(lead.full_name || lead.fullName, leadData.fullName);

    // 4. Admin updates status to "In Progress"
    const updateRes = await client.patch(`/api/enquiries/${enqId}/status`, {
      status: 'In Progress',
    }, { token: auth.token });
    assert.equal(updateRes.status, 200, 'Status update must succeed');

    // 5. Verify status updated
    const verifyList = await client.get('/api/enquiries', { token: auth.token });
    const verifyArray = Array.isArray(verifyList.body) ? verifyList.body : verifyList.body?.enquiries;
    const updatedLead = verifyArray?.find(e => e.id === enqId);
    assert.equal(updatedLead?.status, 'In Progress');

    // 6. Admin deletes enquiry
    const deleteRes = await client.del(`/api/enquiries/${enqId}`, { token: auth.token });
    assert.equal(deleteRes.status, 200, 'Deletion must succeed');

    // 7. Verify deletion
    const finalList = await client.get('/api/enquiries', { token: auth.token });
    const finalArray = Array.isArray(finalList.body) ? finalList.body : finalList.body?.enquiries;
    const deletedLead = finalArray?.find(e => e.id === enqId);
    assert.equal(deletedLead, undefined, 'Deleted enquiry must no longer exist');
  });
});
