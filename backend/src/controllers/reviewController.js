import { query } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

// Create a review
export const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment, tags } = req.body;

    if (!bookingId || !rating) {
      throw new AppError('Booking ID and rating are required', 400);
    }

    if (rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    // Check if booking exists and user is the learner
    const bookingResult = await query(
      `SELECT * FROM bookings WHERE booking_id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    const booking = bookingResult.rows[0];

    if (booking.learner_id !== req.user.userId) {
      throw new AppError('Only the learner can review this session', 403);
    }

    if (booking.status !== 'completed') {
      throw new AppError('Can only review completed sessions', 400);
    }

    // Check if review already exists
    const existingReview = await query(
      `SELECT review_id FROM reviews WHERE booking_id = $1`,
      [bookingId]
    );

    if (existingReview.rows.length > 0) {
      throw new AppError('Review already exists for this booking', 400);
    }

    // Create review
    const result = await query(
      `INSERT INTO reviews (
        booking_id, reviewer_id, reviewee_id, rating, comment, tags
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        bookingId,
        req.user.userId,
        booking.tutor_id,
        rating,
        comment || null,
        tags || []
      ]
    );

    // Update tutor's average rating
    await updateTutorRating(booking.tutor_id);

    // Create notification for tutor
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'new_review', 'New Review', 
         'You received a new review!', 
         json_build_object('review_id', $2, 'rating', $3))`,
      [booking.tutor_id, result.rows[0].review_id, rating]
    );

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews for a tutor
export const getTutorReviews = async (req, res, next) => {
  try {
    const { tutorId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE r.reviewee_id = $1';
    const values = [tutorId];

    if (rating) {
      whereClause += ` AND r.rating = $${values.length + 1}`;
      values.push(parseInt(rating));
    }

    values.push(parseInt(limit), parseInt(offset));

    const result = await query(
      `SELECT 
        r.*,
        u.name as reviewer_name,
        u.profile_pic as reviewer_pic,
        b.subject_id,
        s.name as subject_name
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.user_id
      JOIN bookings b ON r.booking_id = b.booking_id
      JOIN subjects s ON b.subject_id = s.subject_id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM reviews r ${whereClause}`,
      values.slice(0, -2)
    );

    // Get rating distribution
    const distributionResult = await query(
      `SELECT rating, COUNT(*) as count
       FROM reviews
       WHERE reviewee_id = $1
       GROUP BY rating
       ORDER BY rating DESC`,
      [tutorId]
    );

    res.json({
      success: true,
      data: {
        reviews: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit)
        },
        ratingDistribution: distributionResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get review by ID
export const getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        r.*,
        reviewer.name as reviewer_name,
        reviewer.profile_pic as reviewer_pic,
        reviewee.name as reviewee_name,
        b.subject_id,
        s.name as subject_name
      FROM reviews r
      JOIN users reviewer ON r.reviewer_id = reviewer.user_id
      JOIN users reviewee ON r.reviewee_id = reviewee.user_id
      JOIN bookings b ON r.booking_id = b.booking_id
      JOIN subjects s ON b.subject_id = s.subject_id
      WHERE r.review_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Review not found', 404);
    }

    res.json({
      success: true,
      data: { review: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Update review
export const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment, tags } = req.body;

    // Check if user is the reviewer
    const reviewResult = await query(
      `SELECT * FROM reviews WHERE review_id = $1`,
      [id]
    );

    if (reviewResult.rows.length === 0) {
      throw new AppError('Review not found', 404);
    }

    const review = reviewResult.rows[0];

    if (review.reviewer_id !== req.user.userId) {
      throw new AppError('Unauthorized', 403);
    }

    const result = await query(
      `UPDATE reviews 
       SET rating = COALESCE($1, rating),
           comment = COALESCE($2, comment),
           tags = COALESCE($3, tags),
           updated_at = CURRENT_TIMESTAMP
       WHERE review_id = $4
       RETURNING *`,
      [rating, comment, tags, id]
    );

    // Update tutor's average rating
    await updateTutorRating(review.reviewee_id);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Delete review
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reviewResult = await query(
      `SELECT * FROM reviews WHERE review_id = $1`,
      [id]
    );

    if (reviewResult.rows.length === 0) {
      throw new AppError('Review not found', 404);
    }

    const review = reviewResult.rows[0];

    if (review.reviewer_id !== req.user.userId && req.user.role !== 'admin') {
      throw new AppError('Unauthorized', 403);
    }

    await query(`DELETE FROM reviews WHERE review_id = $1`, [id]);

    // Update tutor's average rating
    await updateTutorRating(review.reviewee_id);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Add response to review (tutor only)
export const addReviewResponse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response) {
      throw new AppError('Response is required', 400);
    }

    const reviewResult = await query(
      `SELECT * FROM reviews WHERE review_id = $1`,
      [id]
    );

    if (reviewResult.rows.length === 0) {
      throw new AppError('Review not found', 404);
    }

    const review = reviewResult.rows[0];

    if (review.reviewee_id !== req.user.userId) {
      throw new AppError('Only the tutor can respond to this review', 403);
    }

    const result = await query(
      `UPDATE reviews 
       SET response = $1, response_at = CURRENT_TIMESTAMP
       WHERE review_id = $2
       RETURNING *`,
      [response, id]
    );

    // Create notification for reviewer
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'review_response', 'Tutor Responded', 
         'A tutor responded to your review.', 
         json_build_object('review_id', $2))`,
      [review.reviewer_id, id]
    );

    res.json({
      success: true,
      message: 'Response added successfully',
      data: { review: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to update tutor's average rating
async function updateTutorRating(tutorId) {
  const result = await query(
    `SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as total_reviews
     FROM reviews
     WHERE reviewee_id = $1`,
    [tutorId]
  );

  const { avg_rating, total_reviews } = result.rows[0];

  await query(
    `UPDATE users 
     SET rating = $1, total_reviews = $2
     WHERE user_id = $3`,
    [avg_rating || 0, total_reviews, tutorId]
  );
}

// Get user's reviews (as reviewer)
export const getUserReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT 
        r.*,
        u.name as reviewee_name,
        u.profile_pic as reviewee_pic,
        b.subject_id,
        s.name as subject_name
      FROM reviews r
      JOIN users u ON r.reviewee_id = u.user_id
      JOIN bookings b ON r.booking_id = b.booking_id
      JOIN subjects s ON b.subject_id = s.subject_id
      WHERE r.reviewer_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3`,
      [req.user.userId, parseInt(limit), parseInt(offset)]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM reviews WHERE reviewer_id = $1`,
      [req.user.userId]
    );

    res.json({
      success: true,
      data: {
        reviews: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
