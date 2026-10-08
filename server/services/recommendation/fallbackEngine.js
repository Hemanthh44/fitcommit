/**
 * FitCommit Reliable Fallback Recommendation Engine
 * Provides deterministic, fail-safe sports science baselines when external AI services or complex pipelines are unavailable.
 * Aligned with Academic Demonstration Requirements & Software Fault Tolerance
 */

const { NON_MEDICAL_DISCLAIMER } = require('./types');

/**
 * Deterministic Baseline Workout Plan
 */
function getFallbackWorkout(goal = 'General Fitness', commitmentScore = 75) {
  const scaling = commitmentScore >= 80 ? 1.08 : commitmentScore < 60 ? 0.85 : 1.0;
  
  return {
    source: 'DETERMINISTIC_FALLBACK',
    fallback_applied: true,
    plan_name: `Baseline Academic Conditioning Plan (${goal})`,
    target_goal: goal,
    difficulty_level: 'Intermediate',
    commitment_evaluation: {
      score: commitmentScore,
      tier: 'RELIABLE_BASELINE',
      volume_scaling_factor: scaling,
      notes: 'Generated via deterministic sports science fallback engine.'
    },
    periodization_structure: {
      split_type: 'Full Body & Compound Core (ACSM Baseline)',
      target_sessions_per_week: 3,
      rest_days_per_week: 4,
      rpe_guideline: '7.0 - 8.0'
    },
    schedule: [
      {
        day: 'Session A',
        name: 'Full Body Compound Fundamentals',
        focus: 'Knee Flexion, Horizontal Push & Vertical Pull',
        durationMinutes: 45,
        exercises: [
          { name: 'Goblet Squat', sets: 3, reps: '10-12', targetRPE: 7.5, equipment: 'Dumbbell' },
          { name: 'Dumbbell Flat Bench Press', sets: 3, reps: '8-10', targetRPE: 7.5, equipment: 'Dumbbells & Bench' },
          { name: 'Lat Pulldown / Band Pull-Down', sets: 3, reps: '10-12', targetRPE: 7.5, equipment: 'Cable / Band' },
          { name: 'Plank Hold', sets: 3, reps: '45 seconds', targetRPE: 7.0, equipment: 'Mat' }
        ]
      },
      {
        day: 'Session B',
        name: 'Posterior Chain & Shoulder Health',
        focus: 'Hip Hinge, Vertical Push & Horizontal Retraction',
        durationMinutes: 45,
        exercises: [
          { name: 'Romanian Deadlift (Dumbbell)', sets: 3, reps: '10-12', targetRPE: 7.5, equipment: 'Dumbbells' },
          { name: 'Seated Dumbbell Overhead Press', sets: 3, reps: '10-12', targetRPE: 7.5, equipment: 'Dumbbells' },
          { name: 'Chest-Supported Dumbbell Row', sets: 3, reps: '10-12', targetRPE: 7.5, equipment: 'Dumbbells & Bench' },
          { name: 'Glute Bridges', sets: 3, reps: '15 reps', targetRPE: 7.0, equipment: 'Mat' }
        ]
      }
    ],
    disclaimer: NON_MEDICAL_DISCLAIMER
  };
}

/**
 * Deterministic Baseline Macronutrient Allocation
 */
