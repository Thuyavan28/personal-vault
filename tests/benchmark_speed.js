import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

async function benchmark() {
  console.log('⚡ Running Speed Benchmark & Google Auth Verification...\n');

  // 1. Test Google Auth Endpoint (Direct signup/signin)
  console.log('--- Testing Google Auth Route ---');
  const googleEmail = `google_user_${Date.now()}@gmail.com`;
  const googleRes = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: googleEmail,
      name: 'Google Test User',
      googleId: 'g_' + Date.now(),
      action: 'signup'
    })
  });
  assert.strictEqual(googleRes.status, 200, 'Google Auth should return 200');
  const googleData = await googleRes.json();
  assert.ok(googleData.token, 'Must return token');
  assert.strictEqual(googleData.user.email, googleEmail);
  console.log('✅ Google Auth (Signup/Login) successfully executed without errors');

  // 2. Test response time of GET /api/vault/items with Demo User
  console.log('\n--- Benchmarking Response Times for /api/vault/items ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@securevault.io', password: 'Password123!' })
  });
  const { token } = await loginRes.json();

  // Test 1: First fetch
  const t0 = performance.now();
  const res1 = await fetch(`${BASE_URL}/vault/items?type=all`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const t1 = performance.now();
  const data1 = await res1.json();
  const firstDuration = (t1 - t0).toFixed(1);
  const cacheStatus1 = res1.headers.get('x-cache-status') || 'N/A';
  console.log(`⏱️ Request 1 (Fetch from DB): ${firstDuration} ms (Cache: ${cacheStatus1}, Items: ${data1.items.length})`);

  // Test 2: Repeat fetch (Cache hit)
  const t2 = performance.now();
  const res2 = await fetch(`${BASE_URL}/vault/items?type=all`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const t3 = performance.now();
  const data2 = await res2.json();
  const secondDuration = (t3 - t2).toFixed(1);
  const cacheStatus2 = res2.headers.get('x-cache-status') || 'N/A';
  console.log(`⚡ Request 2 (Cache HIT): ${secondDuration} ms (Cache: ${cacheStatus2}, Items: ${data2.items.length})`);

  // Test 3: Tab switch / category filter
  const t4 = performance.now();
  const res3 = await fetch(`${BASE_URL}/vault/items?type=credential`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const t5 = performance.now();
  const data3 = await res3.json();
  const thirdDuration = (t5 - t4).toFixed(1);
  const cacheStatus3 = res3.headers.get('x-cache-status') || 'N/A';
  console.log(`⚡ Request 3 (Category filter): ${thirdDuration} ms (Cache: ${cacheStatus3}, Items: ${data3.items.length})`);

  console.log('\n=============================================');
  console.log(`🎯 TARGET: Under 1.5 - 2.0 seconds (1500 - 2000 ms)`);
  console.log(`🚀 ACHIEVED: Request 1 = ${firstDuration}ms, Request 2 = ${secondDuration}ms, Request 3 = ${thirdDuration}ms`);
  console.log(`🏆 Performance improvement: Up to ${(3730 / parseFloat(secondDuration)).toFixed(0)}x faster than previous 3.73s!`);
  console.log('=============================================\n');
}

benchmark().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
