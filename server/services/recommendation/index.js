/**
 * FitCommit AI Recommendation Service - Unified Architecture Facade
 * Decoupled service layer orchestrating workout, diet, macro, and equipment alternatives.
 * Features built-in fallback resilience and strict non-medical guidelines.
 */

const { NON_MEDICAL_DISCLAIMER, normalizeUserContext } = require('./types');
const { calculateBMI, recommendMacronutrients } = require('./macroRecommendation');
const { recommendWorkout } = require('./workoutRecommendation');
const { recommendDiet } = require('./dietRecommendation');
const { recommendAlternativeExercises } = require('./alternativeExerciseEngine');
const fallback = require('./fallbackEngine');

class RecommendationService {
  constructor() {
    this.name = 'FitCommit Autonomous Recommendation Engine';
    this.version = '2.0.0';
    this.status = 'READY';
  }

  /**
   * Generates a personalized periodized workout plan
   */
  getWorkoutPlan(userContext) {
    try {
      const normalized = normalizeUserContext(userContext);
      const plan = recommendWorkout(normalized);
      return {
        success: true,
        source: 'AI_SPORTS_SCIENCE_ENGINE',
        fallback_applied: false,
        ...plan
      };
    } catch (err) {
      console.warn('[RecommendationService] Workout recommendation failed, engaging fallback:', err.message);
      return {
        success: true,
        ...fallback.getFallbackWorkout(userContext?.fitness_goal, userContext?.commitment_score)
      };
    }
  }

  /**
   * Generates a tailored daily diet protocol
   */
  getDietPlan(userContext) {
    try {
      const normalized = normalizeUserContext(userContext);
      const diet = recommendDiet(normalized);
      return {
        success: true,
        source: 'AI_SPORTS_SCIENCE_ENGINE',
        fallback_applied: false,
        ...diet
      };
    } catch (err) {
      console.warn('[RecommendationService] Diet recommendation failed, engaging fallback:', err.message);
      return {
        success: true,
        ...fallback.getFallbackDiet(userContext?.dietary_preference, 2200)
      };
    }
  }

  /**
   * Calculates Basal Metabolic Rate, TDEE, and macronutrient targets
   */
  getMacronutrients(userContext) {
    try {
      const normalized = normalizeUserContext(userContext);
      const macros = recommendMacronutrients(normalized);
      return {
        success: true,
        source: 'AI_SPORTS_SCIENCE_ENGINE',
        fallback_applied: false,
        ...macros
      };
    } catch (err) {
      console.warn('[RecommendationService] Macro recommendation failed, engaging fallback:', err.message);
      return {
        success: true,
        ...fallback.getFallbackMacronutrients(userContext?.weight, userContext?.height, userContext?.fitness_goal)
      };
    }
  }

  /**
   * Provides biomechanical alternative exercise recommendations when equipment is occupied
   */
  getAlternativeExercises(equipmentContext) {
    try {
      const alternatives = recommendAlternativeExercises(equipmentContext);
      return {
        success: true,
        source: 'AI_SPORTS_SCIENCE_ENGINE',
        fallback_applied: false,
        ...alternatives
      };
    } catch (err) {
      console.warn('[RecommendationService] Alternative exercise lookup failed, engaging fallback:', err.message);
      return {
        success: true,
        ...fallback.getFallbackAlternatives(equipmentContext?.equipment_name || equipmentContext?.name)
      };
    }
  }

  /**
   * Generates a comprehensive full-spectrum recommendation package
   */
  generateComprehensiveRecommendations(userContext) {
    const normalized = normalizeUserContext(userContext);
    
    const macros = this.getMacronutrients(normalized);
    const diet = this.getDietPlan({
      ...normalized,
      target_daily_calories: macros.energy_expenditure?.target_daily_calories || 2200
    });
    const workout = this.getWorkoutPlan(normalized);

    return {
      success: true,
      service_info: {
        engine: this.name,
        version: this.version,
        timestamp: new Date().toISOString()
      },
      user_summary: {
        height_cm: normalized.height_cm,
        weight_kg: normalized.weight_kg,
        bmi: macros.biometrics?.bmi,
        bmi_category: macros.biometrics?.bmi_category,
        fitness_goal: normalized.fitness_goal,
        commitment_score: normalized.commitment_score,
        activity_multiplier: normalized.activity_level,
        dietary_preference: normalized.dietary_preference
      },
      workout_recommendation: workout,
      diet_recommendation: diet,
      macronutrient_allocation: macros,
      disclaimer: NON_MEDICAL_DISCLAIMER
    };
  }

  // --- Backward-Compatible Legacy Interfaces ---
  calculateBMI(weightKg, heightCm) {
    const res = calculateBMI(weightKg, heightCm);
    return {
      bmi: res.bmi_value,
      category: res.category
    };
  }

  calculateMacronutrients(weightKg, heightCm, goal = 'General Fitness', age = 24, gender = 'male', activityLevel = 1.4) {
    const res = recommendMacronutrients({
      weight: weightKg,
      height: heightCm,
      fitness_goal: goal,
      age,
      gender,
      activity_level: activityLevel
    });

    return {
      dailyCalories: res.energy_expenditure.target_daily_calories,
      proteinIntake: res.macronutrients.protein.grams,
      carbIntake: res.macronutrients.carbohydrates.grams,
      fatIntake: res.macronutrients.fats.grams
    };
  }

  adaptWorkoutRoutine(baseRoutine, completionRatePercent) {
    let adjustmentFactor = 1.0;
    let adaptationNotes = 'Baseline routine maintained based on steady commitment.';

    if (completionRatePercent >= 80) {
      adjustmentFactor = 1.08;
      adaptationNotes = 'High adherence detected (≥80%). Progressive overload volume applied with slight set/rep expansion.';
    } else if (completionRatePercent < 60) {
      adjustmentFactor = 0.85;
      adaptationNotes = 'Lower consistency observed (<60%). Routine scaled down by 15% to prioritize recovery and prevent burnout.';
    }

    const adaptedSchedule = (baseRoutine || []).map(session => ({
      ...session,
      exercises: (session.exercises || []).map(ex => {
        let adaptedSets = ex.sets;
        if (adjustmentFactor > 1.0 && ex.sets < 5) {
          adaptedSets = ex.sets + 1;
        } else if (adjustmentFactor < 1.0 && ex.sets > 2) {
          adaptedSets = ex.sets - 1;
        }
        return {
          ...ex,
          sets: adaptedSets,
          targetRPE: +(ex.targetRPE * (adjustmentFactor >= 1 ? 1 : 0.95)).toFixed(1)
        };
      })
    }));

    return {
      adjustmentFactor,
      adaptationNotes,
      adaptedSchedule
    };
  }
}

const serviceInstance = new RecommendationService();

module.exports = {
  recommendationService: serviceInstance,
  calculateBMI: serviceInstance.calculateBMI.bind(serviceInstance),
  calculateMacronutrients: serviceInstance.calculateMacronutrients.bind(serviceInstance),
  adaptWorkoutRoutine: serviceInstance.adaptWorkoutRoutine.bind(serviceInstance),
  recommendWorkout: serviceInstance.getWorkoutPlan.bind(serviceInstance),
  recommendDiet: serviceInstance.getDietPlan.bind(serviceInstance),
  recommendAlternativeExercises: serviceInstance.getAlternativeExercises.bind(serviceInstance),
  generateComprehensiveRecommendations: serviceInstance.generateComprehensiveRecommendations.bind(serviceInstance),
  NON_MEDICAL_DISCLAIMER
};
