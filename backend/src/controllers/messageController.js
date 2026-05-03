import { query } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

// Get all conversations for user
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT DISTINCT ON (
        CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
      )
        m.*,
        CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as other_user_id,
        u.name as other_user_name,
        u.profile_pic as other_user_pic,
        u.is_online as other_user_online
       FROM messages m
       JOIN users u ON (
         (m.sender_id = $1 AND m.receiver_id = u.user_id) OR
         (m.receiver_id = $1 AND m.sender_id = u.user_id)
       )
       WHERE m.sender_id = $1 OR m.receiver_id = $1
       ORDER BY other_user_id, m.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: { conversations: result.rows },
    });
  } catch (error) {
    next(error);
  }
};

// Get conversation with specific user
export const getConversation = async (req, res, next) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.userId;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT 
        m.*,
        sender.name as sender_name,
        sender.profile_pic as sender_pic
       FROM messages m
       JOIN users sender ON m.sender_id = sender.user_id
       WHERE (
         (m.sender_id = $1 AND m.receiver_id = $2) OR
         (m.sender_id = $2 AND m.receiver_id = $1)
       )
       ORDER BY m.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, otherUserId, parseInt(limit), parseInt(offset)]
    );

    // Mark messages as read
    await query(
      `UPDATE messages 
       SET is_read = true 
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
      [otherUserId, userId]
    );

    res.json({
      success: true,
      data: { messages: result.rows.reverse() },
    });
  } catch (error) {
    next(error);
  }
};

// Send message
export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content, messageType = 'text' } = req.body;

    if (!receiverId || !content) {
      throw new AppError('Receiver ID and content are required', 400);
    }

    const result = await query(
      `INSERT INTO messages (
        sender_id, receiver_id, content, message_type
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [req.user.userId, receiverId, content, messageType]
    );

    // Create notification for receiver
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'new_message', 'New Message', 
         'You received a new message.', 
         json_build_object('message_id', $2, 'sender_id', $3))`,
      [receiverId, result.rows[0].message_id, req.user.userId]
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

// Mark message as read
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE messages 
       SET is_read = true 
       WHERE message_id = $1 AND receiver_id = $2
       RETURNING *`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Message not found', 404);
    }

    res.json({
      success: true,
      message: 'Message marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// Delete message
export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const messageResult = await query(
      `SELECT * FROM messages WHERE message_id = $1`,
      [id]
    );

    if (messageResult.rows.length === 0) {
      throw new AppError('Message not found', 404);
    }

    const message = messageResult.rows[0];

    if (message.sender_id !== req.user.userId) {
      throw new AppError('Unauthorized', 403);
    }

    await query(`DELETE FROM messages WHERE message_id = $1`, [id]);

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
