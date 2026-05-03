import express from 'express';
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getPopularSubjects
} from '../controllers/subjectController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/popular', getPopularSubjects);
router.get('/', getAllSubjects);
router.get('/:id', getSubjectById);

// Protected routes
router.post('/', authenticateToken, authorizeRoles('admin'), createSubject);
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateSubject);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteSubject);

export default router;
