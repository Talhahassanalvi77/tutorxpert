import { query } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

// Get all subjects
export const getAllSubjects = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE is_active = true';
    const values = [];
    let paramCount = 1;

    if (category) {
      whereClause += ` AND category = $${paramCount++}`;
      values.push(category);
    }

    if (search) {
      whereClause += ` AND (name ILIKE $${paramCount++} OR description ILIKE $${paramCount++})`;
      values.push(`%${search}%`, `%${search}%`);
    }

    const result = await query(
      `SELECT * FROM subjects ${whereClause}
       ORDER BY name ASC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...values, parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      data: { subjects: result.rows }
    });
  } catch (error) {
    next(error);
  }
};

// Get subject by ID
export const getSubjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM subjects WHERE subject_id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Subject not found', 404);
    }

    res.json({
      success: true,
      data: { subject: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Create subject (admin only)
export const createSubject = async (req, res, next) => {
  try {
    const { name, description, tags, category, icon } = req.body;

    if (!name) {
      throw new AppError('Subject name is required', 400);
    }

    const result = await query(
      `INSERT INTO subjects (name, description, tags, category, icon)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description || null, tags || [], category || null, icon || null]
    );

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: { subject: result.rows[0] }
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('Subject with this name already exists', 400);
    }
    next(error);
  }
};

// Update subject (admin only)
export const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, tags, category, icon, is_active } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (tags) {
      updates.push(`tags = $${paramCount++}`);
      values.push(tags);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (icon !== undefined) {
      updates.push(`icon = $${paramCount++}`);
      values.push(icon);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    values.push(id);

    const result = await query(
      `UPDATE subjects SET ${updates.join(', ')} WHERE subject_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Subject not found', 404);
    }

    res.json({
      success: true,
      message: 'Subject updated successfully',
      data: { subject: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Delete subject (admin only)
export const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM subjects WHERE subject_id = $1', [id]);

    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get popular subjects
export const getPopularSubjects = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const result = await query(
      `SELECT s.*, COUNT(tp.subjects) as tutor_count
       FROM subjects s
       LEFT JOIN tutor_profiles tp ON s.subject_id = ANY(tp.subjects)
       WHERE s.is_active = true
       GROUP BY s.subject_id
       ORDER BY tutor_count DESC
       LIMIT $1`,
      [parseInt(limit)]
    );

    res.json({
      success: true,
      data: { subjects: result.rows }
    });
  } catch (error) {
    next(error);
  }
};
