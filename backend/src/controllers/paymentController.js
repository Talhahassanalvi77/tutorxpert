import Stripe from 'stripe';
import { query } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Create payment intent for a booking
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      throw new AppError('Booking ID is required', 400);
    }

    // Get booking details
    const bookingResult = await query(
      `SELECT * FROM bookings WHERE booking_id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    const booking = bookingResult.rows[0];

    // Check if user is the learner
    if (booking.learner_id !== req.user.userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Check if already paid
    if (booking.payment_status === 'paid') {
      throw new AppError('Booking already paid', 400);
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.total_amount * 100), // Convert to cents
      currency: booking.currency || 'usd',
      metadata: {
        bookingId: booking.booking_id,
        learnerId: booking.learner_id,
        tutorId: booking.tutor_id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: booking.total_amount,
        currency: booking.currency || 'usd',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Confirm payment after successful transaction
export const confirmPayment = async (req, res, next) => {
  try {
    const { bookingId, paymentIntentId } = req.body;

    if (!bookingId || !paymentIntentId) {
      throw new AppError('Booking ID and Payment Intent ID are required', 400);
    }

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new AppError('Payment not successful', 400);
    }

    // Update booking payment status
    const result = await query(
      `UPDATE bookings 
       SET payment_status = 'paid', payment_method = 'stripe', 
           stripe_payment_intent_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE booking_id = $2
       RETURNING *`,
      [paymentIntentId, bookingId]
    );

    // Create transaction record
    await query(
      `INSERT INTO transactions (
        user_id, booking_id, amount, currency, type, status, 
        payment_method, stripe_payment_intent_id
      ) VALUES ($1, $2, $3, $4, 'payment', 'completed', 'stripe', $5)
      RETURNING *`,
      [
        req.user.userId,
        bookingId,
        paymentIntent.amount / 100,
        paymentIntent.currency,
        paymentIntentId,
      ]
    );

    // Update booking status to confirmed
    await query(
      `UPDATE bookings SET status = 'confirmed' WHERE booking_id = $1`,
      [bookingId]
    );

    // Create notification for tutor
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       SELECT 
         tutor_id,
         'payment_received',
         'Payment Received!',
         'A booking has been paid and confirmed.',
         json_build_object('booking_id', $1, 'amount', $2)
       FROM bookings WHERE booking_id = $1`,
      [bookingId, paymentIntent.amount / 100]
    );

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: { booking: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

// Get tutor earnings
export const getTutorEarnings = async (req, res, next) => {
  try {
    const tutorId = req.user.userId;

    // Get total earnings
    const earningsResult = await query(
      `SELECT 
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_earnings,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount * 0.8 ELSE 0 END) as net_earnings,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount * 0.2 ELSE 0 END) as platform_fees,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_sessions
       FROM bookings
       WHERE tutor_id = $1`,
      [tutorId]
    );

    // Get pending earnings (completed but not paid out)
    const pendingResult = await query(
      `SELECT 
        SUM(b.total_amount * 0.8) as pending_amount,
        COUNT(*) as pending_sessions
       FROM bookings b
       WHERE b.tutor_id = $1 
         AND b.status = 'completed'
         AND b.payment_status = 'paid'
         AND NOT EXISTS (
           SELECT 1 FROM payouts p 
           WHERE p.booking_id = b.booking_id AND p.status = 'completed'
         )`,
      [tutorId]
    );

    // Get payout history
    const payoutsResult = await query(
      `SELECT * FROM payouts 
       WHERE tutor_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [tutorId]
    );

    res.json({
      success: true,
      data: {
        totalEarnings: parseFloat(earningsResult.rows[0].total_earnings || 0),
        netEarnings: parseFloat(earningsResult.rows[0].net_earnings || 0),
        platformFees: parseFloat(earningsResult.rows[0].platform_fees || 0),
        paidSessions: parseInt(earningsResult.rows[0].paid_sessions || 0),
        pendingAmount: parseFloat(pendingResult.rows[0].pending_amount || 0),
        pendingSessions: parseInt(pendingResult.rows[0].pending_sessions || 0),
        payouts: payoutsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Request payout
export const requestPayout = async (req, res, next) => {
  try {
    const { amount, method = 'stripe' } = req.body;

    if (!amount || amount <= 0) {
      throw new AppError('Invalid amount', 400);
    }

    const tutorId = req.user.userId;

    // Check available balance
    const balanceResult = await query(
      `SELECT 
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount * 0.8 ELSE 0 END) as total_earnings,
        COALESCE((
          SELECT SUM(amount) FROM payouts 
          WHERE tutor_id = $1 AND status = 'completed'
        ), 0) as total_payouts
       FROM bookings
       WHERE tutor_id = $1`,
      [tutorId]
    );

    const availableBalance =
      parseFloat(balanceResult.rows[0].total_earnings || 0) -
      parseFloat(balanceResult.rows[0].total_payouts || 0);

    if (amount > availableBalance) {
      throw new AppError('Insufficient balance', 400);
    }

    // Check minimum payout amount
    if (amount < 20) {
      throw new AppError('Minimum payout amount is $20', 400);
    }

    // Get tutor's Stripe account
    const tutorProfile = await query(
      `SELECT stripe_account_id FROM tutor_profiles WHERE user_id = $1`,
      [tutorId]
    );

    if (!tutorProfile.rows[0].stripe_account_id) {
      throw new AppError('Please connect your Stripe account first', 400);
    }

    // Create payout via Stripe
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amount * 100),
        currency: 'usd',
        destination: tutorProfile.rows[0].stripe_account_id,
      },
      {
        stripeAccount: tutorProfile.rows[0].stripe_account_id,
      }
    );

    // Create payout record
    const result = await query(
      `INSERT INTO payouts (
        tutor_id, amount, currency, method, stripe_payout_id, status
      ) VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *`,
      [tutorId, amount, 'usd', method, payout.id]
    );

    res.json({
      success: true,
      message: 'Payout requested successfully',
      data: { payout: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

// Get payment history
export const getPaymentHistory = async (req, res, next) => {
  try {
    const { type = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.userId;

    let whereClause;
    if (type === 'earnings') {
      whereClause = 'WHERE tutor_id = $1';
    } else if (type === 'payments') {
      whereClause = 'WHERE learner_id = $1';
    } else {
      whereClause = 'WHERE tutor_id = $1 OR learner_id = $1';
    }

    const values = [userId, parseInt(limit), parseInt(offset)];

    const result = await query(
      `SELECT 
        b.booking_id,
        b.total_amount,
        b.currency,
        b.payment_status,
        b.scheduled_at,
        b.created_at,
        s.name as subject_name,
        CASE 
          WHEN b.tutor_id = $1 THEN u_learner.name
          ELSE u_tutor.name
        END as other_party_name,
        CASE 
          WHEN b.tutor_id = $1 THEN 'earned'
          ELSE 'paid'
        END as transaction_type
       FROM bookings b
       JOIN users u_learner ON b.learner_id = u_learner.user_id
       JOIN users u_tutor ON b.tutor_id = u_tutor.user_id
       JOIN subjects s ON b.subject_id = s.subject_id
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM bookings b ${whereClause}`,
      values.slice(0, -2)
    );

    res.json({
      success: true,
      data: {
        payments: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create Stripe Connect account for tutor
export const createStripeConnectAccount = async (req, res, next) => {
  try {
    const tutorId = req.user.userId;

    // Check if already has account
    const existingProfile = await query(
      `SELECT stripe_account_id FROM tutor_profiles WHERE user_id = $1`,
      [tutorId]
    );

    if (existingProfile.rows[0].stripe_account_id) {
      throw new AppError('Stripe account already connected', 400);
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      metadata: {
        tutorId: tutorId,
      },
    });

    // Update tutor profile
    await query(
      `UPDATE tutor_profiles SET stripe_account_id = $1 WHERE user_id = $2`,
      [account.id, tutorId]
    );

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/dashboard/tutor-profile?refresh=true`,
      return_url: `${process.env.FRONTEND_URL}/dashboard/tutor-profile?success=true`,
      type: 'account_onboarding',
    });

    res.json({
      success: true,
      data: {
        accountId: account.id,
        onboardingUrl: accountLink.url,
      },
    });
  } catch (error) {
    next(error);
  }
};
