import express from 'express';
import {
  getLearnerProgress,
  recordProgress,
  createLearningPath,
  updateLearningPath,
  awardBadge,
  getProgressAnalytics
} from '../controllers/progressController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/:learnerId', getLearnerProgress);
router.get('/:learnerId/analytics', getProgressAnalytics);
router.post('/record', recordProgress);
router.post('/path', createLearningPath);
router.patch('/path/:id', updateLearningPath);
router.post('/badge', authorizeRoles('admin'), awardBadge);

export default router;
