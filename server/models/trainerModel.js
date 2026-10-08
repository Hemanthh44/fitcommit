const { query } = require('../config/db');

class TrainerModel {
  static async getAll() {
    const res = await query('SELECT * FROM trainers ORDER BY trainer_id ASC');
    return res.rows;
  }

  static async getAssigned(userId) {
    const res = await query(`
      SELECT t.*, ta.allocation_id, ta.status as allocation_status
      FROM trainer_allocations ta
      JOIN trainers t ON ta.trainer_id = t.trainer_id
      WHERE ta.user_id = $1 AND ta.status = 'ACTIVE'
      LIMIT 1
    `, [userId]);

    return res.rows[0] || null;
  }

  static async getMessages(allocationId) {
    const res = await query(`
      SELECT message_id, allocation_id, sender_role, message_text, sent_at
      FROM trainer_messages
      WHERE allocation_id = $1
      ORDER BY message_id ASC
    `, [allocationId]);

    return res.rows;
  }

  static async sendMessage(allocationId, senderRole, text) {
    const res = await query(`
      INSERT INTO trainer_messages (allocation_id, sender_role, message_text, sent_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `, [allocationId, senderRole, text]);

    const msgId = res.lastInsertRowid || res.rows[0]?.id || 1;
    return { message_id: msgId, allocation_id: allocationId, sender_role: senderRole, message_text: text, sent_at: 'Just now' };
  }
}

module.exports = TrainerModel;
