import express from 'express';
import {
  getMatchesForLearner,
  getAIMatches,
  acceptMatch,
  rejectMatch,
  getUserMatches
} from '../controllers/matchController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getUserMatches);
router.get('/recommend', getMatchesForLearner);
router.get('/ai', getAIMatches);
router.post('/:matchId/accept', acceptMatch);
router.post('/:matchId/reject', rejectMatch);

export default router;
