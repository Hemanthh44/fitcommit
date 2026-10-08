/**
 * Alternative Exercise Recommendation Engine
 * Biomechanical movement pattern matcher when smart gym equipment is occupied
 * Aligned with SRS Requirement F16, Use Case U11, Performance P4
 */

const { NON_MEDICAL_DISCLAIMER } = require('./types');

/**
 * Knowledge Base of Exercise Biomechanics and Alternatives
 */
const BIOMECHANICAL_ALTERNATIVES = {
  // 1. Leg Press (45-Degree Quadriceps & Glute Compound)
  'leg press': [
    {
      alternative_name: 'Goblet Squat (Heavy Dumbbell)',
      category: 'Legs',
      target_muscle: 'Quadriceps, Adductors & Core',
      movement_pattern: 'Bilateral Knee Flexion / Squat',
      difficulty: 'Beginner - Intermediate',
      required_equipment: 'Dumbbell / Kettlebell',
      biomechanical_notes: 'Provides equivalent knee flexion quad stimulation with added thoracic extensor core activation.',
      form_cues: 'Maintain upright torso, drive elbows inside knees at the bottom, distribute weight mid-foot.'
    },
    {
      alternative_name: 'Bulgarian Split Squat',
      category: 'Legs',
      target_muscle: 'Quadriceps & Gluteus Medius',
      movement_pattern: 'Unilateral Knee Flexion',
      difficulty: 'Intermediate',
      required_equipment: 'Dumbbells & Flat Bench',
      biomechanical_notes: 'Eliminates bilateral spinal loading while matching Leg Press quadriceps hypertrophy through unilateral overload.',
      form_cues: 'Elevate rear foot on bench, descend until rear knee hovers 1 inch above turf, keep front shin relatively vertical.'
    },
    {
      alternative_name: 'Walking Dumbbell Lunges',
      category: 'Legs',
      target_muscle: 'Quads, Glutes & Hamstrings',
      movement_pattern: 'Dynamic Unilateral Locomotion',
      difficulty: 'Beginner',
      required_equipment: 'Dumbbells',
      biomechanical_notes: 'High metabolic demand with continuous knee extensor time under tension.',
      form_cues: 'Take deliberate strides, maintain forward torso lean for maximum glute recruitment.'
    }
  ],

  // 2. Barbell Bench Press (Horizontal Chest Press)
  'bench press': [
    {
      alternative_name: 'Flat Dumbbell Bench Press',
      category: 'Chest',
      target_muscle: 'Pectoralis Major (Sternal Head) & Anterior Deltoid',
      movement_pattern: 'Horizontal Pushing',
      difficulty: 'Intermediate',
      required_equipment: 'Dumbbells & Flat Bench',
      biomechanical_notes: 'Allows converged pressing path and superior active pectoral stretch compared to fixed barbell.',
      form_cues: 'Retract and depress scapulae, keep wrists stacked over elbows, press dumbbells in slight convergent arc.'
    },
    {
      alternative_name: 'Dumbbell Floor Press',
      category: 'Chest',
      target_muscle: 'Pectoralis Major & Triceps Brachii',
      movement_pattern: 'Restricted Depth Horizontal Push',
      difficulty: 'Beginner - Intermediate',
      required_equipment: 'Dumbbells & Floor Mat',
      biomechanical_notes: 'Protects glenohumeral anterior capsule while heavily targeting lockout tricep and mid-chest recruitment.',
      form_cues: 'Lie flat on floor with knees bent, pause triceps softly on turf before explosive press.'
    },
    {
      alternative_name: 'Deficit Push-Ups with Elevation',
      category: 'Chest',
      target_muscle: 'Pectoralis Major & Serratus Anterior',
      movement_pattern: 'Closed-Chain Horizontal Push',
      difficulty: 'Intermediate',
      required_equipment: 'Parallettes / Weight Plates',
      biomechanical_notes: 'Closed kinetic chain movement promoting scapular upward rotation and deep sternal fiber stretch.',
      form_cues: 'Place hands on 4-inch elevated plates, descend below hand level, press through palm heels.'
    }
  ],

  // 3. Power Squat Rack (Axial Knee / Hip Extension)
  'squat rack': [
    {
      alternative_name: 'Zercher Squat with Dumbbells / Barbell',
      category: 'Full Body',
      target_muscle: 'Quadriceps, Upper Back & Anterior Core',
      movement_pattern: 'Anterior-Loaded Bilateral Squat',
      difficulty: 'Intermediate - Advanced',
      required_equipment: 'Barbell or Heavy Dumbbells',
      biomechanical_notes: 'Displaces center of mass forward, increasing quad quad-recruitment without heavy spinal compressive load.',
      form_cues: 'Cradle weight in elbow crooks, lock core tight, squat deep into hip crease.'
    },
    {
      alternative_name: 'Heavy Dumbbell Step-Ups',
      category: 'Full Body',
      target_muscle: 'Gluteus Maximus & Vastus Medialis',
      movement_pattern: 'Unilateral Step Elevation',
      difficulty: 'Intermediate',
      required_equipment: 'Dumbbells & Plyo Box / Bench',
      biomechanical_notes: 'Direct vertical concentric force production with minimal shear stress on lumbar spine.',
      form_cues: 'Plant entire front foot on box, avoid bouncing off trailing toe, drive solely through lead heel.'
    }
  ],

  // 4. Lat Pulldown Machine (Vertical Pulling)
  'lat pulldown': [
    {
      alternative_name: 'Wide-Grip Bodyweight Pull-Ups (Assisted if needed)',
      category: 'Back',
      target_muscle: 'Latissimus Dorsi & Teres Major',
      movement_pattern: 'Vertical Pulling (Closed-Chain)',
      difficulty: 'Intermediate - Advanced',
      required_equipment: 'Pull-Up Bar',
      biomechanical_notes: 'Closed-chain kinematics activate higher motor unit firing in latissimus dorsi than seated machine pulldowns.',
      form_cues: 'Initiate by driving shoulder blades down, pull chest to bar, do not kipp or swing hips.'
    },
    {
      alternative_name: 'Chest-Supported Incline Dumbbell Row',
      category: 'Back',
      target_muscle: 'Rhomboids, Mid-Traps & Lats',
      movement_pattern: 'Horizontal Retraction',
      difficulty: 'Beginner - Intermediate',
      required_equipment: 'Incline Bench & Dumbbells',
      biomechanical_notes: 'Completely unloads lower back, allowing strict isolation of mid-back and lat musculature.',
      form_cues: 'Set bench to 30 degrees, let arms hang, pull elbows up toward hips and squeeze scapulae for 1 second.'
    }
  ],

  // 5. Cable Crossover / Multi-Station (Variable Vector Resistance)
  'cable machine': [
    {
      alternative_name: 'Resistance Band Crossover & Flyes',
      category: 'Full Body',
      target_muscle: 'Pectoralis Major & Deltoids',
      movement_pattern: 'Convergent Horizontal Adduction',
      difficulty: 'Beginner',
      required_equipment: 'Resistance Bands',
      biomechanical_notes: 'Replicates continuous tension resistance curve, peaking at maximal pectoral contraction.',
      form_cues: 'Anchor band at chest height, step forward for baseline tension, hug arms together in wide arc.'
    },
    {
      alternative_name: 'Incline Dumbbell Flyes with Peak Squeeze',
      category: 'Full Body',
      target_muscle: 'Pectoralis Major (Clavicular Head)',
      movement_pattern: 'Transverse Adduction',
      difficulty: 'Intermediate',
      required_equipment: 'Dumbbells & Incline Bench',
      biomechanical_notes: 'Isolates chest stretch under loaded eccentric control.',
      form_cues: 'Keep slight bend in elbows, open wide until mild chest stretch is felt, squeeze up without clacking dumbbells.'
    }
  ],

  // 6. Chest Press Machine (Guided Horizontal Press)
  'chest press': [
    {
      alternative_name: 'Incline Dumbbell Press',
      category: 'Chest',
      target_muscle: 'Clavicular Pectoralis & Triceps',
      movement_pattern: 'Low-to-High Horizontal Push',
      difficulty: 'Intermediate',
      required_equipment: 'Incline Bench & Dumbbells',
      biomechanical_notes: 'Independent arm freedom prevents bilateral asymmetry compensations commonly seen on fixed machines.',
      form_cues: 'Set bench at 30-45 degrees, tuck elbows at 45 degrees relative to torso, press smoothly.'
    },
    {
      alternative_name: 'Parallel Bar Dips (Chest Lean)',
      category: 'Chest',
      target_muscle: 'Lower Pectoralis & Triceps',
      movement_pattern: 'Downward Angular Press',
      difficulty: 'Intermediate - Advanced',
      required_equipment: 'Dip Station / Parallel Bars',
      biomechanical_notes: 'Exceptional compound stimulus for lower pectoral development with high pec stretch.',
      form_cues: 'Lean torso forward 20 degrees, flare elbows slightly, descend until shoulders are level with elbows.'
    }
  ],

  // 7. Commercial Treadmill (Cardiovascular Conditioning)
  'treadmill': [
    {
      alternative_name: 'Assault Air Bike (HIIT Intervals)',
      category: 'Cardio',
      target_muscle: 'Full Body Cardiovascular & Metabolic System',
      movement_pattern: 'Dual-Action Cyclical Conditioning',
      difficulty: 'All Levels',
      required_equipment: 'Air Bike',
      biomechanical_notes: 'Zero impact on lower extremity joints while engaging upper and lower limbs simultaneously for 20% higher caloric expenditure.',
      form_cues: 'Alternate between 20 seconds maximum output and 40 seconds recovery for high-efficiency conditioning.'
    },
    {
      alternative_name: 'Rowing Ergometer (Concept2)',
      category: 'Cardio',
      target_muscle: 'Posterior Chain & Cardiovascular Engine',
      movement_pattern: 'Horizontal Hip Drive & Row',
      difficulty: 'Intermediate',
      required_equipment: 'Rowing Machine',
      biomechanical_notes: 'Recruits 85% of total body muscle mass per stroke with zero joint collision impact.',
      form_cues: 'Sequence: Legs drive first, hip hinge back, arms pull to sternum. Reverse sequence on return.'
    }
  ]
};

