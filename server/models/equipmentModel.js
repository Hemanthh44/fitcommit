const { query } = require('../config/db');

class EquipmentModel {
  static async getAllWithSensors() {
    const res = await query(`
      SELECT ge.equipment_id, ge.equipment_name, ge.category, ge.image_url,
             es.sensor_id, es.occupancy_status, es.battery_level, es.last_updated
      FROM gym_equipment ge
      LEFT JOIN equipment_sensors es ON ge.equipment_id = es.equipment_id
      ORDER BY ge.equipment_id ASC
    `);

    const equipmentList = [];
    for (const eq of res.rows) {
      const altRes = await query(`
        SELECT suggested_exercise_name, muscle_group, instructions
        FROM alternative_exercise_suggestions
        WHERE equipment_id = $1
      `, [eq.equipment_id]);

      equipmentList.push({
        ...eq,
        alternatives: altRes.rows
      });
    }

    return equipmentList;
  }

  static async updateSensorStatus(equipmentId, newStatus) {
    await query(`
      UPDATE equipment_sensors
      SET occupancy_status = $1, last_updated = CURRENT_TIMESTAMP
      WHERE equipment_id = $2
    `, [newStatus, equipmentId]);

    const res = await query(`
      SELECT ge.equipment_id, ge.equipment_name, es.occupancy_status, es.last_updated
      FROM gym_equipment ge
      JOIN equipment_sensors es ON ge.equipment_id = es.equipment_id
      WHERE ge.equipment_id = $1
    `, [equipmentId]);

    return res.rows[0] || null;
  }

  static async getAlternatives(equipmentId) {
    const res = await query(`
      SELECT suggested_exercise_name, muscle_group, instructions
      FROM alternative_exercise_suggestions
      WHERE equipment_id = $1
    `, [equipmentId]);
    return res.rows;
  }
}

module.exports = EquipmentModel;
