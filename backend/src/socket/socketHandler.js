import { query } from '../db/index.js';

// Store socket connections by user ID
const userSockets = new Map();
// Store active session rooms
const sessionRooms = new Map();

export function setupSocketIO(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Authentication - join user's personal room
    socket.on('authenticate', async (data) => {
      const { userId, role } = data;
      
      if (userId) {
        socket.join(`user:${userId}`);
        userSockets.set(userId, socket.id);

        socket.emit('authenticated', { success: true, userId });
        console.log(`User ${userId} authenticated with socket ${socket.id}`);
      }
    });

    // Join session room for real-time collaboration
    socket.on('join_session', async (data) => {
      const { sessionId, userId } = data;
      
      socket.join(`session:${sessionId}`);
      
      if (!sessionRooms.has(sessionId)) {
        sessionRooms.set(sessionId, new Set());
      }
      sessionRooms.get(sessionId).add(socket.id);

      // Notify others in the session
      socket.to(`session:${sessionId}`).emit('user_joined', {
        sessionId,
        userId,
        timestamp: new Date()
      });

      console.log(`User ${userId} joined session ${sessionId}`);
    });

    // Leave session room
    socket.on('leave_session', (data) => {
      const { sessionId, userId } = data;
      
      socket.leave(`session:${sessionId}`);
      
      if (sessionRooms.has(sessionId)) {
        sessionRooms.get(sessionId).delete(socket.id);
      }

      socket.to(`session:${sessionId}`).emit('user_left', {
        sessionId,
        userId,
        timestamp: new Date()
      });
    });

    // Real-time chat in session
    socket.on('session_chat', async (data) => {
      const { sessionId, message, messageType, metadata, userId, userName, userRole } = data;
      
      // Broadcast to session room
      io.to(`session:${sessionId}`).emit('session_chat', {
        sessionId,
        message: {
          sessionId,
          senderId: userId,
          senderName: userName,
          senderRole: userRole,
          message,
          messageType: messageType || 'text',
          metadata: metadata || {},
          timestamp: new Date()
        }
      });
    });

    // Whiteboard sync
    socket.on('whiteboard_update', (data) => {
      const { sessionId, drawing, userId } = data;
      
      socket.to(`session:${sessionId}`).emit('whiteboard_update', {
        sessionId,
        drawing,
        userId
      });
    });

    // Code editor sync
    socket.on('code_update', (data) => {
      const { sessionId, code, language, userId } = data;
      
      socket.to(`session:${sessionId}`).emit('code_update', {
        sessionId,
        code,
        language,
        userId
      });
    });

    // Cursor position sync for collaborative editing
    socket.on('cursor_position', (data) => {
      const { sessionId, position, userId } = data;
      
      socket.to(`session:${sessionId}`).emit('cursor_position', {
        sessionId,
        position,
        userId
      });
    });

    // Typing indicator
    socket.on('typing_start', (data) => {
      const { sessionId, userId, userName } = data;
      
      socket.to(`session:${sessionId}`).emit('typing_start', {
        sessionId,
        userId,
        userName
      });
    });

    socket.on('typing_end', (data) => {
      const { sessionId, userId } = data;
      
      socket.to(`session:${sessionId}`).emit('typing_end', {
        sessionId,
        userId
      });
    });

    // Quiz/Poll events
    socket.on('quiz_start', (data) => {
      const { sessionId, quiz, userId } = data;
      
      io.to(`session:${sessionId}`).emit('quiz_start', {
        sessionId,
        quiz,
        startedBy: userId
      });
    });

    socket.on('quiz_answer', (data) => {
      const { sessionId, questionId, answer, userId } = data;
      
      socket.to(`session:${sessionId}`).emit('quiz_answer', {
        sessionId,
        questionId,
        answer,
        userId
      });
    });

    // File sharing in session
    socket.on('file_shared', (data) => {
      const { sessionId, file, userId } = data;
      
      io.to(`session:${sessionId}`).emit('file_shared', {
        sessionId,
        file,
        sharedBy: userId
      });
    });

    // Screen share events
    socket.on('screen_share_start', (data) => {
      const { sessionId, userId } = data;
      
      io.to(`session:${sessionId}`).emit('screen_share_start', {
        sessionId,
        userId
      });
    });

    socket.on('screen_share_end', (data) => {
      const { sessionId, userId } = data;
      
      io.to(`session:${sessionId}`).emit('screen_share_end', {
        sessionId,
        userId
      });
    });

    // Booking notifications
    socket.on('booking_update', async (data) => {
      const { bookingId, tutorId, learnerId, status } = data;
      
      // Notify tutor
      if (tutorId) {
        io.to(`user:${tutorId}`).emit('booking_notification', {
          type: 'booking_update',
          bookingId,
          status,
          timestamp: new Date()
        });
      }
      
      // Notify learner
      if (learnerId) {
        io.to(`user:${learnerId}`).emit('booking_notification', {
          type: 'booking_update',
          bookingId,
          status,
          timestamp: new Date()
        });
      }

      // Save notification to database
      const notificationData = {
        type: 'booking_update',
        title: 'Booking Update',
        message: `Your booking status has been updated to ${status}`,
        data: JSON.stringify({ bookingId, status })
      };

      if (tutorId) {
        await query(
          `INSERT INTO notifications (user_id, type, title, message, data)
           VALUES (?, ?, ?, ?, ?)`,
          [tutorId, notificationData.type, notificationData.title, notificationData.message, notificationData.data]
        );
      }
      if (learnerId && learnerId !== tutorId) {
        await query(
          `INSERT INTO notifications (user_id, type, title, message, data)
           VALUES (?, ?, ?, ?, ?)`,
          [learnerId, notificationData.type, notificationData.title, notificationData.message, notificationData.data]
        );
      }
    });

    // Match notifications
    socket.on('match_created', async (data) => {
      const { matchId, tutorId, learnerId, score } = data;
      
      // Notify tutor about new match
      if (tutorId) {
        io.to(`user:${tutorId}`).emit('match_notification', {
          type: 'new_match',
          matchId,
          learnerId,
          score,
          timestamp: new Date()
        });

        await query(
          `INSERT INTO notifications (user_id, type, title, message, data)
           VALUES (?, 'new_match', 'New Match Available!', 
             'You have a new potential student match.', ?)`,
          [tutorId, JSON.stringify({ match_id: matchId, learner_id: learnerId })]
        );
      }
    });

    // Message notification (direct message between users)
    socket.on('direct_message', async (data) => {
      const { senderId, receiverId, message, bookingId } = data;
      
      // Notify receiver
      io.to(`user:${receiverId}`).emit('message_received', {
        senderId,
        message,
        bookingId,
        timestamp: new Date()
      });

      // Save to database
      await query(
        `INSERT INTO messages (sender_id, receiver_id, booking_id, content)
         VALUES (?, ?, ?, ?)`,
        [senderId, receiverId, bookingId || null, message]
      );
    });

    // Disconnect handling
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Remove from userSockets
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }

      // Remove from session rooms
      for (const [sessionId, sockets] of sessionRooms.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          io.to(`session:${sessionId}`).emit('user_left', {
            sessionId,
            socketId: socket.id,
            timestamp: new Date()
          });
        }
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error: ${socket.id}`, error);
    });
  });

  console.log('✅ Socket.IO initialized');
}

// Export for use in other modules
export function notifyUser(userId, event, data) {
  const io = require('../index.js').io;
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function notifySession(sessionId, event, data) {
  const io = require('../index.js').io;
  if (io) {
    io.to(`session:${sessionId}`).emit(event, data);
  }
}

export { userSockets, sessionRooms };
