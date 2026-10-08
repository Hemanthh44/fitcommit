const { query } = require('../config/db');

async function getNotifications(req, res) {
  try {
    const userId = req.user.user_id;
    const notifs = await query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC LIMIT 30
    `, [userId]);

    const unreadCountRes = await query(`
      SELECT count(*) as unread_count 
      FROM notifications 
      WHERE user_id = $1 AND is_read = 0
    `, [userId]);

    res.json({
      notifications: notifs.rows,
      unreadCount: unreadCountRes.rows[0]?.unread_count || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    if (id === 'all') {
      await query('UPDATE notifications SET is_read = 1 WHERE user_id = $1', [userId]);
    } else {
      await query('UPDATE notifications SET is_read = 1 WHERE notification_id = $1 AND user_id = $2', [id, userId]);
    }

    res.json({ message: 'Notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getNotifications,
  markAsRead
};
