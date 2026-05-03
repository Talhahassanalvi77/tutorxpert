import { query } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

// Get user's favorite tutors
export const getFavorites = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT 
        f.*,
        u.name,
        u.profile_pic,
        u.rating,
        u.total_reviews,
        tp.subjects,
        tp.experience_years,
        tp.hourly_rate,
        tp.languages,
        tp.introduction
       FROM favorites f
       JOIN users u ON f.tutor_id = u.user_id
       LEFT JOIN tutor_profiles tp ON f.tutor_id = tp.user_id
       WHERE f.learner_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: { favorites: result.rows },
    });
  } catch (error) {
    next(error);
  }
};

// Add tutor to favorites
export const addFavorite = async (req, res, next) => {
  try {
    const { tutorId } = req.body;
    const learnerId = req.user.userId;

    if (!tutorId) {
      throw new AppError('Tutor ID is required', 400);
    }

    // Check if tutor exists
    const tutorCheck = await query(
      `SELECT * FROM users WHERE user_id = $1 AND role = 'tutor'`,
      [tutorId]
    );

    if (tutorCheck.rows.length === 0) {
      throw new AppError('Tutor not found', 404);
    }

    // Check if already favorited
    const existing = await query(
      `SELECT * FROM favorites WHERE learner_id = $1 AND tutor_id = $2`,
      [learnerId, tutorId]
    );

    if (existing.rows.length > 0) {
      throw new AppError('Tutor already in favorites', 400);
    }

    const result = await query(
      `INSERT INTO favorites (learner_id, tutor_id) 
       VALUES ($1, $2) 
       RETURNING *`,
      [learnerId, tutorId]
    );

    res.json({
      success: true,
      message: 'Tutor added to favorites',
      data: { favorite: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

// Remove tutor from favorites
export const removeFavorite = async (req, res, next) => {
  try {
    const { tutorId } = req.params;
    const learnerId = req.user.userId;

    const result = await query(
      `DELETE FROM favorites 
       WHERE learner_id = $1 AND tutor_id = $2
       RETURNING *`,
      [learnerId, tutorId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Favorite not found', 404);
    }

    res.json({
      success: true,
      message: 'Tutor removed from favorites',
    });
  } catch (error) {
    next(error);
  }
};
