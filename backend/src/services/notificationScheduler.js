import cron from 'node-cron';
import { query } from '../db/postgresql.js';
import { sendEmail } from './emailService.js';
import { sendPushNotification, notificationTemplates } from './pushNotificationService.js';

// Schedule session reminders
export const scheduleSessionReminders = () => {
  // Run every 5 minutes to check for upcoming sessions
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('Checking for upcoming sessions...');
      
      // Find sessions starting in 30 minutes
      const upcomingSessions = await query(`
        SELECT 
          b.booking_id,
          b.learner_id,
          b.tutor_id,
          b.scheduled_at,
          b.duration_minutes,
          s.name as subject_name,
          learner.name as learner_name,
          learner.email as learner_email,
          tutor.name as tutor_name,
          tutor.email as tutor_email
        FROM bookings b
        JOIN subjects s ON b.subject_id = s.subject_id
        JOIN users learner ON b.learner_id = learner.user_id
        JOIN users tutor ON b.tutor_id = tutor.user_id
        WHERE b.status = 'confirmed'
          AND b.scheduled_at BETWEEN NOW() + INTERVAL '25 minutes' AND NOW() + INTERVAL '35 minutes'
          AND NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.user_id IN (b.learner_id, b.tutor_id) 
              AND n.type = 'session_reminder'
              AND n.data->>'booking_id' = b.booking_id::text
          )
      `);

      for (const session of upcomingSessions.rows) {
        // Send reminders to both learner and tutor
        const participants = [
          { id: session.learner_id, name: session.learner_name, email: session.learner_email },
          { id: session.tutor_id, name: session.tutor_name, email: session.tutor_email }
        ];

        for (const participant of participants) {
          // Create notification in database
          await query(`
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES ($1, 'session_reminder', 'Session Starting Soon', 
              'Your session starts in 30 minutes', 
              json_build_object('booking_id', $2, 'subject', $3))
          `, [participant.id, session.booking_id, session.subject_name]);

          // Send push notification
          const pushNotification = notificationTemplates.sessionReminder({
            userName: participant.name,
            subjectName: session.subject_name,
            scheduledAt: session.scheduled_at,
            durationMinutes: session.duration_minutes,
            minutesUntil: 30,
            sessionId: session.booking_id
          });

          await sendPushNotification(participant.id, pushNotification);

          // Send email reminder
          await sendEmail(participant.email, 'sessionReminder', {
            userName: participant.name,
            subjectName: session.subject_name,
            scheduledAt: session.scheduled_at,
            durationMinutes: session.duration_minutes,
            sessionId: session.booking_id
          });
        }
      }

      console.log(`Sent reminders for ${upcomingSessions.rows.length} upcoming sessions`);
    } catch (error) {
      console.error('Error in session reminder scheduler:', error);
    }
  });
};

// Schedule daily digest emails
export const scheduleDailyDigests = () => {
  // Run daily at 8 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('Sending daily digest emails...');
      
      // Get active learners
      const activeUsers = await query(`
        SELECT DISTINCT u.user_id, u.name, u.email, u.role
        FROM users u
        WHERE u.role IN ('learner', 'tutor')
          AND EXISTS (
            SELECT 1 FROM bookings b 
            WHERE (b.learner_id = u.user_id OR b.tutor_id = u.user_id)
              AND b.created_at >= CURRENT_DATE - INTERVAL '7 days'
          )
      `);

      for (const user of activeUsers.rows) {
        // Get user's upcoming sessions
        const upcomingSessions = await query(`
          SELECT COUNT(*) as count
          FROM bookings b
          WHERE (b.learner_id = $1 OR b.tutor_id = $1)
            AND b.status = 'confirmed'
            AND b.scheduled_at >= NOW()
            AND b.scheduled_at <= NOW() + INTERVAL '7 days'
        `, [user.user_id]);

        // Get unread notifications
        const unreadNotifications = await query(`
          SELECT COUNT(*) as count
          FROM notifications
          WHERE user_id = $1 AND is_read = false
        `, [user.user_id]);

        if (upcomingSessions.rows[0].count > 0 || unreadNotifications.rows[0].count > 0) {
          // Send daily digest email
          await sendEmail(user.email, 'dailyDigest', {
            userName: user.name,
            upcomingSessions: upcomingSessions.rows[0].count,
            unreadNotifications: unreadNotifications.rows[0].count
          });
        }
      }

      console.log(`Sent daily digests to ${activeUsers.rows.length} users`);
    } catch (error) {
      console.error('Error in daily digest scheduler:', error);
    }
  });
};

