/**
 * Tier 3 - Cross-Feature Combinations: Candidate Hiring Lifecycle
 * Tests pairwise interaction across Candidate Submission -> Admin Auth -> Applications Management -> Status Mutation -> Deletion Cleanup.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { client } from '../helpers/test-client.mjs';

describe('Tier 3: End-to-End Candidate Hiring Lifecycle', () => {
  it('CROSS-HIRING-1: Candidate applies -> Admin logs in -> inspects -> updates status -> deletes candidate', async () => {
    // 1. Candidate submits application
    const uniqueEmail = `lifecycle.candidate.${Date.now()}@example.de`;
    const candidateData = {
      full_name: 'Helena Wolf',
      email: uniqueEmail,
      phone: '+49 160 9988776',
      role: 'German Language Trainer',
      resume_link: 'https://linkedin.com/in/helenawolf',
      notes: 'TestDaF & Goethe C2 certified trainer with 7 years teaching experience.',
    };

    const submitRes = await client.post('/api/applications', candidateData);
    assert.equal(submitRes.status, 201, 'Application submission must succeed with 201');
    const appId = submitRes.body?.application_id;
    assert.ok(appId, 'Application ID must be returned');

    // 2. Admin logs in with authentic credentials
    const auth = await client.loginAdmin();
    assert.ok(auth.token, 'Admin login must succeed');

    // 3. Admin verifies session
    const verifyRes = await client.get('/api/auth/verify', { token: auth.token });
    assert.equal(verifyRes.status, 200, 'Session token must verify cleanly');

    // 4. Admin lists applications and confirms candidate is present with status 'New'
    const listRes = await client.get('/api/applications', { token: auth.token });
    assert.equal(listRes.status, 200);
    const candidate = listRes.body?.applications?.find(a => a.id === appId || a.email === uniqueEmail);
    assert.ok(candidate, 'Candidate must appear in admin applications list');
    assert.equal(candidate.status, 'New', 'Initial candidate status must be "New"');
    assert.equal(candidate.full_name, candidateData.full_name);
    assert.equal(candidate.role, candidateData.role);

    // 5. Admin filters by role
    const filterRes = await client.get('/api/applications', {
      token: auth.token,
      query: { role: 'German Language Trainer' },
    });
    assert.equal(filterRes.status, 200);
    const filteredCandidate = filterRes.body?.applications?.find(a => a.id === appId);
    assert.ok(filteredCandidate, 'Candidate must appear in role-filtered list');

    // 6. Admin advances status: 'Reviewing' -> 'Shortlisted' -> 'Interviewed' -> 'Hired'
    const statusSequence = ['Reviewing', 'Shortlisted', 'Interviewed', 'Hired'];
    for (const targetStatus of statusSequence) {
      const updateRes = await client.patch(`/api/applications/${appId}/status`, {
        status: targetStatus,
      }, { token: auth.token });
      assert.equal(updateRes.status, 200, `Must successfully update status to ${targetStatus}`);

      // Verify persistence
      const verifyList = await client.get('/api/applications', { token: auth.token });
      const updated = verifyList.body?.applications?.find(a => a.id === appId);
      assert.equal(updated.status, targetStatus, `Persisted status must match ${targetStatus}`);
    }

    // 7. Admin deletes application
    const deleteRes = await client.del(`/api/applications/${appId}`, { token: auth.token });
    assert.equal(deleteRes.status, 200, 'Application deletion must return 200');

    // 8. Verify candidate is no longer in list
    const finalList = await client.get('/api/applications', { token: auth.token });
    const deletedCandidate = finalList.body?.applications?.find(a => a.id === appId);
    assert.equal(deletedCandidate, undefined, 'Deleted candidate must no longer appear in applications list');

    // 9. Subsequent deletion or status update on deleted ID returns 404
    const repeatDel = await client.del(`/api/applications/${appId}`, { token: auth.token });
    assert.equal(repeatDel.status, 404, 'Deleting already deleted application must return 404');
  });

  it('CROSS-HIRING-2: Status rejection lifecycle: candidate marked as Rejected', async () => {
    // 1. Submit application
    const submitRes = await client.post('/api/applications', {
      full_name: 'Unqualified Applicant',
      email: `reject.test.${Date.now()}@example.de`,
      phone: '+49 111 222333',
      role: 'Visa Consultant',
      notes: 'No relevant immigration experience.',
    });
    assert.equal(submitRes.status, 201);
    const appId = submitRes.body?.application_id;

    // 2. Admin logs in
    const auth = await client.loginAdmin();

    // 3. Admin transitions to Rejected
    const rejectRes = await client.patch(`/api/applications/${appId}/status`, {
      status: 'Rejected',
    }, { token: auth.token });
    assert.equal(rejectRes.status, 200);

    // 4. Verify candidate status is Rejected
    const listRes = await client.get('/api/applications', { token: auth.token });
    const candidate = listRes.body?.applications?.find(a => a.id === appId);
    assert.equal(candidate.status, 'Rejected');

    // Clean up
    await client.del(`/api/applications/${appId}`, { token: auth.token });
  });
});
