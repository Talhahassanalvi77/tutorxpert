import express from 'express';
import {
  getCommunityPosts,
  createPost,
  getPostById,
  addReply,
  upvotePost,
  downvotePost,
  acceptAnswer,
  searchPosts
} from '../controllers/communityController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/search', searchPosts);
router.get('/', getCommunityPosts);
router.get('/:id', getPostById);
router.post('/', authenticateToken, createPost);
router.post('/:id/reply', authenticateToken, addReply);
router.post('/:id/upvote', authenticateToken, upvotePost);
router.post('/:id/downvote', authenticateToken, downvotePost);
router.post('/accept', authenticateToken, acceptAnswer);

export default router;
