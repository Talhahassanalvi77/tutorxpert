import express from 'express';
import {
  getUserAnalytics,
  trackEvent,
  getEventAnalytics
} from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/user/:userId', authenticateToken, getUserAnalytics);
router.get('/events', getEventAnalytics);
router.post('/track', trackEvent);

export default router;
