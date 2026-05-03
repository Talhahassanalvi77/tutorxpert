import express from 'express';
import { register, login, getMe, updateProfile, changePassword, refreshToken, googleAuth } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/signup', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);

// Protected routes
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, changePassword);
router.post('/refresh-token', authenticateToken, refreshToken);

export default router;
