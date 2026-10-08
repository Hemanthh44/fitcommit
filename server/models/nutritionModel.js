const { query } = require('../config/db');

class NutritionModel {
  static async getDietPlan(userId) {
    const res = await query(`
      SELECT * FROM diet_plans
      WHERE user_id = $1
      ORDER BY diet_plan_id DESC
      LIMIT 1
    `, [userId]);

    if (!res.rows[0]) return null;
    const plan = res.rows[0];
    return {
      ...plan,
      meal_structure: typeof plan.meal_structure === 'string' ? JSON.parse(plan.meal_structure) : plan.meal_structure
    };
  }

  static async getMacroTargets(userId) {
    const res = await query(`
      SELECT * FROM macronutrient_targets
      WHERE user_id = $1
      ORDER BY macro_target_id DESC
      LIMIT 1
    `, [userId]);
    return res.rows[0] || null;
  }

  static async getBMIHistory(userId) {
    const res = await query(`
      SELECT bmi_id, record_date, height, weight, bmi_value, category
      FROM bmi_records
      WHERE user_id = $1
      ORDER BY record_date DESC, bmi_id DESC
    `, [userId]);
    return res.rows;
  }

  static async logBMI(userId, height, weight, bmi, category) {
    const res = await query(`
      INSERT INTO bmi_records (user_id, height, weight, bmi_value, category, record_date)
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
    `, [userId, height, weight, bmi, category]);

    return res.lastInsertRowid || res.rows[0]?.id || 1;
  }

  static async saveMacroTargets(userId, bmiId, calories, protein, carbs, fat) {
    await query(`
      INSERT INTO macronutrient_targets (user_id, bmi_id, daily_calories, protein_intake, carb_intake, fat_intake)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, bmiId, calories, protein, carbs, fat]);
  }
}

module.exports = NutritionModel;
