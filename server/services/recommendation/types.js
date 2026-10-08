/**
 * FitCommit Recommendation Service - Types & Context Normalizer
 * Standardized data transfer contracts and safety boundaries
 */

const NON_MEDICAL_DISCLAIMER = Object.freeze({
  notice: "FitCommit fitness, workout, and nutritional recommendations are derived from standard exercise physiology and sports science models for physical conditioning and educational purposes only.",
  medical_warning: "This service does not provide medical advice, diagnosis, or clinical prescription. Consult a qualified physician or healthcare professional before initiating new exercise or diet regimens.",
  standards: "Aligned with ACSM (American College of Sports Medicine) and ISSN (International Society of Sports Nutrition) guidelines."
});

/**
 * Validates and normalizes structured user context
 * @param {Object} input
 * @returns {Object} normalizedContext
 */
function normalizeUserContext(input = {}) {
  const heightCm = Math.max(120, Math.min(240, parseFloat(input.height || input.height_cm || 178)));
  const weightKg = Math.max(35, Math.min(250, parseFloat(input.weight || input.weight_kg || 72.5)));
  const age = Math.max(16, Math.min(90, parseInt(input.age || 24, 10)));
  const gender = (input.gender || 'male').toLowerCase() === 'female' ? 'female' : 'male';
  
  // Normalized Goal
  const rawGoal = (input.fitness_goal || input.goal || 'Hypertrophy & Strength').trim();
  let normalizedGoal = 'General Fitness';
  if (/muscle|hypertrophy|bulk/i.test(rawGoal)) normalizedGoal = 'Muscle Gain';
  else if (/fat|cut|weight loss|lean/i.test(rawGoal)) normalizedGoal = 'Fat Loss';
  else if (/strength|power/i.test(rawGoal)) normalizedGoal = 'Strength';
  else if (/endurance|cardio|stamina/i.test(rawGoal)) normalizedGoal = 'Endurance';

  // Activity Multiplier (1.2 Sedentary to 1.9 Athletic)
  let activityLevel = parseFloat(input.activity_level || 1.4);
  if (isNaN(activityLevel) || activityLevel < 1.1 || activityLevel > 2.0) {
    activityLevel = 1.4; // Default moderate gym goer (3-4 days/week)
  }

  // Commitment & Adherence Score (0 to 100)
  const commitmentScore = Math.max(0, Math.min(100, parseInt(input.commitment_score || input.adherence || 82, 10)));
  const adherenceRate = +(commitmentScore / 100).toFixed(2);

  // Dietary Preferences
  const rawDiet = (input.dietary_preference || input.diet || 'Omnivore').trim();
  let dietaryPreference = 'Omnivore';
  if (/veg|plant/i.test(rawDiet) && !/non/i.test(rawDiet)) {
    dietaryPreference = /vegan/i.test(rawDiet) ? 'Vegan' : 'Vegetarian';
  } else if (/pesca/i.test(rawDiet)) {
    dietaryPreference = 'Pescatarian';
  } else if (/keto|low carb/i.test(rawDiet)) {
    dietaryPreference = 'Keto';
  }

  // Experience level
  const experienceLevel = ['Beginner', 'Intermediate', 'Advanced'].includes(input.experience_level)
    ? input.experience_level
    : 'Intermediate';

  return {
    height_cm: heightCm,
    weight_kg: weightKg,
    age,
    gender,
    fitness_goal: normalizedGoal,
    raw_goal: rawGoal,
    activity_level: activityLevel,
    commitment_score: commitmentScore,
    adherence_rate: adherenceRate,
    dietary_preference: dietaryPreference,
    experience_level: experienceLevel,
    equipment_availability: Array.isArray(input.equipment_availability) ? input.equipment_availability : [],
    previous_performance: input.previous_performance || {
      completed_this_week: 3,
      target_this_week: 4,
      avg_rpe: 7.5
    }
  };
}

module.exports = {
  NON_MEDICAL_DISCLAIMER,
  normalizeUserContext
};
