import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectSQLite, initializeDatabase } from './db/index.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import subjectRoutes from './routes/subjects.js';
import tutorRoutes from './routes/tutors.js';
import matchRoutes from './routes/match.js';
import bookingRoutes from './routes/bookings.js';
import sessionRoutes from './routes/sessions.js';
import progressRoutes from './routes/progress.js';
import communityRoutes from './routes/community.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';
import reviewRoutes from './routes/reviews.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payments.js';
import favoritesRoutes from './routes/favorites.js';
import messageRoutes from './routes/messages.js';
import { setupSocketIO } from './socket/socketHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/messages', messageRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connections and server start
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectSQLite();
    initializeDatabase();
    
    setupSocketIO(io);
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 TutorXpert Backend running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { io };
