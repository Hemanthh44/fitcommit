const { query } = require('../config/db');
const { calculateBMI, calculateMacronutrients } = require('../services/aiRecommendationEngine');

async function getProfile(req, res) {
  try {
    const userRes = await query('SELECT user_id, name, email, role, height, weight, fitness_goal, account_status, created_at FROM users WHERE user_id = $1', [req.user.user_id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];

    const bmiRes = await query('SELECT * FROM bmi_records WHERE user_id = $1 ORDER BY bmi_id DESC LIMIT 1', [user.user_id]);
    const macroRes = await query('SELECT * FROM macronutrient_targets WHERE user_id = $1 ORDER BY macro_target_id DESC LIMIT 1', [user.user_id]);
    const subRes = await query(`
      SELECT s.*, m.membership_name, m.tier, m.features
      FROM subscriptions s
      JOIN memberships m ON s.membership_id = m.membership_id
      WHERE s.user_id = $1 ORDER BY s.subscription_id DESC LIMIT 1
    `, [user.user_id]);

    res.json({
      user,
      latestBMI: bmiRes.rows[0] || null,
      macroTargets: macroRes.rows[0] || null,
      subscription: subRes.rows[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, height, weight, fitness_goal } = req.body;
    const userId = req.user.user_id;

    if (!name || !height || !weight || !fitness_goal) {
      return res.status(400).json({ error: 'Name, height, weight, and fitness goal are required.' });
    }

    const numHeight = parseFloat(height);
    const numWeight = parseFloat(weight);

    await query(`
      UPDATE users 
      SET name = $1, height = $2, weight = $3, fitness_goal = $4
      WHERE user_id = $5
    `, [name, numHeight, numWeight, fitness_goal, userId]);

    // Recalculate BMI and Macronutrients automatically per SRS U9/U10
    const { bmi, category } = calculateBMI(numWeight, numHeight);
    const bmiRes = await query(`
      INSERT INTO bmi_records (user_id, height, weight, bmi_value, category, record_date)
      VALUES ($1, $2, $3, $4, $5, DATE('now'))
    `, [userId, numHeight, numWeight, bmi, category]);

    const bmiId = bmiRes.lastInsertRowid || bmiRes.rows[0]?.id || 1;
    const macros = calculateMacronutrients(numWeight, numHeight, fitness_goal);

    await query(`
      INSERT INTO macronutrient_targets (user_id, bmi_id, daily_calories, protein_intake, carb_intake, fat_intake)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, bmiId, macros.dailyCalories, macros.proteinIntake, macros.carbIntake, macros.fatIntake]);

    res.json({
      message: 'Profile updated successfully with recalculated biometrics.',
      user: {
        user_id: userId,
        name,
        email: req.user.email,
        role: req.user.role,
        height: numHeight,
        weight: numWeight,
        fitness_goal
      },
      newBMI: { bmi, category },
      newMacros: macros
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getProfile,
  updateProfile
};
