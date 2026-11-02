/**
 * Tier 4 - Real-World Application Scenario: Multi-Role Recruitment Campaign
 * Models the end-to-end recruitment drive across EuroPath's 4 core advertised roles:
 * - German Language Trainer
 * - Visa Consultant
 * - Student Counselor
 * - European Relocation Coordinator
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { client } from '../helpers/test-client.mjs';

describe('Tier 4: Multi-Role Recruitment Campaign Scenario', () => {
  it('SCENARIO-1: Multi-candidate recruitment campaign across all 4 advertised roles', async () => {
    const runId = Date.now();
    const candidates = [
      {
        full_name: 'Anja Becker',
        email: `anja.trainer.${runId}@example.de`,
        phone: '+49 171 1111111',
        role: 'German Language Trainer',
        resume_link: 'https://linkedin.com/in/anjabecker',
        notes: 'Telc & Goethe C2 certified. 6 years experience preparing nurses for German healthcare.',
      },
      {
        full_name: 'Devraj Sengupta',
        email: `devraj.visa.${runId}@example.com`,
        phone: '+91 9830022222',
        role: 'Visa Consultant',
        resume_link: 'https://linkedin.com/in/devrajsengupta',
        notes: 'Specialist in German Blue Card, Opportunity Card (Chancenkarte), and family reunion visas.',
      },
      {
        full_name: 'Fatima Al-Mansoor',
        email: `fatima.counselor.${runId}@example.ae`,
        phone: '+971 50 3333333',
        role: 'Student Counselor',
        resume_link: 'https://linkedin.com/in/fatimamansoor',
        notes: 'APS India verification guidance expert with 300+ successful TU9 university placements.',
      },
      {
        full_name: 'Markus Lindner',
        email: `markus.relocation.${runId}@example.at`,
        phone: '+43 664 4444444',
        role: 'European Relocation Coordinator',
        resume_link: 'https://linkedin.com/in/markuslindner',
        notes: 'Assisting expatriates in Berlin and Munich with city registration (Anmeldung), TK insurance, and banking.',
      },
    ];

    // 1. Submit applications for all 4 roles
    const createdAppIds = [];
    for (const c of candidates) {
      const res = await client.post('/api/applications', c);
      assert.equal(res.status, 201, `Submission for ${c.role} must succeed with 201`);
      assert.ok(res.body?.application_id, 'Must return application_id');
      createdAppIds.push({ id: res.body.application_id, role: c.role, email: c.email });
    }

    assert.equal(createdAppIds.length, 4, 'All 4 candidates must be registered');

    // 2. Admin logs in
    const auth = await client.loginAdmin();
    assert.ok(auth.token, 'Admin login must succeed');

    // 3. Admin lists all applications and verifies presence of all 4 candidates
    const allAppsRes = await client.get('/api/applications', { token: auth.token });
    assert.equal(allAppsRes.status, 200);
    const allApps = allAppsRes.body?.applications || [];

    for (const { id } of createdAppIds) {
      const found = allApps.find(a => a.id === id);
      assert.ok(found, `Application ID ${id} must be in admin applications list`);
      assert.equal(found.status, 'New', 'Initial status must be New');
    }

    // 4. Admin filters by 'German Language Trainer'
    const trainerRes = await client.get('/api/applications', {
      token: auth.token,
      query: { role: 'German Language Trainer' },
    });
    assert.equal(trainerRes.status, 200);
    const trainerApps = trainerRes.body?.applications || [];
    assert.ok(trainerApps.some(a => a.email.includes(`anja.trainer.${runId}`)));

    // 5. Admin updates candidates according to recruitment decisions:
    // - Shortlist Trainer
    // - Shortlist Visa Consultant
    // - Interview Counselor
    // - Hire Relocation Coordinator
    const decisions = [
      { role: 'German Language Trainer', newStatus: 'Shortlisted' },
      { role: 'Visa Consultant', newStatus: 'Shortlisted' },
      { role: 'Student Counselor', newStatus: 'Interviewed' },
      { role: 'European Relocation Coordinator', newStatus: 'Hired' },
    ];

    for (const d of decisions) {
      const target = createdAppIds.find(c => c.role === d.role);
      const updateRes = await client.patch(`/api/applications/${target.id}/status`, {
        status: d.newStatus,
      }, { token: auth.token });
      assert.equal(updateRes.status, 200, `Must update status of ${d.role} to ${d.newStatus}`);
    }

    // 6. Verify persisted statuses in admin view
    const recheckRes = await client.get('/api/applications', { token: auth.token });
    const recheckApps = recheckRes.body?.applications || [];

    for (const d of decisions) {
      const target = createdAppIds.find(c => c.role === d.role);
      const appRecord = recheckApps.find(a => a.id === target.id);
      assert.equal(appRecord.status, d.newStatus, `Status for ${d.role} must be ${d.newStatus}`);
    }

    // Clean up test data
    for (const { id } of createdAppIds) {
      await client.del(`/api/applications/${id}`, { token: auth.token });
    }
  });
});
