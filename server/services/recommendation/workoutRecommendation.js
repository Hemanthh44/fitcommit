/**
 * Workout Recommendation & Adaptive Routine Engine
 * Evaluates goal, commitment adherence, experience, and equipment availability
 * Aligned with SRS Requirements F5, F7, U4
 */

const { NON_MEDICAL_DISCLAIMER, normalizeUserContext } = require('./types');

/**
 * Standard Training Split Templates
 */
const SPLIT_TEMPLATES = {
  UPPER_LOWER_4DAY: [
    {
      day: 'Monday',
      name: 'Upper Body Hypertrophy & Power',
      focus: 'Chest, Back, Shoulders & Arms',
      durationMinutes: 50,
      exercises: [
        { name: 'Barbell / Dumbbell Bench Press', sets: 4, reps: '8-10', targetRPE: 8.0, equipment: 'Bench Press', primaryMuscle: 'Chest' },
        { name: 'Chest-Supported Row', sets: 4, reps: '10-12', targetRPE: 7.5, equipment: 'Dumbbells / Bench', primaryMuscle: 'Upper Back' },
        { name: 'Overhead Dumbbell Press', sets: 3, reps: '10-12', targetRPE: 8.0, equipment: 'Dumbbells', primaryMuscle: 'Anterior Deltoid' },
        { name: 'Lat Pulldown', sets: 3, reps: '10-12', targetRPE: 7.5, equipment: 'Lat Pulldown', primaryMuscle: 'Lats' },
        { name: 'Incline Dumbbell Bicep Curl', sets: 3, reps: '12-15', targetRPE: 8.5, equipment: 'Dumbbells', primaryMuscle: 'Biceps' },
        { name: 'Triceps Overhead Cable Extension', sets: 3, reps: '12-15', targetRPE: 8.5, equipment: 'Cable Machine', primaryMuscle: 'Triceps' }
      ]
    },
    {
      day: 'Tuesday',
      name: 'Lower Body Strength & Posterior Chain',
      focus: 'Quadriceps, Hamstrings & Calves',
      durationMinutes: 55,
      exercises: [
        { name: 'Barbell Back Squat / Hack Squat', sets: 4, reps: '6-8', targetRPE: 8.0, equipment: 'Squat Rack', primaryMuscle: 'Quadriceps' },
        { name: 'Romanian Deadlift', sets: 4, reps: '8-10', targetRPE: 8.0, equipment: 'Barbell / Dumbbells', primaryMuscle: 'Hamstrings' },
        { name: '45-Degree Leg Press', sets: 3, reps: '10-12', targetRPE: 8.0, equipment: 'Leg Press', primaryMuscle: 'Quadriceps' },
        { name: 'Seated Leg Curl', sets: 3, reps: '12-15', targetRPE: 8.5, equipment: 'Leg Curl Machine', primaryMuscle: 'Hamstrings' },
        { name: 'Standing Calf Raise', sets: 4, reps: '15-20', targetRPE: 9.0, equipment: 'Calf Machine / Dumbbell', primaryMuscle: 'Calves' }
      ]
    },
    {
      day: 'Thursday',
      name: 'Upper Body Metabolic Volume',
      focus: 'Chest, Lats & Scapular Stability',
      durationMinutes: 48,
      exercises: [
        { name: 'Incline Dumbbell Press', sets: 4, reps: '10-12', targetRPE: 8.0, equipment: 'Incline Bench', primaryMuscle: 'Upper Chest' },
        { name: 'Neutral Grip Pull-Ups / Lat Pulldown', sets: 4, reps: '8-10', targetRPE: 8.5, equipment: 'Lat Pulldown / Bar', primaryMuscle: 'Lats' },
        { name: 'Cable Chest Flyes', sets: 3, reps: '12-15', targetRPE: 8.0, equipment: 'Cable Machine', primaryMuscle: 'Chest' },
        { name: 'Dumbbell Lateral Raise', sets: 4, reps: '15-20', targetRPE: 9.0, equipment: 'Dumbbells', primaryMuscle: 'Lateral Deltoid' },
        { name: 'Rope Hammer Curls', sets: 3, reps: '12-15', targetRPE: 8.5, equipment: 'Cable Machine', primaryMuscle: 'Brachialis' }
      ]
    },
    {
      day: 'Friday',
      name: 'Lower Body Hypertrophy & Unilateral',
      focus: 'Glutes, Adductors & Core',
      durationMinutes: 50,
      exercises: [
        { name: 'Bulgarian Split Squats', sets: 3, reps: '10-12/leg', targetRPE: 8.5, equipment: 'Dumbbells & Bench', primaryMuscle: 'Quads & Glutes' },
        { name: 'Leg Press Feet High & Wide', sets: 3, reps: '12-15', targetRPE: 8.0, equipment: 'Leg Press', primaryMuscle: 'Glutes' },
        { name: 'Lying Hamstring Curl', sets: 3, reps: '12-15', targetRPE: 8.5, equipment: 'Hamstring Machine', primaryMuscle: 'Hamstrings' },
        { name: 'Hanging Leg Raises', sets: 3, reps: '12-15', targetRPE: 8.0, equipment: 'Pull-Up Bar', primaryMuscle: 'Core / Abs' }
      ]
    }
  ]
};

