const { query } = require('../config/db');

class WorkoutModel {
  static async getActivePlan(userId) {
    const res = await query(`
      SELECT wp.*, cr.adjustment_factor, cr.min_completion_rate
      FROM workout_plans wp
      LEFT JOIN commitment_rules cr ON wp.workout_plan_id = cr.workout_plan_id
      WHERE wp.user_id = $1 AND wp.is_active = TRUE
      ORDER BY wp.workout_plan_id DESC
      LIMIT 1
    `, [userId]);

    if (!res.rows[0]) return null;
    const plan = res.rows[0];
    return {
      ...plan,
      schedule: typeof plan.schedule === 'string' ? JSON.parse(plan.schedule) : plan.schedule
    };
  }

  static async logCompletion(userId, workoutPlanId, calories = 510, notes = 'Completed') {
    // Record into progress_logs
    await query(`
      INSERT INTO progress_logs (user_id, workout_plan_id, log_date, calories_burned, steps, workout_completed, notes)
      VALUES ($1, $2, CURRENT_DATE, $3, 8500, TRUE, $4)
    `, [userId, workoutPlanId, calories, notes]);

    // Recalculate adherence
    const logs = await query(`
      SELECT COUNT(*) as count FROM progress_logs
      WHERE user_id = $1 AND workout_completed = TRUE
    `, [userId]);

    const completed = parseInt(logs.rows[0].count) || 1;
    const score = Math.min(100, 70 + completed * 4);

    return { completedSessions: completed, commitmentScore: score };
  }

  static async getHistory(userId) {
    const res = await query(`
      SELECT log_date, calories_burned, steps, workout_completed, notes
      FROM progress_logs
      WHERE user_id = $1
      ORDER BY log_date DESC
      LIMIT 30
    `, [userId]);
    return res.rows;
  }
}

module.exports = WorkoutModel;
