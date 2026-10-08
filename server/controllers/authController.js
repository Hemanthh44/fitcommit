const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { calculateBMI, calculateMacronutrients } = require('../services/aiRecommendationEngine');

async function register(req, res) {
  try {
    const { name, email, password, height, weight, fitness_goal, role = 'BASE_MEMBER' } = req.body;

    if (!name || !email || !password || !height || !weight || !fitness_goal) {
      return res.status(400).json({ error: 'All fields (name, email, password, height, weight, fitness_goal) are required.' });
    }

    const existing = await query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = role === 'PREMIUM_MEMBER' ? 'PREMIUM_MEMBER' : 'BASE_MEMBER';

    const insertUserRes = await query(`
      INSERT INTO users (name, email, password_hash, role, height, weight, fitness_goal, account_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
    `, [name, email, passwordHash, assignedRole, parseFloat(height), parseFloat(weight), fitness_goal]);

    const userId = insertUserRes.lastInsertRowid || insertUserRes.rows[0].id || insertUserRes.rows[0].user_id;

    // 1. Create Subscription
    const membershipId = assignedRole === 'PREMIUM_MEMBER' ? 2 : 1;
    await query(`
      INSERT INTO subscriptions (user_id, membership_id, start_date, expiry_date, subscription_status)
      VALUES ($1, $2, DATE('now'), DATE('now', '+365 days'), 'VALID')
    `, [userId, membershipId]);

    // If Premium, also assign Gym Subscription and Trainer
    if (assignedRole === 'PREMIUM_MEMBER') {
      const subRes = await query('SELECT subscription_id FROM subscriptions WHERE user_id = $1 ORDER BY subscription_id DESC LIMIT 1', [userId]);
      const subId = subRes.rows[0].subscription_id;
      await query(`
        INSERT INTO gym_subscriptions (subscription_id, gym_id, access_status)
        VALUES ($1, 1, 'ACTIVE')
      `, [subId]);

      // Allocate Trainer (Arun Abhishek)
      await query(`
        INSERT INTO trainer_allocations (user_id, trainer_id, status)
        VALUES ($1, 1, 'ACTIVE')
      `, [userId]);
    }

    // 2. Calculate initial BMI
    const { bmi, category } = calculateBMI(parseFloat(weight), parseFloat(height));
    const bmiRes = await query(`
      INSERT INTO bmi_records (user_id, height, weight, bmi_value, category, record_date)
      VALUES ($1, $2, $3, $4, $5, DATE('now'))
    `, [userId, parseFloat(height), parseFloat(weight), bmi, category]);

    const bmiId = bmiRes.lastInsertRowid || bmiRes.rows[0]?.id || 1;

    // 3. Calculate Macronutrients
    const macros = calculateMacronutrients(parseFloat(weight), parseFloat(height), fitness_goal);
    await query(`
      INSERT INTO macronutrient_targets (user_id, bmi_id, daily_calories, protein_intake, carb_intake, fat_intake)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, bmiId, macros.dailyCalories, macros.proteinIntake, macros.carbIntake, macros.fatIntake]);

    // 4. Create Initial Adaptive Workout Plan
    const defaultSchedule = [
      {
        day: 'Day 1',
        name: 'Foundation Upper Body',
        durationMinutes: 45,
        exercises: [
          { name: 'Dumbbell Bench Press', sets: 3, reps: '10-12', targetRPE: 7.5 },
          { name: 'Dumbbell Bent-Over Row', sets: 3, reps: '10-12', targetRPE: 7.5 },
          { name: 'Shoulder Press', sets: 3, reps: '12', targetRPE: 7.0 },
          { name: 'Plank Hold', sets: 3, reps: '45s', targetRPE: 7.0 }
        ]
      },
      {
        day: 'Day 2',
        name: 'Lower Body Alignment',
        durationMinutes: 45,
        exercises: [
          { name: 'Goblet Squats', sets: 3, reps: '10-12', targetRPE: 7.5 },
          { name: 'Romanian Deadlifts', sets: 3, reps: '10-12', targetRPE: 7.5 },
          { name: 'Reverse Lunges', sets: 3, reps: '10 per leg', targetRPE: 7.0 }
        ]
      },
      {
        day: 'Day 3',
        name: 'Active Dedication Flow',
        durationMinutes: 35,
        exercises: [
          { name: 'Push-Ups (Strict Form)', sets: 3, reps: '12-15', targetRPE: 7.5 },
          { name: 'Lat Pulldowns / Inverted Rows', sets: 3, reps: '10-12', targetRPE: 7.5 },
          { name: 'Core Hollow Body Hold', sets: 3, reps: '30s', targetRPE: 8.0 }
        ]
      }
    ];

    const wpRes = await query(`
      INSERT INTO workout_plans (user_id, trainer_id, plan_name, difficulty_level, target_goal, schedule, is_active)
      VALUES ($1, NULL, 'Adaptive Onboarding Routine', 'Beginner', $2, $3, 1)
    `, [userId, fitness_goal, JSON.stringify(defaultSchedule)]);

    const wpId = wpRes.lastInsertRowid || wpRes.rows[0]?.id || 1;
    await query(`
      INSERT INTO commitment_rules (workout_plan_id, rule_name, adjustment_factor, min_completion_rate)
      VALUES ($1, 'Onboarding Adherence Rule', 1.00, 70)
    `, [wpId]);

    // 5. Create Diet Plan
    const mealStructure = {
      breakfast: { title: 'Nordic Protein Porridge', calories: 480, protein: 32, carbs: 62, fat: 10, description: 'Rolled oats with clean whey isolate, pumpkin seeds, and blueberries.' },
      lunch: { title: 'Scandinavian Salmon & Greens', calories: 620, protein: 42, carbs: 48, fat: 24, description: 'Grilled wild salmon with roasted baby potatoes and asparagus.' },
      snack: { title: 'Organic Skyr & Crushed Walnuts', calories: 260, protein: 24, carbs: 14, fat: 9, description: 'High-protein Icelandic yogurt with raw walnuts.' },
      dinner: { title: 'Herb Turkey Medallions & Quinoa', calories: 650, protein: 44, carbs: 65, fat: 18, description: 'Lean grilled turkey breast with tri-color quinoa and steamed broccoli.' }
    };

    await query(`
      INSERT INTO diet_plans (membership_id, user_id, diet_name, calorie_target, meal_structure)
      VALUES ($1, $2, 'Balanced Dedication Diet', $3, $4)
    `, [membershipId, userId, macros.dailyCalories, JSON.stringify(mealStructure)]);

    // 6. Create Welcome Notification
    await query(`
      INSERT INTO notifications (user_id, type, title, message, is_read)
      VALUES ($1, 'SUBSCRIPTION', 'Welcome to FitCommit', 'Your commitment profile has been initialized with personalized adaptive plans.', 0)
    `, [userId]);

    const token = jwt.sign({ userId, email, role: assignedRole }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        user_id: userId,
        name,
        email,
        role: assignedRole,
        height: parseFloat(height),
        weight: parseFloat(weight),
        fitness_goal
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to complete registration: ' + err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const user = userRes.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    if (user.account_status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Your account is suspended. Contact administration.' });
    }

    // Fetch subscription details
    const subRes = await query(`
      SELECT s.*, m.membership_name, m.tier, m.features 
      FROM subscriptions s
      JOIN memberships m ON s.membership_id = m.membership_id
      WHERE s.user_id = $1 AND s.subscription_status = 'VALID'
      ORDER BY s.subscription_id DESC LIMIT 1
    `, [user.user_id]);

    const token = jwt.sign({ userId: user.user_id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        height: user.height,
        weight: user.weight,
        fitness_goal: user.fitness_goal,
        account_status: user.account_status
      },
      subscription: subRes.rows[0] || null
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
}

async function getMe(req, res) {
  try {
    const userRes = await query('SELECT user_id, name, email, role, height, weight, fitness_goal, account_status, created_at FROM users WHERE user_id = $1', [req.user.user_id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];

    const subRes = await query(`
      SELECT s.*, m.membership_name, m.tier, m.price, m.features 
      FROM subscriptions s
      JOIN memberships m ON s.membership_id = m.membership_id
      WHERE s.user_id = $1
      ORDER BY s.subscription_id DESC LIMIT 1
    `, [user.user_id]);

    res.json({
      user,
      subscription: subRes.rows[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function demoLogin(req, res) {
  try {
    const { role } = req.body; // 'base', 'premium', 'trainer', 'admin'
    let email = 'hemanth@fitcommit.com';
    if (role === 'premium') email = 'sumith@fitcommit.com';
    else if (role === 'trainer') email = 'arun@fitcommit.com';
    else if (role === 'admin') email = 'bheem@fitcommit.com';

    const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: `Demo profile for role '${role}' not found.` });
    }

    const user = userRes.rows[0];
    const subRes = await query(`
      SELECT s.*, m.membership_name, m.tier, m.features 
      FROM subscriptions s
      JOIN memberships m ON s.membership_id = m.membership_id
      WHERE s.user_id = $1
      ORDER BY s.subscription_id DESC LIMIT 1
    `, [user.user_id]);

    const token = jwt.sign({ userId: user.user_id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: `Switched to demo persona: ${user.name} (${user.role})`,
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        height: user.height,
        weight: user.weight,
        fitness_goal: user.fitness_goal,
        account_status: user.account_status
      },
      subscription: subRes.rows[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  register,
  login,
  getMe,
  demoLogin
};
