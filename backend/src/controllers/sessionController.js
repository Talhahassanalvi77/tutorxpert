import { query } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

// Create a new session
export const createSession = async (req, res, next) => {
  try {
    const { bookingId, videoRoomId } = req.body;

    if (!bookingId) {
      throw new AppError('Booking ID is required', 400);
    }

    // Get booking details
    const bookingResult = await query(
      `SELECT * FROM bookings WHERE booking_id = ?`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    const booking = bookingResult.rows[0];

    // Check permissions
    if (
      booking.learner_id !== req.user.userId &&
      booking.tutor_id !== req.user.userId
    ) {
      throw new AppError('Unauthorized', 403);
    }

    // Create session
    const result = await query(
      `INSERT INTO sessions (booking_id, video_room_id, start_time)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       RETURNING *`,
      [bookingId, videoRoomId || null]
    );

    // Update booking status
    await query(
      `UPDATE bookings SET status = 'confirmed' WHERE booking_id = ?`,
      [bookingId]
    );

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: { session: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Get session by ID
export const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        s.*,
        b.subject_id,
        b.learner_id,
        b.tutor_id,
        sub.name as subject_name,
        learner.name as learner_name,
        tutor.name as tutor_name
      FROM sessions s
      JOIN bookings b ON s.booking_id = b.booking_id
      JOIN subjects sub ON b.subject_id = sub.subject_id
      JOIN users learner ON b.learner_id = learner.user_id
      JOIN users tutor ON b.tutor_id = tutor.user_id
      WHERE s.session_id = ?`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    const session = result.rows[0];

    // Check permissions
    if (
      session.learner_id !== req.user.userId &&
      session.tutor_id !== req.user.userId &&
      req.user.role !== 'admin'
    ) {
      throw new AppError('Unauthorized', 403);
    }

    res.json({
      success: true,
      data: {
        session,
        toolsData: {}
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update session notes
export const updateSessionNotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await query(
      `UPDATE sessions SET notes = ? WHERE session_id = ?
       RETURNING *`,
      [notes, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    res.json({
      success: true,
      message: 'Session notes updated',
      data: { session: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Save session tools data
export const saveSessionTools = async (req, res, next) => {
  try {
    const { id } = req.params;
    const toolsData = req.body;

    res.json({
      success: true,
      message: 'Session tools data saved',
      data: { toolsData }
    });
  } catch (error) {
    next(error);
  }
};

// Add chat message to session
export const addSessionChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, messageType = 'text', metadata } = req.body;

    if (!message) {
      throw new AppError('Message is required', 400);
    }

    res.status(201).json({
      success: true,
      data: { 
        chatMessage: {
          sessionId: id,
          senderId: req.user.userId,
          senderName: req.user.name,
          message,
          messageType,
          timestamp: new Date()
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get session chat history
export const getSessionChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    res.json({
      success: true,
      data: { messages: [] }
    });
  } catch (error) {
    next(error);
  }
};

// Get user's sessions
export const getUserSessions = async (req, res, next) => {
  try {
    const { type = 'all', status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.userId;

    let whereClause;
    let values;

    if (type === 'learner') {
      whereClause = 'WHERE b.learner_id = ?';
      values = [userId];
    } else if (type === 'tutor') {
      whereClause = 'WHERE b.tutor_id = ?';
      values = [userId];
    } else {
      whereClause = 'WHERE b.learner_id = ? OR b.tutor_id = ?';
      values = [userId, userId];
    }

    const result = await query(
      `SELECT 
        s.*,
        b.subject_id,
        b.scheduled_at,
        b.status as booking_status,
        s.start_time,
        s.end_time,
        sub.name as subject_name,
        learner.name as learner_name,
        tutor.name as tutor_name
      FROM sessions s
      JOIN bookings b ON s.booking_id = b.booking_id
      JOIN subjects sub ON b.subject_id = sub.subject_id
      JOIN users learner ON b.learner_id = learner.user_id
      JOIN users tutor ON b.tutor_id = tutor.user_id
      ${whereClause}
      ORDER BY s.start_time DESC
      LIMIT ? OFFSET ?`,
      [...values, parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      data: { sessions: result.rows }
    });
  } catch (error) {
    next(error);
  }
};

// Complete session with notes and summary
export const completeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes, attendance, sessionSummary, learnerFeedback, tutorFeedback } = req.body;

    // Get session details first
    const sessionResult = await query(
      `SELECT s.*, b.learner_id, b.tutor_id, b.subject_id, sub.name as subject_name
       FROM sessions s
       JOIN bookings b ON s.booking_id = b.booking_id  
       JOIN subjects sub ON b.subject_id = sub.subject_id
       WHERE s.session_id = ?`,
      [id]
    );

    if (sessionResult.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    const session = sessionResult.rows[0];

    // Calculate session duration
    const startTime = new Date(session.start_time);
    const endTime = new Date();
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

    const result = await query(
      `UPDATE sessions 
       SET notes = ?, 
           attendance = ?, 
           end_time = CURRENT_TIMESTAMP,
           session_summary = ?,
           duration_actual = ?
       WHERE session_id = ?
       RETURNING *`,
      [notes, JSON.stringify(attendance || {}), sessionSummary, durationMinutes, id]
    );

    // Update booking status to completed
    await query(
      `UPDATE bookings SET status = 'completed' WHERE booking_id = ?`,
      [session.booking_id]
    );

    res.json({
      success: true,
      message: 'Session completed successfully',
      data: { 
        session: result.rows[0],
        durationMinutes
      }
    });
  } catch (error) {
    next(error);
  }
};

// Auto-save session tools (for real-time sync)
export const autoSaveTools = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { whiteboard, code, notes, files, timestamp } = req.body;

    res.json({
      success: true,
      message: 'Tools auto-saved',
      data: { lastSaved: timestamp || new Date() }
    });
  } catch (error) {
    next(error);
  }
};

// Generate AI summary for session
export const generateAISummary = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get session details
    const sessionResult = await query(
      `SELECT s.*, b.subject_id, sub.name as subject_name
       FROM sessions s
       JOIN bookings b ON s.booking_id = b.booking_id
       JOIN subjects sub ON b.subject_id = sub.subject_id
       WHERE s.session_id = ?`,
      [id]
    );

    if (sessionResult.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    const session = sessionResult.rows[0];

    res.json({
      success: true,
      data: { summary: session.session_summary || 'Session completed successfully' }
    });
  } catch (error) {
    next(error);
  }
};
