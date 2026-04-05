import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(userId, role) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.connected = true;

      // Authenticate
      if (userId) {
        this.socket.emit('authenticate', { userId, role });
      }
    });

    this.socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Session methods
  joinSession(sessionId, userId) {
    if (this.socket) {
      this.socket.emit('join_session', { sessionId, userId });
    }
  }

  leaveSession(sessionId, userId) {
    if (this.socket) {
      this.socket.emit('leave_session', { sessionId, userId });
    }
  }

  // Chat
  sendChatMessage(data) {
    if (this.socket) {
      this.socket.emit('session_chat', data);
    }
  }

  // Whiteboard
  sendWhiteboardUpdate(data) {
    if (this.socket) {
      this.socket.emit('whiteboard_update', data);
    }
  }

  // Code editor
  sendCodeUpdate(data) {
    if (this.socket) {
      this.socket.emit('code_update', data);
    }
  }

  // Cursor position
  sendCursorPosition(data) {
    if (this.socket) {
      this.socket.emit('cursor_position', data);
    }
  }

  // Typing indicators
  startTyping(data) {
    if (this.socket) {
      this.socket.emit('typing_start', data);
    }
  }

  endTyping(data) {
    if (this.socket) {
      this.socket.emit('typing_end', data);
    }
  }

  // Quiz
  startQuiz(data) {
    if (this.socket) {
      this.socket.emit('quiz_start', data);
    }
  }

  submitQuizAnswer(data) {
    if (this.socket) {
      this.socket.emit('quiz_answer', data);
    }
  }

  // File sharing
  shareFile(data) {
    if (this.socket) {
      this.socket.emit('file_shared', data);
    }
  }

  // Screen share
  startScreenShare(data) {
    if (this.socket) {
      this.socket.emit('screen_share_start', data);
    }
  }

  endScreenShare(data) {
    if (this.socket) {
      this.socket.emit('screen_share_end', data);
    }
  }

  // Booking updates
  sendBookingUpdate(data) {
    if (this.socket) {
      this.socket.emit('booking_update', data);
    }
  }

  // Match notifications
  sendMatchCreated(data) {
    if (this.socket) {
      this.socket.emit('match_created', data);
    }
  }

  // Direct messages
  sendDirectMessage(data) {
    if (this.socket) {
      this.socket.emit('direct_message', data);
    }
  }

  // Event listeners
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }
}

// Singleton instance
export const socketService = new SocketService();
export default socketService;
