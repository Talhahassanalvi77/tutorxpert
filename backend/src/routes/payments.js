import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getTutorEarnings,
  requestPayout,
  getPaymentHistory,
  createStripeConnectAccount,
} from '../controllers/paymentController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All payment routes require authentication
router.use(authenticateToken);

// Payment processing
router.post('/create-intent', createPaymentIntent);
router.post('/:bookingId/confirm', confirmPayment);

// Tutor earnings and payouts
router.get('/earnings', authorizeRoles('tutor'), getTutorEarnings);
router.post('/payout', authorizeRoles('tutor'), requestPayout);
router.post('/connect-account', authorizeRoles('tutor'), createStripeConnectAccount);

// Payment history
router.get('/history', getPaymentHistory);

export default router;
