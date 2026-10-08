/**
 * FitCommit Client Data Store
 */

export const INITIAL_PERSONAS = [
  {
    user_id: 1,
    name: 'Hemanth Sai Krishna',
    email: 'hemanth@fitcommit.com',
    role: 'BASE_MEMBER',
    height: 178,
    weight: 72.5,
    fitness_goal: 'Muscle Gain',
    account_status: 'ACTIVE',
    membership: {
      membership_id: 1,
      membership_name: 'Base Commitment Tier',
      tier: 'BASE',
      price: 0.0,
      subscription_status: 'VALID',
      gym_access: false
    }
  },
  {
    user_id: 2,
    name: 'Sumith Raj',
    email: 'sumith@fitcommit.com',
    role: 'PREMIUM_MEMBER',
    height: 175,
    weight: 70.0,
    fitness_goal: 'General Fitness',
    account_status: 'ACTIVE',
    membership: {
      membership_id: 2,
      membership_name: 'Premium Smart Pass',
      tier: 'PREMIUM',
      price: 29.0,
      subscription_status: 'VALID',
      gym_access: true
    }
  },
  {
    user_id: 3,
    name: 'Arun Abhishek',
    email: 'arun@fitcommit.com',
    role: 'TRAINER',
    height: 182,
    weight: 78.0,
    fitness_goal: 'Strength & Hypertrophy',
    account_status: 'ACTIVE',
    membership: {
      membership_id: 2,
      membership_name: 'Trainer Staff Account',
      tier: 'PREMIUM',
      price: 0.0,
      subscription_status: 'VALID',
      gym_access: true
    }
  },
  {
    user_id: 4,
    name: 'Bheem Sagar',
    email: 'bheem@fitcommit.com',
    role: 'ADMIN',
    height: 180,
    weight: 75.0,
    fitness_goal: 'Endurance',
    account_status: 'ACTIVE',
    membership: {
      membership_id: 2,
      membership_name: 'System Administrator Access',
      tier: 'PREMIUM',
      price: 0.0,
      subscription_status: 'VALID',
      gym_access: true
    }
  }
];

