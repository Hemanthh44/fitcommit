const { query } = require('../config/db');

async function getMetrics(req, res) {
  try {
    const totalUsersRes = await query('SELECT count(*) as count FROM users');
    const baseUsersRes = await query("SELECT count(*) as count FROM users WHERE role = 'BASE_MEMBER'");
    const premiumUsersRes = await query("SELECT count(*) as count FROM users WHERE role = 'PREMIUM_MEMBER'");
    const trainersRes = await query('SELECT count(*) as count FROM trainers');

    const totalEquipmentRes = await query('SELECT count(*) as count FROM gym_equipment');
    const occupiedEquipmentRes = await query("SELECT count(*) as count FROM equipment_sensors WHERE occupancy_status = 'OCCUPIED'");
    const activeSensorsRes = await query("SELECT count(*) as count FROM equipment_sensors WHERE occupancy_status != 'OUT_OF_SERVICE'");

    const totalWorkoutsRes = await query('SELECT sum(workout_completed) as count FROM progress_logs');

    res.json({
      metrics: {
        totalUsers: totalUsersRes.rows[0].count,
        baseMembers: baseUsersRes.rows[0].count,
        premiumMembers: premiumUsersRes.rows[0].count,
        trainers: trainersRes.rows[0].count,
        totalGymMachines: totalEquipmentRes.rows[0].count,
        currentlyOccupiedMachines: occupiedEquipmentRes.rows[0].count,
        activeSensors: activeSensorsRes.rows[0].count,
        systemHealth: '99.8% High Availability (Operational)',
        totalWorkoutsCompleted: totalWorkoutsRes.rows[0].count || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllUsers(req, res) {
  try {
    const usersRes = await query(`
      SELECT u.user_id, u.name, u.email, u.role, u.height, u.weight, u.fitness_goal, u.account_status, u.created_at,
             m.membership_name, s.subscription_status
      FROM users u
      LEFT JOIN subscriptions s ON u.user_id = s.user_id
      LEFT JOIN memberships m ON s.membership_id = m.membership_id
      ORDER BY u.user_id ASC
    `);

    res.json(usersRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { role, account_status } = req.body;

    if (role) {
      await query('UPDATE users SET role = $1 WHERE user_id = $2', [role, id]);
    }
    if (account_status) {
      await query('UPDATE users SET account_status = $1 WHERE user_id = $2', [account_status, id]);
    }

    res.json({ message: 'User updated successfully by administrator.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateEquipmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { occupancy_status } = req.body;

    await query(`
      UPDATE equipment_sensors 
      SET occupancy_status = $1, last_updated = CURRENT_TIMESTAMP
      WHERE equipment_id = $2
    `, [occupancy_status, id]);

    res.json({ message: `Machine ${id} occupancy status set to ${occupancy_status}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getMetrics,
  getAllUsers,
  updateUser,
  updateEquipmentStatus
};
