import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getAllBookings,
  getRevenueReport,
  verifyTutor,
  suspendUser,
  getPlatformAnalytics,
  exportData
} from '../controllers/adminController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics', getPlatformAnalytics);

// User management
router.get('/users', getAllUsers);
router.patch('/users/:userId/verify', verifyTutor);
router.patch('/users/:userId/suspend', suspendUser);

// Booking management
router.get('/bookings', getAllBookings);

// Reports
router.get('/reports/revenue', getRevenueReport);
router.get('/export', exportData);

export default router;
