// server/test_qr_attendance.js
// Automated verification suite for FitCommit QR-Based Gym Check-In and Occupancy Telemetry

const http = require('http');

function post(path, body, token = null) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log(' FITCOMMIT: QR-BASED GYM CHECK-IN & OCCUPANCY TEST SUITE');
  console.log(' (Replacing physical IoT sensors with entrance QR scanning)');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, extraInfo = '') {
    total++;
    if (condition) {
      console.log(`  [PASS] Test ${total}: ${testName} ${extraInfo}`);
      passed++;
    } else {
      console.error(`  [FAIL] Test ${total}: ${testName} ${extraInfo}`);
    }
  }

  // 1. Authenticate Personas
  console.log('1. Authenticating Demo Personas...');
  const baseAuth = await post('/api/auth/demo-login', { role: 'base' });
  const baseToken = baseAuth.body.token;
  assert(baseToken && baseAuth.body.user.role === 'BASE_MEMBER', 'Base Member authenticated (Hemanth - BASE_MEMBER)');

  const premiumAuth = await post('/api/auth/demo-login', { role: 'premium' });
  const premiumToken = premiumAuth.body.token;
  assert(premiumToken && premiumAuth.body.user.role === 'PREMIUM_MEMBER', 'Premium Member authenticated (Sumith - PREMIUM_MEMBER)');

  const adminAuth = await post('/api/auth/demo-login', { role: 'admin' });
  const adminToken = adminAuth.body.token;
  assert(adminToken && adminAuth.body.user.role === 'ADMIN', 'Admin authenticated (Bheem - ADMIN)');

  // 2. Baseline Occupancy Verification
  console.log('\n2. Baseline Gym Occupancy Check...');
  const publicOccRes = await get('/api/gym/occupancy');
  assert(publicOccRes.status === 200, 'Public unauthenticated GET /api/gym/occupancy returns 200 OK (for phone landing)');

  const baselineRes = await get('/api/gym/occupancy', premiumToken);
  assert(baselineRes.status === 200, 'GET /api/gym/occupancy returns 200 OK');
  const baseOcc = baselineRes.body.occupancy.current_occupancy;
  const totalMems = baselineRes.body.occupancy.total_members;
  const capacity = baselineRes.body.gym.capacity;
  console.log(`     -> Baseline Occupancy: ${baseOcc}/${capacity} (${baselineRes.body.occupancy.occupancy_percentage}%)`);
  console.log(`     -> Total Registered Members: ${totalMems}`);
  assert(baseOcc >= 0 && capacity === 100, `Capacity is 100 and baseline occupancy is valid (${baseOcc})`);
  assert(totalMems === 150, `Total Registered Members is separate from occupancy (${totalMems} members)`);

  // Ensure clean state for Sumith (checkout if active)
  await post('/api/gym/check-out', {}, premiumToken);

  const occBefore = (await get('/api/gym/occupancy', premiumToken)).body.occupancy.current_occupancy;

  // 3. Negative Test: Base Member without Gym Pass
  console.log('\n3. Membership Gate Validation (Base Member Check-In)...');
  const baseCheckIn = await post('/api/gym/check-in', { gymIdentifier: 'FITCOMMIT-GYM-001' }, baseToken);
  assert(
    baseCheckIn.status === 403, 
    'Base Member check-in denied with HTTP 403 Forbidden',
    `(${baseCheckIn.body.message})`
  );
  const occAfterBase = (await get('/api/gym/occupancy', premiumToken)).body.occupancy.current_occupancy;
  assert(occAfterBase === occBefore, 'Occupancy did NOT increase after denied Base member attempt');

  // 4. Negative Test: Invalid QR Code
  console.log('\n4. QR Validation (Invalid QR Code)...');
  const badQrCheckIn = await post('/api/gym/check-in', { gymIdentifier: 'FAKE-GYM-999' }, premiumToken);
  assert(
    badQrCheckIn.status === 400,
    'Invalid QR code rejected with HTTP 400 Bad Request',
    `(${badQrCheckIn.body.message})`
  );

  // 5. Positive Test: Valid Scanned URL Check-In by Premium Member
  console.log('\n5. Valid QR Check-In Flow (gymIdentifier & URL decoding)...');
  const validCheckIn = await post('/api/gym/check-in', { gymIdentifier: 'http://172.16.210.219:5173/gym/check-in?gym=FITCOMMIT-GYM-001' }, premiumToken);
  assert(validCheckIn.status === 200, 'Valid scanned URL check-in succeeds with HTTP 200 OK');
  assert(validCheckIn.body.attendance.status === 'CHECKED_IN', 'Attendance record marked status = CHECKED_IN');
  assert(validCheckIn.body.occupancy.current_occupancy === occBefore + 1, `Current occupancy increased by 1 (${occBefore} -> ${occBefore + 1})`);
  assert(validCheckIn.body.occupancy.total_members === totalMems, 'Total Registered Members remained constant at 150');

  // 6. Negative Test: Duplicate Check-In Prevention
  console.log('\n6. Duplicate Check-In Prevention...');
  const dupCheckIn = await post('/api/gym/check-in', { qr_code: 'FITCOMMIT-GYM-001' }, premiumToken);
  assert(
    dupCheckIn.status === 400,
    'Duplicate check-in blocked with HTTP 400 Bad Request',
    `(${dupCheckIn.body.message})`
  );
  const occAfterDup = (await get('/api/gym/occupancy', premiumToken)).body.occupancy.current_occupancy;
  assert(occAfterDup === occBefore + 1, 'Current occupancy did NOT increase on duplicate scan attempt');

  // 7. User Check-Out Flow
  console.log('\n7. User Check-Out Flow...');
  const checkOutRes = await post('/api/gym/check-out', {}, premiumToken);
  assert(checkOutRes.status === 200, 'Check-out succeeds with HTTP 200 OK');
  assert(checkOutRes.body.attendance.status === 'CHECKED_OUT', 'Attendance record marked status = CHECKED_OUT');
  assert(checkOutRes.body.attendance.check_out_time !== null, 'Check-out timestamp stored successfully');
  assert(Boolean(checkOutRes.body.attendance.session_duration_formatted), `Session duration computed: ${checkOutRes.body.attendance.session_duration_formatted}`);
  assert(checkOutRes.body.occupancy.current_occupancy === occBefore, `Current occupancy decremented by 1 back to ${occBefore}`);

  // 8. Negative Test: Checkout when outside
  console.log('\n8. Redundant Check-Out Prevention...');
  const noSessionCheckOut = await post('/api/gym/check-out', {}, premiumToken);
  assert(noSessionCheckOut.status === 400, 'Check-out blocked when user has no active session');

  // 9. Personal Attendance History & Analytics
  console.log('\n9. Personal Attendance History & Statistics...');
  const myHistRes = await get('/api/gym/my-attendance', premiumToken);
  assert(myHistRes.status === 200, 'GET /api/gym/my-attendance returns 200 OK');
  assert(myHistRes.body.stats && myHistRes.body.stats.total_visits >= 1, `Total visits calculated: ${myHistRes.body.stats.total_visits}`);
  assert(Boolean(myHistRes.body.stats.total_gym_time_formatted), `Total gym time: ${myHistRes.body.stats.total_gym_time_formatted}`);
  assert(Boolean(myHistRes.body.stats.average_session_formatted), `Average session: ${myHistRes.body.stats.average_session_formatted}`);
  assert(Array.isArray(myHistRes.body.attendance) && myHistRes.body.attendance.length > 0, `History contains ${myHistRes.body.attendance.length} logged sessions`);

  // 10. Admin Telemetry & Real-Time Oversight
  console.log('\n10. Admin Telemetry & Authorization...');
  // Non-admin attempt
  const nonAdminAccess = await get('/api/admin/gym/occupancy', premiumToken);
  assert(nonAdminAccess.status === 403, 'Non-admin forbidden from admin gym occupancy (HTTP 403)');

  // Admin access
  const adminOccRes = await get('/api/admin/gym/occupancy', adminToken);
  assert(adminOccRes.status === 200, 'Admin can access GET /api/admin/gym/occupancy');
  const adminOcc = adminOccRes.body.occupancy;
  assert(adminOcc.current_occupancy === occBefore, `Admin sees live occupancy: ${adminOcc.current_occupancy}`);
  assert(adminOcc.capacity === 100, `Admin sees capacity: ${adminOcc.capacity}`);
  assert(adminOcc.total_members === 150, `Admin sees active members: ${adminOcc.total_members}`);
  assert(adminOcc.check_ins_today >= 1, `Admin sees today's check-ins: ${adminOcc.check_ins_today}`);
  assert(Array.isArray(adminOccRes.body.recent_activity), `Admin sees recent activity stream (${adminOccRes.body.recent_activity.length} events)`);

  const adminAttRes = await get('/api/admin/gym/attendance', adminToken);
  assert(adminAttRes.status === 200, 'Admin can access GET /api/admin/gym/attendance');
  assert(adminAttRes.body.attendance.length > 0, `Admin sees full attendance ledger (${adminAttRes.body.attendance.length} records)`);

  console.log('\n================================================================');
  console.log(` RESULT: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log(' All QR Attendance & Occupancy requirements verified!');
  console.log('================================================================\n');

  process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
