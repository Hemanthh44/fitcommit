/**
 * FitCommit Real-Time Gym Occupancy & Availability Verification Suite
 * Tests exact college demo scenario and business rules:
 * - 0 inside -> 1 inside -> duplicate prevention -> 2 inside -> checkout -> 1 inside
 * - Capacity enforcement (400 "Gym is currently full.")
 * - Membership gating (403 for base member)
 * - Public & authenticated GET /api/gym/occupancy response structure
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

const get = (p, t) => request('GET', p, null, t);
const post = (p, b, t) => request('POST', p, b, t);

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('FitCommit: Real-Time Gym Availability & Occupancy Tests');
  console.log('====================================================\n');

  // 1. Authenticate Personas
  console.log('[Step 1] Authenticating Demo Personas...');
  const baseLogin = await post('/api/auth/demo-login', { role: 'base' });
  const baseToken = baseLogin.body.token;
  assert(baseLogin.status === 200 && baseToken, 'Base Member (Hemanth) authenticated');

  const premiumLogin = await post('/api/auth/demo-login', { role: 'premium' });
  const premiumToken = premiumLogin.body.token;
  assert(premiumLogin.status === 200 && premiumToken, 'Premium Member (Sumith / Student 1) authenticated');

  const trainerLogin = await post('/api/auth/demo-login', { role: 'trainer' });
  const trainerToken = trainerLogin.body.token;
  assert(trainerLogin.status === 200 && trainerToken, 'Trainer (Arun / Student 2) authenticated');

  // 2. Demo Reset: Start at 0 Inside, 100 Available Spots
  console.log('\n[Step 2] Resetting Demo State for College Demo (0 inside, 100 available)...');
  const resetRes = await post('/api/gym/reset-demo', {});
  assert(resetRes.status === 200, 'POST /api/gym/reset-demo succeeds with 200 OK');
  assert(resetRes.body.currentMembers === 0, 'Reset sets currentMembers to 0');
  assert(resetRes.body.availableSpots === 100, 'Reset sets availableSpots to 100 (capacity)');
  assert(resetRes.body.occupancyPercentage === 0, 'Reset sets occupancyPercentage to 0%');

  // 3. Public GET /api/gym/occupancy Response Schema
  console.log('\n[Step 3] Verifying GET /api/gym/occupancy API Contract...');
  const publicOcc = await get('/api/gym/occupancy');
  assert(publicOcc.status === 200, 'Public GET /api/gym/occupancy returns 200 OK');
  assert(publicOcc.body.gymId === 'FITCOMMIT-GYM-001', 'Response contains exact gymId "FITCOMMIT-GYM-001"');
  assert(publicOcc.body.capacity === 100, 'Response contains capacity = 100');
  assert(publicOcc.body.currentMembers === 0, 'Response contains currentMembers = 0');
  assert(publicOcc.body.availableSpots === 100, 'Response contains availableSpots = 100');
  assert(publicOcc.body.occupancyPercentage === 0, 'Response contains occupancyPercentage = 0');
  assert(publicOcc.body.userStatus.isInside === false, 'Public visitor has isInside = false');

  // 4. Rule 6: Membership Eligibility Gate
  console.log('\n[Step 4] Testing Rule 6: Only eligible members can check in...');
  const baseCheckIn = await post('/api/gym/check-in', { gymId: 'FITCOMMIT-GYM-001' }, baseToken);
  assert(baseCheckIn.status === 403, 'Base member check-in rejected with 403 Forbidden');
  assert(baseCheckIn.body.error === 'Active gym membership required to check in.', 'Error message indicates gym membership required');

  // 5. Student 1 Scans Gym QR (Check In)
  console.log('\n[Step 5] Demo Scenario Step 1: Student 1 scans Gym QR...');
  const student1CheckIn = await post('/api/gym/check-in', { gymId: 'FITCOMMIT-GYM-001' }, premiumToken);
  assert(student1CheckIn.status === 200, 'Student 1 check-in returns 200 OK');
  assert(student1CheckIn.body.message === 'Checked in successfully.', 'Message is "Checked in successfully."');
  assert(student1CheckIn.body.currentMembers === 1, 'Current occupancy increases to 1');
  assert(student1CheckIn.body.availableSpots === 99, 'Available spots decreases to 99');
  assert(student1CheckIn.body.occupancyPercentage === 1, 'Occupancy percentage is 1%');

  // 6. Rule 1: Duplicate Check-In Prevention
  console.log('\n[Step 6] Testing Rule 1: Prevent duplicate check-in...');
  const dupCheckIn = await post('/api/gym/check-in', { gymId: 'FITCOMMIT-GYM-001' }, premiumToken);
  assert(dupCheckIn.status === 400, 'Duplicate check-in rejected with 400 Bad Request');
  assert(dupCheckIn.body.message === 'You are already inside the gym.', 'Message is "You are already inside the gym."');

  // Verify occupancy did NOT increase
  const occAfterDup = await get('/api/gym/occupancy');
  assert(occAfterDup.body.currentMembers === 1, 'Occupancy remains 1 after duplicate attempt');
  assert(occAfterDup.body.availableSpots === 99, 'Available spots remains 99');

  // 7. Student 2 Scans Gym QR (Check In)
  console.log('\n[Step 7] Demo Scenario Step 2: Student 2 scans Gym QR...');
  const student2CheckIn = await post('/api/gym/check-in', { gymId: 'FITCOMMIT-GYM-001' }, trainerToken);
  assert(student2CheckIn.status === 200, 'Student 2 check-in returns 200 OK');
  assert(student2CheckIn.body.currentMembers === 2, 'Current occupancy increases to 2');
  assert(student2CheckIn.body.availableSpots === 98, 'Available spots decreases to 98');

  // 8. Other Users View Live Occupancy
  console.log('\n[Step 8] Demo Scenario Step 3: Another user opens FitCommit...');
  const otherUserOcc = await get('/api/gym/occupancy', baseToken);
  assert(otherUserOcc.body.currentMembers === 2, 'Other user sees 2 Members Inside');
  assert(otherUserOcc.body.availableSpots === 98, 'Other user sees 98 Spots Available');
  assert(otherUserOcc.body.occupancyPercentage === 2, 'Other user sees 2% Occupancy');
  assert(otherUserOcc.body.userStatus.isInside === false, 'Base user sees they are currently outside');

  // 9. Student 1 Check Status Check
  const student1Occ = await get('/api/gym/occupancy', premiumToken);
  assert(student1Occ.body.userStatus.isInside === true, 'Student 1 sees they are currently inside');
  assert(student1Occ.body.userStatus.checkInTime !== null, 'Student 1 has recorded checkInTime');

  // 10. Demo Scenario Step 4: Student 1 Clicks Check Out
  console.log('\n[Step 9] Demo Scenario Step 4: Student 1 clicks Check Out...');
  const student1CheckOut = await post('/api/gym/check-out', {}, premiumToken);
  assert(student1CheckOut.status === 200, 'Student 1 check-out returns 200 OK');
  assert(student1CheckOut.body.message === 'Checked out successfully.', 'Message is "Checked out successfully."');
  assert(student1CheckOut.body.currentMembers === 1, 'Current occupancy decreases from 2 to 1');
  assert(student1CheckOut.body.availableSpots === 99, 'Available spots increases from 98 to 99');

  // 11. Rule 2: Cannot Check Out When Outside
  console.log('\n[Step 10] Testing Rule 2: Cannot check out if not inside...');
  const repeatCheckOut = await post('/api/gym/check-out', {}, premiumToken);
  assert(repeatCheckOut.status === 400, 'Check-out when outside rejected with 400 Bad Request');
  assert(repeatCheckOut.body.error === 'You are not currently inside the gym.', 'Error message indicates not currently inside');

  // 12. Full URL Parsing Test
  console.log('\n[Step 11] Testing Full QR URL parameter extraction...');
  // Check out student 2 first
  await post('/api/gym/check-out', {}, trainerToken);
  const occReset = await get('/api/gym/occupancy');
  assert(occReset.body.currentMembers === 0, 'Occupancy back to 0');

  const urlCheckIn = await post('/api/gym/check-in', {
    gymId: 'http://172.16.210.219:5173/gym/check-in?gym=FITCOMMIT-GYM-001'
  }, premiumToken);
  assert(urlCheckIn.status === 200, 'Full URL payload automatically parsed and checked in');
  assert(urlCheckIn.body.currentMembers === 1, 'Occupancy is 1 after URL check-in');

  // 12. Rule 3 & 4: Capacity Limit Rejection ("Gym is currently full.")
  console.log('\n[Step 12] Testing Rule 3 & 4: Gym capacity limit rejection...');
  // Check out any active sessions first
  await post('/api/gym/reset-demo', {});
  const { query } = require('./config/db');

  // Temporarily set gym capacity to 1 to test full capacity enforcement
  await query("UPDATE gyms SET capacity = 1 WHERE gym_id = 1");
  // Student 1 checks in (occupancy becomes 1, which equals capacity 1)
  await post('/api/gym/check-in', { gymId: 'FITCOMMIT-GYM-001' }, premiumToken);
  
  // Student 2 attempts to check in when gym is at 100% capacity
  const fullCheckIn = await post('/api/gym/check-in', { gymId: 'FITCOMMIT-GYM-001' }, trainerToken);
  assert(fullCheckIn.status === 400, 'Check-in rejected when gym is at capacity with 400 Bad Request');
  assert(fullCheckIn.body.error === 'Gym is currently full.', 'Error is "Gym is currently full."');
  assert(fullCheckIn.body.availableSpots === 0, 'Available spots is 0 (never negative)');

  // Restore gym capacity back to 100 and clean up
  await query("UPDATE gyms SET capacity = 100 WHERE gym_id = 1");
  await post('/api/gym/check-out', {}, premiumToken);
  const postRestoreOcc = await get('/api/gym/occupancy');
  assert(postRestoreOcc.body.capacity === 100, 'Capacity restored to 100');
  assert(postRestoreOcc.body.currentMembers === 0, 'Current members reset to 0');
  assert(postRestoreOcc.body.availableSpots === 100, 'Available spots is 100');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passedCount} / ${totalCount} PASSED`);
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
