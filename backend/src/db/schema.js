import pool from './postgresql.js';

export async function createTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('learner', 'tutor', 'admin')),
        profile_pic VARCHAR(500),
        bio TEXT,
        skills TEXT[],
        rating DECIMAL(3,2) DEFAULT 0.00,
        total_reviews INTEGER DEFAULT 0,
        is_verified BOOLEAN DEFAULT false,
        is_suspended BOOLEAN DEFAULT false,
        auth_provider VARCHAR(50) DEFAULT 'email',
        google_id VARCHAR(255),
        facebook_id VARCHAR(255),
        timezone VARCHAR(100),
        preferred_language VARCHAR(10) DEFAULT 'en',
        preferred_currency VARCHAR(10) DEFAULT 'USD',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Subjects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        tags TEXT[],
        category VARCHAR(100),
        icon VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tutor profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tutor_profiles (
        profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        subjects UUID[],
        experience_years INTEGER DEFAULT 0,
        hourly_rate DECIMAL(10,2) DEFAULT 0.00,
        currency VARCHAR(10) DEFAULT 'USD',
        languages TEXT[],
        education TEXT[],
        certifications TEXT[],
        availability JSONB DEFAULT '[]',
        introduction TEXT,
        teaching_style TEXT,
        video_intro_url VARCHAR(500),
        total_sessions INTEGER DEFAULT 0,
        total_hours INTEGER DEFAULT 0,
        response_rate INTEGER DEFAULT 0,
        response_time INTEGER DEFAULT 0,
        is_available BOOLEAN DEFAULT true,
        offers_trial BOOLEAN DEFAULT false,
        trial_duration INTEGER DEFAULT 30,
        stripe_account_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Learner profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS learner_profiles (
        learner_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        learning_goals TEXT[],
        preferred_subjects UUID[],
        learning_style VARCHAR(50),
        timezone VARCHAR(100),
        grade_level VARCHAR(50),
        school_organization VARCHAR(255),
        parent_email VARCHAR(255),
        total_sessions INTEGER DEFAULT 0,
        total_hours INTEGER DEFAULT 0,
        learning_streak INTEGER DEFAULT 0,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Matches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        learner_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        tutor_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        score DECIMAL(5,4) DEFAULT 0.0000,
        match_reasons TEXT[],
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
        viewed_by_learner BOOLEAN DEFAULT false,
        viewed_by_tutor BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      )
    `);

    // Bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        learner_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        tutor_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        subject_id UUID REFERENCES subjects(subject_id),
        scheduled_at TIMESTAMP NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
        total_amount DECIMAL(10,2),
        currency VARCHAR(10) DEFAULT 'USD',
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        stripe_payment_intent_id VARCHAR(255),
        notes TEXT,
        is_trial BOOLEAN DEFAULT false,
        cancellation_reason TEXT,
        rescheduled_from UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES bookings(booking_id),
        video_room_id VARCHAR(255),
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        duration_actual INTEGER,
        notes TEXT,
        session_summary TEXT,
        ai_summary TEXT,
        is_recording BOOLEAN DEFAULT false,
        recording_url VARCHAR(500),
        attendance JSONB,
        rating_given BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Progress records table
    await client.query(`
      CREATE TABLE IF NOT EXISTS progress_records (
        record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        learner_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        subject_id UUID REFERENCES subjects(subject_id),
        tutor_id UUID REFERENCES users(user_id),
        skill_name VARCHAR(255),
        performance_score DECIMAL(5,2),
        mastery_level VARCHAR(50),
        topics_covered TEXT[],
        strengths TEXT[],
        areas_for_improvement TEXT[],
        recommendations TEXT[],
        session_count INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES bookings(booking_id),
        reviewer_id UUID REFERENCES users(user_id),
        reviewee_id UUID REFERENCES users(user_id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        tags TEXT[],
        is_public BOOLEAN DEFAULT true,
        response TEXT,
        response_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Community posts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS community_posts (
        post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        subject_id UUID REFERENCES subjects(subject_id),
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        tags TEXT[],
        post_type VARCHAR(50) DEFAULT 'question' CHECK (post_type IN ('question', 'answer', 'resource', 'discussion')),
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        is_answered BOOLEAN DEFAULT false,
        accepted_answer_id UUID,
        parent_post_id UUID REFERENCES community_posts(post_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        is_read BOOLEAN DEFAULT false,
        is_pushed BOOLEAN DEFAULT false,
        is_emailed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Learning paths table
    await client.query(`
      CREATE TABLE IF NOT EXISTS learning_paths (
        path_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        learner_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        subject_id UUID REFERENCES subjects(subject_id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        milestones JSONB,
        current_milestone INTEGER DEFAULT 0,
        progress_percentage DECIMAL(5,2) DEFAULT 0.00,
        estimated_hours INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Badges/Achievements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS badges (
        badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon_url VARCHAR(500),
        criteria JSONB,
        badge_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User badges table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        user_badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        badge_id UUID REFERENCES badges(badge_id),
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        context JSONB
      )
    `);

    // Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID REFERENCES users(user_id),
        receiver_id UUID REFERENCES users(user_id),
        booking_id UUID REFERENCES bookings(booking_id),
        content TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'text',
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Post votes table for community upvoting
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_votes (
        vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID REFERENCES community_posts(post_id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        vote_type VARCHAR(10) CHECK (vote_type IN ('upvote', 'downvote')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      )
    `);

    // Favorites table
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        favorite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        learner_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        tutor_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(learner_id, tutor_id)
      )
    `);

    // Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        booking_id UUID REFERENCES bookings(booking_id),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        type VARCHAR(50) CHECK (type IN ('payment', 'payout', 'refund', 'fee')),
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        stripe_payment_intent_id VARCHAR(255),
        stripe_transfer_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payouts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payouts (
        payout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tutor_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        booking_id UUID REFERENCES bookings(booking_id),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        method VARCHAR(50) DEFAULT 'stripe',
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        stripe_payout_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Device registrations for push notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS device_registrations (
        registration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        player_id VARCHAR(255) NOT NULL,
        device_type VARCHAR(50) DEFAULT 'web',
        device_token VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, device_type)
      )
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_tutor_profiles_user_id ON tutor_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_tutor_profiles_available ON tutor_profiles(is_available);
      CREATE INDEX IF NOT EXISTS idx_learner_profiles_user_id ON learner_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_matches_learner_id ON matches(learner_id);
      CREATE INDEX IF NOT EXISTS idx_matches_tutor_id ON matches(tutor_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_learner_id ON bookings(learner_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_tutor_id ON bookings(tutor_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
      CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_booking_id ON sessions(booking_id);
      CREATE INDEX IF NOT EXISTS idx_progress_learner_id ON progress_records(learner_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
      CREATE INDEX IF NOT EXISTS idx_community_posts_subject_id ON community_posts(subject_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
      CREATE INDEX IF NOT EXISTS idx_post_votes_post_id ON post_votes(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_votes_user_id ON post_votes(user_id);
      CREATE INDEX IF NOT EXISTS idx_favorites_learner_id ON favorites(learner_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_payouts_tutor_id ON payouts(tutor_id);
      CREATE INDEX IF NOT EXISTS idx_device_registrations_user_id ON device_registrations(user_id);
    `);

    await client.query('COMMIT');
    console.log('✅ PostgreSQL tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default createTables;
