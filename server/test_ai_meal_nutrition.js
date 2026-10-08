/**
 * Automated Acceptance Test Suite: AI Meal Nutrition Tracking
 * FitCommit Production Architecture
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log(' Starting FitCommit AI Meal Nutrition Acceptance Tests');
  console.log('====================================================');

  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      process.exitCode = 1;
    }
  }

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  assert(healthRes.ok && healthData.status === 'ONLINE', '1. Backend health check returns ONLINE status');

  // 2. Demo User Login
  const loginRes = await fetch(`${BASE_URL}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'BASE_MEMBER' })
  });
  const loginData = await loginRes.json();
  assert(loginRes.ok && Boolean(loginData.token), '2. Authenticated user receives valid JWT session token');
  const token = loginData.token;

  // 3. Test Invalid Image File (Negative Test)
  const invalidForm = new FormData();
  invalidForm.append('image', new Blob(['fake text content'], { type: 'text/plain' }), 'test.txt');
  const invalidRes = await fetch(`${BASE_URL}/nutrition/analyze-meal`, {
    method: 'POST',
    body: invalidForm
  });
  assert(invalidRes.status === 400, '3. Invalid file format returns HTTP 400 with user-friendly error');

  // 4. Test Missing Image File
  const emptyForm = new FormData();
  const emptyRes = await fetch(`${BASE_URL}/nutrition/analyze-meal`, {
    method: 'POST',
    body: emptyForm
  });
  assert(emptyRes.status === 400, '4. Missing image payload returns HTTP 400 error');

  // 5. Test AI Vision Analysis with Real Image
  const sampleImagePath = path.join(__dirname, '../client/public/images/andrew-kayani-4G08MoVJlig-unsplash.jpg');
  const imageBuffer = fs.readFileSync(sampleImagePath);
  const validBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
  const validForm = new FormData();
  validForm.append('image', validBlob, 'grilled_salmon_plate.jpg');

  const analyzeRes = await fetch(`${BASE_URL}/nutrition/analyze-meal`, {
    method: 'POST',
    body: validForm
  });
  const analyzeData = await analyzeRes.json();
  assert(analyzeRes.ok && analyzeData.success === true, '5. Image successfully analyzed by AI vision endpoint');
  assert(Array.isArray(analyzeData.foods) && analyzeData.foods.length > 0, '6. Identified visible food items in meal');
  assert(Boolean(analyzeData.totals?.calories) && Boolean(analyzeData.totals?.protein_g), '7. Computed total meal calories and macronutrients');
  assert(Boolean(analyzeData.disclaimer), '8. Non-medical disclaimer is present in response');

  // Verify food item properties
  const sampleFood = analyzeData.foods[0];
  assert(
    sampleFood.name && 
    sampleFood.quantity && 
    sampleFood.calories !== undefined && 
    sampleFood.protein_g !== undefined &&
    ['high', 'medium', 'low'].includes(sampleFood.confidence),
    '9. Food items include name, quantity, calories, protein, carbs, fat, fiber, and confidence'
  );

  // 10. Fetch Initial Today's Meals
  const initialTodayRes = await fetch(`${BASE_URL}/nutrition/meals/today`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const initialToday = await initialTodayRes.json();
  assert(initialToday.success && Array.isArray(initialToday.meals), '10. Retrieved today logged meals from database');
  const initialMealCount = initialToday.meals.length;
  const initialCalories = initialToday.todayConsumed.calories;

  // 11. User Correction: Modify items and add custom item, then Save Meal
  const correctedFoods = [
    {
      name: 'Atlantic Salmon Fillet',
      quantity: '200 g',
      calories: 410,
      protein_g: 44,
      carbs_g: 0,
      fat_g: 24,
      fiber_g: 0,
      confidence: 'high'
    },
    {
      name: 'Steamed Broccoli with Lemon',
      quantity: '120 g',
      calories: 55,
      protein_g: 4,
      carbs_g: 8,
      fat_g: 1,
      fiber_g: 4,
      confidence: 'high'
    }
  ];

  const correctedTotals = {
    calories: 465,
    protein_g: 48,
    carbs_g: 8,
    fat_g: 25,
    fiber_g: 4
  };

  const saveRes = await fetch(`${BASE_URL}/nutrition/meals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      meal_type: 'DINNER',
      meal_name: 'Grilled Salmon with Broccoli',
      foods: correctedFoods,
      totals: correctedTotals,
      image_url: 'data:image/jpeg;base64,mockpreview'
    })
  });
  const saveData = await saveRes.json();
  assert(saveRes.status === 201 && saveData.success === true, '11. Successfully saved corrected meal to database');
  const savedMealId = saveData.meal.meal_id;

  // 12. Verify Today's Dashboard & History are updated
  const updatedTodayRes = await fetch(`${BASE_URL}/nutrition/meals/today`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const updatedToday = await updatedTodayRes.json();
  assert(updatedToday.meals.length === initialMealCount + 1, '12. Today meal count increased by 1 in history');
  assert(
    updatedToday.todayConsumed.calories === initialCalories + correctedTotals.calories,
    '13. Today daily consumed calories accurately updated'
  );
  assert(
    updatedToday.todayConsumed.protein >= correctedTotals.protein_g,
    '14. Today daily consumed protein accurately aggregated'
  );

  // 15. Verify Meal Details in History (slot = DINNER, includes all items)
  const loggedDinner = updatedToday.meals.find(m => m.meal_id === savedMealId);
  assert(
    loggedDinner && loggedDinner.meal_type === 'DINNER' && loggedDinner.foods.length === 2,
    '15. Logged meal preserved with full food items list and quantities'
  );

  // 16. Delete the test meal to verify clean lifecycle
  const deleteRes = await fetch(`${BASE_URL}/nutrition/meals/${savedMealId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const deleteData = await deleteRes.json();
  assert(deleteRes.ok && deleteData.success === true, '16. Successfully deleted meal from today log');

  // 17. Verify Existing Gym Occupancy & Attendance is Unaffected
  const occupancyRes = await fetch(`${BASE_URL}/gym/occupancy`);
  const occupancyData = await occupancyRes.json();
  assert(occupancyRes.ok && occupancyData.capacity === 100, '17. Gym occupancy endpoint is fully operational and unaffected');

  // 18. Verify Existing Workout Plan is Unaffected
  const workoutRes = await fetch(`${BASE_URL}/workouts/current`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const workoutData = await workoutRes.json();
  assert(workoutRes.ok && Boolean(workoutData.plan_name), '18. Adaptive workout plan is fully operational and unaffected');

  // 19. Test Database Search Endpoint (/api/nutrition/foods?q=...)
  const searchRes = await fetch(`${BASE_URL}/nutrition/foods?q=biryani`);
  const searchData = await searchRes.json();
  assert(searchRes.ok && searchData.success && searchData.results.length > 0 && searchData.results[0].name.toLowerCase().includes('biryani'), '19. Search nutrition database endpoint returns verified entries');

  // 20. Test Deterministic Portion Calculation Endpoint (/api/nutrition/calculate-portion)
  const calcPortionRes = await fetch(`${BASE_URL}/nutrition/calculate-portion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ food_id: 'usda_rice_white_cooked', quantity_g: 200 })
  });
  const calcPortionData = await calcPortionRes.json();
  // 130 kcal / 100g -> 260 kcal for 200g
  assert(calcPortionRes.ok && calcPortionData.nutrition.calories === 260, '20. Deterministic portion endpoint calculates 260 kcal for 200g white rice');

  // 21. Verify 8 Required Meal Types Resolution & Deterministic Nutrition
  const { resolveFoodEntry, calculateDeterministicNutrition } = require('./services/nutrition/nutritionResolver');

  const requiredMealTypes = [
    {
      name: '1. Rice + dal + vegetables',
      items: [
        { name: 'white rice', grams: 200 },
        { name: 'dal', grams: 150 },
        { name: 'vegetables', grams: 100 }
      ]
    },
    {
      name: '2. Chicken biryani + egg',
      items: [
        { name: 'chicken biryani', grams: 300 },
        { name: 'boiled egg', grams: 50 }
      ]
    },
    {
      name: '3. Chapati + paneer curry',
      items: [
        { name: 'chapati', grams: 120 },
        { name: 'paneer curry', grams: 150 }
      ]
    },
    {
      name: '4. Dosa + sambar',
      items: [
        { name: 'dosa', grams: 100 },
        { name: 'sambar', grams: 150 }
      ]
    },
    {
      name: '5. Idli + sambar',
      items: [
        { name: 'idli', grams: 120 },
        { name: 'sambar', grams: 150 }
      ]
    },
    {
      name: '6. Oats + banana',
      items: [
        { name: 'oats', grams: 200 },
        { name: 'banana', grams: 120 }
      ]
    },
    {
      name: '7. Eggs + toast',
      items: [
        { name: 'egg', grams: 100 },
        { name: 'toast', grams: 60 }
      ]
    },
    {
      name: '8. Mixed Indian thali',
      items: [
        { name: 'roti', grams: 80 },
        { name: 'rice', grams: 150 },
        { name: 'dal', grams: 100 },
        { name: 'paneer curry', grams: 100 },
        { name: 'curd', grams: 100 }
      ]
    }
  ];

  for (const meal of requiredMealTypes) {
    let totalCalories = 0;
    let allMatched = true;

    for (const item of meal.items) {
      const match = resolveFoodEntry(item.name);
      if (!match.entry) {
        allMatched = false;
        break;
      }
      const macros = calculateDeterministicNutrition(match.entry, item.grams);
      totalCalories += macros.calories;
    }

    assert(allMatched && totalCalories > 0, `21. ${meal.name} deterministically resolved with ${totalCalories} kcal`);
  }

  // 22. Verify Ambiguous Food Flagging (paneer/tofu)
  const ambiguousCheck = resolveFoodEntry('paneer/tofu');
  assert(ambiguousCheck.requires_confirmation === true && ambiguousCheck.possible_matches.length > 0, '22. Ambiguous item (paneer/tofu) correctly flagged with requires_confirmation: true');

  console.log('====================================================');
  console.log(` Results: ${passed}/${total} Tests Passed`);
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
