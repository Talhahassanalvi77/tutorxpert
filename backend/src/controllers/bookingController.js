import { query } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { bookingLimiter } from '../middleware/rateLimiter.js';

// Create a new booking
export const createBooking = async (req, res, next) => {
  try {
    const {
      tutorId,
      subjectId,
      scheduledAt,
      durationMinutes = 60,
      notes,
      isTrial = false
    } = req.body;

    if (!tutorId || !subjectId || !scheduledAt) {
      throw new AppError('Tutor, subject, and scheduled time are required', 400);
    }

    // Ensure all UUIDs are strings
    const learnerId = String(req.user.userId);
    const tutorIdStr = String(tutorId);
    const subjectIdStr = String(subjectId);
    const scheduledAtStr = String(scheduledAt);

    // Get tutor's hourly rate and trial status
    const tutorResult = await query(
      `SELECT hourly_rate, currency, offers_trial FROM tutor_profiles WHERE user_id = $1`,
      [tutorIdStr]
    );

    if (tutorResult.rows.length === 0) {
      throw new AppError('Tutor not found', 404);
    }

    const tutor = tutorResult.rows[0];
    let totalAmount;
    
    // Trial lesson handling
    if (isTrial) {
      if (!tutor.offers_trial) {
        throw new AppError('This tutor does not offer trial lessons', 400);
      }
      // Check if learner already had a trial with this tutor
      const priorTrial = await query(
        `SELECT booking_id FROM bookings 
         WHERE learner_id = $1 AND tutor_id = $2 AND is_trial = true AND status != 'cancelled'
         LIMIT 1`,
        [learnerId, tutorIdStr]
      );
      if (priorTrial.rows.length > 0) {
        throw new AppError('You have already used a trial with this tutor', 400);
      }
      totalAmount = 0; // Trial is free
    } else {
      totalAmount = (parseFloat(tutor.hourly_rate) * durationMinutes) / 60;
    }

    // Enhanced conflict detection - check for overlapping sessions
    const scheduledDate = new Date(scheduledAtStr);
    const sessionEnd = new Date(scheduledDate.getTime() + durationMinutes * 60000);
    
    const conflictCheck = await query(
      `SELECT booking_id, scheduled_at, duration_minutes 
       FROM bookings
       WHERE tutor_id = $1
         AND status IN ('pending', 'confirmed')
         AND (
           -- New session starts during existing session
           (scheduled_at <= $2 AND scheduled_at + INTERVAL '1 minute' * duration_minutes > $2)
           OR
           -- New session ends during existing session  
           (scheduled_at < $3 AND scheduled_at + INTERVAL '1 minute' * duration_minutes >= $3)
           OR
           -- New session completely contains existing session
           (scheduled_at >= $2 AND scheduled_at + INTERVAL '1 minute' * duration_minutes <= $3)
         )`,
      [tutorIdStr, scheduledAtStr, sessionEnd.toISOString()]
    );

    if (conflictCheck.rows.length > 0) {
      const conflictingSession = conflictCheck.rows[0];
      const conflictStart = new Date(conflictingSession.scheduled_at);
      const conflictEnd = new Date(conflictStart.getTime() + conflictingSession.duration_minutes * 60000);
      
      throw new AppError(
        `Time slot conflicts with existing booking from ${conflictStart.toLocaleTimeString()} to ${conflictEnd.toLocaleTimeString()}`, 
        400
      );
    }

    // Check tutor availability settings
    const dayOfWeek = scheduledDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];
    const timeOfDay = scheduledDate.getHours() * 60 + scheduledDate.getMinutes();
    
    const availabilityCheck = await query(
      `SELECT availability FROM tutor_profiles WHERE user_id = $1`,
      [tutorId]
    );
    
    if (availabilityCheck.rows.length > 0 && availabilityCheck.rows[0].availability) {
      const availability = availabilityCheck.rows[0].availability;
      const dayAvailability = availability.find(slot => slot.day === dayName);
      
      // If no availability for this day, allow booking (don't block it)
      if (!dayAvailability) {
        // No specific availability for this day, allow the booking
      } else if (dayAvailability.slots && dayAvailability.slots.length > 0) {
        // Check if time is within any slot
        const isWithinAvailableHours = dayAvailability.slots.some(slotStr => {
          // Slot format could be "9:00-12:00" or have separate start/end
          let startTime, endTime;
          
          if (typeof slotStr === 'string' && slotStr.includes('-')) {
            const [start, end] = slotStr.split('-');
            startTime = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
            endTime = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
          } else if (slotStr.start && slotStr.end) {
            startTime = parseInt(slotStr.start.split(':')[0]) * 60 + parseInt(slotStr.start.split(':')[1]);
            endTime = parseInt(slotStr.end.split(':')[0]) * 60 + parseInt(slotStr.end.split(':')[1]);
          }
          
          return startTime !== undefined && endTime !== undefined && 
                 timeOfDay >= startTime && timeOfDay < endTime;
        });
        
        if (!isWithinAvailableHours && dayAvailability.slots.length > 0) {
          throw new AppError('Requested time is outside tutor\'s available hours', 400);
        }
      }
    }

    // Create booking
    // Cast all UUID parameters explicitly
    const result = await query(
      `INSERT INTO bookings (
        learner_id, tutor_id, subject_id, scheduled_at, duration_minutes,
        total_amount, currency, notes, status, is_trial
      ) VALUES ($1::uuid, $2::uuid, $3::uuid, $4::timestamptz, $5, $6::decimal, $7, $8, 'pending', $9)
       RETURNING *`,
      [
        learnerId,
        tutorIdStr,
        subjectIdStr,
        scheduledAtStr,
        isTrial ? 30 : durationMinutes,
        totalAmount,
        tutor.currency || 'USD',
        notes || null,
        isTrial || false
      ]
    );

    const booking = result.rows[0];

    // Create notification for tutor
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'new_booking', 'New Booking Request', 
         $2, 
         json_build_object('booking_id', $3, 'learner_id', $4))`,
      [
        tutorId, 
        isTrial ? 'You have a new trial lesson request!' : 'You have a new booking request.',
        booking.booking_id, 
        learnerId
      ]
    );

    res.status(201).json({
      success: true,
      message: isTrial ? 'Trial lesson requested successfully' : 'Booking created successfully',
      data: { 
        booking,
        isTrial: isTrial || false
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all bookings for user
export const getBookings = async (req, res, next) => {
  try {
    const { status, type = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.userId;
    const userRole = req.user.role;

    let whereClause;
    let values;

    if (userRole === 'learner' || type === 'learner') {
      whereClause = 'WHERE b.learner_id = $1';
      values = [userId];
    } else if (userRole === 'tutor' || type === 'tutor') {
      whereClause = 'WHERE b.tutor_id = $1';
      values = [userId];
    } else {
      whereClause = 'WHERE b.learner_id = $1 OR b.tutor_id = $1';
      values = [userId];
    }

    if (status) {
      whereClause += ` AND b.status = $${values.length + 1}`;
      values.push(status);
    }

    values.push(parseInt(limit), parseInt(offset));

    const result = await query(
      `SELECT 
        b.*,
        s.name as subject_name,
        s.icon as subject_icon,
        learner.name as learner_name,
        learner.profile_pic as learner_pic,
        tutor.name as tutor_name,
        tutor.profile_pic as tutor_pic,
        tutor.rating as tutor_rating
      FROM bookings b
      JOIN subjects s ON b.subject_id = s.subject_id
      JOIN users learner ON b.learner_id = learner.user_id
      JOIN users tutor ON b.tutor_id = tutor.user_id
      ${whereClause}
      ORDER BY b.scheduled_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM bookings b ${whereClause}`,
      values.slice(0, values.length - 2)
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

// Get booking by ID
export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        b.*,
        s.name as subject_name,
        s.description as subject_description,
        learner.name as learner_name,
        learner.email as learner_email,
        learner.profile_pic as learner_pic,
        tutor.name as tutor_name,
        tutor.email as tutor_email,
        tutor.profile_pic as tutor_pic,
        tutor.rating as tutor_rating,
        tp.introduction as tutor_intro
      FROM bookings b
      JOIN subjects s ON b.subject_id = s.subject_id
      JOIN users learner ON b.learner_id = learner.user_id
      JOIN users tutor ON b.tutor_id = tutor.user_id
      LEFT JOIN tutor_profiles tp ON tutor.user_id = tp.user_id
      WHERE b.booking_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    const booking = result.rows[0];

    // Check permissions
    if (
      booking.learner_id !== req.user.userId &&
      booking.tutor_id !== req.user.userId &&
      req.user.role !== 'admin'
    ) {
      throw new AppError('Unauthorized', 403);
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

// Confirm booking (tutor action)
export const confirmBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE bookings 
       SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
       WHERE booking_id = $1 AND tutor_id = $2
       RETURNING *`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Booking not found or unauthorized', 404);
    }

    // Create notification for learner
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       SELECT 
         learner_id,
         'booking_confirmed',
         'Booking Confirmed!',
         'Your tutoring session has been confirmed.',
         json_build_object('booking_id', $1)
       FROM bookings WHERE booking_id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'Booking confirmed',
      data: { booking: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Cancel booking
export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if user is learner or tutor of this booking
    const bookingCheck = await query(
      `SELECT * FROM bookings WHERE booking_id = $1`,
      [id]
    );

    if (bookingCheck.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    const booking = bookingCheck.rows[0];

    if (
      booking.learner_id !== req.user.userId &&
      booking.tutor_id !== req.user.userId &&
      req.user.role !== 'admin'
    ) {
      throw new AppError('Unauthorized', 403);
    }

    const result = await query(
      `UPDATE bookings 
       SET status = 'cancelled', cancellation_reason = $1, updated_at = CURRENT_TIMESTAMP
       WHERE booking_id = $2
       RETURNING *`,
      [reason || null, id]
    );

    // Create notification for the other party
    const notifierId = booking.learner_id === req.user.userId ? booking.tutor_id : booking.learner_id;
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'booking_cancelled', 'Booking Cancelled', 
         'A tutoring session has been cancelled.', 
         json_build_object('booking_id', $2, 'reason', $3))`,
      [notifierId, id, reason]
    );

    res.json({
      success: true,
      message: 'Booking cancelled',
      data: { booking: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Reschedule booking
export const rescheduleBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      throw new AppError('New scheduled time is required', 400);
    }

    const bookingCheck = await query(
      `SELECT * FROM bookings WHERE booking_id = $1`,
      [id]
    );

    if (bookingCheck.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    const booking = bookingCheck.rows[0];

    // Check permissions
    if (
      booking.learner_id !== req.user.userId &&
      booking.tutor_id !== req.user.userId
    ) {
      throw new AppError('Unauthorized', 403);
    }

    // Check for conflicts at new time
    const conflictCheck = await query(
      `SELECT booking_id FROM bookings
       WHERE tutor_id = $1
         AND scheduled_at = $2
         AND status IN ('pending', 'confirmed')
         AND booking_id != $3`,
      [booking.tutor_id, scheduledAt, id]
    );

    if (conflictCheck.rows.length > 0) {
      throw new AppError('This time slot is already booked', 400);
    }

    const result = await query(
      `UPDATE bookings 
       SET scheduled_at = $1, updated_at = CURRENT_TIMESTAMP
       WHERE booking_id = $2
       RETURNING *`,
      [scheduledAt, id]
    );

    // Create notification for the other party
    const notifierId = booking.learner_id === req.user.userId ? booking.tutor_id : booking.learner_id;
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'booking_rescheduled', 'Booking Rescheduled', 
         'A tutoring session has been rescheduled.', 
         json_build_object('booking_id', $2, 'new_time', $3))`,
      [notifierId, id, scheduledAt]
    );

    res.json({
      success: true,
      message: 'Booking rescheduled',
      data: { booking: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Get tutor availability
export const getTutorAvailability = async (req, res, next) => {
  try {
    const { tutorId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new AppError('Start date and end date are required', 400);
    }

    // Get tutor's availability settings
    const tutorResult = await query(
      `SELECT availability FROM tutor_profiles WHERE user_id = $1`,
      [tutorId]
    );

    if (tutorResult.rows.length === 0) {
      throw new AppError('Tutor not found', 404);
    }

    const availability = tutorResult.rows[0].availability || [];

    // Get booked slots
    const bookedResult = await query(
      `SELECT scheduled_at, duration_minutes
       FROM bookings
       WHERE tutor_id = $1
         AND scheduled_at BETWEEN $2 AND $3
         AND status IN ('pending', 'confirmed')`,
      [tutorId, startDate, endDate]
    );

    const bookedSlots = bookedResult.rows.map(row => ({
      start: row.scheduled_at,
      end: new Date(new Date(row.scheduled_at).getTime() + row.duration_minutes * 60000)
    }));

    res.json({
      success: true,
      data: {
        availability,
        bookedSlots
      }
    });
  } catch (error) {
    next(error);
  }
};
