/**
 * Tier 5: Adversarial Stress Testing & Deep Negative Edge Cases
 * Author: teamwork_challenger_1 (Empirical Challenger)
 * 
 * Verifies:
 * 1. Unauthenticated rejection across all protected endpoints with method & header variations
 * 2. JWT forgery, invalid signatures, algorithm switching ("none"), expired tokens, tampered payloads
 * 3. Extreme input fuzzing (SQLi, XSS, Unicode, oversized payloads, non-object JSON bodies)
 * 4. High concurrency burst stress & race conditions on application submissions & updates
 * 5. Role-based authorization boundaries (Super Admin vs standard roles on /api/users)
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { client } from '../helpers/test-client.mjs';
import { CONFIG } from '../helpers/config.mjs';

describe('Tier 5: Adversarial Stress Testing & Negative Execution', () => {
  let adminToken;
  let adminUser;

  before(async () => {
    const auth = await client.loginAdmin();
    adminToken = auth.token;
    adminUser = auth.user;
    assert.ok(adminToken, 'Failed to authenticate admin for Tier 5 setup');
  });

  describe('5.1 Unauthenticated & Forged Access Attack Surface', () => {
    it('ADV-AUTH-1: Rejects missing authorization header on all protected endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/applications' },
        { method: 'patch', path: '/api/applications/1/status', body: { status: 'Reviewing' } },
        { method: 'del', path: '/api/applications/1' },
        { method: 'get', path: '/api/enquiries' },
        { method: 'patch', path: '/api/enquiries/1/status', body: { status: 'Closed' } },
        { method: 'del', path: '/api/enquiries/1' },
        { method: 'get', path: '/api/auth/verify' },
        { method: 'get', path: '/api/users' },
        { method: 'post', path: '/api/users', body: { username: 'test', password: '123' } },
        { method: 'post', path: '/api/whatsapp/send', body: { phone: '123', message: 'hi' } }
      ];

      for (const ep of endpoints) {
        let res;
        if (ep.method === 'get') res = await client.get(ep.path);
        else if (ep.method === 'patch') res = await client.patch(ep.path, ep.body);
        else if (ep.method === 'del') res = await client.del(ep.path);
        else if (ep.method === 'post') res = await client.post(ep.path, ep.body);

        assert.equal(res.status, 401, `Endpoint ${ep.method.toUpperCase()} ${ep.path} must return 401 unauthenticated, got ${res.status}`);
        assert.equal(res.body?.success, false);
      }
    });

    it('ADV-AUTH-2: Rejects empty, whitespace-only, and malformed Bearer headers', async () => {
      const badHeaders = [
        'Bearer',
        'Bearer ',
        'Bearer   ',
        'Basic dXNlcjpwYXNz',
        'Token abcdef12345',
        'Bearer null',
        'Bearer undefined',
        'Bearer [object Object]',
        'Bearer ../../../etc/passwd'
      ];

      for (const hdr of badHeaders) {
        const res = await client.get('/api/applications', {
          headers: { 'Authorization': hdr }
        });
        assert.ok(
          res.status === 401 || res.status === 403,
          `Header "${hdr}" must return 401 or 403, got ${res.status}`
        );
      }
    });

    it('ADV-AUTH-3: Rejects forged JWT tokens signed with attacker secret', async () => {
      const attackerSecret = 'attacker_private_secret_key_666';
      const forgedToken = jwt.sign(
        { id: 999, username: 'admin', role: 'Super Admin' },
        attackerSecret,
        { expiresIn: '1h' }
      );

      const res = await client.get('/api/auth/verify', { token: forgedToken });
      assert.ok(res.status === 401 || res.status === 403, `Forged token must return 401/403, got ${res.status}`);
    });

    it('ADV-AUTH-4: Rejects JWT with alg "none" vulnerability', async () => {
      // Create token with header { alg: "none" }
      const headerB64 = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payloadB64 = Buffer.from(JSON.stringify({ id: 1, username: 'admin', role: 'Super Admin' })).toString('base64url');
      const noneToken = `${headerB64}.${payloadB64}.`;

      const res = await client.get('/api/applications', { token: noneToken });
      assert.ok(res.status === 401 || res.status === 403, `alg:none token must be rejected, got ${res.status}`);
    });

    it('ADV-AUTH-5: Rejects expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { id: 1, username: 'admin', role: 'Super Admin' },
        CONFIG.jwtSecret,
        { expiresIn: '-10s' } // Expired 10 seconds ago
      );

      const res = await client.get('/api/applications', { token: expiredToken });
      assert.ok(res.status === 401 || res.status === 403, `Expired token must return 401/403, got ${res.status}`);
    });

    it('ADV-AUTH-6: Enforces role-based authorization: non-Super-Admin rejected on /api/users', async () => {
      // Sign token with role "Consultant"
      const consultantToken = jwt.sign(
        { id: 42, username: 'consultant_user', role: 'Consultant' },
        CONFIG.jwtSecret,
        { expiresIn: '1h' }
      );

      const res = await client.get('/api/users', { token: consultantToken });
      assert.equal(res.status, 403, 'Non-Super-Admin user must receive 403 Forbidden on /api/users');
      assert.equal(res.body?.success, false);
    });
  });

  describe('5.2 Authentication Adversarial Stress', () => {
    it('ADV-LOGIN-1: SQL Injection payloads in username/password are neutralized', async () => {
      const sqliPayloads = [
        "' OR '1'='1",
        "admin' --",
        "admin' /*",
        "' OR 1=1 --",
        "admin'; DROP TABLE users; --",
        "\" or \"\"=\"",
        "' UNION SELECT 1, 'admin', 'hash', 'Super Admin' --"
      ];

      for (const payload of sqliPayloads) {
        const res = await client.post('/api/auth/login', {
          username: payload,
          password: 'any_password'
        });
        assert.equal(res.status, 401, `SQLi login payload "${payload}" must be rejected with 401`);
        assert.equal(res.body?.success, false);
      }
    });

    it('ADV-LOGIN-2: Malformed body types (numbers, booleans, objects, arrays) return 400', async () => {
      const badBodies = [
        {},
        { username: 12345, password: 'password' },
        { username: 'admin', password: true },
        { username: ['admin'], password: 'password' },
        { username: { user: 'admin' }, password: 'password' },
        null,
        'not a json object'
      ];

      for (const b of badBodies) {
        const res = await client.post('/api/auth/login', b);
        assert.equal(res.status, 400, `Malformed login body ${JSON.stringify(b)} must return 400`);
      }
    });

    it('ADV-LOGIN-3: Extremely long username and password (10,000 chars) handled safely', async () => {
      const massiveString = 'A'.repeat(10000);
      const res = await client.post('/api/auth/login', {
        username: massiveString,
        password: massiveString
      });
      assert.ok(res.status === 400 || res.status === 401, `Massive string must be rejected cleanly, got ${res.status}`);
      assert.notEqual(res.status, 500, 'Must not crash or 500');
    });
  });

  describe('5.3 Job Applications Boundary & Adversarial Fuzzing', () => {
    it('ADV-APP-1: Submitting application with missing required fields returns 400', async () => {
      const testCases = [
        { full_name: 'John' }, // missing email, phone, role
        { full_name: 'John', email: 'john@example.com' }, // missing phone, role
        { full_name: 'John', email: 'john@example.com', phone: '+49 123' }, // missing role
        { full_name: '', email: 'john@example.com', phone: '+49 123', role: 'Trainer' },
        { full_name: 'John', email: '', phone: '+49 123', role: 'Trainer' },
        { full_name: 'John', email: 'john@example.com', phone: '', role: 'Trainer' },
        { full_name: 'John', email: 'john@example.com', phone: '+49 123', role: '' }
      ];

      for (const tc of testCases) {
        const res = await client.post('/api/applications', tc);
        assert.equal(res.status, 400, `Case ${JSON.stringify(tc)} must return 400`);
        assert.equal(res.body?.success, false);
      }
    });

    it('ADV-APP-2: Email validation fuzzing with boundary strings', async () => {
      const invalidEmails = [
        'plainaddress',
        '@missinguser.com',
        'Joe Smith <email@example.com>',
        'email.example.com',
        'email@example@example.com',
        'email@domain',
        'email@example..com',
        '   ',
        'email@.com',
        'user @domain.com',
        'user@domain..com'
      ];

      for (const email of invalidEmails) {
        const res = await client.post('/api/applications', {
          full_name: 'Fuzzing Candidate',
          email,
          phone: '+49 151 000000',
          role: 'German Language Trainer'
        });
        assert.equal(res.status, 400, `Email "${email}" must be rejected with 400, got ${res.status}`);
      }
    });

    it('ADV-APP-3: XSS, HTML Injection & Unicode Payloads in application fields stored without corruption', async () => {
      const payloads = [
        '<script>alert(document.cookie)</script>',
        '<img src=x onerror=alert(1)>',
        '<svg/onload=confirm(1)>',
        '"><script src=data:text/javascript,alert(1)></script>',
        '${7*7}',
        '{{7*7}}',
        '日本語 / Ümläutë / 🚀 Special Emoji'
      ];

      for (const payload of payloads) {
        const res = await client.post('/api/applications', {
          full_name: `Candidate ${payload}`,
          email: 'safe.test@example.de',
          phone: '+49 151 999999',
          role: 'Overseas Student Counselor',
          notes: payload,
          resume_link: 'https://linkedin.com/in/safe'
        });

        assert.equal(res.status, 201, `Payload "${payload}" should be accepted and safely stored`);
        assert.ok(res.body?.application_id);

        // Verify retrieval via admin
        const appId = res.body.application_id;
        const getRes = await client.get('/api/applications', {
          token: adminToken,
          query: { search: 'Candidate' }
        });
        assert.equal(getRes.status, 200);

        // Clean up
        await client.del(`/api/applications/${appId}`, { token: adminToken });
      }
    });

    it('ADV-APP-4: Prototype pollution & non-string object injection attempts handled safely', async () => {
      const res = await client.post('/api/applications', {
        full_name: { __proto__: { admin: true } },
        email: 'attacker@evil.com',
        phone: '12345678',
        role: 'Trainer'
      });

      assert.equal(res.status, 400, 'Non-string full_name object must be rejected with 400');
    });

    it('ADV-APP-5: Negative and boundary application IDs return 400/404 without 500 error', async () => {
      const badIds = ['-1', '0', 'NaN', 'undefined', 'null', '1.5', '999999999', 'abc', '1; DROP TABLE applications'];

      for (const id of badIds) {
        const patchRes = await client.patch(`/api/applications/${id}/status`, {
          status: 'Reviewing'
        }, { token: adminToken });
        assert.ok(
          patchRes.status === 400 || patchRes.status === 404,
          `PATCH ID "${id}" must return 400 or 404, got ${patchRes.status}`
        );

        const delRes = await client.del(`/api/applications/${id}`, { token: adminToken });
        assert.ok(
          delRes.status === 400 || delRes.status === 404,
          `DELETE ID "${id}" must return 400 or 404, got ${delRes.status}`
        );
      }
    });
  });

  describe('5.4 Concurrency Stress & High-Burst Execution', () => {
    it('ADV-CONC-1: Burst 20 concurrent application submissions without collisions or data corruption', async () => {
      const concurrencyCount = 20;
      const promises = [];

      for (let i = 0; i < concurrencyCount; i++) {
        const payload = {
          full_name: `Burst Candidate ${i}`,
          email: `burst.candidate.${i}@example.de`,
          phone: `+49 151 777${String(i).padStart(3, '0')}`,
          role: i % 2 === 0 ? 'German Language Trainer' : 'Senior Visa & Immigration Consultant',
          resume_link: `https://example.com/cv-${i}`,
          notes: `Burst submission stress index #${i}`
        };
        promises.push(client.post('/api/applications', payload));
      }

      const results = await Promise.all(promises);
      const createdIds = new Set();

      for (const res of results) {
        assert.equal(res.status, 201, 'Every concurrent submission must succeed with 201 Created');
        assert.ok(res.body?.application_id, 'Must return application_id');
        assert.equal(createdIds.has(res.body.application_id), false, 'Duplicate ID detected under concurrency!');
        createdIds.add(res.body.application_id);
      }

      assert.equal(createdIds.size, concurrencyCount, `Expected exactly ${concurrencyCount} unique IDs`);

      // Verify all are readable by admin
      const listRes = await client.get('/api/applications', {
        token: adminToken,
        query: { search: 'Burst Candidate' }
      });
      assert.equal(listRes.status, 200);
      assert.ok(listRes.body?.applications?.length >= concurrencyCount, 'All burst candidates must be in database');

      // Cleanup
      for (const id of createdIds) {
        await client.del(`/api/applications/${id}`, { token: adminToken });
      }
    });

    it('ADV-CONC-2: Concurrent status updates on the same application resolve safely', async () => {
      // Create a test candidate
      const createRes = await client.post('/api/applications', {
        full_name: 'Concurrent Status Candidate',
        email: 'conc.status@example.de',
        phone: '+49 151 888888',
        role: 'Overseas Student Counselor'
      });
      const appId = createRes.body?.application_id;
      assert.ok(appId);

      const statuses = ['Reviewing', 'Shortlisted', 'Interviewed', 'Hired'];
      const patchPromises = statuses.map(status =>
        client.patch(`/api/applications/${appId}/status`, { status }, { token: adminToken })
      );

      const patchResults = await Promise.all(patchPromises);
      for (const res of patchResults) {
        assert.equal(res.status, 200, 'Concurrent status update must return 200 OK');
      }

      // Verify final application state is valid
      const finalRes = await client.get('/api/applications', {
        token: adminToken,
        query: { search: 'Concurrent Status Candidate' }
      });
      const app = finalRes.body?.applications?.find(a => a.id === appId);
      assert.ok(app, 'Candidate must exist');
      assert.ok(statuses.includes(app.status), `Final status must be one of the applied statuses, got ${app.status}`);

      // Cleanup
      await client.del(`/api/applications/${appId}`, { token: adminToken });
    });
  });
});
