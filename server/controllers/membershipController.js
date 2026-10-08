const { query } = require('../config/db');

async function getPlans(req, res) {
  try {
    const plansRes = await query('SELECT * FROM memberships ORDER BY membership_id ASC');
    const plans = plansRes.rows.map(p => {
      let features = p.features;
      if (typeof features === 'string') {
        try {
          features = JSON.parse(features);
        } catch (e) {}
      }
      return { ...p, features };
    });

    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function subscribe(req, res) {
  try {
    const userId = req.user.user_id;
    const { membership_tier = 'PREMIUM', payment_details } = req.body;

    // Academic simulation of PCI-DSS compliant checkout:
    // We DO NOT store raw credit card numbers locally per SRS Requirement 4.2!
    const txnRef = `TXN-FITCOMMIT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const targetMembershipId = membership_tier === 'PREMIUM' ? 2 : 1;

    // 1. Create or update subscription
    const subRes = await query(`
      INSERT INTO subscriptions (user_id, membership_id, start_date, expiry_date, subscription_status)
      VALUES ($1, $2, DATE('now'), DATE('now', '+365 days'), 'VALID')
    `, [userId, targetMembershipId]);

    const subId = subRes.lastInsertRowid || subRes.rows[0]?.id || 2;

    // 2. Record payment transaction (simulated tokenization)
    const amount = membership_tier === 'PREMIUM' ? 29.00 : 0.00;
    await query(`
      INSERT INTO payments (subscription_id, payment_amount, payment_method, transaction_status, transaction_reference)
      VALUES ($1, $2, 'CARD_SIMULATION', 'SUCCESS', $3)
    `, [subId, amount, txnRef]);

    if (membership_tier === 'PREMIUM') {
      // 3. Update user role
      await query(`UPDATE users SET role = 'PREMIUM_MEMBER' WHERE user_id = $1`, [userId]);

      // 4. Create Gym Subscription
      await query(`
        INSERT INTO gym_subscriptions (subscription_id, gym_id, access_status)
        VALUES ($1, 1, 'ACTIVE')
      `, [subId]);

      // 5. Allocate Personal Trainer (Arun Abhishek) per SRS U12
      const existingAlloc = await query('SELECT allocation_id FROM trainer_allocations WHERE user_id = $1', [userId]);
      if (existingAlloc.rows.length === 0) {
        await query(`
          INSERT INTO trainer_allocations (user_id, trainer_id, status)
          VALUES ($1, 1, 'ACTIVE')
        `, [userId]);

        await query(`
          INSERT INTO trainer_messages (allocation_id, sender_role, message_text)
          VALUES (
            (SELECT allocation_id FROM trainer_allocations WHERE user_id = $1 LIMIT 1),
            'TRAINER',
            'Hello! I am Coach Arun Abhishek, your dedicated personal trainer. I am reviewing your fitness goals and look forward to optimizing your performance.'
          )
        `, [userId]);
      }

      // 6. Send notification
      await query(`
        INSERT INTO notifications (user_id, type, title, message, is_read)
        VALUES ($1, 'SUBSCRIPTION', 'Premium Membership Activated', 'You now have full gym facility access, personal trainer allocation, and smart equipment features.', 0)
      `, [userId]);
    }

    res.json({
      message: 'Subscription successfully processed and activated.',
      membership_tier,
      transaction_reference: txnRef,
      status: 'ACTIVE'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getCurrent(req, res) {
  try {
    const userId = req.user.user_id;
    const subRes = await query(`
      SELECT s.*, m.membership_name, m.tier, m.price, m.features,
             gs.gym_subscription_id, gs.access_status as gym_access_status, g.gym_name, g.location as gym_location
      FROM subscriptions s
      JOIN memberships m ON s.membership_id = m.membership_id
      LEFT JOIN gym_subscriptions gs ON s.subscription_id = gs.subscription_id
      LEFT JOIN gyms g ON gs.gym_id = g.gym_id
      WHERE s.user_id = $1
      ORDER BY s.subscription_id DESC LIMIT 1
    `, [userId]);

    const currentSub = subRes.rows[0] || null;
    if (currentSub && typeof currentSub.features === 'string') {
      try {
        currentSub.features = JSON.parse(currentSub.features);
      } catch (e) {}
    }

    res.json(currentSub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getPlans,
  subscribe,
  getCurrent
};
