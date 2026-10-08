const bcrypt = require('bcryptjs');
const { query, exec, getDbType } = require('../config/db');

async function seedDatabase() {
  console.log('--- Initializing FitCommit Database Schema & Seed Data ---');

  // 1. Create Tables (only needed for SQLite standalone mode; PostgreSQL runs schema.sql in initDB)
  if (getDbType() === 'sqlite') {
    await exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'BASE_MEMBER',
      height REAL NOT NULL,
      weight REAL NOT NULL,
      fitness_goal TEXT NOT NULL,
      account_status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS memberships (
      membership_id INTEGER PRIMARY KEY AUTOINCREMENT,
      membership_name TEXT NOT NULL,
      price REAL NOT NULL,
      tier TEXT NOT NULL,
      features TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      subscription_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
      membership_id INTEGER REFERENCES memberships(membership_id),
      start_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      subscription_status TEXT DEFAULT 'VALID'
    );

    CREATE TABLE IF NOT EXISTS gyms (
      gym_id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_name TEXT NOT NULL,
      location TEXT NOT NULL,
      qr_code TEXT UNIQUE DEFAULT 'FITCOMMIT-GYM-001',
      capacity INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gym_subscriptions (
      gym_subscription_id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER REFERENCES subscriptions(subscription_id) ON DELETE CASCADE,
      gym_id INTEGER REFERENCES gyms(gym_id),
      access_status TEXT DEFAULT 'ACTIVE'
    );

    CREATE TABLE IF NOT EXISTS gym_attendance (
      attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
      gym_id INTEGER REFERENCES gyms(gym_id) ON DELETE CASCADE,
      check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      check_out_time DATETIME,
      status TEXT DEFAULT 'CHECKED_IN',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gym_equipment (
      equipment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_id INTEGER REFERENCES gyms(gym_id) ON DELETE CASCADE,
      equipment_name TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS equipment_sensors (
      sensor_id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER REFERENCES gym_equipment(equipment_id) ON DELETE CASCADE,
      occupancy_status TEXT DEFAULT 'AVAILABLE',
      battery_level INTEGER DEFAULT 98,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alternative_exercise_suggestions (
      suggestion_id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER REFERENCES gym_equipment(equipment_id) ON DELETE CASCADE,
      suggested_exercise_name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      instructions TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER REFERENCES subscriptions(subscription_id) ON DELETE CASCADE,
      payment_amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'CARD_SIMULATION',
      transaction_status TEXT DEFAULT 'SUCCESS',
      transaction_reference TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bmi_records (
      bmi_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
      height REAL NOT NULL,
      weight REAL NOT NULL,
      bmi_value REAL NOT NULL,
      category TEXT NOT NULL,
      record_date DATE DEFAULT (DATE('now'))
    );

    CREATE TABLE IF NOT EXISTS macronutrient_targets (
      macro_target_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
      bmi_id INTEGER REFERENCES bmi_records(bmi_id) ON DELETE SET NULL,
      daily_calories INTEGER NOT NULL,
      protein_intake INTEGER NOT NULL,
      carb_intake INTEGER NOT NULL,
      fat_intake INTEGER NOT NULL,
      calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workout_plans (
      workout_plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
      trainer_id INTEGER,
      plan_name TEXT NOT NULL,
      difficulty_level TEXT NOT NULL,
      target_goal TEXT NOT NULL,
      schedule TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS commitment_rules (
      commitment_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_plan_id INTEGER REFERENCES workout_plans(workout_plan_id) ON DELETE CASCADE,
      rule_name TEXT NOT NULL,
      adjustment_factor REAL DEFAULT 1.00,
      min_completion_rate INTEGER DEFAULT 70
    );

    CREATE TABLE IF NOT EXISTS diet_plans (
      diet_plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
      membership_id INTEGER REFERENCES memberships(membership_id),
      user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
      diet_name TEXT NOT NULL,
      calorie_target INTEGER NOT NULL,
      meal_structure TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS progress_logs (
      progress_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
      workout_plan_id INTEGER REFERENCES workout_plans(workout_plan_id) ON DELETE SET NULL,
      log_date DATE DEFAULT (DATE('now')),
      calories_burned INTEGER DEFAULT 0,
      steps INTEGER DEFAULT 0,
      workout_completed INTEGER DEFAULT 0,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS trainers (
      trainer_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
      trainer_name TEXT NOT NULL,
      specialization TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      bio TEXT,
      avatar_url TEXT,
      is_available INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS trainer_allocations (
      allocation_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
      trainer_id INTEGER REFERENCES trainers(trainer_id) ON DELETE CASCADE,
      status TEXT DEFAULT 'ACTIVE',
      allocated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trainer_messages (
      message_id INTEGER PRIMARY KEY AUTOINCREMENT,
      allocation_id INTEGER REFERENCES trainer_allocations(allocation_id) ON DELETE CASCADE,
      sender_role TEXT NOT NULL,
      message_text TEXT NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS supplement_discounts (
      discount_id INTEGER PRIMARY KEY AUTOINCREMENT,
      membership_id INTEGER REFERENCES memberships(membership_id),
      product_name TEXT NOT NULL,
      brand TEXT NOT NULL,
      discount_percentage INTEGER NOT NULL,
      code TEXT NOT NULL,
      expiry_date DATE NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS supplement_redemptions (
      redemption_id INTEGER PRIMARY KEY AUTOINCREMENT,
      discount_id INTEGER REFERENCES supplement_discounts(discount_id),
      user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
      redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  }

  // Check if seed data exists
  const userCheck = await query('SELECT count(*) as count FROM users');
  if (userCheck.rows[0].count > 0) {
    console.log('Database already populated with seed data.');
    await ensureGymAttendanceSeeded();
    await ensureMealsSeeded();
    return;
  }

  console.log('Seeding initial data...');

  // 1. Memberships
  await query(`
    INSERT INTO memberships (membership_name, price, tier, features)
    VALUES 
    ($1, $2, $3, $4),
    ($5, $6, $7, $8)
  `, [
    'Base Commitment', 0.00, 'BASE', JSON.stringify([
      'AI Adaptive Workout Routines',
      'Personalized Macronutrient Target',
      'Continuous BMI Tracking & Historical Trends',
      'Activity & Calorie Intake Logging',
      'Weekly Consistency Scoreboard'
    ]),
    'Premium Smart Pass', 29.00, 'PREMIUM', JSON.stringify([
      'Everything in Base Membership',
      'Physical Gym Facility Access Pass',
      'Dedicated Personal Trainer Allocation',
      'Direct 2-Way Trainer Messaging',
      'Real-Time Smart Equipment Occupancy Tracking',
      'Instant Alternative Exercise Suggestions on Occupied Machines',
      'Partner Supplement Discounts & Promo Codes'
    ])
  ]);

  // 2. Gym
  await query(`
    INSERT INTO gyms (gym_name, location)
    VALUES ($1, $2)
  `, ['FitCommit Flagship Gym', 'Nordic Center, Level 2, Metro Square']);

  // 3. Gym Equipment (The 7 machines from SRS / user request)
  const equipmentList = [
    { name: 'Leg Press', cat: 'Legs', image: '/assets/equipment/leg-press.svg' },
    { name: 'Bench Press', cat: 'Chest', image: '/assets/equipment/bench-press.svg' },
    { name: 'Squat Rack', cat: 'Full Body', image: '/assets/equipment/squat-rack.svg' },
    { name: 'Lat Pulldown', cat: 'Back', image: '/assets/equipment/lat-pulldown.svg' },
    { name: 'Cable Machine', cat: 'Full Body', image: '/assets/equipment/cable-machine.svg' },
    { name: 'Chest Press', cat: 'Chest', image: '/assets/equipment/chest-press.svg' },
    { name: 'Treadmill', cat: 'Cardio', image: '/assets/equipment/treadmill.svg' }
  ];

  for (const eq of equipmentList) {
    const res = await query(`
      INSERT INTO gym_equipment (gym_id, equipment_name, category, image_url)
      VALUES (1, $1, $2, $3)
    `, [eq.name, eq.cat, eq.image]);
  }

  // 4. Equipment Sensors & Alternatives
  // Sensor statuses: Leg Press = OCCUPIED, Bench Press = AVAILABLE, Squat Rack = AVAILABLE, Lat Pulldown = OCCUPIED, Cable Machine = AVAILABLE, Chest Press = OCCUPIED, Treadmill = AVAILABLE
  const sensorStatuses = ['OCCUPIED', 'AVAILABLE', 'AVAILABLE', 'OCCUPIED', 'AVAILABLE', 'OCCUPIED', 'AVAILABLE'];
  for (let i = 1; i <= 7; i++) {
    await query(`
      INSERT INTO equipment_sensors (equipment_id, occupancy_status, battery_level)
      VALUES ($1, $2, $3)
    `, [i, sensorStatuses[i - 1], 95 + (i % 5)]);
  }

  // Alternatives mapping per SRS U11
  const alternatives = [
    // 1: Leg Press
    { eqId: 1, name: 'Goblet Squat', muscle: 'Quadriceps & Glutes', instructions: 'Hold a heavy dumbbell or kettlebell against your chest. Descend smoothly with hips back until thighs are parallel.' },
    { eqId: 1, name: 'Bulgarian Split Squat', muscle: 'Quadriceps, Adductors', instructions: 'Place rear foot on bench. Lower hips vertically until front thigh is parallel to floor. Emphasize quad load.' },
    // 2: Bench Press
    { eqId: 2, name: 'Dumbbell Floor Press', muscle: 'Pectoralis Major, Triceps', instructions: 'Lie on floor with dumbbells. Lower until upper arms touch floor lightly, then press forcefully.' },
    { eqId: 2, name: 'Deficit Push-Ups', muscle: 'Chest & Core', instructions: 'Elevate hands on blocks for extended range of motion. Maintain rigid hollow-body posture.' },
    // 3: Squat Rack
    { eqId: 3, name: 'Zercher Squat (Barbell/Dumbbell)', muscle: 'Full Posterior Chain & Core', instructions: 'Cradle weight in the crook of elbows. Maintain upright torso throughout squat descent.' },
    // 4: Lat Pulldown
    { eqId: 4, name: 'Pull-Ups / Band-Assisted', muscle: 'Latissimus Dorsi', instructions: 'Grip pull-up bar slightly wider than shoulder-width. Drive elbows down to hips.' },
    { eqId: 4, name: 'Chest-Supported Row', muscle: 'Rhomboids & Lats', instructions: 'Incline bench at 30 degrees. Pull dumbbells back smoothly squeezing shoulder blades.' },
    // 5: Cable Machine
    { eqId: 5, name: 'Resistance Band Crossover', muscle: 'Chest & Anterior Deltoid', instructions: 'Anchor dual resistance bands at shoulder height. Bring hands together in an arc motion.' },
    // 6: Chest Press
    { eqId: 6, name: 'Incline Dumbbell Press', muscle: 'Upper Chest & Triceps', instructions: 'Set bench to 30 degrees. Press dumbbells upward with elbows at a 45-degree angle.' },
    // 7: Treadmill
    { eqId: 7, name: 'Assault Air Bike Intervals', muscle: 'Cardiovascular & Full Body', instructions: 'Perform 20s sprint followed by 40s active recovery for high-intensity caloric expenditure.' }
  ];

  for (const alt of alternatives) {
    await query(`
      INSERT INTO alternative_exercise_suggestions (equipment_id, suggested_exercise_name, muscle_group, instructions)
      VALUES ($1, $2, $3, $4)
    `, [alt.eqId, alt.name, alt.muscle, alt.instructions]);
  }

  // 5. Users (4 Demo personas corresponding to SRS roles)
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 1: Base Member (Hemanth)
  await query(`
    INSERT INTO users (name, email, password_hash, role, height, weight, fitness_goal, account_status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, ['Hemanth Sai Krishna', 'hemanth@fitcommit.com', passwordHash, 'BASE_MEMBER', 178.0, 72.5, 'Muscle Gain', 'ACTIVE']);

  // 2: Premium Member (Sumith)
  await query(`
    INSERT INTO users (name, email, password_hash, role, height, weight, fitness_goal, account_status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, ['Sumith Raj', 'sumith@fitcommit.com', passwordHash, 'PREMIUM_MEMBER', 175.0, 70.0, 'General Fitness', 'ACTIVE']);

  // 3: Trainer (Arun)
  await query(`
    INSERT INTO users (name, email, password_hash, role, height, weight, fitness_goal, account_status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, ['Arun Abhishek', 'arun@fitcommit.com', passwordHash, 'TRAINER', 182.0, 78.0, 'Strength & Hypertrophy', 'ACTIVE']);

  // 4: Admin (Bheem)
  await query(`
    INSERT INTO users (name, email, password_hash, role, height, weight, fitness_goal, account_status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, ['Bheem Sagar', 'bheem@fitcommit.com', adminPasswordHash, 'ADMIN', 180.0, 75.0, 'Endurance', 'ACTIVE']);

  // 6. Subscriptions
  // Hemanth -> Base
  await query(`
    INSERT INTO subscriptions (user_id, membership_id, start_date, expiry_date, subscription_status)
    VALUES (1, 1, DATE('now', '-30 days'), DATE('now', '+335 days'), 'VALID')
  `);
  // Sumith -> Premium
  await query(`
    INSERT INTO subscriptions (user_id, membership_id, start_date, expiry_date, subscription_status)
    VALUES (2, 2, DATE('now', '-15 days'), DATE('now', '+350 days'), 'VALID')
  `);

  // Gym Subscription for Premium Member
  await query(`
    INSERT INTO gym_subscriptions (subscription_id, gym_id, access_status)
    VALUES (2, 1, 'ACTIVE')
  `);

  // Payment record for Premium Member
  await query(`
    INSERT INTO payments (subscription_id, payment_amount, payment_method, transaction_status, transaction_reference)
    VALUES (2, 29.00, 'CARD_SIMULATION', 'SUCCESS', 'TXN-FITCOMMIT-PREM-9821')
  `);

  // 7. Trainers & Allocation
  await query(`
    INSERT INTO trainers (user_id, trainer_name, specialization, contact_email, bio, avatar_url, is_available)
    VALUES 
    (3, 'Arun Abhishek', 'CSCS Certified Strength & Conditioning Coach', 'arun@fitcommit.com', 'Specializes in hypertrophy, biomechanics, and adaptive training routines designed for busy academic and engineering schedules.', '/assets/trainers/arun.jpg', 1),
    (NULL, 'Freja Lindqvist', 'Scandinavian Performance & Mobility Specialist', 'freja@fitcommit.com', 'Focuses on functional posture, kettlebell conditioning, and sustainable nutrition habits.', '/assets/trainers/freja.jpg', 1)
  `);

  // Allocate Arun to Sumith (Premium Member)
  await query(`
    INSERT INTO trainer_allocations (user_id, trainer_id, status)
    VALUES (2, 1, 'ACTIVE')
  `);

  // Initial trainer message
  await query(`
    INSERT INTO trainer_messages (allocation_id, sender_role, message_text)
    VALUES 
    (1, 'TRAINER', 'Welcome to FitCommit Premium, Sumith! I have reviewed your weekly consistency. Your commitment score is at a solid 82%. Keep your hydration high and let me know if you need adjustments for upper body volume.'),
    (1, 'USER', 'Thanks Coach Arun! The Leg Press was occupied yesterday but the app suggested Goblet Squats immediately. Completed all 4 sets with great intensity.'),
    (1, 'TRAINER', 'Excellent adaptation. That is precisely what FitCommit dedication is about. Focus on steady tempo.')
  `);

  // 8. BMI Records
  // Hemanth
  await query(`
    INSERT INTO bmi_records (user_id, height, weight, bmi_value, category, record_date)
    VALUES 
    (1, 178.0, 74.0, 23.36, 'Normal Weight', DATE('now', '-21 days')),
    (1, 178.0, 73.2, 23.10, 'Normal Weight', DATE('now', '-14 days')),
    (1, 178.0, 72.8, 22.98, 'Normal Weight', DATE('now', '-7 days')),
    (1, 178.0, 72.5, 22.88, 'Normal Weight', DATE('now'))
  `);

  // Sumith
  await query(`
    INSERT INTO bmi_records (user_id, height, weight, bmi_value, category, record_date)
    VALUES 
    (2, 175.0, 71.5, 23.35, 'Normal Weight', DATE('now', '-14 days')),
    (2, 175.0, 70.0, 22.86, 'Normal Weight', DATE('now'))
  `);

  // 9. Macronutrient Targets
  // Hemanth (Goal: Muscle Gain, Target: 2,240 kcal)
  await query(`
    INSERT INTO macronutrient_targets (user_id, bmi_id, daily_calories, protein_intake, carb_intake, fat_intake)
    VALUES (1, 4, 2240, 140, 250, 70)
  `);
  // Sumith (Goal: General Fitness, Target: 2,100 kcal)
  await query(`
    INSERT INTO macronutrient_targets (user_id, bmi_id, daily_calories, protein_intake, carb_intake, fat_intake)
    VALUES (2, 6, 2100, 135, 230, 65)
  `);

  // 10. Workout Plans & Commitment Rules
  const hemanthSchedule = [
    {
      day: 'Monday',
      name: 'Upper Body Hypertrophy',
      durationMinutes: 45,
      exercises: [
        { name: 'Dumbbell Bench Press', sets: 4, reps: '8-10', targetRPE: 8 },
        { name: 'Chest-Supported Row', sets: 4, reps: '10-12', targetRPE: 8 },
        { name: 'Overhead Dumbbell Press', sets: 3, reps: '10-12', targetRPE: 7.5 },
        { name: 'Incline Bicep Curls & Skullcrushers', sets: 3, reps: '12-15', targetRPE: 8 }
      ]
    },
    {
      day: 'Tuesday',
      name: 'Lower Body Strength & Core',
      durationMinutes: 50,
      exercises: [
        { name: 'Goblet Squats / Barbell Squat', sets: 4, reps: '8-10', targetRPE: 8 },
        { name: 'Romanian Deadlifts', sets: 3, reps: '10-12', targetRPE: 8 },
        { name: 'Walking Lunges', sets: 3, reps: '12 per leg', targetRPE: 7.5 },
        { name: 'Hanging Knee Raises', sets: 3, reps: '15', targetRPE: 8 }
      ]
    },
    {
      day: 'Thursday',
      name: 'Push & Conditioning',
      durationMinutes: 40,
      exercises: [
        { name: 'Incline Dumbbell Press', sets: 4, reps: '10-12', targetRPE: 8 },
        { name: 'Dumbbell Lateral Raises', sets: 4, reps: '15', targetRPE: 8.5 },
        { name: 'Tricep Rope Pushdowns', sets: 3, reps: '12-15', targetRPE: 8 }
      ]
    },
    {
      day: 'Friday',
      name: 'Pull & Posture Architecture',
      durationMinutes: 45,
      exercises: [
        { name: 'Lat Pulldowns / Pull-Ups', sets: 4, reps: '8-10', targetRPE: 8 },
        { name: 'Single-Arm Dumbbell Row', sets: 3, reps: '10-12', targetRPE: 8 },
        { name: 'Face Pulls', sets: 4, reps: '15-20', targetRPE: 7 }
      ]
    }
  ];

  await query(`
    INSERT INTO workout_plans (user_id, trainer_id, plan_name, difficulty_level, target_goal, schedule, is_active)
    VALUES (1, NULL, 'Adaptive Hypertrophy 4-Day', 'Intermediate', 'Muscle Gain', $1, 1)
  `, [JSON.stringify(hemanthSchedule)]);

  await query(`
    INSERT INTO commitment_rules (workout_plan_id, rule_name, adjustment_factor, min_completion_rate)
    VALUES (1, 'Adherence Scaling Rule', 1.05, 75)
  `);

  // Sumith's Plan
  await query(`
    INSERT INTO workout_plans (user_id, trainer_id, plan_name, difficulty_level, target_goal, schedule, is_active)
    VALUES (2, 1, 'Premium Nordic Functional Split', 'Intermediate', 'General Fitness', $1, 1)
  `, [JSON.stringify(hemanthSchedule)]);

  await query(`
    INSERT INTO commitment_rules (workout_plan_id, rule_name, adjustment_factor, min_completion_rate)
    VALUES (2, 'Coach Supervised Adaptation Rule', 1.10, 80)
  `);

  // 11. Diet Plans
  const mealStructure = {
    breakfast: { title: 'Nordic Oats & Whey Bowl', calories: 520, protein: 38, carbs: 65, fat: 12, description: 'Steel-cut oats with whey isolate, wild blueberries, and crushed chia seeds.' },
    lunch: { title: 'Grilled Herb Salmon & Quinoa', calories: 680, protein: 46, carbs: 60, fat: 26, description: 'Atlantic salmon fillet served over quinoa, steamed asparagus, and cold-pressed olive oil.' },
    snack: { title: 'Skyr Yogurt & Almond Medley', calories: 290, protein: 26, carbs: 18, fat: 11, description: 'Traditional Icelandic skyr yogurt topped with raw almonds and raw honey.' },
    dinner: { title: 'Tender Roast Chicken & Sweet Potato', calories: 750, protein: 48, carbs: 75, fat: 21, description: 'Herb-roasted chicken breast with roasted sweet potato cubes and crisp garden greens.' }
  };

  await query(`
    INSERT INTO diet_plans (membership_id, user_id, diet_name, calorie_target, meal_structure)
    VALUES 
    (1, 1, 'Clean Lean Mass Plan', 2240, $1),
    (2, 2, 'Nordic Metabolic Balance Plan', 2100, $2)
  `, [JSON.stringify(mealStructure), JSON.stringify(mealStructure)]);

  // 12. Progress Logs (Past 7 days)
  const logs = [
    { day: -6, cal: 480, steps: 8920, completed: 1, notes: 'Upper body completed on time.' },
    { day: -5, cal: 520, steps: 9410, completed: 1, notes: 'Lower body session executed.' },
    { day: -4, cal: 210, steps: 6500, completed: 0, notes: 'Active rest day & light recovery walk.' },
    { day: -3, cal: 460, steps: 8750, completed: 1, notes: 'Push volume felt great.' },
    { day: -2, cal: 490, steps: 8300, completed: 1, notes: 'Pull routine completed with strict form.' },
    { day: -1, cal: 240, steps: 7120, completed: 0, notes: 'Recovery & mobility flow.' },
    { day: 0,  cal: 510, steps: 8421, completed: 1, notes: 'Today session finished.' }
  ];

  for (const log of logs) {
    await query(`
      INSERT INTO progress_logs (user_id, workout_plan_id, log_date, calories_burned, steps, workout_completed, notes)
      VALUES (1, 1, DATE('now', '${log.day} days'), $1, $2, $3, $4)
    `, [log.cal, log.steps, log.completed, log.notes]);

    await query(`
      INSERT INTO progress_logs (user_id, workout_plan_id, log_date, calories_burned, steps, workout_completed, notes)
      VALUES (2, 2, DATE('now', '${log.day} days'), $1, $2, $3, $4)
    `, [log.cal, log.steps, log.completed, log.notes]);
  }

  // 13. Supplement Discounts
  const discounts = [
    { name: 'Pure Hydrolyzed Whey Isolate', brand: 'Nordic Endurance Labs', pct: 25, code: 'NORDIC25', exp: '2026-12-31', desc: 'Ultra-pure grass-fed whey with 27g protein per serving and zero artificial sweeteners.' },
    { name: 'Electrolyte Mineral Complex', brand: 'Hygge Vitality', pct: 20, code: 'MINERAL20', exp: '2026-11-30', desc: 'Optimal sodium-potassium-magnesium hydration ratio for prolonged workout performance.' },
    { name: 'Micronized Creatine Monohydrate', brand: 'Kobenhavn Nutrition', pct: 30, code: 'CREATINE30', exp: '2026-12-15', desc: 'Pure Creapure pharmaceutical grade for strength output and cellular hydration.' },
    { name: 'Algal Plant-Based Omega-3', brand: 'Nordic Pure Marine', pct: 15, code: 'OMEGA15', exp: '2026-10-31', desc: 'Sustainably sourced DHA & EPA for joint health and cognitive clarity.' }
  ];

  for (const d of discounts) {
    await query(`
      INSERT INTO supplement_discounts (membership_id, product_name, brand, discount_percentage, code, expiry_date, description)
      VALUES (2, $1, $2, $3, $4, $5, $6)
    `, [d.name, d.brand, d.pct, d.code, d.exp, d.desc]);
  }

  // 14. Notifications
  await query(`
    INSERT INTO notifications (user_id, type, title, message, is_read)
    VALUES 
    (1, 'WORKOUT', 'Upper Body Session Scheduled', 'Your adaptive routine is primed for today. Target completion: 45 minutes.', 0),
    (1, 'DIET', 'Daily Macronutrient Goal', 'You are at 85g / 140g protein for today. Keep dinner protein-dense to hit your target.', 0),
    (1, 'SUBSCRIPTION', 'Base Membership Active', 'Enjoy unlimited AI adaptive workouts, BMI tracking, and nutrition tools.', 1),
    (2, 'TRAINER', 'New Message from Coach Arun', 'Arun left constructive feedback on your consistency score.', 0),
    (2, 'EQUIPMENT', 'Smart Equipment Alert', 'Leg Press is currently occupied at the gym. 2 alternative exercises are recommended.', 0)
  `);

  await ensureGymAttendanceSeeded();

  console.log('Database successfully seeded with complete FitCommit SRS data.');
}

async function ensureGymAttendanceSeeded() {
  // 1. Ensure gym table has qr_code and capacity columns
  try {
    await exec(`ALTER TABLE gyms ADD COLUMN qr_code TEXT DEFAULT 'FITCOMMIT-GYM-001'`);
  } catch {}
  try {
    await exec(`ALTER TABLE gyms ADD COLUMN capacity INTEGER DEFAULT 100`);
  } catch {}

  // 2. Ensure gyms row has FITCOMMIT-GYM-001
  const gymCheck = await query('SELECT count(*) as count FROM gyms');
  if (gymCheck.rows[0].count === 0) {
    await query(`
      INSERT INTO gyms (gym_name, location, qr_code, capacity)
      VALUES ($1, $2, $3, $4)
    `, ['FitCommit Central Gym', 'Nordic Center, Level 2, Metro Square', 'FITCOMMIT-GYM-001', 100]);
  } else {
    await query(`
      UPDATE gyms SET gym_name = 'FitCommit Central Gym', qr_code = 'FITCOMMIT-GYM-001', capacity = 100 WHERE gym_id = 1
    `);
  }

  // 3. Ensure gym_attendance table exists
  if (getDbType() === 'sqlite') {
    await exec(`
      CREATE TABLE IF NOT EXISTS gym_attendance (
        attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        gym_id INTEGER REFERENCES gyms(gym_id) ON DELETE CASCADE,
        check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        check_out_time DATETIME,
        status TEXT DEFAULT 'CHECKED_IN',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // 4. Check if attendance already has records
  const attCheck = await query('SELECT count(*) as count FROM gym_attendance');
  if (attCheck.rows[0].count > 0) {
    return;
  }

  console.log('Seeding QR gym attendance data (24 active checked-in members, 24 checked-out today, history records)...');

  // Insert additional demo gym members to have a realistic registered member pool
  const memberNames = [
    'Rahul Verma', 'Akhil Nair', 'Priya Sharma', 'Aarav Patel', 'Sneha Reddy', 
    'Vikram Malhotra', 'Ananya Iyer', 'Rohan Gupta', 'Kavya Sen', 'Aditya Joshi',
    'Ishaan Roy', 'Tanvi Deshmukh', 'Varun Mehta', 'Meera Rao', 'Siddharth Menon',
    'Riya Kapoor', 'Karthik Pillai', 'Divya Chawla', 'Naveen Kumar', 'Pooja Bhat',
    'Harish Nambiar', 'Shreya Saxena', 'Manish Tiwari', 'Neha Agarwal', 'Gautam Bose',
    'Tara Das', 'Akash Sundaram', 'Swati Mishra'
  ];

  const passHash = await bcrypt.hash('member123', 8);
  const seededUserIds = [];

  for (let i = 0; i < memberNames.length; i++) {
    const name = memberNames[i];
    const email = `member${i + 1}@gym.fitcommit.ac.in`;
    try {
      await query(`
        INSERT INTO users (name, email, password_hash, role, height, weight, fitness_goal, account_status)
        VALUES ($1, $2, $3, 'PREMIUM_MEMBER', 172.0, 68.0, 'General Fitness', 'ACTIVE')
      `, [name, email, passHash]);
      const lastId = await query('SELECT last_insert_rowid() as id');
      seededUserIds.push(lastId.rows[0].id);
    } catch {
      // ignore unique constraint
    }
  }

  if (seededUserIds.length === 0) {
    const existing = await query('SELECT user_id FROM users LIMIT 30');
    seededUserIds.push(...existing.rows.map(r => r.user_id));
  }

  // 5. Seed 24 active checked-in members (status = 'CHECKED_IN', check_out_time = NULL)
  // Check-in times staggered over the past 15 - 90 minutes
  for (let i = 0; i < Math.min(24, seededUserIds.length); i++) {
    const userId = seededUserIds[i];
    const minutesAgo = 15 + (i * 3);
    await query(`
      INSERT INTO gym_attendance (user_id, gym_id, check_in_time, status)
      VALUES ($1, 1, datetime('now', '-${minutesAgo} minutes'), 'CHECKED_IN')
    `, [userId]);
  }

  // 6. Seed 24 completed check-ins from earlier today (status = 'CHECKED_OUT')
  for (let i = 0; i < Math.min(24, seededUserIds.length); i++) {
    const userId = seededUserIds[i];
    const inHoursAgo = 5 + (i % 3);
    const outHoursAgo = inHoursAgo - 1.25;
    await query(`
      INSERT INTO gym_attendance (user_id, gym_id, check_in_time, check_out_time, status)
      VALUES ($1, 1, datetime('now', '-${inHoursAgo} hours'), datetime('now', '-${outHoursAgo} hours'), 'CHECKED_OUT')
    `, [userId]);
  }

  // 7. Seed past attendance history for demo user 2 (Sumith Raj, Premium Member)
  const pastSessions = [
    { in: '2026-10-06 18:10:00', out: '2026-10-06 19:35:00' },
    { in: '2026-10-05 17:50:00', out: '2026-10-05 19:10:00' },
    { in: '2026-10-03 18:00:00', out: '2026-10-03 19:15:00' },
    { in: '2026-10-01 17:45:00', out: '2026-10-01 19:05:00' },
    { in: '2026-09-29 18:15:00', out: '2026-09-29 19:40:00' }
  ];

  for (const s of pastSessions) {
    await query(`
      INSERT INTO gym_attendance (user_id, gym_id, check_in_time, check_out_time, status)
      VALUES (2, 1, $1, $2, 'CHECKED_OUT')
    `, [s.in, s.out]);
  }

  console.log('✓ QR Gym Attendance initialized: 24 active checked-in members, 48 today check-ins.');
}

async function ensureMealsSeeded() {
  // 1. Create tables if not exist
  if (getDbType() === 'sqlite') {
    await exec(`
      CREATE TABLE IF NOT EXISTS meals (
        meal_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        meal_type TEXT DEFAULT 'LUNCH',
        meal_name TEXT NOT NULL,
        meal_date DATE DEFAULT (DATE('now')),
        image_url TEXT,
        calories INTEGER NOT NULL DEFAULT 0,
        protein_g INTEGER NOT NULL DEFAULT 0,
        carbs_g INTEGER NOT NULL DEFAULT 0,
        fat_g INTEGER NOT NULL DEFAULT 0,
        fiber_g INTEGER NOT NULL DEFAULT 0,
        ai_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS meal_items (
        item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        meal_id INTEGER REFERENCES meals(meal_id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        quantity TEXT NOT NULL,
        calories INTEGER NOT NULL DEFAULT 0,
        protein_g INTEGER NOT NULL DEFAULT 0,
        carbs_g INTEGER NOT NULL DEFAULT 0,
        fat_g INTEGER NOT NULL DEFAULT 0,
        fiber_g INTEGER NOT NULL DEFAULT 0,
        confidence TEXT DEFAULT 'high'
      );
    `);
  }

  // Check if meals already exist
  const mealCheck = await query('SELECT count(*) as count FROM meals');
  if (mealCheck.rows[0].count > 0) {
    return;
  }

  console.log('Seeding demo initial meals for today...');

  // Seed sample meals for demo users (user 1 and user 2)
  const initialMeals = [
    {
      userId: 1,
      type: 'BREAKFAST',
      name: 'Nordic Protein Oats with Berries',
      calories: 480,
      protein: 36,
      carbs: 62,
      fat: 10,
      fiber: 8,
      items: [
        { name: 'Steel-Cut Oats', quantity: '80 g', calories: 300, protein_g: 10, carbs_g: 54, fat_g: 5, fiber_g: 6, confidence: 'high' },
        { name: 'Whey Protein Isolate', quantity: '30 g', calories: 120, protein_g: 25, carbs_g: 2, fat_g: 1, fiber_g: 0, confidence: 'high' },
        { name: 'Wild Blueberries & Chia', quantity: '50 g', calories: 60, protein_g: 1, carbs_g: 12, fat_g: 4, fiber_g: 2, confidence: 'high' }
      ]
    },
    {
      userId: 1,
      type: 'LUNCH',
      name: 'Grilled Chicken Breast & Herb Quinoa',
      calories: 640,
      protein: 48,
      carbs: 65,
      fat: 14,
      fiber: 7,
      items: [
        { name: 'Grilled Herb Chicken', quantity: '180 g', calories: 290, protein_g: 38, carbs_g: 1, fat_g: 8, fiber_g: 0, confidence: 'high' },
        { name: 'Cooked Quinoa', quantity: '180 g', calories: 220, protein_g: 8, carbs_g: 39, fat_g: 3, fiber_g: 5, fiber_g: 5, confidence: 'high' },
        { name: 'Steamed Broccoli & Olive Oil', quantity: '100 g', calories: 130, protein_g: 2, carbs_g: 8, fat_g: 3, fiber_g: 2, confidence: 'medium' }
      ]
    },
    {
      userId: 2,
      type: 'BREAKFAST',
      name: 'Avocado Egg Toast & Skyr Yogurt',
      calories: 520,
      protein: 34,
      carbs: 45,
      fat: 18,
      fiber: 9,
      items: [
        { name: 'Whole Wheat Sourdough', quantity: '2 slices', calories: 180, protein_g: 8, carbs_g: 32, fat_g: 2, fiber_g: 4, confidence: 'high' },
        { name: 'Poached Eggs (2)', quantity: '100 g', calories: 140, protein_g: 12, carbs_g: 1, fat_g: 10, fiber_g: 0, confidence: 'high' },
        { name: 'Hass Avocado', quantity: '60 g', calories: 100, protein_g: 1, carbs_g: 4, fat_g: 9, fiber_g: 4, confidence: 'high' },
        { name: 'Plain Skyr Yogurt', quantity: '100 g', calories: 100, protein_g: 13, carbs_g: 4, fat_g: 0, fiber_g: 1, confidence: 'high' }
      ]
    }
  ];

  for (const m of initialMeals) {
    const mealRes = await query(`
      INSERT INTO meals (user_id, meal_type, meal_name, meal_date, calories, protein_g, carbs_g, fat_g, fiber_g)
      VALUES ($1, $2, $3, DATE('now'), $4, $5, $6, $7, $8)
    `, [m.userId, m.type, m.name, m.calories, m.protein, m.carbs, m.fat, m.fiber]);

    const lastId = await query('SELECT last_insert_rowid() as id');
    const mealId = lastId.rows[0]?.id || mealRes.rows[0]?.id;

    if (mealId) {
      for (const item of m.items) {
        await query(`
          INSERT INTO meal_items (meal_id, name, quantity, calories, protein_g, carbs_g, fat_g, fiber_g, confidence)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [mealId, item.name, item.quantity, item.calories, item.protein_g, item.carbs_g, item.fat_g, item.fiber_g || 1, item.confidence || 'high']);
      }
    }
  }

  console.log('✓ Demo meals successfully seeded.');
}

module.exports = { seedDatabase, ensureGymAttendanceSeeded, ensureMealsSeeded };

