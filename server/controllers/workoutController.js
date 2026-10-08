const { query } = require('../config/db');
const { adaptWorkoutRoutine } = require('../services/aiRecommendationEngine');

async function getCurrentPlan(req, res) {
  try {
    const userId = req.user.user_id;

    const planRes = await query(`
      SELECT wp.*, cr.rule_name, cr.adjustment_factor, cr.min_completion_rate
      FROM workout_plans wp
      LEFT JOIN commitment_rules cr ON wp.workout_plan_id = cr.workout_plan_id
      WHERE wp.user_id = $1 AND wp.is_active = 1
      ORDER BY wp.workout_plan_id DESC LIMIT 1
    `, [userId]);

    let plan = planRes.rows[0];
    if (!plan) {
      return res.status(404).json({ error: 'No active workout plan found.' });
    }

    let schedule = plan.schedule;
    if (typeof schedule === 'string') {
      try {
        schedule = JSON.parse(schedule);
      } catch (e) {
        // already parsed
      }
    }

    // Calculate weekly commitment completion rate from past 7 days logs
    const logsRes = await query(`
      SELECT count(*) as total_days, 
             sum(workout_completed) as completed_workouts
      FROM progress_logs
      WHERE user_id = $1 AND log_date >= DATE('now', '-7 days')
    `, [userId]);

    const totalDays = logsRes.rows[0]?.total_days || 7;
    const completedWorkouts = logsRes.rows[0]?.completed_workouts || 4;
    // Expected target: 4-5 sessions per week
    const targetSessions = 5;
    const completionRatePercent = Math.min(100, Math.round((completedWorkouts / targetSessions) * 100));

    // Pass through AI recommendation adaptation engine
    const adaptationResult = adaptWorkoutRoutine(schedule, completionRatePercent);

    // Check if workout is completed today
    const todayLogRes = await query(`
      SELECT * FROM progress_logs 
      WHERE user_id = $1 AND log_date = DATE('now')
    `, [userId]);
    const isCompletedToday = todayLogRes.rows.length > 0 && todayLogRes.rows[0].workout_completed === 1;

    res.json({
      plan_id: plan.workout_plan_id,
      plan_name: plan.plan_name,
      difficulty_level: plan.difficulty_level,
      target_goal: plan.target_goal,
      commitment_score: completionRatePercent,
      completed_this_week: completedWorkouts,
      target_this_week: targetSessions,
      is_completed_today: isCompletedToday,
      adjustment_factor: adaptationResult.adjustmentFactor,
      adaptation_notes: adaptationResult.adaptationNotes,
      schedule: adaptationResult.adaptedSchedule,
      today_workout: adaptationResult.adaptedSchedule[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function completeTodayWorkout(req, res) {
  try {
    const userId = req.user.user_id;
    const { calories = 480, notes = 'Completed full adaptive session' } = req.body;

    // Check if a record exists for today
    const existing = await query(`
      SELECT progress_id FROM progress_logs 
      WHERE user_id = $1 AND log_date = DATE('now')
    `, [userId]);

    if (existing.rows.length > 0) {
      await query(`
        UPDATE progress_logs 
        SET workout_completed = 1, calories_burned = calories_burned + $1, notes = $2
        WHERE progress_id = $3
      `, [parseInt(calories), notes, existing.rows[0].progress_id]);
    } else {
      await query(`
        INSERT INTO progress_logs (user_id, workout_plan_id, log_date, calories_burned, steps, workout_completed, notes)
        VALUES ($1, 1, DATE('now'), $2, 8500, 1, $3)
      `, [userId, parseInt(calories), notes]);
    }

    // Add notification
    await query(`
      INSERT INTO notifications (user_id, type, title, message, is_read)
      VALUES ($1, 'WORKOUT', 'Workout Session Logged', 'Great dedication! Today workout has been marked as complete.', 0)
    `, [userId]);

    res.json({
      message: 'Workout marked as complete! Your commitment score has been updated.',
      success: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getWorkoutHistory(req, res) {
  try {
    const userId = req.user.user_id;
    const history = await query(`
      SELECT * FROM progress_logs 
      WHERE user_id = $1 AND workout_completed = 1
      ORDER BY log_date DESC LIMIT 30
    `, [userId]);

    res.json(history.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getCurrentPlan,
  completeTodayWorkout,
  getWorkoutHistory
};
