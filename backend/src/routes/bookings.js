import express from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  confirmBooking,
  cancelBooking,
  rescheduleBooking,
  getTutorAvailability
} from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/auth.js';
import { bookingLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/availability/:tutorId', getTutorAvailability);
router.get('/', getBookings);
router.get('/:id', getBookingById);
router.post('/', bookingLimiter, createBooking);
router.patch('/:id/confirm', confirmBooking);
router.patch('/:id/cancel', cancelBooking);
router.patch('/:id/reschedule', rescheduleBooking);

export default router;
