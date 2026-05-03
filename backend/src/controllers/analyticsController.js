import { query } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

// Get user analytics
export const getUserAnalytics = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.userId;
    const { period = '30' } = req.query; // days

    const userResult = await query(
      `SELECT role FROM users WHERE user_id = ?`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const role = userResult.rows[0].role;

    let analytics;

    if (role === 'tutor') {
      analytics = await getTutorAnalytics(userId, period);
    } else if (role === 'learner') {
      analytics = await getLearnerAnalytics(userId, period);
    } else {
      analytics = await getAdminAnalytics(period);
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

// Tutor analytics
async function getTutorAnalytics(userId, period) {
  const days = parseInt(period);

  const stats = await query(
    `SELECT 
      tp.total_sessions,
      tp.total_hours,
      tp.response_rate,
      tp.response_time,
      u.rating,
      u.total_reviews,
      COUNT(DISTINCT b.booking_id) as recent_bookings,
      SUM(b.total_amount) as recent_earnings,
      COUNT(DISTINCT b.learner_id) as unique_students
    FROM tutor_profiles tp
    JOIN users u ON tp.user_id = u.user_id
    LEFT JOIN bookings b ON tp.user_id = b.tutor_id
    WHERE tp.user_id = ?
    GROUP BY tp.profile_id, u.user_id`,
    [userId]
  );

  // Get subject distribution
  const subjectDistribution = await query(
    `SELECT 
      s.name,
      COUNT(b.booking_id) as sessions
    FROM bookings b
    JOIN subjects s ON b.subject_id = s.subject_id
    WHERE b.tutor_id = ?
    GROUP BY s.subject_id, s.name
    ORDER BY sessions DESC
    LIMIT 10`,
    [userId]
  );

  return {
    stats: stats.rows[0] || {},
    subjectDistribution: subjectDistribution.rows
  };
}

// Learner analytics
async function getLearnerAnalytics(userId, period) {
  const days = parseInt(period);

  const stats = await query(
    `SELECT 
      lp.total_sessions,
      lp.total_hours,
      lp.learning_streak,
      lp.last_active,
      COUNT(DISTINCT pr.subject_id) as subjects_learned,
      AVG(pr.performance_score) as avg_performance
    FROM learner_profiles lp
    LEFT JOIN progress_records pr ON lp.user_id = pr.learner_id
    WHERE lp.user_id = ?
    GROUP BY lp.learner_id`,
    [userId]
  );

  // Get subject distribution
  const subjectDistribution = await query(
    `SELECT 
      s.name,
      COUNT(b.booking_id) as sessions,
      AVG(pr.performance_score) as avg_score
    FROM bookings b
    JOIN subjects s ON b.subject_id = s.subject_id
    LEFT JOIN progress_records pr ON b.booking_id = pr.record_id
    WHERE b.learner_id = ?
    GROUP BY s.subject_id, s.name
    ORDER BY sessions DESC
    LIMIT 10`,
    [userId]
  );

  // Get learning path progress
  const learningPaths = await query(
    `SELECT * FROM learning_paths 
     WHERE learner_id = ? AND is_active = 1
     ORDER BY progress_percentage DESC`,
    [userId]
  );

  return {
    stats: stats.rows[0] || {},
    subjectDistribution: subjectDistribution.rows,
    learningPaths: learningPaths.rows
  };
}

// Admin analytics
async function getAdminAnalytics(period) {
  const days = parseInt(period);

  const platformStats = await query(
    `SELECT 
      (SELECT COUNT(*) FROM users WHERE role = 'learner') as total_learners,
      (SELECT COUNT(*) FROM users WHERE role = 'tutor') as total_tutors,
      (SELECT COUNT(*) FROM bookings) as total_bookings,
      (SELECT SUM(total_amount) FROM bookings WHERE status = 'completed') as total_revenue,
      (SELECT AVG(rating) FROM users WHERE role = 'tutor') as avg_tutor_rating,
      (SELECT COUNT(*) FROM community_posts) as total_posts`
  );

  // Get top tutors
  const topTutors = await query(
    `SELECT 
      u.user_id,
      u.name,
      u.rating,
      u.total_reviews,
      tp.total_sessions,
      tp.hourly_rate
    FROM users u
    JOIN tutor_profiles tp ON u.user_id = tp.user_id
    WHERE u.role = 'tutor'
    ORDER BY u.rating DESC, tp.total_sessions DESC
    LIMIT 10`
  );

  // Get popular subjects
  const popularSubjects = await query(
    `SELECT 
      s.name,
      COUNT(b.booking_id) as bookings
    FROM subjects s
    LEFT JOIN bookings b ON s.subject_id = b.subject_id
    GROUP BY s.subject_id, s.name
    ORDER BY bookings DESC
    LIMIT 10`
  );

  return {
    platformStats: platformStats.rows[0] || {},
    topTutors: topTutors.rows,
    popularSubjects: popularSubjects.rows
  };
}

// Track analytics event
export const trackEvent = async (req, res, next) => {
  try {
    const { eventType, category, properties, page } = req.body;

    if (!eventType) {
      throw new AppError('Event type is required', 400);
    }

    res.status(201).json({
      success: true,
      data: { 
        event: {
          eventType,
          category,
          properties,
          page,
          timestamp: new Date()
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get event analytics
export const getEventAnalytics = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        events: []
      }
    });
  } catch (error) {
    next(error);
  }
};
