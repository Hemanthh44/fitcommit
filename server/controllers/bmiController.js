const { query } = require('../config/db');
const { calculateBMI, calculateMacronutrients } = require('../services/aiRecommendationEngine');

async function getBMIHistory(req, res) {
  try {
    const userId = req.user.user_id;
    const historyRes = await query(`
      SELECT * FROM bmi_records 
      WHERE user_id = $1 
      ORDER BY record_date ASC, bmi_id ASC
    `, [userId]);

    const latest = historyRes.rows[historyRes.rows.length - 1] || null;

    res.json({
      latest,
      history: historyRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function calculateAndLogBMI(req, res) {
  try {
    const userId = req.user.user_id;
    const { height, weight } = req.body;

    if (!height || !weight) {
      return res.status(400).json({ error: 'Height (cm) and Weight (kg) are required.' });
    }

    const numHeight = parseFloat(height);
    const numWeight = parseFloat(weight);

    const { bmi, category } = calculateBMI(numWeight, numHeight);

    // Save record
    const bmiRes = await query(`
      INSERT INTO bmi_records (user_id, height, weight, bmi_value, category, record_date)
      VALUES ($1, $2, $3, $4, $5, DATE('now'))
    `, [userId, numHeight, numWeight, bmi, category]);

    const bmiId = bmiRes.lastInsertRowid || bmiRes.rows[0]?.id || 1;

    // Update user profile table with latest metrics
    await query(`
      UPDATE users 
      SET height = $1, weight = $2 
      WHERE user_id = $3
    `, [numHeight, numWeight, userId]);

    // Recalculate macro target aligned with new weight
    const userRes = await query('SELECT fitness_goal FROM users WHERE user_id = $1', [userId]);
    const goal = userRes.rows[0]?.fitness_goal || 'General Fitness';
    const macros = calculateMacronutrients(numWeight, numHeight, goal);

    await query(`
      INSERT INTO macronutrient_targets (user_id, bmi_id, daily_calories, protein_intake, carb_intake, fat_intake)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, bmiId, macros.dailyCalories, macros.proteinIntake, macros.carbIntake, macros.fatIntake]);

    res.json({
      message: 'BMI calculated and stored successfully.',
      record: {
        bmi_id: bmiId,
        height: numHeight,
        weight: numWeight,
        bmi_value: bmi,
        category,
        record_date: new Date().toISOString().split('T')[0]
      },
      updatedMacros: macros
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getBMIHistory,
  calculateAndLogBMI
};
