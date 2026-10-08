const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'fitcommit-scandinavian-secret-key-2026';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please authenticate.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userRes = await query('SELECT user_id, name, email, role, height, weight, fitness_goal, account_status FROM users WHERE user_id = $1', [decoded.userId]);
    
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    const user = userRes.rows[0];
    if (user.account_status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Account suspended. Contact administration.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired authentication token.' });
  }
}

async function optionalAuthToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userRes = await query('SELECT user_id, name, email, role, height, weight, fitness_goal, account_status FROM users WHERE user_id = $1', [decoded.userId]);
    if (userRes.rows.length > 0 && userRes.rows[0].account_status !== 'SUSPENDED') {
      req.user = userRes.rows[0];
    } else {
      req.user = null;
    }
    next();
  } catch (err) {
    req.user = null;
    next();
  }
}

module.exports = { authenticateToken, optionalAuthToken, JWT_SECRET };
