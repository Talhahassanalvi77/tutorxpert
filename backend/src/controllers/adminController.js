import { query } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

// Get admin dashboard statistics
export const getDashboardStats = async (req, res, next) => {
  try {
    // Total users
    const usersResult = await query(
      `SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'learner') as total_learners,
        COUNT(*) FILTER (WHERE role = 'tutor') as total_tutors,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_30d
      FROM users`
    );

    // Total bookings
    const bookingsResult = await query(
      `SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as bookings_30d,
        SUM(total_amount) FILTER (WHERE status = 'completed') as total_revenue
      FROM bookings`
    );

    // Total sessions
    const sessionsResult = await query(
      `SELECT 
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE start_time >= CURRENT_DATE - INTERVAL '30 days') as sessions_30d,
        AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) as avg_session_duration
      FROM sessions
      WHERE end_time IS NOT NULL`
    );

    // Active users (logged in last 7 days)
    const activeUsersResult = await query(
      `SELECT COUNT(DISTINCT user_id) as active_users
       FROM notifications
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
    );

    // Top subjects
    const topSubjectsResult = await query(
      `SELECT s.name, COUNT(b.booking_id) as booking_count
       FROM subjects s
       LEFT JOIN bookings b ON s.subject_id = b.subject_id
       GROUP BY s.subject_id, s.name
       ORDER BY booking_count DESC
       LIMIT 5`
    );

    // Recent activity
    const recentActivityResult = await query(
      `SELECT 
        'booking' as type,
        b.booking_id as id,
        u.name as user_name,
        s.name as subject_name,
        b.created_at as timestamp
       FROM bookings b
       JOIN users u ON b.learner_id = u.user_id
       JOIN subjects s ON b.subject_id = s.subject_id
       ORDER BY b.created_at DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        users: usersResult.rows[0],
        bookings: bookingsResult.rows[0],
        sessions: sessionsResult.rows[0],
        activeUsers: activeUsersResult.rows[0].active_users,
        topSubjects: topSubjectsResult.rows,
        recentActivity: recentActivityResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all users with filters
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20, sortBy = 'created_at', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      whereClause += ` AND role = $${paramCount}`;
      values.push(role);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      values.push(`%${search}%`);
    }

    paramCount++;
    values.push(parseInt(limit));
    paramCount++;
    values.push(parseInt(offset));

    const result = await query(
      `SELECT 
        user_id, email, name, role, profile_pic, rating, 
        is_verified, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY ${sortBy} ${order}
      LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      values.slice(0, -2)
    );

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

// Get all bookings with filters
export const getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const values = [];

    if (status) {
      whereClause = 'WHERE b.status = $1';
      values.push(status);
    }

    values.push(parseInt(limit), parseInt(offset));

    const result = await query(
      `SELECT 
        b.*,
        s.name as subject_name,
        learner.name as learner_name,
        learner.email as learner_email,
        tutor.name as tutor_name,
        tutor.email as tutor_email
      FROM bookings b
      JOIN subjects s ON b.subject_id = s.subject_id
      JOIN users learner ON b.learner_id = learner.user_id
      JOIN users tutor ON b.tutor_id = tutor.user_id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM bookings b ${whereClause}`,
      values.slice(0, -2)
    );

    res.json({
      success: true,
      data: {
        bookings: result.rows,
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

// Get revenue reports
export const getRevenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    let dateFormat;
    switch (groupBy) {
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      case 'week':
        dateFormat = 'YYYY-IW';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    const result = await query(
      `SELECT 
        TO_CHAR(created_at, $1) as period,
        COUNT(*) as booking_count,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_booking_value
      FROM bookings
      WHERE status = 'completed'
        AND created_at BETWEEN $2 AND $3
      GROUP BY period
      ORDER BY period`,
      [dateFormat, startDate, endDate]
    );

    res.json({
      success: true,
      data: { report: result.rows }
    });
  } catch (error) {
    next(error);
  }
};

// Verify tutor
export const verifyTutor = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `UPDATE users SET is_verified = true WHERE user_id = $1 AND role = 'tutor'
       RETURNING *`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Tutor not found', 404);
    }

    // Send notification
    await query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'account_verified', 'Account Verified!', 
         'Congratulations! Your tutor account has been verified.')`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Tutor verified successfully',
      data: { user: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Suspend user
export const suspendUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const result = await query(
      `UPDATE users SET is_suspended = true, suspension_reason = $1
       WHERE user_id = $2
       RETURNING *`,
      [reason, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    // Send notification
    await query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'account_suspended', 'Account Suspended', 
         'Your account has been suspended. Reason: ' || $2)`,
      [userId, reason]
    );

    res.json({
      success: true,
      message: 'User suspended successfully',
      data: { user: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Get platform analytics
export const getPlatformAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query; // days

    // User growth
    const userGrowthResult = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '${period} days'
      GROUP BY DATE(created_at)
      ORDER BY date`
    );

    // Booking trends
    const bookingTrendsResult = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as bookings,
        SUM(total_amount) as revenue
      FROM bookings
      WHERE created_at >= CURRENT_DATE - INTERVAL '${period} days'
      GROUP BY DATE(created_at)
      ORDER BY date`
    );

    // Subject popularity
    const subjectPopularityResult = await query(
      `SELECT 
        s.name,
        COUNT(b.booking_id) as booking_count
      FROM subjects s
      LEFT JOIN bookings b ON s.subject_id = b.subject_id
        AND b.created_at >= CURRENT_DATE - INTERVAL '${period} days'
      GROUP BY s.subject_id, s.name
      ORDER BY booking_count DESC
      LIMIT 10`
    );

    // Tutor performance
    const tutorPerformanceResult = await query(
      `SELECT 
        u.name,
        u.rating,
        COUNT(b.booking_id) as total_bookings,
        COUNT(s.session_id) as completed_sessions,
        AVG(r.rating) as avg_session_rating
      FROM users u
      JOIN tutor_profiles tp ON u.user_id = tp.user_id
      LEFT JOIN bookings b ON u.user_id = b.tutor_id
      LEFT JOIN sessions s ON b.booking_id = s.booking_id
      LEFT JOIN reviews r ON b.booking_id = r.booking_id
      WHERE b.created_at >= CURRENT_DATE - INTERVAL '${period} days'
      GROUP BY u.user_id, u.name, u.rating
      ORDER BY total_bookings DESC
      LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        userGrowth: userGrowthResult.rows,
        bookingTrends: bookingTrendsResult.rows,
        subjectPopularity: subjectPopularityResult.rows,
        topTutors: tutorPerformanceResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// Export data
export const exportData = async (req, res, next) => {
  try {
    const { type, format = 'json' } = req.query;

    let data;
    switch (type) {
      case 'users':
        const usersResult = await query('SELECT * FROM users');
        data = usersResult.rows;
        break;
      case 'bookings':
        const bookingsResult = await query('SELECT * FROM bookings');
        data = bookingsResult.rows;
        break;
      case 'sessions':
        const sessionsResult = await query('SELECT * FROM sessions');
        data = sessionsResult.rows;
        break;
      default:
        throw new AppError('Invalid export type', 400);
    }

    if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}.csv`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data
      });
    }
  } catch (error) {
    next(error);
  }
};

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}
