import express from 'express';
import {
  createReview,
  getTutorReviews,
  getReviewById,
  updateReview,
  deleteReview,
  addReviewResponse,
  getUserReviews
} from '../controllers/reviewController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/tutor/:tutorId', getTutorReviews);
router.get('/:id', getReviewById);

// Protected routes
router.use(authenticateToken);

router.post('/', createReview);
router.get('/user/me', getUserReviews);
router.patch('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/response', addReviewResponse);

export default router;
