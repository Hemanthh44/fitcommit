const { query } = require('../config/db');

class MembershipModel {
  static async getPlans() {
    const res = await query('SELECT * FROM memberships ORDER BY price ASC');
    return res.rows.map(row => ({
      ...row,
      features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features
    }));
  }

  static async getPlanByTier(tier) {
    const res = await query('SELECT * FROM memberships WHERE UPPER(tier) = UPPER($1) LIMIT 1', [tier]);
    if (!res.rows[0]) return null;
    const plan = res.rows[0];
    return {
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
    };
  }

  static async getActiveSubscription(userId) {
    const res = await query(`
      SELECT s.subscription_id, s.start_date, s.expiry_date, s.subscription_status,
             m.membership_id, m.membership_name, m.tier, m.price, m.features,
             gs.access_status as gym_access_status
      FROM subscriptions s
      JOIN memberships m ON s.membership_id = m.membership_id
      LEFT JOIN gym_subscriptions gs ON s.subscription_id = gs.subscription_id
      WHERE s.user_id = $1
      ORDER BY s.subscription_id DESC
      LIMIT 1
    `, [userId]);

    if (!res.rows[0]) return null;
    const sub = res.rows[0];
    return {
      ...sub,
      features: typeof sub.features === 'string' ? JSON.parse(sub.features) : sub.features,
      gym_access: sub.gym_access_status === 'ACTIVE'
    };
  }

  static async createSubscription(userId, membershipId) {
    const res = await query(`
      INSERT INTO subscriptions (user_id, membership_id, start_date, expiry_date, subscription_status)
      VALUES ($1, $2, CURRENT_DATE, DATE('now', '+365 days'), 'VALID')
    `, [userId, membershipId]);

    const subId = res.lastInsertRowid || res.rows[0]?.id || res.rows[0]?.subscription_id;

    // Record simulated payment
    const plan = await query('SELECT price FROM memberships WHERE membership_id = $1', [membershipId]);
    const price = plan.rows[0]?.price || 0.0;
    const txRef = 'FC_TX_' + Date.now().toString(36).toUpperCase();

    await query(`
      INSERT INTO payments (subscription_id, payment_amount, payment_method, transaction_status, transaction_reference)
      VALUES ($1, $2, 'CARD_SIMULATION', 'SUCCESS', $3)
    `, [subId, price, txRef]);

    return { subscription_id: subId, transaction_reference: txRef, price };
  }
}

module.exports = MembershipModel;
