import express from 'express';
import {
  getConversations,
  getConversation,
  sendMessage,
  markAsRead,
  deleteMessage,
} from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All message routes require authentication
router.use(authenticateToken);

router.get('/', getConversations);
router.get('/conversation/:otherUserId', getConversation);
router.post('/', sendMessage);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteMessage);

export default router;
