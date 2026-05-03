import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendNotification,
  broadcastNotification
} from '../controllers/notificationController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.post('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.post('/send', authorizeRoles('admin'), sendNotification);
router.post('/broadcast', authorizeRoles('admin'), broadcastNotification);

export default router;
