const { query } = require('../config/db');

async function getAnalytics(req, res) {
  try {
    const userId = req.user.user_id;

    // Fetch past 7 days records
    const logsRes = await query(`
      SELECT * FROM progress_logs 
      WHERE user_id = $1 
      ORDER BY log_date ASC LIMIT 14
    `, [userId]);

    const logs = logsRes.rows;

    const totalCalories = logs.reduce((sum, item) => sum + (item.calories_burned || 0), 0);
    const totalSteps = logs.reduce((sum, item) => sum + (item.steps || 0), 0);
    const completedCount = logs.filter(item => item.workout_completed === 1).length;
    const commitmentRate = Math.min(100, Math.round((completedCount / Math.max(1, logs.length)) * 100));

    // Current BMI
    const bmiRes = await query('SELECT bmi_value, category FROM bmi_records WHERE user_id = $1 ORDER BY bmi_id DESC LIMIT 1', [userId]);

    res.json({
      summary: {
        totalCalories,
        avgCaloriesPerDay: Math.round(totalCalories / Math.max(1, logs.length)),
        totalSteps,
        avgStepsPerDay: Math.round(totalSteps / Math.max(1, logs.length)),
        completedWorkouts: completedCount,
        totalTrackedDays: logs.length,
        commitmentRate,
        currentBMI: bmiRes.rows[0]?.bmi_value || 22.8,
        bmiCategory: bmiRes.rows[0]?.category || 'Normal Weight'
      },
      dailyLogs: logs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function logActivity(req, res) {
  try {
    const userId = req.user.user_id;
    const { steps = 5000, calories_burned = 300, workout_completed = 0, notes = '' } = req.body;

    const existing = await query(`
      SELECT progress_id FROM progress_logs 
      WHERE user_id = $1 AND log_date = DATE('now')
    `, [userId]);

    if (existing.rows.length > 0) {
      await query(`
        UPDATE progress_logs 
        SET steps = steps + $1, calories_burned = calories_burned + $2, notes = $3
        WHERE progress_id = $4
      `, [parseInt(steps), parseInt(calories_burned), notes, existing.rows[0].progress_id]);
    } else {
      await query(`
        INSERT INTO progress_logs (user_id, workout_plan_id, log_date, calories_burned, steps, workout_completed, notes)
        VALUES ($1, 1, DATE('now'), $2, $3, $4, $5)
      `, [userId, parseInt(calories_burned), parseInt(steps), parseInt(workout_completed), notes]);
    }

    res.json({ message: 'Activity logged successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAnalytics,
  logActivity
};
