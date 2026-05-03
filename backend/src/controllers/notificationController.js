import { query } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

// Get user notifications
export const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly = false, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.userId;

    let whereClause = 'WHERE user_id = $1';
    const values = [userId];

    if (unreadOnly === 'true') {
      whereClause += ' AND is_read = false';
    }

    values.push(parseInt(limit), parseInt(offset));

    const result = await query(
      `SELECT * FROM notifications
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM notifications ${whereClause}`,
      values.slice(0, values.length - 2)
    );

    const unreadCount = await query(
      `SELECT COUNT(*) as unread FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        unreadCount: unreadCount.rows[0]?.unread || 0,
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

// Mark notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE notification_id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Notification not found', 404);
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = false`,
      [req.user.userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM notifications 
       WHERE notification_id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Notification not found', 404);
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};

// Send notification (admin only)
export const sendNotification = async (req, res, next) => {
  try {
    const { userId, type, title, message, data, sendEmail = false } = req.body;

    if (!userId || !type || !title || !message) {
      throw new AppError('userId, type, title, and message are required', 400);
    }

    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, data, is_emailed)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, type, title, message, data || {}, sendEmail]
    );

    // TODO: Send email if sendEmail is true
    // await sendEmailNotification(userId, title, message);

    res.status(201).json({
      success: true,
      message: 'Notification sent',
      data: { notification: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Broadcast notification to all users
export const broadcastNotification = async (req, res, next) => {
  try {
    const { type, title, message, role } = req.body;

    if (!type || !title || !message) {
      throw new AppError('type, title, and message are required', 400);
    }

    let whereClause = '';
    let values = [type, title, message];

    if (role) {
      whereClause = 'WHERE role = $4';
      values.push(role);
    }

    await query(
      `INSERT INTO notifications (user_id, type, title, message)
       SELECT user_id, $1, $2, $3 FROM users ${whereClause}`,
      values
    );

    res.json({
      success: true,
      message: 'Broadcast sent successfully'
    });
  } catch (error) {
    next(error);
  }
};
