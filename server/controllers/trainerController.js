const { query } = require('../config/db');

async function getAssignedTrainer(req, res) {
  try {
    const userId = req.user.user_id;

    const allocRes = await query(`
      SELECT ta.*, t.trainer_name, t.specialization, t.contact_email, t.bio, t.avatar_url, t.is_available
      FROM trainer_allocations ta
      JOIN trainers t ON ta.trainer_id = t.trainer_id
      WHERE ta.user_id = $1 AND ta.status = 'ACTIVE'
      ORDER BY ta.allocation_id DESC LIMIT 1
    `, [userId]);

    let trainer = allocRes.rows[0];
    if (!trainer) {
      // If user is Premium or Trainer, auto-allocate default trainer Arun
      if (req.user.role === 'PREMIUM_MEMBER' || req.user.role === 'ADMIN') {
        await query(`
          INSERT INTO trainer_allocations (user_id, trainer_id, status)
          VALUES ($1, 1, 'ACTIVE')
        `, [userId]);

        const retryRes = await query(`
          SELECT ta.*, t.trainer_name, t.specialization, t.contact_email, t.bio, t.avatar_url, t.is_available
          FROM trainer_allocations ta
          JOIN trainers t ON ta.trainer_id = t.trainer_id
          WHERE ta.user_id = $1 AND ta.status = 'ACTIVE'
          LIMIT 1
        `, [userId]);
        trainer = retryRes.rows[0];
      }
    }

    res.json({
      allocated: !!trainer,
      trainer: trainer || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMessages(req, res) {
  try {
    const userId = req.user.user_id;

    // Get active allocation
    const allocRes = await query(`
      SELECT allocation_id FROM trainer_allocations 
      WHERE user_id = $1 AND status = 'ACTIVE' 
      LIMIT 1
    `, [userId]);

    if (allocRes.rows.length === 0) {
      return res.json([]);
    }

    const allocId = allocRes.rows[0].allocation_id;
    const msgRes = await query(`
      SELECT * FROM trainer_messages 
      WHERE allocation_id = $1 
      ORDER BY sent_at ASC
    `, [allocId]);

    res.json(msgRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function sendMessage(req, res) {
  try {
    const userId = req.user.user_id;
    const { message_text, sender_role = 'USER' } = req.body;

    if (!message_text) {
      return res.status(400).json({ error: 'Message text cannot be empty.' });
    }

    const allocRes = await query(`
      SELECT allocation_id FROM trainer_allocations 
      WHERE user_id = $1 AND status = 'ACTIVE' 
      LIMIT 1
    `, [userId]);

    if (allocRes.rows.length === 0) {
      return res.status(400).json({ error: 'No active personal trainer allocation found.' });
    }

    const allocId = allocRes.rows[0].allocation_id;
    const insertRes = await query(`
      INSERT INTO trainer_messages (allocation_id, sender_role, message_text)
      VALUES ($1, $2, $3)
    `, [allocId, sender_role, message_text]);

    res.json({
      message: 'Message sent successfully.',
      sentMessage: {
        message_id: insertRes.lastInsertRowid || 1,
        allocation_id: allocId,
        sender_role,
        message_text,
        sent_at: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listTrainers(req, res) {
  try {
    const trainersRes = await query('SELECT * FROM trainers');
    res.json(trainersRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAssignedTrainer,
  getMessages,
  sendMessage,
  listTrainers
};
