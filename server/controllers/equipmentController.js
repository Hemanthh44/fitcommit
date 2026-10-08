const { query } = require('../config/db');

async function getAllEquipment(req, res) {
  try {
    const equipmentRes = await query(`
      SELECT ge.*, es.sensor_id, es.occupancy_status, es.battery_level, es.last_updated
      FROM gym_equipment ge
      JOIN equipment_sensors es ON ge.equipment_id = es.equipment_id
      ORDER BY ge.equipment_id ASC
    `);

    const equipmentList = [];
    for (const item of equipmentRes.rows) {
      // If occupied, fetch suggested alternatives
      let alternatives = [];
      if (item.occupancy_status === 'OCCUPIED') {
        const altRes = await query(`
          SELECT * FROM alternative_exercise_suggestions
          WHERE equipment_id = $1
        `, [item.equipment_id]);
        alternatives = altRes.rows;
      }

      equipmentList.push({
        ...item,
        alternatives
      });
    }

    res.json(equipmentList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function toggleSensorStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // optional explicit status

    const currentRes = await query('SELECT * FROM equipment_sensors WHERE equipment_id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment sensor not found.' });
    }

    const current = currentRes.rows[0];
    const newStatus = status || (current.occupancy_status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE');

    await query(`
      UPDATE equipment_sensors 
      SET occupancy_status = $1, last_updated = CURRENT_TIMESTAMP
      WHERE equipment_id = $2
    `, [newStatus, id]);

    // Fetch alternatives if newly occupied
    let alternatives = [];
    if (newStatus === 'OCCUPIED') {
      const altRes = await query('SELECT * FROM alternative_exercise_suggestions WHERE equipment_id = $1', [id]);
      alternatives = altRes.rows;
    }

    // Fetch equipment name
    const eqNameRes = await query('SELECT equipment_name FROM gym_equipment WHERE equipment_id = $1', [id]);
    const equipmentName = eqNameRes.rows[0]?.equipment_name || 'Machine';

    res.json({
      message: `IoT Sensor state updated to ${newStatus}.`,
      equipment_id: parseInt(id),
      equipment_name: equipmentName,
      occupancy_status: newStatus,
      last_updated: new Date().toISOString(),
      alternatives
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAlternatives(req, res) {
  try {
    const { id } = req.params;
    const altRes = await query(`
      SELECT * FROM alternative_exercise_suggestions
      WHERE equipment_id = $1
    `, [id]);

    res.json(altRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAllEquipment,
  toggleSensorStatus,
  getAlternatives
};
