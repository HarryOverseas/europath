/**
 * Master Test Runner for Harry Overseas E2E Test Suite (Tiers 1-4).
 * 
 * Supports:
 * - Running all tiers or specific tier (--tier=1,2,3,4)
 * - Running against live backend or auto-starting contract reference server
 * - Detailed test results reporting
 * 
 * Usage:
 *   node tests/run_tests.mjs
 *   node tests/run_tests.mjs --tier=1
 *   node tests/run_tests.mjs --tier=2
 *   node tests/run_tests.mjs --tier=3
 *   node tests/run_tests.mjs --tier=4
 *   node tests/run_tests.mjs --live
 */

import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { client } from './helpers/test-client.mjs';
import { CONFIG } from './helpers/config.mjs';
import { startMockServer, stopMockServer } from './helpers/mock-server.mjs';

const __dirname = resolve(new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));

// Parse command line arguments
const args = process.argv.slice(2);
const tierArg = args.find(a => a.startsWith('--tier='));
const targetTier = tierArg ? tierArg.split('=')[1] : null;
const forceLive = args.includes('--live');
const forceMock = args.includes('--mock');

async function getTestFiles() {
  const testsDir = __dirname;
  const tiers = [
    { tier: '1', dir: 'tier1_features' },
    { tier: '2', dir: 'tier2_boundaries' },
    { tier: '3', dir: 'tier3_cross_feature' },
    { tier: '4', dir: 'tier4_real_world' },
    { tier: '5', dir: 'tier5_adversarial' },
  ];

  const selectedTiers = targetTier
    ? tiers.filter(t => t.tier === targetTier)
    : tiers;

  const files = [];
  for (const { dir } of selectedTiers) {
    const fullDir = join(testsDir, dir);
    try {
      const dirFiles = readdirSync(fullDir)
        .filter(f => f.endsWith('.test.mjs'))
        .map(f => join(fullDir, f));
      files.push(...dirFiles);
    } catch (err) {
      console.warn(`Could not read directory ${fullDir}: ${err.message}`);
    }
  }

  return files;
}

async function main() {
  console.log('='.repeat(65));
  console.log(' Harry Overseas Automated E2E Test Suite (Tiers 1 - 4)');
  console.log('='.repeat(65));

  let mockServerInstance = null;
  const isLiveServerUp = await client.isServerReachable();

  if (forceMock || (!forceLive && !isLiveServerUp)) {
    const mockPort = 5055;
    console.log(`[INFO] Live backend offline at ${CONFIG.baseUrl}.`);
    console.log(`[INFO] Initializing contract reference server on port ${mockPort}...`);
    mockServerInstance = await startMockServer(mockPort);
    process.env.TEST_API_URL = `http://localhost:${mockPort}`;
    client.baseUrl = process.env.TEST_API_URL;
    console.log(`[OK] Contract reference server listening at ${client.baseUrl}\n`);
  } else {
    console.log(`[OK] Connected to live backend at ${client.baseUrl}\n`);
  }

  const testFiles = await getTestFiles();
  if (testFiles.length === 0) {
    console.error('[ERROR] No test files matched the selected criteria.');
    if (mockServerInstance) await stopMockServer();
    process.exit(1);
  }

  console.log(`[RUNNER] Executing ${testFiles.length} test suites:`);
  for (const f of testFiles) {
    console.log(`  - ${f.replace(resolve(__dirname, '..'), '')}`);
  }
  console.log('');

  let hasFailures = false;

  try {
    const testStream = run({
      files: testFiles,
      concurrency: false, // Run suites sequentially for isolation
    });

    testStream.on('test:fail', () => {
      hasFailures = true;
    });

    // Pipe results to Node spec reporter
    testStream.compose(new spec()).pipe(process.stdout);

    await new Promise((resolve) => {
      testStream.on('end', resolve);
    });
  } catch (err) {
    console.error('[FATAL] Error during test execution:', err);
    hasFailures = true;
  } finally {
    if (mockServerInstance) {
      await stopMockServer();
      console.log('\n[INFO] Contract reference server stopped.');
    }
  }

  console.log('\n' + '='.repeat(65));
  if (hasFailures) {
    console.log(' TEST SUITE FAILED: Review failure outputs above.');
    console.log('='.repeat(65));
    process.exit(1);
  } else {
    console.log(' ALL TESTS PASSED: E2E Interface Contracts Verified (100%).');
    console.log('='.repeat(65));
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
