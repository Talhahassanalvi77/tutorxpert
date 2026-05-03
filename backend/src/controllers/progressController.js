import { query } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

// Get learner progress
export const getLearnerProgress = async (req, res, next) => {
  try {
    const learnerId = req.params.learnerId || req.user.userId;
    const { subjectId } = req.query;

    let whereClause = 'WHERE learner_id = $1';
    const values = [learnerId];

    if (subjectId) {
      whereClause += ` AND subject_id = $${values.length + 1}`;
      values.push(subjectId);
    }

    const result = await query(
      `SELECT 
        pr.*,
        s.name as subject_name,
        u.name as tutor_name
      FROM progress_records pr
      LEFT JOIN subjects s ON pr.subject_id = s.subject_id
      LEFT JOIN users u ON pr.tutor_id = u.user_id
      ${whereClause}
      ORDER BY pr.timestamp DESC`,
      values
    );

    // Get learning paths
    const pathsResult = await query(
      `SELECT * FROM learning_paths WHERE learner_id = $1 AND is_active = true`,
      [learnerId]
    );

    // Get badges
    const badgesResult = await query(
      `SELECT ub.*, b.name, b.description, b.icon_url, b.badge_type
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.badge_id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at DESC`,
      [learnerId]
    );

    // Get overall stats
    const statsResult = await query(
      `SELECT 
        total_sessions,
        total_hours,
        learning_streak,
        last_active
      FROM learner_profiles
      WHERE user_id = $1`,
      [learnerId]
    );

    res.json({
      success: true,
      data: {
        progress: result.rows,
        learningPaths: pathsResult.rows,
        badges: badgesResult.rows,
        stats: statsResult.rows[0] || {}
      }
    });
  } catch (error) {
    next(error);
  }
};

// Record progress
export const recordProgress = async (req, res, next) => {
  try {
    const {
      subjectId,
      tutorId,
      skillName,
      performanceScore,
      masteryLevel,
      topicsCovered,
      strengths,
      areasForImprovement,
      recommendations
    } = req.body;

    if (!subjectId) {
      throw new AppError('Subject ID is required', 400);
    }

    const result = await query(
      `INSERT INTO progress_records (
        learner_id, subject_id, tutor_id, skill_name, performance_score,
        mastery_level, topics_covered, strengths, areas_for_improvement, recommendations
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        req.user.userId,
        subjectId,
        tutorId || req.user.userId,
        skillName || null,
        performanceScore || null,
        masteryLevel || null,
        topicsCovered || [],
        strengths || [],
        areasForImprovement || [],
        recommendations || []
      ]
    );

    // Update learner profile stats
    await query(
      `UPDATE learner_profiles 
       SET total_sessions = total_sessions + 1,
           last_active = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1`,
      [req.user.userId]
    );

    res.status(201).json({
      success: true,
      message: 'Progress recorded',
      data: { progress: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Create/Update learning path
export const createLearningPath = async (req, res, next) => {
  try {
    const { subjectId, name, description, milestones, estimatedHours } = req.body;

    if (!subjectId || !name) {
      throw new AppError('Subject ID and name are required', 400);
    }

    const result = await query(
      `INSERT INTO learning_paths (
        learner_id, subject_id, name, description, milestones, estimated_hours
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        req.user.userId,
        subjectId,
        name,
        description || null,
        milestones || [],
        estimatedHours || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Learning path created',
      data: { path: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Update learning path progress
export const updateLearningPath = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentMilestone, progressPercentage } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (currentMilestone !== undefined) {
      updates.push(`current_milestone = $${paramCount++}`);
      values.push(currentMilestone);
    }
    if (progressPercentage !== undefined) {
      updates.push(`progress_percentage = $${paramCount++}`);
      values.push(progressPercentage);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, req.user.userId);

    const result = await query(
      `UPDATE learning_paths 
       SET ${updates.join(', ')}
       WHERE path_id = $${paramCount - 1} AND learner_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Learning path not found', 404);
    }

    res.json({
      success: true,
      message: 'Learning path updated',
      data: { path: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Award badge to user
export const awardBadge = async (req, res, next) => {
  try {
    const { userId, badgeId, context } = req.body;

    if (!userId || !badgeId) {
      throw new AppError('User ID and badge ID are required', 400);
    }

    // Check if user already has this badge
    const existing = await query(
      `SELECT * FROM user_badges WHERE user_id = $1 AND badge_id = $2`,
      [userId, badgeId]
    );

    if (existing.rows.length > 0) {
      throw new AppError('User already has this badge', 400);
    }

    const result = await query(
      `INSERT INTO user_badges (user_id, badge_id, context)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, badgeId, context || {}]
    );

    // Create notification
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'badge_earned', 'Badge Earned!', 
         'You earned a new badge!', 
         json_build_object('badge_id', $2))`,
      [userId, badgeId]
    );

    res.status(201).json({
      success: true,
      message: 'Badge awarded',
      data: { badge: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Get progress analytics
export const getProgressAnalytics = async (req, res, next) => {
  try {
    const learnerId = req.params.learnerId || req.user.userId;

    const analytics = await query(
      `SELECT 
        COUNT(*) as total_sessions,
        AVG(performance_score) as avg_performance,
        COUNT(DISTINCT subject_id) as subjects_learned,
        MAX(timestamp) as last_session,
        COUNT(DISTINCT DATE(timestamp)) as active_days
      FROM progress_records
      WHERE learner_id = $1`,
      [learnerId]
    );

    // Get progress over time (last 30 days)
    const progressOverTime = await query(
      `SELECT 
        DATE(timestamp) as date,
        COUNT(*) as sessions,
        AVG(performance_score) as avg_score
      FROM progress_records
      WHERE learner_id = $1 AND timestamp > NOW() - INTERVAL '30 days'
      GROUP BY DATE(timestamp)
      ORDER BY date DESC`,
      [learnerId]
    );

    res.json({
      success: true,
      data: {
        analytics: analytics.rows[0],
        progressOverTime: progressOverTime.rows
      }
    });
  } catch (error) {
    next(error);
  }
};
