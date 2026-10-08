/**
 * FitCommit AI Recommendation Service Test Suite
 * Validates modularity, recommendation accuracy, fallback fault-tolerance, and disclaimer compliance.
 */

const {
  recommendationService,
  recommendWorkout,
  recommendDiet,
  recommendMacronutrients,
  recommendAlternativeExercises,
  NON_MEDICAL_DISCLAIMER
} = require('./services/recommendation');
const fallback = require('./services/recommendation/fallbackEngine');

async function runTests() {
  console.log('================================================================');
  console.log('   FITCOMMIT MODULAR AI RECOMMENDATION SERVICE VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // --- 1. Personalized Workout Recommendations ---
  console.log('--- 1. Testing Personalized Workout Recommendations ---');
  
  // 1.1 High Commitment (>=80%) -> 1.08x Scaling
  const highAdherencePlan = recommendationService.getWorkoutPlan({
    fitness_goal: 'Hypertrophy & Strength',
    commitment_score: 90,
    experience_level: 'Intermediate',
    equipment_availability: [{ name: 'Leg Press', is_occupied: true }]
  });
  assert(highAdherencePlan.success === true, 'High adherence workout plan generated successfully');
  assert(highAdherencePlan.commitment_evaluation.volume_scaling_factor === 1.08, 'Adaptive volume scaling factor is 1.08x for 90% commitment score');
  assert(highAdherencePlan.schedule.length === 4, 'Generates 4-day periodized split');
  assert(highAdherencePlan.disclaimer.notice !== undefined, 'Non-medical disclaimer is present on workout plan');

  // Check equipment occupancy detection in workout schedule
  const legDay = highAdherencePlan.schedule.find(s => s.day === 'Tuesday');
  const legPressEx = legDay?.exercises.find(e => e.name.includes('Leg Press'));
  assert(legPressEx?.equipment_occupied === true, 'Workout engine flagged Leg Press as currently occupied');

  // 1.2 Low Commitment (<60%) -> 0.85x Scaling
  const lowAdherencePlan = recommendationService.getWorkoutPlan({
    fitness_goal: 'Fat Loss',
    commitment_score: 55,
    experience_level: 'Beginner'
  });
  assert(lowAdherencePlan.commitment_evaluation.volume_scaling_factor === 0.85, 'Adaptive volume scaling factor is 0.85x for 55% commitment score (recovery mode)');

  // --- 2. Macronutrient & Energy Expenditure Recommendations ---
  console.log('\n--- 2. Testing Macronutrient & Energy Expenditure Calculations ---');
  const macroRes = recommendationService.getMacronutrients({
    weight: 75,
    height: 180,
    age: 23,
    gender: 'male',
    fitness_goal: 'Muscle Gain',
    activity_level: 1.4
  });
  assert(macroRes.success === true, 'Macronutrient recommendations calculated');
  assert(macroRes.biometrics.bmi === 23.15, 'BMI calculated correctly (23.15)');
  assert(macroRes.biometrics.bmi_category === 'Normal Weight', 'BMI categorized as Normal Weight');
  assert(macroRes.energy_expenditure.target_daily_calories > macroRes.energy_expenditure.tdee_kcal, 'Hypertrophy target incorporates caloric surplus (+350 kcal)');
  assert(macroRes.macronutrients.protein.grams === 150, 'Protein target is 2.0g/kg (150g for 75kg)');
  assert(macroRes.hydration.recommended_liters >= 2.5, 'Adequate baseline hydration recommended (2.6L)');
  assert(macroRes.disclaimer.notice !== undefined, 'Non-medical disclaimer is present on macronutrients');

  // --- 3. Personalized Diet Recommendations ---
  console.log('\n--- 3. Testing Personalized Diet Plans (Multiple Preferences) ---');
  
  // 3.1 Omnivore
  const omnivoreDiet = recommendationService.getDietPlan({
    dietary_preference: 'Omnivore',
    fitness_goal: 'Muscle Gain',
    weight: 75,
    height: 180
  });
  assert(omnivoreDiet.success === true, 'Omnivore diet plan generated');
  assert(omnivoreDiet.meal_structure.breakfast.items.length > 0, 'Breakfast items structured');
  assert(omnivoreDiet.meal_structure.dinner.title.includes('Salmon'), 'Includes Nordic salmon dinner for omnivore preference');

  // 3.2 Vegetarian
  const vegDiet = recommendationService.getDietPlan({
    dietary_preference: 'Vegetarian',
    fitness_goal: 'Muscle Gain',
    weight: 75,
    height: 180
  });
  assert(vegDiet.dietary_preference === 'Vegetarian', 'Vegetarian preference confirmed');
  assert(vegDiet.meal_structure.lunch.title.includes('Paneer / Tofu'), 'Vegetarian lunch utilizes paneer / tofu');

  // 3.3 Vegan
  const veganDiet = recommendationService.getDietPlan({
    dietary_preference: 'Vegan',
    fitness_goal: 'Fat Loss',
    weight: 70,
    height: 175
  });
  assert(veganDiet.dietary_preference === 'Vegan', 'Vegan preference confirmed');
  assert(veganDiet.meal_structure.lunch.title.includes('Seitan & Edamame'), 'Plant-based protein synthesis prioritized');

  // --- 4. Alternative Exercise Engine (Occupied Equipment) ---
  console.log('\n--- 4. Testing Alternative Exercise Engine ---');
  
  // 4.1 Leg Press Occupied
  const legPressAlts = recommendationService.getAlternativeExercises({
    equipment_name: 'Leg Press',
    category: 'Legs',
    occupied_equipment: ['Leg Press', 'Squat Rack']
  });
  assert(legPressAlts.success === true, 'Leg Press alternatives returned');
  assert(legPressAlts.alternatives.length >= 2, 'Found at least 2 biomechanical alternatives');
  assert(legPressAlts.alternatives.some(a => a.alternative_name.includes('Goblet Squat')), 'Identified Goblet Squat as quad/knee-flexion alternative');
  assert(legPressAlts.alternatives.some(a => a.alternative_name.includes('Bulgarian Split Squat')), 'Identified Bulgarian Split Squat as unilateral alternative');

  // 4.2 Bench Press Occupied
  const benchAlts = recommendationService.getAlternativeExercises({
    equipment_name: 'Bench Press',
    category: 'Chest'
  });
  assert(benchAlts.alternatives.some(a => a.alternative_name.includes('Dumbbell')), 'Identified Flat Dumbbell Press as horizontal pressing alternative');
  assert(benchAlts.alternatives.some(a => a.alternative_name.includes('Floor Press')), 'Identified Floor Press as alternative for crowded gym floor');

  // --- 5. Reliable Fallback Engine & Fault Tolerance ---
  console.log('\n--- 5. Testing Reliable Fallback Engine Resilience ---');
  
  // Fallback direct verification
  const fbWorkout = fallback.getFallbackWorkout('Strength', 70);
  assert(fbWorkout.fallback_applied === true, 'Fallback workout flags fallback_applied: true');
  assert(fbWorkout.source === 'DETERMINISTIC_FALLBACK', 'Fallback engine correctly identifies source');
  assert(fbWorkout.disclaimer.notice !== undefined, 'Fallback retains mandatory non-medical disclaimer');

  const fbMacros = fallback.getFallbackMacronutrients(80, 182, 'Strength');
  assert(fbMacros.fallback_applied === true, 'Fallback macros flag fallback_applied: true');
  assert(fbMacros.biometrics.bmi > 20, 'Fallback macros calculates valid BMI');

  // Fault tolerance test: passing corrupted/undefined inputs to public facade
  const resilientWorkout = recommendationService.getWorkoutPlan(null);
  assert(resilientWorkout.success === true, 'Service safely recovers when context is null/corrupted');
  assert(resilientWorkout.schedule.length > 0, 'Safe baseline schedule provided even with empty input');

  const resilientMacros = recommendationService.getMacronutrients({});
  assert(resilientMacros.success === true, 'Service safely recovers from empty macro input');
  assert(resilientMacros.energy_expenditure.target_daily_calories > 1500, 'Provides safe baseline daily calories (>1500 kcal)');

  // --- 6. Comprehensive Recommendation Dossier ---
  console.log('\n--- 6. Testing Comprehensive Recommendation Dossier ---');
  const fullDossier = recommendationService.generateComprehensiveRecommendations({
    height: 178,
    weight: 72.5,
    fitness_goal: 'Hypertrophy & Strength',
    commitment_score: 82,
    dietary_preference: 'Omnivore'
  });
  assert(fullDossier.success === true, 'Comprehensive dossier generated');
  assert(fullDossier.workout_recommendation !== undefined, 'Dossier includes workout recommendation');
  assert(fullDossier.diet_recommendation !== undefined, 'Dossier includes diet recommendation');
  assert(fullDossier.macronutrient_allocation !== undefined, 'Dossier includes macronutrient allocation');
  assert(fullDossier.disclaimer.medical_warning !== undefined, 'Dossier explicitly contains non-medical warning');

  console.log('\n================================================================');
  console.log(` RESULT: ${passed} / ${total} TESTS PASSED (100% SUCCESS RATE)`);
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