/**
 * Recommends biomechanical alternatives for an equipment item
 * @param {Object} queryContext
 */
function recommendAlternativeExercises(queryContext = {}) {
  const targetName = (queryContext.equipment_name || queryContext.name || queryContext.equipment || '').toLowerCase().trim();
  const category = queryContext.category || 'All';
  const occupiedMachines = new Set(
    (queryContext.occupied_equipment || [])
      .map(item => (typeof item === 'string' ? item : item.name || item.equipment_name || '').toLowerCase())
  );

  // Match key in database
  let matchedKey = null;
  for (const key of Object.keys(BIOMECHANICAL_ALTERNATIVES)) {
    if (targetName.includes(key) || key.includes(targetName)) {
      matchedKey = key;
      break;
    }
  }

  let suggestions = [];
  if (matchedKey && BIOMECHANICAL_ALTERNATIVES[matchedKey]) {
    suggestions = BIOMECHANICAL_ALTERNATIVES[matchedKey];
  } else {
    // Fallback: match by category
    const catLower = category.toLowerCase();
    for (const [key, alts] of Object.entries(BIOMECHANICAL_ALTERNATIVES)) {
      for (const alt of alts) {
        if (alt.category.toLowerCase().includes(catLower)) {
          suggestions.push(alt);
        }
      }
    }
    // Limit to top 3
    suggestions = suggestions.slice(0, 3);
  }

  // Filter out any alternatives whose required equipment is also occupied
  const filteredSuggestions = suggestions.map(alt => {
    const isApparatusOccupied = Array.from(occupiedMachines).some(occ => 
      alt.required_equipment.toLowerCase().includes(occ)
    );
    return {
      ...alt,
      apparatus_status: isApparatusOccupied ? 'LIMITED' : 'AVAILABLE'
    };
  });

  return {
    queried_equipment: targetName || 'Gym Equipment',
    category,
    occupancy_status: queryContext.is_occupied ? 'OCCUPIED' : 'MONITORED',
    total_alternatives_found: filteredSuggestions.length,
    alternatives: filteredSuggestions,
    biomechanical_guidance: "When primary equipment is occupied, select an alternative matching the target movement pattern with equivalent RPE to maintain programmed training stimulus.",
    disclaimer: NON_MEDICAL_DISCLAIMER
  };
}

module.exports = {
  BIOMECHANICAL_ALTERNATIVES,
  recommendAlternativeExercises
};