function getFallbackMacronutrients(weightKg = 70, heightCm = 175, goal = 'General Fitness') {
  const safeWeight = Math.max(40, Math.min(200, weightKg));
  const safeHeight = Math.max(120, Math.min(220, heightCm));
  const heightM = safeHeight / 100;
  const bmi = +(safeWeight / (heightM * heightM)).toFixed(2);

  // ACSM Standard: 30-35 kcal/kg for active gym participants
  const baseKcal = Math.round(safeWeight * 32);
  const proteinG = Math.round(safeWeight * 1.8);
  const fatG = Math.round((baseKcal * 0.28) / 9);
  const carbG = Math.round((baseKcal - (proteinG * 4 + fatG * 9)) / 4);

  return {
    source: 'DETERMINISTIC_FALLBACK',
    fallback_applied: true,
    biometrics: {
      height_cm: safeHeight,
      weight_kg: safeWeight,
      bmi,
      bmi_category: bmi < 18.5 ? 'Underweight' : bmi >= 25 ? 'Overweight' : 'Normal Weight'
    },
    energy_expenditure: {
      bmr_kcal: Math.round(10 * safeWeight + 6.25 * safeHeight - 5 * 24 + 5),
      tdee_kcal: baseKcal,
      target_daily_calories: baseKcal,
      caloric_delta: 0,
      rationale: 'Calculated using standard ACSM bodyweight metabolic coefficients.'
    },
    macronutrients: {
      protein: { grams: proteinG, calories: proteinG * 4, grams_per_kg: 1.8 },
      carbohydrates: { grams: carbG, calories: carbG * 4 },
      fats: { grams: fatG, calories: fatG * 9 }
    },
    hydration: {
      recommended_water_ml: Math.round(safeWeight * 35),
      recommended_liters: +((safeWeight * 35) / 1000).toFixed(1)
    },
    disclaimer: NON_MEDICAL_DISCLAIMER
  };
}

/**
 * Deterministic Baseline Diet Plan
 */
function getFallbackDiet(dietaryPreference = 'Omnivore', targetCalories = 2200) {
  return {
    source: 'DETERMINISTIC_FALLBACK',
    fallback_applied: true,
    plan_name: `Standard Sports Nutrition Protocol (${dietaryPreference})`,
    dietary_preference: dietaryPreference,
    energy_targets: { target_daily_calories: targetCalories },
    meal_structure: {
      breakfast: {
        title: 'Balanced Morning Fuel',
        items: ['Rolled oats with fresh berries and seeds', '2-3 eggs or high-protein yogurt alternative', 'Water / Green tea'],
        calories: Math.round(targetCalories * 0.28)
      },
      lunch: {
        title: 'Nutrient-Dense Midday Bowl',
        items: ['Lean protein source (poultry, fish, tofu, or tempeh - 180g)', 'Whole grain complex carbohydrate (quinoa, brown rice - 150g)', 'Steamed mixed green vegetables'],
        calories: Math.round(targetCalories * 0.35)
      },
      pre_workout: {
        title: 'Pre-Training Energy Snack',
        items: ['1 medium fruit (banana or apple)', '1 tablespoon natural nut butter'],
        calories: Math.round(targetCalories * 0.12)
      },
      dinner: {
        title: 'Evening Recovery Meal',
        items: ['Grilled protein portion (180g)', 'Roasted root vegetables or sweet potatoes', 'Fresh salad with cold-pressed olive oil'],
        calories: Math.round(targetCalories * 0.25)
      }
    },
    disclaimer: NON_MEDICAL_DISCLAIMER
  };
}

/**
 * Deterministic Alternative Exercises Fallback
 */
function getFallbackAlternatives(equipmentName = 'Gym Equipment') {
  return {
    source: 'DETERMINISTIC_FALLBACK',
    fallback_applied: true,
    queried_equipment: equipmentName,
    alternatives: [
      {
        alternative_name: 'Dumbbell / Free-Weight Universal Alternative',
        difficulty: 'All Levels',
        required_equipment: 'Dumbbells',
        biomechanical_notes: 'Replaces fixed mechanical pathway with free range of motion.',
        form_cues: 'Focus on full range of motion, eccentric control of 2-3 seconds, and steady breathing.'
      },
      {
        alternative_name: 'Bodyweight Resistance Alternative',
        difficulty: 'Beginner - Intermediate',
        required_equipment: 'Bodyweight / Floor Mat',
        biomechanical_notes: 'Closed kinetic chain variation preserving target muscle recruitment.',
        form_cues: 'Squeeze target muscle group at peak contraction for 1 full second.'
      }
    ],
    disclaimer: NON_MEDICAL_DISCLAIMER
  };
}

module.exports = {
  getFallbackWorkout,
  getFallbackMacronutrients,
  getFallbackDiet,
  getFallbackAlternatives
};
