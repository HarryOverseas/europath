/**
 * Tier 4 - Real-World Application Scenario: Session Lifecycle & Token Security
 * Tests token lifecycle, tampering detection, header variations, and post-logout security.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { client } from '../helpers/test-client.mjs';

describe('Tier 4: Session Lifecycle & Token Hardening', () => {
  it('SCENARIO-3: Complete token lifecycle: issuance, verification, tampering rejection, and logout revocation simulation', async () => {
    // 1. Log in and get authentic token
    const auth = await client.loginAdmin();
    assert.ok(auth.token, 'Must receive JWT on authentic login');
    const validToken = auth.token;

    // 2. Verify token works on protected endpoints
    const verifyRes = await client.get('/api/auth/verify', { token: validToken });
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body?.user?.username, auth.user.username);

    // 3. Test case insensitivity / header formatting
    const lowercaseHeaderRes = await client.get('/api/applications', {
      headers: { 'authorization': `bearer ${validToken}` },
    });
    // Standard Node/Express converts headers to lowercase; Bearer prefix can be parsed
    assert.ok(lowercaseHeaderRes.status === 200 || lowercaseHeaderRes.status === 401, 'Handled without 500 error');

    // 4. Token tampering test:
    // A JWT has 3 parts: header.payload.signature
    const parts = validToken.split('.');
    assert.equal(parts.length, 3, 'Valid JWT must have 3 parts');

    // Decode payload and tamper with claims (e.g. elevate permissions or change id)
    const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payloadObj = JSON.parse(payloadStr);
    payloadObj.role = 'Root Administrator (Forged)';
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');

    // Reconstruct token with tampered payload but original signature
    const tamperedToken = `${parts[0]}.${tamperedPayloadB64}.${parts[2]}`;

    // Attempt to access protected endpoint with tampered token
    const tamperedRes = await client.get('/api/applications', { token: tamperedToken });
    assert.ok(
      tamperedRes.status === 401 || tamperedRes.status === 403,
      `Tampered token must be rejected with 401 or 403, got ${tamperedRes.status}`
    );

    // 5. Signature tampering test: mutate signature bytes
    const corruptedSigToken = `${parts[0]}.${parts[1]}.CORRUPTED_SIGNATURE_BYTES`;
    const corruptedRes = await client.get('/api/applications', { token: corruptedSigToken });
    assert.ok(
      corruptedRes.status === 401 || corruptedRes.status === 403,
      `Corrupted signature token must be rejected with 401 or 403, got ${corruptedRes.status}`
    );

    // 6. Simulate client-side logout: purge token from request
    // Subsequent calls without token must fail immediately
    const loggedOutRes = await client.get('/api/applications');
    assert.equal(loggedOutRes.status, 401, 'Requests after token removal must be rejected with 401');
  });
});
