/**
 * Recommendation Controller
 * Exposes REST API endpoints for the decoupled AI Recommendation Service
 */

const { 
  recommendationService,
  NON_MEDICAL_DISCLAIMER 
} = require('../services/recommendation');
const EquipmentModel = require('../models/equipmentModel');
const WorkoutModel = require('../models/workoutModel');

/**
 * Helper to construct user recommendation context from session user and overrides
 */
async function buildUserContext(user, body = {}) {
  // Fetch user's current commitment score if available
  let commitmentScore = 82;
  try {
    const activeWorkout = await WorkoutModel.getCurrentPlan(user.user_id);
    if (activeWorkout && activeWorkout.commitment_score !== undefined) {
      commitmentScore = activeWorkout.commitment_score;
    }
  } catch (err) {
    // default baseline
  }

  // Fetch currently occupied gym equipment to inform workout plan
  let occupiedEquipment = [];
  try {
    const allEq = await EquipmentModel.getAllWithSensors();
    occupiedEquipment = allEq.filter(eq => eq.occupancy_status === 'OCCUPIED');
  } catch (err) {
    // non-fatal
  }

  return {
    height: body.height || user.height || 178,
    weight: body.weight || user.weight || 72.5,
    age: body.age || 24,
    gender: body.gender || 'male',
    fitness_goal: body.fitness_goal || user.fitness_goal || 'Muscle Gain',
    activity_level: body.activity_level || 1.4,
    commitment_score: body.commitment_score !== undefined ? body.commitment_score : commitmentScore,
    dietary_preference: body.dietary_preference || 'Omnivore',
    experience_level: body.experience_level || 'Intermediate',
    equipment_availability: occupiedEquipment,
    previous_performance: body.previous_performance || {
      completed_this_week: 3,
      target_this_week: 4,
      avg_rpe: 7.5
    }
  };
}

const recommendationController = {
  /**
   * POST /api/recommendations/workout
   * Generates personalized workout recommendation
   */
  async getWorkoutRecommendation(req, res) {
    try {
      const userContext = await buildUserContext(req.user, req.body);
      const result = recommendationService.getWorkoutPlan(userContext);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate workout recommendation', details: err.message });
    }
  },

  /**
   * POST /api/recommendations/diet
   * Generates personalized diet recommendation
   */
  async getDietRecommendation(req, res) {
    try {
      const userContext = await buildUserContext(req.user, req.body);
      const result = recommendationService.getDietPlan(userContext);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate diet recommendation', details: err.message });
    }
  },

  /**
   * POST /api/recommendations/macros
   * Calculates TDEE and macronutrient gram partition
   */
  async getMacroRecommendation(req, res) {
    try {
      const userContext = await buildUserContext(req.user, req.body);
      const result = recommendationService.getMacronutrients(userContext);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to calculate macronutrients', details: err.message });
    }
  },

  /**
   * POST /api/recommendations/alternatives
   * Biomechanical alternative exercise suggestions when equipment is occupied
   */
  async getAlternativeExercises(req, res) {
    try {
      const { equipment_id, equipment_name, category, occupied_equipment } = req.body;

      let targetName = equipment_name;
      let targetCat = category;

      // If equipment_id provided, lookup from database
      if (equipment_id && !targetName) {
        const item = await EquipmentModel.getWithSensor(equipment_id);
        if (item) {
          targetName = item.equipment_name;
          targetCat = item.category;
        }
      }

      // Collect currently occupied equipment from database if not explicitly passed
      let occupiedList = occupied_equipment || [];
      if (!occupied_equipment) {
        const allEq = await EquipmentModel.getAllWithSensors();
        occupiedList = allEq.filter(e => e.occupancy_status === 'OCCUPIED').map(e => e.equipment_name);
      }

      const result = recommendationService.getAlternativeExercises({
        equipment_name: targetName,
        category: targetCat,
        occupied_equipment: occupiedList,
        is_occupied: true
      });

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch alternative exercise suggestions', details: err.message });
    }
  },

  /**
   * GET /api/recommendations/my-recommendations
   * Full comprehensive dossier tailored to the authenticated member
   */
  async getComprehensiveRecommendation(req, res) {
    try {
      const userContext = await buildUserContext(req.user, req.query);
      const dossier = recommendationService.generateComprehensiveRecommendations(userContext);
      res.json(dossier);
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate comprehensive recommendations', details: err.message });
    }
  }
};

module.exports = {
  recommendationController
};
