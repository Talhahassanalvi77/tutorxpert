import express from 'express';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../controllers/favoritesController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All favorite routes require authentication
router.use(authenticateToken);

router.get('/', getFavorites);
router.post('/', addFavorite);
router.delete('/:tutorId', removeFavorite);

export default router;
