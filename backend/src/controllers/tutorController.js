import { query } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

// Get all tutors with filters
export const getAllTutors = async (req, res, next) => {
  try {
    const {
      subject,
      language,
      minPrice,
      maxPrice,
      minRating,
      availability,
      sortBy = 'rating',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    const validSorts = ['rating', 'hourly_rate', 'total_sessions', 'response_rate', 'created_at'];
    const sortField = validSorts.includes(sortBy) ? sortBy : 'rating';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    let whereClause = 'WHERE tp.is_available = true';
    const values = [];
    let paramCount = 1;

    if (subject) {
      whereClause += ` AND $${paramCount++} = ANY(tp.subjects)`;
      values.push(subject);
    }

    if (language) {
      whereClause += ` AND $${paramCount++} = ANY(tp.languages)`;
      values.push(language);
    }

    if (minPrice) {
      whereClause += ` AND tp.hourly_rate >= $${paramCount++}`;
      values.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      whereClause += ` AND tp.hourly_rate <= $${paramCount++}`;
      values.push(parseFloat(maxPrice));
    }

    if (minRating) {
      whereClause += ` AND u.rating >= $${paramCount++}`;
      values.push(parseFloat(minRating));
    }

    values.push(parseInt(limit), parseInt(offset));

    const result = await query(
      `SELECT 
        tp.profile_id,
        tp.user_id,
        u.name,
        u.profile_pic,
        u.rating,
        u.total_reviews,
        u.is_verified,
        tp.subjects,
        tp.experience_years,
        tp.hourly_rate,
        tp.currency,
        tp.languages,
        tp.education,
        tp.certifications,
        tp.introduction,
        tp.teaching_style,
        tp.video_intro_url,
        tp.total_sessions,
        tp.total_hours,
        tp.response_rate,
        tp.response_time,
        tp.created_at
      FROM tutor_profiles tp
      JOIN users u ON tp.user_id = u.user_id
      ${whereClause}
      ORDER BY ${sortField} ${order}
      LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM tutor_profiles tp
       JOIN users u ON tp.user_id = u.user_id
       WHERE tp.is_available = true`
    );

    res.json({
      success: true,
      data: {
        tutors: result.rows,
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

// Get tutor by ID
export const getTutorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        tp.*,
        u.name,
        u.email,
        u.profile_pic,
        u.rating,
        u.total_reviews,
        u.is_verified,
        u.skills
      FROM tutor_profiles tp
      JOIN users u ON tp.user_id = u.user_id
      WHERE tp.profile_id = $1 OR tp.user_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Tutor not found', 404);
    }

    // Get tutor's reviews
    const reviewsResult = await query(
      `SELECT r.*, u.name as reviewer_name, u.profile_pic as reviewer_pic
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.user_id
       WHERE r.reviewee_id = $1 AND r.is_public = true
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [result.rows[0].user_id]
    );

    // Get tutor's subjects details
    const subjectsResult = await query(
      `SELECT * FROM subjects WHERE subject_id = ANY($1)`,
      [result.rows[0].subjects]
    );

    res.json({
      success: true,
      data: {
        tutor: {
          ...result.rows[0],
          reviews: reviewsResult.rows,
          subjectDetails: subjectsResult.rows
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create/Update tutor profile
export const createTutorProfile = async (req, res, next) => {
  try {
    const {
      subjects,
      experience_years,
      hourly_rate,
      languages,
      education,
      certifications,
      availability,
      introduction,
      teaching_style,
      video_intro_url
    } = req.body;

    // Check if profile exists
    const existing = await query(
      `SELECT profile_id FROM tutor_profiles WHERE user_id = $1`,
      [req.user.userId]
    );

    if (existing.rows.length > 0) {
      // Update existing profile - ONLY update fields that are EXPLICITLY provided
      const updates = [];
      const values = [];
      let paramCount = 1;

      // Use strict checks - only update if value is explicitly provided (not undefined)
      // and is valid (not empty for strings/arrays)
      if (subjects !== undefined) {
        if (Array.isArray(subjects) && subjects.length > 0) {
          updates.push(`subjects = $${paramCount++}`);
          values.push(subjects);
        } else if (subjects === null || (Array.isArray(subjects) && subjects.length === 0)) {
          // Allow clearing with empty array or null
          updates.push(`subjects = $${paramCount++}`);
          values.push([]);
        }
      }
      
      if (experience_years !== undefined) {
        const expNum = parseInt(experience_years);
        if (!isNaN(expNum) && expNum >= 0) {
          updates.push(`experience_years = $${paramCount++}`);
          values.push(expNum);
        } else if (experience_years === null || experience_years === '') {
          updates.push(`experience_years = $${paramCount++}`);
          values.push(0);
        }
      }
      
      if (hourly_rate !== undefined) {
        const rateNum = parseFloat(hourly_rate);
        if (!isNaN(rateNum) && rateNum >= 0) {
          updates.push(`hourly_rate = $${paramCount++}`);
          values.push(rateNum);
        } else if (hourly_rate === null || hourly_rate === '') {
          updates.push(`hourly_rate = $${paramCount++}`);
          values.push(0);
        }
      }
      
      if (languages !== undefined) {
        if (Array.isArray(languages) && languages.length > 0) {
          updates.push(`languages = $${paramCount++}`);
          values.push(languages);
        } else if (languages === null || (Array.isArray(languages) && languages.length === 0)) {
          updates.push(`languages = $${paramCount++}`);
          values.push([]);
        }
      }
      
      if (education !== undefined) {
        if (Array.isArray(education) && education.length > 0) {
          updates.push(`education = $${paramCount++}`);
          values.push(education);
        }
      }
      
      if (certifications !== undefined) {
        if (Array.isArray(certifications) && certifications.length > 0) {
          updates.push(`certifications = $${paramCount++}`);
          values.push(certifications);
        }
      }
      
      if (availability !== undefined) {
        const availJson = Array.isArray(availability) ? JSON.stringify(availability) : availability;
        if (availJson) {
          updates.push(`availability = $${paramCount++}::jsonb`);
          values.push(availJson);
        }
      }
      
      if (introduction !== undefined && introduction !== null) {
        const introStr = String(introduction).trim();
        if (introStr !== '') {
          updates.push(`introduction = $${paramCount++}`);
          values.push(introStr);
        }
      }
      
      if (teaching_style !== undefined && teaching_style !== null) {
        const styleStr = String(teaching_style).trim();
        if (styleStr !== '') {
          updates.push(`teaching_style = $${paramCount++}`);
          values.push(styleStr);
        }
      }
      
      if (video_intro_url !== undefined && video_intro_url !== null && video_intro_url !== '') {
        updates.push(`video_intro_url = $${paramCount++}`);
        values.push(video_intro_url);
      }

      // If no fields to update, just return success
      if (updates.length === 0) {
        return res.json({
          success: true,
          message: 'No changes to update',
          data: { profile: existing.rows[0] }
        });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(req.user.userId);

      const result = await query(
        `UPDATE tutor_profiles SET ${updates.join(', ')} WHERE user_id = $${paramCount}
         RETURNING *`,
        values
      );

      res.json({
        success: true,
        message: 'Tutor profile updated successfully',
        data: { profile: result.rows[0] }
      });
    } else {
      // Create new profile
      const result = await query(
        `INSERT INTO tutor_profiles (
          user_id, subjects, experience_years, hourly_rate, languages,
          education, certifications, availability, introduction, teaching_style, video_intro_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)
        RETURNING *`,
        [
          req.user.userId,
          subjects || [],
          experience_years || 0,
          hourly_rate || 0,
          languages || [],
          education || [],
          certifications || [],
          JSON.stringify(availability || []),
          introduction || null,
          teaching_style || null,
          video_intro_url || null
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Tutor profile created successfully',
        data: { profile: result.rows[0] }
      });
    }
  } catch (error) {
    next(error);
  }
};

// Update tutor availability
export const updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;

    if (availability === undefined || availability === null) {
      throw new AppError('Availability data is required', 400);
    }

    // Validate it's a proper array
    if (!Array.isArray(availability)) {
      throw new AppError('Availability must be an array', 400);
    }

    const result = await query(
      `UPDATE tutor_profiles 
       SET availability = $1::jsonb, updated_at = CURRENT_TIMESTAMP, is_available = true
       WHERE user_id = $2
       RETURNING *`,
      [JSON.stringify(availability), req.user.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Tutor profile not found', 404);
    }

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: { profile: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Toggle tutor availability status
export const toggleAvailability = async (req, res, next) => {
  try {
    const { isAvailable } = req.body;

    const result = await query(
      `UPDATE tutor_profiles 
       SET is_available = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING *`,
      [isAvailable !== false, req.user.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Tutor profile not found', 404);
    }

    res.json({
      success: true,
      message: 'Availability status updated',
      data: { profile: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Get tutor statistics
export const getTutorStats = async (req, res, next) => {
  try {
    const tutorId = req.params.id || req.user.userId;

    const stats = await query(
      `SELECT 
        tp.total_sessions,
        tp.total_hours,
        tp.response_rate,
        tp.response_time,
        u.rating,
        u.total_reviews,
        COUNT(DISTINCT b.booking_id) as total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.booking_id END) as completed_sessions,
        COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.booking_id END) as cancelled_sessions
      FROM tutor_profiles tp
      JOIN users u ON tp.user_id = u.user_id
      LEFT JOIN bookings b ON tp.user_id = b.tutor_id
      WHERE tp.user_id = $1
      GROUP BY tp.profile_id, u.user_id`,
      [tutorId]
    );

    res.json({
      success: true,
      data: { stats: stats.rows[0] || {} }
    });
  } catch (error) {
    next(error);
  }
};
