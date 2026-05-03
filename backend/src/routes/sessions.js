import express from 'express';
import {
  createSession,
  getSessionById,
  updateSessionNotes,
  saveSessionTools,
  addSessionChat,
  getSessionChat,
  getUserSessions,
  completeSession,
  autoSaveTools,
  generateAISummary
} from '../controllers/sessionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getUserSessions);
router.get('/:id', getSessionById);
router.get('/:id/chat', getSessionChat);
router.post('/', createSession);
router.patch('/:id/notes', updateSessionNotes);
router.patch('/:id/complete', completeSession);
router.post('/:id/tools', saveSessionTools);
router.patch('/:id/auto-save', autoSaveTools);
router.post('/:id/ai-summary', generateAISummary);
router.post('/:id/chat', addSessionChat);

export default router;
