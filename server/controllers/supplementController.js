const { query } = require('../config/db');

async function getOffers(req, res) {
  try {
    const userId = req.user.user_id;

    const offersRes = await query(`
      SELECT sd.*, 
             CASE WHEN sr.redemption_id IS NOT NULL THEN 1 ELSE 0 END as is_redeemed
      FROM supplement_discounts sd
      LEFT JOIN supplement_redemptions sr ON sd.discount_id = sr.discount_id AND sr.user_id = $1
      ORDER BY sd.discount_id ASC
    `, [userId]);

    res.json(offersRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function redeemCode(req, res) {
  try {
    const userId = req.user.user_id;
    const { discount_id } = req.body;

    if (!discount_id) {
      return res.status(400).json({ error: 'Discount ID is required.' });
    }

    const checkRes = await query('SELECT * FROM supplement_discounts WHERE discount_id = $1', [discount_id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Supplement offer not found.' });
    }

    // Insert redemption
    await query(`
      INSERT INTO supplement_redemptions (discount_id, user_id)
      VALUES ($1, $2)
    `, [discount_id, userId]);

    const offer = checkRes.rows[0];

    res.json({
      message: `Discount code '${offer.code}' successfully redeemed for ${offer.product_name}!`,
      code: offer.code,
      discount_percentage: offer.discount_percentage,
      product: offer.product_name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getOffers,
  redeemCode
};
