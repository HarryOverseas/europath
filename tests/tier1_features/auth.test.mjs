/**
 * Tier 1 - Feature Coverage: Admin Authentication (F3, F4)
 * Authoritative Contract: PROJECT.md § 1. Admin Authentication Contract
 * Acceptance Criteria: ORIGINAL_REQUEST.md § Authentication & Security
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { client } from '../helpers/test-client.mjs';
import { CONFIG } from '../helpers/config.mjs';

describe('Tier 1: Admin Authentication API (F3, F4)', () => {
  it('F3-T1: POST /api/auth/login succeeds with valid credentials and issues JWT token', async () => {
    const res = await client.post('/api/auth/login', {
      username: CONFIG.admin.username,
      password: CONFIG.admin.password,
    });

    assert.equal(res.status, 200, 'Expected 200 OK for valid credentials');
    assert.ok(res.body, 'Expected response body');
    assert.equal(res.body.success, true, 'Expected success: true');
    assert.ok(typeof res.body.token === 'string' && res.body.token.length > 20, 'Expected valid JWT token string');
    assert.ok(res.body.user, 'Expected user profile object');
    assert.equal(res.body.user.username, CONFIG.admin.username, 'Expected user.username to match admin');
    assert.ok(res.body.user.role, 'Expected user role to be present');
  });

  it('F3-T2: POST /api/auth/login rejects invalid password with 401 Unauthorized', async () => {
    const res = await client.post('/api/auth/login', {
      username: CONFIG.admin.username,
      password: 'WrongPassword!999',
    });

    assert.equal(res.status, 401, 'Expected 401 Unauthorized for incorrect password');
    assert.equal(res.body?.success, false, 'Expected success: false');
    assert.ok(res.body?.error, 'Expected error message in response');
    assert.equal(res.body?.token, undefined, 'Must not return token on failed login');
  });

  it('F3-T3: POST /api/auth/login rejects non-existent username with 401 Unauthorized', async () => {
    const res = await client.post('/api/auth/login', {
      username: 'non_existent_admin_user_xyz',
      password: CONFIG.admin.password,
    });

    assert.equal(res.status, 401, 'Expected 401 Unauthorized for unknown user');
    assert.equal(res.body?.success, false, 'Expected success: false');
    assert.ok(res.body?.error, 'Expected error message in response');
    assert.equal(res.body?.token, undefined, 'Must not return token on unknown user');
  });

  it('F3-T4: POST /api/auth/login rejects request when username is omitted with 400 Bad Request', async () => {
    const res = await client.post('/api/auth/login', {
      password: CONFIG.admin.password,
    });

    assert.equal(res.status, 400, 'Expected 400 Bad Request when username missing');
    assert.equal(res.body?.success, false, 'Expected success: false');
    assert.ok(res.body?.error, 'Expected error message for missing username');
  });

  it('F3-T5: POST /api/auth/login rejects request when password is omitted with 400 Bad Request', async () => {
    const res = await client.post('/api/auth/login', {
      username: CONFIG.admin.username,
    });

    assert.equal(res.status, 400, 'Expected 400 Bad Request when password missing');
    assert.equal(res.body?.success, false, 'Expected success: false');
    assert.ok(res.body?.error, 'Expected error message for missing password');
  });

  it('F4-T1: GET /api/auth/verify succeeds with valid JWT Bearer token and returns session user', async () => {
    // Obtain valid token first
    const { token } = await client.loginAdmin();
    assert.ok(token, 'Must obtain a valid token from login helper');

    const res = await client.get('/api/auth/verify', { token });

    assert.equal(res.status, 200, 'Expected 200 OK for valid token verification');
    assert.equal(res.body?.success, true, 'Expected success: true');
    assert.ok(res.body?.user, 'Expected verified user object');
    assert.equal(res.body.user.username, CONFIG.admin.username, 'Expected verified username to match');
  });
});
