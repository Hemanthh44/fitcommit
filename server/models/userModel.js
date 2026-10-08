const { query } = require('../config/db');

class UserModel {
  static async findByEmail(email) {
    const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return res.rows[0] || null;
  }

  static async findById(userId) {
    const res = await query('SELECT user_id, name, email, role, height, weight, fitness_goal, account_status, created_at FROM users WHERE user_id = $1', [userId]);
    return res.rows[0] || null;
  }

  static async create({ name, email, passwordHash, role = 'BASE_MEMBER', height, weight, fitnessGoal }) {
    const res = await query(`
      INSERT INTO users (name, email, password_hash, role, height, weight, fitness_goal, account_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
    `, [name, email, passwordHash, role, parseFloat(height), parseFloat(weight), fitnessGoal]);

    const id = res.lastInsertRowid || res.rows[0]?.id || res.rows[0]?.user_id;
    return this.findById(id);
  }

  static async updateProfile(userId, { name, height, weight, fitnessGoal }) {
    await query(`
      UPDATE users 
      SET name = COALESCE($1, name),
          height = COALESCE($2, height),
          weight = COALESCE($3, weight),
          fitness_goal = COALESCE($4, fitness_goal)
      WHERE user_id = $5
    `, [name, height ? parseFloat(height) : null, weight ? parseFloat(weight) : null, fitnessGoal, userId]);

    return this.findById(userId);
  }

  static async getAll() {
    const res = await query(`
      SELECT user_id, name, email, role, height, weight, fitness_goal, account_status, created_at
      FROM users
      ORDER BY user_id ASC
    `);
    return res.rows;
  }

  static async updateRole(userId, newRole) {
    await query('UPDATE users SET role = $1 WHERE user_id = $2', [newRole, userId]);
    return this.findById(userId);
  }
}

module.exports = UserModel;
