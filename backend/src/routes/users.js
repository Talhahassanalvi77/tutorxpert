import express from 'express';
import { getAllUsers, getUserById, deleteUser } from '../controllers/userController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRoles('admin'), getAllUsers);
router.get('/:id', getUserById);
router.delete('/:id', authorizeRoles('admin'), deleteUser);

export default router;