export const INITIAL_EQUIPMENT = [
  {
    equipment_id: 1,
    equipment_name: 'Leg Press',
    category: 'Legs',
    occupancy_status: 'OCCUPIED',
    battery_level: 97,
    last_updated: '2 mins ago',
    sensor_id: 101,
    alternatives: [
      {
        suggested_exercise_name: 'Goblet Squat (Heavy Dumbbell)',
        muscle_group: 'Quadriceps, Glutes',
        instructions: 'Hold a heavy dumbbell vertically at your chest. Descend hips back and down until thighs are parallel to the floor.'
      },
      {
        suggested_exercise_name: 'Bulgarian Split Squat',
        muscle_group: 'Quadriceps, Glute Medius',
        instructions: 'Elevate your rear foot on a bench. Keep torso upright and lower hips until front thigh reaches 90 degrees.'
      }
    ]
  },
  {
    equipment_id: 2,
    equipment_name: 'Bench Press',
    category: 'Chest',
    occupancy_status: 'AVAILABLE',
    battery_level: 99,
    last_updated: 'Just now',
    sensor_id: 102,
    alternatives: [
      {
        suggested_exercise_name: 'Dumbbell Floor Press',
        muscle_group: 'Pectoralis Major, Triceps',
        instructions: 'Lie flat on floor with dumbbells. Lower until triceps contact the floor lightly, then press up.'
      },
      {
        suggested_exercise_name: 'Deficit Push-Ups',
        muscle_group: 'Chest, Anterior Deltoids',
        instructions: 'Elevate hands on blocks for extended stretch through the chest pectorals.'
      }
    ]
  },
  {
    equipment_id: 3,
    equipment_name: 'Squat Rack',
    category: 'Full Body',
    occupancy_status: 'AVAILABLE',
    battery_level: 94,
    last_updated: '4 mins ago',
    sensor_id: 103,
    alternatives: [
      {
        suggested_exercise_name: 'Zercher Squat',
        muscle_group: 'Quadriceps, Upper Back, Core',
        instructions: 'Cradle weight in the crooks of your elbows, maintaining rigid spinal bracing.'
      }
    ]
  },
  {
    equipment_id: 4,
    equipment_name: 'Lat Pulldown',
    category: 'Back',
    occupancy_status: 'OCCUPIED',
    battery_level: 98,
    last_updated: '1 min ago',
    sensor_id: 104,
    alternatives: [
      {
        suggested_exercise_name: 'Strict Pull-Ups / Band-Assisted',
        muscle_group: 'Latissimus Dorsi',
        instructions: 'Hang from overhead bar with pronated grip. Pull chest up to bar driving elbows to hips.'
      },
      {
        suggested_exercise_name: 'Chest-Supported Dumbbell Row',
        muscle_group: 'Rhomboids, Lats',
        instructions: 'Set incline bench to 30 degrees. Pull dumbbells toward hips with controlled scapular retraction.'
      }
    ]
  },
  {
    equipment_id: 5,
    equipment_name: 'Cable Machine',
    category: 'Full Body',
    occupancy_status: 'AVAILABLE',
    battery_level: 92,
    last_updated: '6 mins ago',
    sensor_id: 105,
    alternatives: [
      {
        suggested_exercise_name: 'Resistance Band Crossovers',
        muscle_group: 'Pectorals',
        instructions: 'Anchor dual heavy bands at shoulder height. Sweep arms forward in hugging arc.'
      }
    ]
  },
  {
    equipment_id: 6,
    equipment_name: 'Chest Press',
    category: 'Chest',
    occupancy_status: 'OCCUPIED',
    battery_level: 96,
    last_updated: 'Just now',
    sensor_id: 106,
    alternatives: [
      {
        suggested_exercise_name: 'Incline Dumbbell Press (30°)',
        muscle_group: 'Upper Pectorals',
        instructions: 'Press dumbbells up with slight inward arc, controlling the negative descent.'
      }
    ]
  },
  {
    equipment_id: 7,
    equipment_name: 'Treadmill',
    category: 'Cardio',
    occupancy_status: 'AVAILABLE',
    battery_level: 100,
    last_updated: 'Just now',
    sensor_id: 107,
    alternatives: [
      {
        suggested_exercise_name: 'Assault Air Bike Intervals',
        muscle_group: 'Cardiovascular Conditioning',
        instructions: 'Perform 20s maximum power sprints followed by 40s active recovery cadence.'
      }
    ]
  }
];

export const INITIAL_WORKOUT_PLAN = {
  workout_plan_id: 1,
  plan_name: 'Adaptive Hypertrophy 4-Day Split',
  target_goal: 'Muscle Gain',
  difficulty_level: 'Intermediate',
  commitment_score: 82,
  completed_this_week: 4,
  target_this_week: 5,
  is_completed_today: false,
  adjustment_factor: 1.08,
  adaptation_notes: 'High consistency detected (82%). Progressive overload volume applied with slight set/rep expansion.',
  schedule: [
    {
      day: 'Monday',
      name: 'Upper Body Hypertrophy',
      durationMinutes: 45,
      exercises: [
        { name: 'Dumbbell Bench Press', sets: 4, reps: '8-10', targetRPE: 8.0 },
        { name: 'Chest-Supported Row', sets: 4, reps: '10-12', targetRPE: 8.0 },
        { name: 'Overhead Dumbbell Press', sets: 3, reps: '10-12', targetRPE: 7.5 },
        { name: 'Incline Bicep Curls & Skullcrushers', sets: 3, reps: '12-15', targetRPE: 8.0 }
      ]
    },
    {
      day: 'Tuesday',
      name: 'Lower Body Strength & Core',
      durationMinutes: 50,
      exercises: [
        { name: 'Goblet Squats / Barbell Squats', sets: 4, reps: '8-10', targetRPE: 8.0 },
        { name: 'Romanian Deadlifts', sets: 3, reps: '10-12', targetRPE: 8.0 },
        { name: 'Walking Lunges', sets: 3, reps: '12 per leg', targetRPE: 7.5 },
        { name: 'Hanging Knee Raises', sets: 3, reps: '15', targetRPE: 8.0 }
      ]
    },
    {
      day: 'Thursday',
      name: 'Push & Conditioning',
      durationMinutes: 40,
      exercises: [
        { name: 'Incline Dumbbell Press', sets: 4, reps: '10-12', targetRPE: 8.0 },
        { name: 'Dumbbell Lateral Raises', sets: 4, reps: '15', targetRPE: 8.5 },
        { name: 'Tricep Rope Pushdowns', sets: 3, reps: '12-15', targetRPE: 8.0 }
      ]
    },
    {
      day: 'Friday',
      name: 'Pull & Postural Architecture',
      durationMinutes: 45,
      exercises: [
        { name: 'Lat Pulldowns / Inverted Rows', sets: 4, reps: '8-10', targetRPE: 8.0 },
        { name: 'Single-Arm Dumbbell Row', sets: 3, reps: '10-12', targetRPE: 8.0 },
        { name: 'Face Pulls', sets: 4, reps: '15-20', targetRPE: 7.0 }
      ]
    }
  ]
};

