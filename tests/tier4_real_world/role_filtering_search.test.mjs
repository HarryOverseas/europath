/**
 * Tier 4 - Real-World Application Scenario: Role Filtering & Multi-Criteria Search
 * Verifies department filtering and candidate search functionality
 * as used by the Admin Dashboard.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { client } from '../helpers/test-client.mjs';

describe('Tier 4: Role-Based Filtering & Precision Search', () => {
  it('SCENARIO-4: Multi-criteria filtering by role, status, and free-text search query', async () => {
    const runId = Date.now();
    const auth = await client.loginAdmin();
    assert.ok(auth.token);

    // Seed 4 distinct candidates
    const seeds = [
      {
        full_name: `Alice Wonder ${runId}`,
        email: `alice.${runId}@example.de`,
        phone: '+49 111 0001',
        role: 'German Language Trainer',
        notes: 'Specializes in medical German terminology for doctors.',
      },
      {
        full_name: `Bob Builder ${runId}`,
        email: `bob.${runId}@example.de`,
        phone: '+49 111 0002',
        role: 'Visa Consultant',
        notes: 'Focus on EU Blue Card salary threshold criteria.',
      },
      {
        full_name: `Carol Counselor ${runId}`,
        email: `carol.${runId}@example.de`,
        phone: '+49 111 0003',
        role: 'Student Counselor',
        notes: 'Expert in APS India and DAAD scholarship applications.',
      },
      {
        full_name: `Daniel Relocator ${runId}`,
        email: `daniel.${runId}@example.de`,
        phone: '+49 111 0004',
        role: 'European Relocation Coordinator',
        notes: 'Assistance with public health insurance enrollment and banking.',
      },
    ];

    const createdIds = [];
    for (const s of seeds) {
      const res = await client.post('/api/applications', s);
      assert.equal(res.status, 201);
      createdIds.push(res.body.application_id);
    }

    // Update Alice to 'Shortlisted' and Bob to 'Hired'
    await client.patch(`/api/applications/${createdIds[0]}/status`, { status: 'Shortlisted' }, { token: auth.token });
    await client.patch(`/api/applications/${createdIds[1]}/status`, { status: 'Hired' }, { token: auth.token });

    // 1. Filter by role: 'German Language Trainer'
    const roleRes = await client.get('/api/applications', {
      token: auth.token,
      query: { role: 'German Language Trainer' },
    });
    assert.equal(roleRes.status, 200);
    const trainerApps = roleRes.body?.applications || [];
    assert.ok(trainerApps.some(a => a.id === createdIds[0]));
    assert.ok(!trainerApps.some(a => a.id === createdIds[1]), 'Bob must not appear in trainer filter');

    // 2. Filter by status: 'Hired'
    const statusRes = await client.get('/api/applications', {
      token: auth.token,
      query: { status: 'Hired' },
    });
    assert.equal(statusRes.status, 200);
    const hiredApps = statusRes.body?.applications || [];
    assert.ok(hiredApps.some(a => a.id === createdIds[1]), 'Bob must be in Hired filter');
    assert.ok(!hiredApps.some(a => a.id === createdIds[0]), 'Alice must not be in Hired filter');

    // 3. Free-text search by keyword: 'DAAD'
    const searchRes = await client.get('/api/applications', {
      token: auth.token,
      query: { search: 'DAAD' },
    });
    assert.equal(searchRes.status, 200);
    const searchApps = searchRes.body?.applications || [];
    assert.ok(searchApps.some(a => a.id === createdIds[2]), 'Carol must match search query "DAAD"');
    assert.ok(!searchApps.some(a => a.id === createdIds[0]), 'Alice must not match search query "DAAD"');

    // Clean up
    for (const id of createdIds) {
      await client.del(`/api/applications/${id}`, { token: auth.token });
    }
  });
});
