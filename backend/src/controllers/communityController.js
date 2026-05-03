import { query } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

// Get community posts
export const getCommunityPosts = async (req, res, next) => {
  try {
    const {
      subjectId,
      postType = 'all',
      sortBy = 'created_at',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    const validSorts = ['created_at', 'upvotes', 'views', 'created_at'];
    const sortField = validSorts.includes(sortBy) ? sortBy : 'created_at';

    let whereClause = 'WHERE cp.parent_post_id IS NULL';
    const values = [];
    let paramCount = 1;

    if (subjectId) {
      whereClause += ` AND cp.subject_id = $${paramCount++}`;
      values.push(subjectId);
    }

    if (postType !== 'all') {
      whereClause += ` AND cp.post_type = $${paramCount++}`;
      values.push(postType);
    }

    values.push(parseInt(limit), parseInt(offset));

    const result = await query(
      `SELECT 
        cp.*,
        u.name as author_name,
        u.profile_pic as author_pic,
        s.name as subject_name,
        (SELECT COUNT(*) FROM community_posts WHERE parent_post_id = cp.post_id) as reply_count
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.user_id
      LEFT JOIN subjects s ON cp.subject_id = s.subject_id
      ${whereClause}
      ORDER BY cp.${sortField} DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    res.json({
      success: true,
      data: {
        posts: result.rows,
        pagination: {
          total: result.length,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new post
export const createPost = async (req, res, next) => {
  try {
    const { title, content, subjectId, tags, postType = 'question' } = req.body;

    if (!title || !content) {
      throw new AppError('Title and content are required', 400);
    }

    const result = await query(
      `INSERT INTO community_posts (
        user_id, subject_id, title, content, tags, post_type
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        req.user.userId,
        subjectId || null,
        title,
        content,
        tags || [],
        postType
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Get post by ID
export const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Increment views
    await query(
      `UPDATE community_posts SET views = views + 1 WHERE post_id = $1`,
      [id]
    );

    const result = await query(
      `SELECT 
        cp.*,
        u.name as author_name,
        u.profile_pic as author_pic,
        s.name as subject_name
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.user_id
      LEFT JOIN subjects s ON cp.subject_id = s.subject_id
      WHERE cp.post_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Post not found', 404);
    }

    // Get replies
    const repliesResult = await query(
      `SELECT 
        cp.*,
        u.name as author_name,
        u.profile_pic as author_pic
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.user_id
      WHERE cp.parent_post_id = $1
      ORDER BY cp.created_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        post: result.rows[0],
        replies: repliesResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add reply to post
export const addReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      throw new AppError('Content is required', 400);
    }

    // Get original post
    const postResult = await query(
      `SELECT * FROM community_posts WHERE post_id = $1`,
      [id]
    );

    if (postResult.rows.length === 0) {
      throw new AppError('Post not found', 404);
    }

    const result = await query(
      `INSERT INTO community_posts (
        user_id, subject_id, title, content, post_type, parent_post_id
      ) VALUES ($1, $2, $3, $4, 'answer', $5)
      RETURNING *`,
      [
        req.user.userId,
        postResult.rows[0].subject_id,
        'Re: ' + postResult.rows[0].title,
        content,
        id
      ]
    );

    // Update parent post if this is the first answer
    if (postResult.rows[0].post_type === 'question') {
      await query(
        `UPDATE community_posts 
         SET is_answered = true, accepted_answer_id = $1
         WHERE post_id = $2`,
        [result.rows[0].post_id, id]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Reply added',
      data: { post: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Upvote post
export const upvotePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user already voted
    const existingVote = await query(
      `SELECT vote_type FROM post_votes WHERE post_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (existingVote.rows.length > 0) {
      const currentVote = existingVote.rows[0].vote_type;
      
      if (currentVote === 'upvote') {
        // Remove upvote
        await query(`DELETE FROM post_votes WHERE post_id = $1 AND user_id = $2`, [id, userId]);
        await query(`UPDATE community_posts SET upvotes = upvotes - 1 WHERE post_id = $1`, [id]);
      } else {
        // Change downvote to upvote
        await query(
          `UPDATE post_votes SET vote_type = 'upvote' WHERE post_id = $1 AND user_id = $2`,
          [id, userId]
        );
        await query(
          `UPDATE community_posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE post_id = $1`,
          [id]
        );
      }
    } else {
      // Add new upvote
      await query(
        `INSERT INTO post_votes (post_id, user_id, vote_type) VALUES ($1, $2, 'upvote')`,
        [id, userId]
      );
      await query(`UPDATE community_posts SET upvotes = upvotes + 1 WHERE post_id = $1`, [id]);
    }

    // Get updated post
    const result = await query(
      `SELECT 
        cp.*,
        u.name as author_name,
        u.profile_pic as author_pic,
        s.name as subject_name,
        COALESCE(pv.vote_type, null) as user_vote
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.user_id
      LEFT JOIN subjects s ON cp.subject_id = s.subject_id
      LEFT JOIN post_votes pv ON cp.post_id = pv.post_id AND pv.user_id = $2
      WHERE cp.post_id = $1`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Post not found', 404);
    }

    res.json({
      success: true,
      message: 'Vote updated',
      data: { post: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Downvote post
export const downvotePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user already voted
    const existingVote = await query(
      `SELECT vote_type FROM post_votes WHERE post_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (existingVote.rows.length > 0) {
      const currentVote = existingVote.rows[0].vote_type;
      
      if (currentVote === 'downvote') {
        // Remove downvote
        await query(`DELETE FROM post_votes WHERE post_id = $1 AND user_id = $2`, [id, userId]);
        await query(`UPDATE community_posts SET downvotes = downvotes - 1 WHERE post_id = $1`, [id]);
      } else {
        // Change upvote to downvote
        await query(
          `UPDATE post_votes SET vote_type = 'downvote' WHERE post_id = $1 AND user_id = $2`,
          [id, userId]
        );
        await query(
          `UPDATE community_posts SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE post_id = $1`,
          [id]
        );
      }
    } else {
      // Add new downvote
      await query(
        `INSERT INTO post_votes (post_id, user_id, vote_type) VALUES ($1, $2, 'downvote')`,
        [id, userId]
      );
      await query(`UPDATE community_posts SET downvotes = downvotes + 1 WHERE post_id = $1`, [id]);
    }

    // Get updated post
    const result = await query(
      `SELECT 
        cp.*,
        u.name as author_name,
        u.profile_pic as author_pic,
        s.name as subject_name,
        COALESCE(pv.vote_type, null) as user_vote
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.user_id
      LEFT JOIN subjects s ON cp.subject_id = s.subject_id
      LEFT JOIN post_votes pv ON cp.post_id = pv.post_id AND pv.user_id = $2
      WHERE cp.post_id = $1`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Post not found', 404);
    }

    res.json({
      success: true,
      message: 'Vote updated',
      data: { post: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Accept answer
export const acceptAnswer = async (req, res, next) => {
  try {
    const { postId, answerId } = req.body;

    // Verify user owns the question
    const questionResult = await query(
      `SELECT * FROM community_posts WHERE post_id = $1 AND user_id = $2`,
      [postId, req.user.userId]
    );

    if (questionResult.rows.length === 0) {
      throw new AppError('Question not found or unauthorized', 404);
    }

    const result = await query(
      `UPDATE community_posts 
       SET is_answered = true, accepted_answer_id = $1
       WHERE post_id = $2
       RETURNING *`,
      [answerId, postId]
    );

    res.json({
      success: true,
      message: 'Answer accepted',
      data: { post: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Search community posts
export const searchPosts = async (req, res, next) => {
  try {
    const { q, subjectId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!q) {
      throw new AppError('Search query is required', 400);
    }

    let whereClause = 'WHERE cp.parent_post_id IS NULL AND (cp.title ILIKE $1 OR cp.content ILIKE $1)';
    const values = [`%${q}%`];

    if (subjectId) {
      whereClause += ` AND cp.subject_id = $${values.length + 1}`;
      values.push(subjectId);
    }

    values.push(parseInt(limit), parseInt(offset));

    const result = await query(
      `SELECT 
        cp.*,
        u.name as author_name,
        u.profile_pic as author_pic,
        s.name as subject_name
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.user_id
      LEFT JOIN subjects s ON cp.subject_id = s.subject_id
      ${whereClause}
      ORDER BY cp.upvotes DESC, cp.created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    res.json({
      success: true,
      data: { posts: result.rows }
    });
  } catch (error) {
    next(error);
  }
};