export const INITIAL_DIET_PLAN = {
  diet_name: 'Nordic Clean Lean Mass Protocol',
  calorie_target: 2240,
  macros: {
    protein: 140,
    carbs: 250,
    fat: 70
  },
  consumed_today: {
    calories: 1480,
    protein: 98,
    carbs: 165,
    fat: 42
  },
  meal_structure: {
    breakfast: {
      title: 'Nordic Oats & Whey Bowl',
      calories: 520,
      protein: 38,
      carbs: 65,
      fat: 12,
      description: 'Steel-cut oats with whey isolate, wild blueberries, and crushed chia seeds.'
    },
    lunch: {
      title: 'Atlantic Herb Salmon & Quinoa',
      calories: 680,
      protein: 46,
      carbs: 60,
      fat: 26,
      description: 'Pan-seared Atlantic salmon over tri-color quinoa, asparagus, and cold-pressed olive oil.'
    },
    snack: {
      title: 'Skyr Yogurt & Almond Medley',
      calories: 290,
      protein: 26,
      carbs: 18,
      fat: 11,
      description: 'Traditional high-protein Icelandic skyr topped with raw crushed almonds.'
    },
    dinner: {
      title: 'Tender Roast Chicken & Sweet Potato',
      calories: 750,
      protein: 48,
      carbs: 75,
      fat: 21,
      description: 'Rosemary-roasted chicken breast with baked sweet potato cubes and crisp garden greens.'
    }
  }
};

export const INITIAL_BMI_HISTORY = [
  { bmi_id: 1, record_date: '2026-09-15', height: 178, weight: 74.0, bmi_value: 23.36, category: 'Normal Weight' },
  { bmi_id: 2, record_date: '2026-09-22', height: 178, weight: 73.2, bmi_value: 23.10, category: 'Normal Weight' },
  { bmi_id: 3, record_date: '2026-09-29', height: 178, weight: 72.8, bmi_value: 22.98, category: 'Normal Weight' },
  { bmi_id: 4, record_date: '2026-10-06', height: 178, weight: 72.5, bmi_value: 22.88, category: 'Normal Weight' }
];

export const INITIAL_PROGRESS_LOGS = [
  { log_date: '2026-09-30', calories_burned: 480, steps: 8920, workout_completed: true, notes: 'Upper body completed on time.' },
  { log_date: '2026-10-01', calories_burned: 520, steps: 9410, workout_completed: true, notes: 'Lower body session executed.' },
  { log_date: '2026-10-02', calories_burned: 210, steps: 6500, workout_completed: false, notes: 'Active rest day & light recovery walk.' },
  { log_date: '2026-10-03', calories_burned: 460, steps: 8750, workout_completed: true, notes: 'Push volume felt great.' },
  { log_date: '2026-10-04', calories_burned: 490, steps: 8300, workout_completed: true, notes: 'Pull routine completed with strict form.' },
  { log_date: '2026-10-05', calories_burned: 240, steps: 7120, workout_completed: false, notes: 'Recovery & mobility flow.' },
  { log_date: '2026-10-06', calories_burned: 510, steps: 8421, workout_completed: true, notes: 'Today session finished.' }
];