/**
 * Recommends personalized workout routine and scales volume
 * @param {Object} rawContext
 */
function recommendWorkout(rawContext) {
  const ctx = normalizeUserContext(rawContext);
  const { fitness_goal, commitment_score, experience_level, equipment_availability } = ctx;

  // 1. Calculate Adaptive Volume Scaling Factor (SRS F5)
  let volumeScalingFactor = 1.0;
  let commitmentTier = 'MODERATE_COMMITMENT';
  let adaptationNotes = '';

  if (commitment_score >= 80) {
    volumeScalingFactor = 1.08;
    commitmentTier = 'HIGH_DEDICATION';
    adaptationNotes = `High commitment detected (${commitment_score}%). Automated volume expansion factor (1.08x) applied with progressive overload set extensions.`;
  } else if (commitment_score < 60) {
    volumeScalingFactor = 0.85;
    commitmentTier = 'RECOVERY_PRIORITY';
    adaptationNotes = `Commitment adherence score is ${commitment_score}%. Routine scaled down by 15% (0.85x) to prevent overtraining, preserve recovery, and rebuild consistency.`;
  } else {
    volumeScalingFactor = 1.00;
    commitmentTier = 'STABLE_COMMITMENT';
    adaptationNotes = `Steady commitment (${commitment_score}%). Standard baseline volume maintained for consistent linear progression.`;
  }

  // 2. Select base training split
  const baseSplit = SPLIT_TEMPLATES.UPPER_LOWER_4DAY;

  // 3. Adapt routine schedule based on factor and equipment occupancy
  const occupiedEquipmentNames = new Set(
    (equipment_availability || [])
      .filter(eq => eq.is_occupied || eq.occupancy_status === 'OCCUPIED')
      .map(eq => (eq.name || eq.equipment_name || '').toLowerCase())
  );

  const adaptedSchedule = baseSplit.map(session => {
    const adaptedExercises = session.exercises.map(ex => {
      let finalSets = ex.sets;
      let finalRPE = ex.targetRPE;

      if (volumeScalingFactor > 1.0 && ex.sets < 5) {
        finalSets = ex.sets + 1;
      } else if (volumeScalingFactor < 1.0 && ex.sets > 2) {
        finalSets = ex.sets - 1;
        finalRPE = +(finalRPE * 0.95).toFixed(1);
      }

      // Check if equipment is occupied
      const isOccupied = occupiedEquipmentNames.has((ex.equipment || '').toLowerCase());

      return {
        ...ex,
        sets: finalSets,
        targetRPE: finalRPE,
        equipment_occupied: isOccupied,
        equipment_status: isOccupied ? 'OCCUPIED' : 'AVAILABLE'
      };
    });

    return {
      ...session,
      adapted_duration_minutes: Math.round(session.durationMinutes * (volumeScalingFactor > 1.0 ? 1.05 : volumeScalingFactor < 1.0 ? 0.9 : 1.0)),
      exercises: adaptedExercises
    };
  });

  return {
    plan_name: `Adaptive ${fitness_goal} 4-Day Periodized Split`,
    target_goal: fitness_goal,
    difficulty_level: experience_level,
    commitment_evaluation: {
      score: commitment_score,
      tier: commitmentTier,
      volume_scaling_factor: volumeScalingFactor,
      notes: adaptationNotes
    },
    periodization_structure: {
      split_type: 'Upper / Lower 4-Day Hybrid',
      target_sessions_per_week: 4,
      rest_days_per_week: 3,
      rpe_guideline: fitness_goal === 'Strength' ? '8.0 - 9.0' : '7.5 - 8.5'
    },
    schedule: adaptedSchedule,
    disclaimer: NON_MEDICAL_DISCLAIMER
  };
}

module.exports = {
  recommendWorkout
};