// Schedule booking expiration cleanup
export const scheduleBookingCleanup = () => {
  // Run every hour to clean up expired bookings
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Cleaning up expired bookings...');
      
      // Cancel bookings that are past their scheduled time and still pending
      const expiredBookings = await query(`
        UPDATE bookings 
        SET status = 'expired', updated_at = CURRENT_TIMESTAMP
        WHERE status = 'pending' 
          AND scheduled_at < NOW() - INTERVAL '1 hour'
        RETURNING booking_id, learner_id, tutor_id
      `);

      // Notify users about expired bookings
      for (const booking of expiredBookings.rows) {
        await query(`
          INSERT INTO notifications (user_id, type, title, message, data)
          VALUES 
            ($1, 'booking_expired', 'Booking Expired', 'A booking request has expired', 
             json_build_object('booking_id', $3)),
            ($2, 'booking_expired', 'Booking Expired', 'A booking request has expired', 
             json_build_object('booking_id', $3))
        `, [booking.learner_id, booking.tutor_id, booking.booking_id]);
      }

      console.log(`Cleaned up ${expiredBookings.rows.length} expired bookings`);
    } catch (error) {
      console.error('Error in booking cleanup scheduler:', error);
    }
  });
};

// Schedule badge awarding
export const scheduleBadgeAwarding = () => {
  // Run daily at midnight to check for new badge achievements
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Checking for badge achievements...');
      
      // Check for "First Session" badge
      const firstSessionUsers = await query(`
        SELECT DISTINCT b.learner_id as user_id
        FROM bookings b
        WHERE b.status = 'completed'
          AND NOT EXISTS (
            SELECT 1 FROM user_badges ub 
            JOIN badges bg ON ub.badge_id = bg.badge_id
            WHERE ub.user_id = b.learner_id AND bg.name = 'First Session'
          )
        GROUP BY b.learner_id
        HAVING COUNT(*) = 1
      `);

      const firstSessionBadge = await query(`
        SELECT badge_id FROM badges WHERE name = 'First Session'
      `);

      if (firstSessionBadge.rows.length > 0) {
        for (const user of firstSessionUsers.rows) {
          await query(`
            INSERT INTO user_badges (user_id, badge_id, context)
            VALUES ($1, $2, json_build_object('achievement_type', 'first_session'))
          `, [user.user_id, firstSessionBadge.rows[0].badge_id]);

          // Send notification
          await query(`
            INSERT INTO notifications (user_id, type, title, message)
            VALUES ($1, 'badge_earned', 'Badge Earned!', 'You earned the "First Session" badge!')
          `, [user.user_id]);
        }
      }

      // Check for "Dedicated Learner" badge (10+ sessions)
      const dedicatedLearners = await query(`
        SELECT b.learner_id as user_id, COUNT(*) as session_count
        FROM bookings b
        WHERE b.status = 'completed'
          AND NOT EXISTS (
            SELECT 1 FROM user_badges ub 
            JOIN badges bg ON ub.badge_id = bg.badge_id
            WHERE ub.user_id = b.learner_id AND bg.name = 'Dedicated Learner'
          )
        GROUP BY b.learner_id
        HAVING COUNT(*) >= 10
      `);

      const dedicatedLearnerBadge = await query(`
        SELECT badge_id FROM badges WHERE name = 'Dedicated Learner'
      `);

      if (dedicatedLearnerBadge.rows.length > 0) {
        for (const user of dedicatedLearners.rows) {
          await query(`
            INSERT INTO user_badges (user_id, badge_id, context)
            VALUES ($1, $2, json_build_object('achievement_type', 'dedicated_learner', 'session_count', $3))
          `, [user.user_id, dedicatedLearnerBadge.rows[0].badge_id, user.session_count]);

          // Send notification
          await query(`
            INSERT INTO notifications (user_id, type, title, message)
            VALUES ($1, 'badge_earned', 'Badge Earned!', 'You earned the "Dedicated Learner" badge!')
          `, [user.user_id]);
        }
      }

      console.log(`Awarded badges to ${firstSessionUsers.rows.length + dedicatedLearners.rows.length} users`);
    } catch (error) {
      console.error('Error in badge awarding scheduler:', error);
    }
  });
};

// Initialize all schedulers
export const initializeSchedulers = () => {
  console.log('🕐 Initializing notification schedulers...');
  
  scheduleSessionReminders();
  scheduleDailyDigests();
  scheduleBookingCleanup();
  scheduleBadgeAwarding();
  
  console.log('✅ All schedulers initialized');
};

export default {
  initializeSchedulers,
  scheduleSessionReminders,
  scheduleDailyDigests,
  scheduleBookingCleanup,
  scheduleBadgeAwarding
};