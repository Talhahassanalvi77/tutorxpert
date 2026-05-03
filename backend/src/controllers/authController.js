import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { AppError } from '../middleware/errorHandler.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Google OAuth Login/Register
export const googleAuth = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError('Google token is required', 400);
    }

    // Verify Google token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
    } catch (verifyError) {
      throw new AppError('Invalid Google token', 401);
    }

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Check if user exists
    let result = await query(
      `SELECT user_id, email, name, role, password_hash, profile_pic, bio, skills, rating, is_verified
       FROM users WHERE email = $1`,
      [email]
    );

    let user;
    if (result.rows.length === 0) {
      // Create new user (default to learner)
      const insertResult = await query(
        `INSERT INTO users (email, name, profile_pic, role, auth_provider, google_id)
         VALUES ($1, $2, $3, 'learner', 'google', $4)
         RETURNING user_id, email, name, role, profile_pic, bio, skills, rating, is_verified`,
        [email, name, picture, googleId]
      );
      user = insertResult.rows[0];

      // Create learner profile
      await query(
        `INSERT INTO learner_profiles (user_id, learning_streak)
         VALUES ($1, $2)`,
        [user.user_id, 0]
      );
    } else {
      // Keep existing user data - do NOT update anything on login
      user = result.rows[0];
    }

    // Generate token
    const jwtToken = generateToken(user.user_id);

    res.json({
      success: true,
      message: 'Google login successful',
      data: {
        user: {
          userId: user.user_id,
          email: user.email,
          name: user.name,
          role: user.role,
          profilePic: user.profile_pic,
          bio: user.bio,
          skills: user.skills,
          rating: user.rating,
          isVerified: user.is_verified
        },
        token: jwtToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// Register new user
export const register = async (req, res, next) => {
  try {
    const { email, password, name, role, bio, skills } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      throw new AppError('Please provide all required fields', 400);
    }

    // Validate role
    if (!['learner', 'tutor', 'admin'].includes(role)) {
      throw new AppError('Invalid role. Must be learner, tutor, or admin', 400);
    }

    // Check if user already exists
    const existingUser = await query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, name, role, bio, skills)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, email, name, role, profile_pic, bio, skills, rating, is_verified, created_at`,
      [email, passwordHash, name, role, bio || null, skills || []]
    );

    const user = result.rows[0];

    // Create tutor or learner profile based on role
    if (role === 'tutor') {
      await query(
        `INSERT INTO tutor_profiles (user_id, hourly_rate, is_available)
         VALUES ($1, $2, $3)`,
        [user.user_id, 0, true]
      );
    } else if (role === 'learner') {
      await query(
        `INSERT INTO learner_profiles (user_id, learning_streak)
         VALUES ($1, $2)`,
        [user.user_id, 0]
      );
    }

    // Generate token
    const token = generateToken(user.user_id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          userId: user.user_id,
          email: user.email,
          name: user.name,
          role: user.role,
          profilePic: user.profile_pic,
          bio: user.bio,
          skills: user.skills,
          rating: user.rating,
          isVerified: user.is_verified,
          createdAt: user.created_at
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    // Find user
    const result = await query(
      `SELECT user_id, email, name, role, password_hash, profile_pic, bio, skills, rating, is_verified
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = result.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken(user.user_id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          userId: user.user_id,
          email: user.email,
          name: user.name,
          role: user.role,
          profilePic: user.profile_pic,
          bio: user.bio,
          skills: user.skills,
          rating: user.rating,
          isVerified: user.is_verified
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
export const getMe = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT user_id, email, name, role, profile_pic, bio, skills, rating, total_reviews, is_verified, created_at
       FROM users WHERE user_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = result.rows[0];

    // Get role-specific profile
    let profile = null;
    if (user.role === 'tutor') {
      const tutorResult = await query(
        `SELECT * FROM tutor_profiles WHERE user_id = $1`,
        [user.user_id]
      );
      profile = tutorResult.rows[0];
    } else if (user.role === 'learner') {
      const learnerResult = await query(
        `SELECT * FROM learner_profiles WHERE user_id = $1`,
        [user.user_id]
      );
      profile = learnerResult.rows[0];
    }

    // Convert to camelCase for frontend
    const userFormatted = {
      userId: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePic: user.profile_pic,
      bio: user.bio,
      skills: user.skills,
      rating: user.rating,
      totalReviews: user.total_reviews,
      isVerified: user.is_verified,
      createdAt: user.created_at
    };

    res.json({
      success: true,
      data: {
        user: userFormatted,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, skills, profilePic } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    // Only update name if explicitly provided AND not empty
    if (name && name.trim && name.trim() !== '') {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    // Only update bio if explicitly provided (even empty string allowed to clear)
    if (bio !== undefined && bio !== null) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
    }
    // Only update skills if explicitly provided AND is an array with values
    if (skills && Array.isArray(skills) && skills.length > 0) {
      updates.push(`skills = $${paramCount++}`);
      values.push(skills);
    }
    // Only update profilePic if explicitly provided AND not empty/null
    if (profilePic && profilePic.trim && profilePic.trim() !== '') {
      updates.push(`profile_pic = $${paramCount++}`);
      values.push(profilePic);
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.user.userId);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${paramCount}
       RETURNING user_id, email, name, role, profile_pic, bio, skills, rating, is_verified`,
      values
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          userId: result.rows[0].user_id,
          email: result.rows[0].email,
          name: result.rows[0].name,
          role: result.rows[0].role,
          profilePic: result.rows[0].profile_pic,
          bio: result.rows[0].bio,
          skills: result.rows[0].skills,
          rating: result.rows[0].rating,
          isVerified: result.rows[0].is_verified
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Change password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Please provide current and new password', 400);
    }

    // Get current user
    const result = await query(
      `SELECT password_hash FROM users WHERE user_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = result.rows[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
      [newPasswordHash, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refreshToken = async (req, res, next) => {
  try {
    const token = generateToken(req.user.userId);

    res.json({
      success: true,
      data: { token }
    });
  } catch (error) {
    next(error);
  }
};
