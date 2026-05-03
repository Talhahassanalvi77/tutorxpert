import jwt from 'jsonwebtoken';
import { query } from '../db/postgresql.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database to ensure they still exist and are active
    const result = await query(
      'SELECT user_id, email, name, role, is_verified FROM users WHERE user_id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      userId: result.rows[0].user_id,
      email: result.rows[0].email,
      name: result.rows[0].name,
      role: result.rows[0].role,
      isVerified: result.rows[0].is_verified
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    next(error);
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

export const authorizeResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resourceTable = req.resourceTable || 'users';
    
    const result = await query(
      `SELECT user_id FROM ${resourceTable} WHERE ${resourceTable === 'users' ? 'user_id' : 'user_id'} = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Allow if user is admin or owns the resource
    if (req.user.role === 'admin' || result.rows[0].user_id === req.user.userId) {
      next();
    } else {
      return res.status(403).json({ error: 'Forbidden: You do not own this resource' });
    }
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await query(
        'SELECT user_id, email, name, role FROM users WHERE user_id = $1',
        [decoded.userId]
      );

      if (result.rows.length > 0) {
        req.user = {
          userId: result.rows[0].user_id,
          email: result.rows[0].email,
          name: result.rows[0].name,
          role: result.rows[0].role
        };
      }
    }

    next();
  } catch (error) {
    next();
  }
};
