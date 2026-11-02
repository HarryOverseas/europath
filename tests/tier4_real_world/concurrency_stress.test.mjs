/**
 * Tier 4 - Real-World Application Scenario: High-Concurrency & Burst Submissions
 * Verifies system stability, lack of race conditions, and non-colliding IDs
 * during simultaneous application bursts.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { client } from '../helpers/test-client.mjs';

describe('Tier 4: Concurrency Stress & Race Condition Testing', () => {
  it('SCENARIO-2: Burst submission of 10 concurrent applications without ID collision or data loss', async () => {
    const runId = Date.now();
    const batchSize = 10;
    const submissionPromises = [];

    for (let i = 1; i <= batchSize; i++) {
      const payload = {
        full_name: `Concurrent Applicant ${i}`,
        email: `concurrent.${i}.${runId}@example.de`,
        phone: `+49 150 ${String(i).padStart(7, '0')}`,
        role: i % 2 === 0 ? 'German Language Trainer' : 'Visa Consultant',
        notes: `Simultaneous batch applicant index ${i}`,
      };
      submissionPromises.push(client.post('/api/applications', payload));
    }

    // Execute concurrently
    const responses = await Promise.all(submissionPromises);

    // 1. Verify all responded with 201 Created
    for (let i = 0; i < responses.length; i++) {
      const res = responses[i];
      assert.equal(res.status, 201, `Submission ${i + 1} must return 201 Created`);
      assert.equal(res.body?.success, true);
      assert.ok(res.body?.application_id, `Submission ${i + 1} must return application_id`);
    }

    // 2. Verify all returned application IDs are strictly unique
    const appIds = responses.map(r => r.body.application_id);
    const uniqueIds = new Set(appIds);
    assert.equal(uniqueIds.size, batchSize, 'All returned application IDs must be unique (no collisions)');

    // 3. Admin logs in and verifies all 10 candidates exist
    const auth = await client.loginAdmin();
    const listRes = await client.get('/api/applications', { token: auth.token });
    assert.equal(listRes.status, 200);
    const serverApps = listRes.body?.applications || [];

    for (const id of appIds) {
      const found = serverApps.find(a => a.id === id);
      assert.ok(found, `Concurrent candidate ID ${id} must persist in database`);
    }

    // 4. Concurrent status updates: all 10 candidates updated in parallel
    const updatePromises = appIds.map(id =>
      client.patch(`/api/applications/${id}/status`, { status: 'Reviewing' }, { token: auth.token })
    );
    const updateResponses = await Promise.all(updatePromises);
    for (const uRes of updateResponses) {
      assert.equal(uRes.status, 200, 'Concurrent status update must succeed');
    }

    // Clean up
    for (const id of appIds) {
      await client.del(`/api/applications/${id}`, { token: auth.token });
    }
  });
});
