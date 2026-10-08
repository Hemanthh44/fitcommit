const { query } = require('../config/db');

class SupplementModel {
  static async getOffers(userId) {
    const res = await query(`
      SELECT sd.*, 
             CASE WHEN sr.redemption_id IS NOT NULL THEN 1 ELSE 0 END as is_redeemed
      FROM supplement_discounts sd
      LEFT JOIN supplement_redemptions sr ON sd.discount_id = sr.discount_id AND sr.user_id = $1
      ORDER BY sd.discount_id ASC
    `, [userId]);

    return res.rows;
  }

  static async redeem(discountId, userId) {
    const check = await query('SELECT redemption_id FROM supplement_redemptions WHERE discount_id = $1 AND user_id = $2', [discountId, userId]);
    if (check.rows.length > 0) {
      throw new Error('This supplement promo code has already been redeemed.');
    }

    await query(`
      INSERT INTO supplement_redemptions (discount_id, user_id, redeemed_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
    `, [discountId, userId]);

    const disc = await query('SELECT code, product_name FROM supplement_discounts WHERE discount_id = $1', [discountId]);
    return disc.rows[0];
  }
}

module.exports = SupplementModel;
