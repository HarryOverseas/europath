/**
 * Tier 2 - Boundary & Corner Cases: Authentication
 * Tests edge cases: empty strings, whitespace, extreme lengths, SQL injection payloads, malformed types.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { client } from '../helpers/test-client.mjs';

describe('Tier 2: Auth Boundary & Robustness Cases', () => {
  it('AUTH-BND-1: Empty string credentials return 400 Bad Request', async () => {
    const res = await client.post('/api/auth/login', {
      username: '',
      password: '',
    });
    assert.equal(res.status, 400, 'Empty username and password must return 400 Bad Request');
    assert.equal(res.body?.success, false);
  });

  it('AUTH-BND-2: Whitespace-only credentials return 400 Bad Request', async () => {
    const res = await client.post('/api/auth/login', {
      username: '   ',
      password: '      ',
    });
    assert.equal(res.status, 400, 'Whitespace-only credentials must return 400 Bad Request');
    assert.equal(res.body?.success, false);
  });

  it('AUTH-BND-3: Extreme payload length does not crash server and returns 400 or 401', async () => {
    const longString = 'A'.repeat(5000);
    const res = await client.post('/api/auth/login', {
      username: longString,
      password: longString,
    });
    assert.ok(res.status === 400 || res.status === 401, `Expected 400 or 401 for oversized credentials, got ${res.status}`);
    assert.equal(res.body?.success, false);
  });

  it('AUTH-BND-4: SQL injection payload in username is safely neutralized and rejected (401)', async () => {
    const sqliPayload = "' OR '1'='1' --";
    const res = await client.post('/api/auth/login', {
      username: sqliPayload,
      password: 'password',
    });
    assert.equal(res.status, 401, 'SQL injection attempt must return 401 and not authenticate');
    assert.equal(res.body?.success, false);
    assert.equal(res.body?.token, undefined);
  });

  it('AUTH-BND-5: Special characters and unicode umlauts are handled safely without 500 error', async () => {
    const res = await client.post('/api/auth/login', {
      username: 'müller_öäüß@harryglobal.com',
      password: 'Password#äöü!@2026',
    });
    assert.equal(res.status, 401, 'Unknown unicode user must return 401 without unhandled server exception');
    assert.notEqual(res.status, 500, 'Must not throw 500 Internal Server Error');
  });

  it('AUTH-BND-6: Non-string data types in login body are rejected with 400', async () => {
    const res = await client.post('/api/auth/login', {
      username: 12345,
      password: { secret: 'nested_object' },
    });
    assert.ok(res.status === 400 || res.status === 401, `Expected 400 or 401 for non-string credentials, got ${res.status}`);
    assert.equal(res.body?.success, false);
  });
});
