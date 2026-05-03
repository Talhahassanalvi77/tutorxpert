import { query } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

// Get all users (admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const values = [];
    
    if (role) {
      whereClause = 'WHERE role = $1';
      values.push(role);
    }

    const result = await query(
      `SELECT user_id, email, name, role, profile_pic, rating, is_verified, created_at
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, parseInt(limit), parseInt(offset)]
    );

    const countResult = await query(`SELECT COUNT(*) FROM users ${whereClause}`, values);

    res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT user_id, email, name, role, profile_pic, bio, skills, rating, total_reviews, is_verified, created_at
       FROM users WHERE user_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM users WHERE user_id = $1', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