export const INITIAL_TRAINER = {
  trainer_id: 1,
  trainer_name: 'Coach Arun Abhishek',
  specialization: 'CSCS Certified Strength & Biomechanics Coach',
  contact_email: 'arun@fitcommit.com',
  bio: 'Specializes in progressive hypertrophy, kinematic alignment, and sustainable commitment-based routines designed for busy professionals and fitness enthusiasts.',
  avatar_url: '/assets/trainers/arun.jpg',
  is_available: true,
  status: 'ACTIVE'
};

export const INITIAL_TRAINER_MESSAGES = [
  {
    message_id: 1,
    sender_role: 'TRAINER',
    message_text: 'Welcome to FitCommit Premium, Sumith! I have reviewed your weekly consistency. Your commitment score is at a solid 82%. Keep your hydration high and let me know if you need adjustments for upper body volume.',
    sent_at: '2026-10-05 09:30'
  },
  {
    message_id: 2,
    sender_role: 'USER',
    message_text: 'Thanks Coach Arun! The Leg Press was occupied yesterday at the gym but the app suggested Goblet Squats immediately. Completed all 4 sets with great intensity.',
    sent_at: '2026-10-05 18:45'
  },
  {
    message_id: 3,
    sender_role: 'TRAINER',
    message_text: 'Excellent adaptation. That is precisely what FitCommit dedication is about. Focus on strict eccentric tempo on the squat descent.',
    sent_at: '2026-10-06 08:15'
  }
];

export const INITIAL_SUPPLEMENTS = [
  {
    discount_id: 1,
    product_name: 'Pure Hydrolyzed Whey Isolate',
    brand: 'Nordic Endurance Labs',
    discount_percentage: 25,
    code: 'NORDIC25',
    expiry_date: '2026-12-31',
    description: 'Ultra-pure grass-fed whey with 27g protein per serving and zero artificial sweeteners.'
  },
  {
    discount_id: 2,
    product_name: 'Electrolyte Mineral Complex',
    brand: 'Hygge Vitality',
    discount_percentage: 20,
    code: 'MINERAL20',
    expiry_date: '2026-11-30',
    description: 'Optimal sodium-potassium-magnesium hydration ratio for prolonged workout endurance.'
  },
  {
    discount_id: 3,
    product_name: 'Micronized Creatine Monohydrate',
    brand: 'Kobenhavn Nutrition',
    discount_percentage: 30,
    code: 'CREATINE30',
    expiry_date: '2026-12-15',
    description: 'Pure Creapure pharmaceutical grade for strength output and cellular muscle volume.'
  },
  {
    discount_id: 4,
    product_name: 'Algal Plant-Based Omega-3',
    brand: 'Nordic Pure Marine',
    discount_percentage: 15,
    code: 'OMEGA15',
    expiry_date: '2026-10-31',
    description: 'Sustainably sourced DHA & EPA for joint lubrication and cardiovascular recovery.'
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    notification_id: 1,
    type: 'WORKOUT',
    title: 'Upper Body Session Scheduled',
    message: 'Your adaptive routine is primed for today. Target completion: 45 minutes.',
    is_read: false,
    created_at: '10 mins ago'
  },
  {
    notification_id: 2,
    type: 'DIET',
    title: 'Daily Macronutrient Goal',
    message: 'You are at 98g / 140g protein for today. Keep dinner protein-dense to hit your target.',
    is_read: false,
    created_at: '2 hours ago'
  },
  {
    notification_id: 3,
    type: 'EQUIPMENT',
    title: 'Smart Gym Occupancy Alert',
    message: 'Leg Press is currently occupied at the gym. 2 alternative exercises are recommended.',
    is_read: false,
    created_at: '4 hours ago'
  },
  {
    notification_id: 4,
    type: 'TRAINER',
    title: 'New Feedback from Coach Arun',
    message: 'Coach Arun Abhishek reviewed your commitment score and left constructive notes.',
    is_read: true,
    created_at: 'Yesterday'
  },
  {
    notification_id: 5,
    type: 'SUBSCRIPTION',
    title: 'Membership Active',
    message: 'Your dedication tracking plan is running normally with 99.8% uptime.',
    is_read: true,
    created_at: '2 days ago'
  }
];
