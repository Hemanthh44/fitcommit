const { query } = require('../config/db');

class NotificationModel {
  static async getForUser(userId) {
    const res = await query(`
      SELECT notification_id, type, title, message, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY notification_id DESC
    `, [userId]);

    const unread = res.rows.filter(r => !r.is_read).length;
    return { notifications: res.rows, unreadCount: unread };
  }

  static async markRead(notificationId, userId) {
    if (notificationId === 'all') {
      await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
    } else {
      await query('UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 AND user_id = $2', [notificationId, userId]);
    }
    return true;
  }

  static async create(userId, type, title, message) {
    await query(`
      INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
      VALUES ($1, $2, $3, $4, FALSE, CURRENT_TIMESTAMP)
    `, [userId, type, title, message]);
  }
}

module.exports = NotificationModel;
