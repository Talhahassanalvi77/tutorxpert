import express from 'express';
import {
  getAllTutors,
  getTutorById,
  createTutorProfile,
  updateAvailability,
  toggleAvailability,
  getTutorStats
} from '../controllers/tutorController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllTutors);
router.get('/:id', getTutorById);
router.get('/:id/stats', getTutorStats);

// Protected routes
router.post('/profile', authenticateToken, authorizeRoles('tutor'), createTutorProfile);
router.put('/availability', authenticateToken, authorizeRoles('tutor'), updateAvailability);
router.patch('/availability', authenticateToken, authorizeRoles('tutor'), toggleAvailability);

export default router;
