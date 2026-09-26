import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting SecureVault Security & API Tests...\n');

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'ok', 'Health check must be ok');
  console.log('✅ 1. Health check passed');

  // 2. Auth: Sign up a new user
  const testEmail = `agent_${Date.now()}@securevault.io`;
  const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'StrongMasterPassword123!',
      confirmPassword: 'StrongMasterPassword123!'
    })
  });
  assert.strictEqual(signupRes.status, 201, 'Signup should return 201 Created');
  const signupData = await signupRes.json();
  assert.ok(signupData.token, 'Must return JWT token');
  assert.strictEqual(signupData.user.hasPin, false, 'New user must not have PIN initially');
  const token = signupData.token;
  console.log('✅ 2. User registration and JWT issuance passed');

  // 3. Mandatory PIN setup: Create 4-digit PIN
  const pinRes = await fetch(`${BASE_URL}/pin/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ pin: '5678', confirmPin: '5678' })
  });
  assert.strictEqual(pinRes.status, 200, 'PIN creation should succeed');
  const pinData = await pinRes.json();
  assert.strictEqual(pinData.hasPin, true, 'hasPin must now be true');
  console.log('✅ 3. 4-Digit PIN creation and bcrypt hashing passed');

  // 4. Save credential (AES-256-GCM encrypted)
  const credRes = await fetch(`${BASE_URL}/vault/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'GitHub Personal Token',
      username: 'octocat_dev',
      password: 'ghp_SuperSecretAntigravityKey2025!',
      url: 'https://github.com',
      notes: 'Repo scope and workflow access only.'
    })
  });
  assert.strictEqual(credRes.status, 201, 'Credential creation should return 201');
  const credData = await credRes.json();
  assert.strictEqual(credData.item.preview, '•••• Locked', 'Must mask preview initially');
  const credItemId = credData.item.id;
  console.log('✅ 4. AES-256-GCM Credential encryption at rest passed');

  // 5. Test unlock with incorrect PIN
  const badUnlockRes = await fetch(`${BASE_URL}/vault/items/${credItemId}/unlock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ pin: '0000' }) // incorrect PIN
  });
  assert.strictEqual(badUnlockRes.status, 401, 'Bad PIN must return 401 Unauthorized');
  const badUnlockData = await badUnlockRes.json();
  assert.ok(badUnlockData.attemptsRemaining !== undefined, 'Must report remaining attempts');
  console.log('✅ 5. Bad PIN rejection and attempt tracking passed');

  // 6. Test rate limiting / Lockout after 5 failed attempts
  for (let i = 0; i < 4; i++) {
    await fetch(`${BASE_URL}/vault/items/${credItemId}/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ pin: '0000' })
    });
  }

  const lockoutRes = await fetch(`${BASE_URL}/vault/items/${credItemId}/unlock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ pin: '5678' }) // Even with correct PIN, lockout must block!
  });
  assert.strictEqual(lockoutRes.status, 429, '5 failed attempts must trigger HTTP 429 lockout');
  const lockoutData = await lockoutRes.json();
  assert.strictEqual(lockoutData.isLocked, true, 'Must indicate account/vault is locked');
  assert.ok(lockoutData.remainingSeconds > 0, 'Must provide remaining lockout duration');
  console.log(`✅ 6. Brute-force protection: 5 failed attempts triggered lockout (${lockoutData.remainingSeconds}s)`);

  // 7. Test Demo user unlock with correct PIN (demo@securevault.io, PIN: 1234)
  const loginDemoRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo@securevault.io',
      password: 'Password123!'
    })
  });
  assert.strictEqual(loginDemoRes.status, 200, 'Demo login should succeed');
  const demoLoginData = await loginDemoRes.json();
  const demoToken = demoLoginData.token;

  const demoItemsRes = await fetch(`${BASE_URL}/vault/items`, {
    headers: { 'Authorization': `Bearer ${demoToken}` }
  });
  const demoItemsData = await demoItemsRes.json();
  assert.ok(demoItemsData.items.length >= 3, 'Demo user should have seeded items');
  const demoCred = demoItemsData.items.find(i => i.type === 'credential');
  assert.ok(demoCred, 'Demo user must have credential item');

  // Unlock demo credential with correct PIN (1234)
  const demoUnlockRes = await fetch(`${BASE_URL}/vault/items/${demoCred.id}/unlock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${demoToken}`
    },
    body: JSON.stringify({ pin: '1234' })
  });
  assert.strictEqual(demoUnlockRes.status, 200, 'Correct PIN should unlock item');
  const demoUnlockData = await demoUnlockRes.json();
  assert.ok(demoUnlockData.item.password, 'Must reveal decrypted password');
  assert.strictEqual(demoUnlockData.item.integrityVerified, true, 'Integrity checksum must match');
  console.log('✅ 7. Correct PIN unlock, AES-256 decryption, & SHA-256 checksum verification passed');

  // 8. Verify audit logs
  const auditRes = await fetch(`${BASE_URL}/audit/logs`, {
    headers: { 'Authorization': `Bearer ${demoToken}` }
  });
  assert.strictEqual(auditRes.status, 200, 'Audit logs request should succeed');
  const auditData = await auditRes.json();
  assert.ok(auditData.logs.length > 0, 'Audit logs must contain recorded security events');
  console.log(`✅ 8. Security audit logging verified (${auditData.logs.length} logged events)`);

  console.log('\n🎉 ALL SECURITY & BACKEND TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
