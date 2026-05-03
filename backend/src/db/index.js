// Unified database interface using sql.js (pure JavaScript SQLite)
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../tutorxpert.db');

let db;
let SQL;

export const connectSQLite = async () => {
  try {
    SQL = await initSqlJs();
    
    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
    
    console.log('✅ SQLite connected');
    return db;
  } catch (error) {
    console.error('❌ SQLite connection failed:', error);
    throw error;
  }
};

// Save database to file
const saveDatabase = () => {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (error) {
    console.error('Error saving database:', error);
  }
};

// Unified query function that works like PostgreSQL client
export const query = (sql, params = []) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    // Convert PostgreSQL $1, $2 syntax to ? for SQLite
    let sqliteQuery = sql;
    let paramIndex = 1;
    while (sqliteQuery.includes(`$${paramIndex}`)) {
      sqliteQuery = sqliteQuery.replace(`$${paramIndex}`, '?');
      paramIndex++;
    }

    if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
      const stmt = db.prepare(sqliteQuery);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return { rows };
    } else {
      db.run(sqliteQuery, params);
      saveDatabase();
      return { rows: [{ id: 1, changes: 1 }] };
    }
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

export const initializeDatabase = () => {
  try {
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('learner', 'tutor', 'admin')),
        profile_pic TEXT,
        bio TEXT,
        skills TEXT,
        rating DECIMAL(3,2) DEFAULT 0.00,
        total_reviews INTEGER DEFAULT 0,
        is_verified BOOLEAN DEFAULT 0,
        is_suspended BOOLEAN DEFAULT 0,
        suspension_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS subjects (
        subject_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        tags TEXT,
        category TEXT,
        icon TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tutor_profiles (
        profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        subjects TEXT,
        experience_years INTEGER DEFAULT 0,
        hourly_rate DECIMAL(10,2) DEFAULT 0.00,
        currency TEXT DEFAULT 'USD',
        languages TEXT,
        education TEXT,
        certifications TEXT,
        availability TEXT,
        introduction TEXT,
        teaching_style TEXT,
        video_intro_url TEXT,
        total_sessions INTEGER DEFAULT 0,
        total_hours INTEGER DEFAULT 0,
        response_rate INTEGER DEFAULT 0,
        response_time INTEGER DEFAULT 0,
        is_available BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS learner_profiles (
        learner_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        learning_goals TEXT,
        preferred_subjects TEXT,
        learning_style TEXT,
        timezone TEXT,
        grade_level TEXT,
        school_organization TEXT,
        parent_email TEXT,
        total_sessions INTEGER DEFAULT 0,
        total_hours INTEGER DEFAULT 0,
        learning_streak INTEGER DEFAULT 0,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS matches (
        match_id INTEGER PRIMARY KEY AUTOINCREMENT,
        learner_id INTEGER NOT NULL,
        tutor_id INTEGER NOT NULL,
        score DECIMAL(5,4) DEFAULT 0.0000,
        match_reasons TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'expired')),
        viewed_by_learner BOOLEAN DEFAULT 0,
        viewed_by_tutor BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        FOREIGN KEY(learner_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY(tutor_id) REFERENCES users(user_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS bookings (
        booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
        learner_id INTEGER NOT NULL,
        tutor_id INTEGER NOT NULL,
        subject_id INTEGER,
        scheduled_at DATETIME NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'expired')),
        total_amount DECIMAL(10,2),
        currency TEXT DEFAULT 'USD',
        payment_status TEXT DEFAULT 'pending',
        notes TEXT,
        cancellation_reason TEXT,
        rescheduled_from INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(learner_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY(tutor_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY(subject_id) REFERENCES subjects(subject_id)
      );

      CREATE TABLE IF NOT EXISTS sessions (
        session_id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        video_room_id TEXT,
        start_time DATETIME,
        end_time DATETIME,
        notes TEXT,
        tools_data TEXT,
        recording_url TEXT,
        attendance TEXT,
        rating_given BOOLEAN DEFAULT 0,
        session_summary TEXT,
        duration_actual INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS progress_records (
        record_id INTEGER PRIMARY KEY AUTOINCREMENT,
        learner_id INTEGER NOT NULL,
        subject_id INTEGER,
        tutor_id INTEGER,
        skill_name TEXT,
        performance_score DECIMAL(5,2),
        mastery_level TEXT,
        topics_covered TEXT,
        strengths TEXT,
        areas_for_improvement TEXT,
        recommendations TEXT,
        session_count INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(learner_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY(subject_id) REFERENCES subjects(subject_id),
        FOREIGN KEY(tutor_id) REFERENCES users(user_id)
      );

      CREATE TABLE IF NOT EXISTS reviews (
        review_id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        reviewer_id INTEGER NOT NULL,
        reviewee_id INTEGER NOT NULL,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        tags TEXT,
        is_public BOOLEAN DEFAULT 1,
        response TEXT,
        response_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(booking_id) REFERENCES bookings(booking_id),
        FOREIGN KEY(reviewer_id) REFERENCES users(user_id),
        FOREIGN KEY(reviewee_id) REFERENCES users(user_id)
      );

      CREATE TABLE IF NOT EXISTS community_posts (
        post_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject_id INTEGER,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT,
        post_type TEXT DEFAULT 'question' CHECK(post_type IN ('question', 'answer', 'resource', 'discussion')),
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        is_answered BOOLEAN DEFAULT 0,
        accepted_answer_id INTEGER,
        parent_post_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY(subject_id) REFERENCES subjects(subject_id),
        FOREIGN KEY(parent_post_id) REFERENCES community_posts(post_id)
      );

      CREATE TABLE IF NOT EXISTS post_votes (
        vote_id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        vote_type TEXT CHECK(vote_type IN ('upvote', 'downvote')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id),
        FOREIGN KEY(post_id) REFERENCES community_posts(post_id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notifications (
        notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        is_read BOOLEAN DEFAULT 0,
        is_pushed BOOLEAN DEFAULT 0,
        is_emailed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS learning_paths (
        path_id INTEGER PRIMARY KEY AUTOINCREMENT,
        learner_id INTEGER NOT NULL,
        subject_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        milestones TEXT,
        current_milestone INTEGER DEFAULT 0,
        progress_percentage DECIMAL(5,2) DEFAULT 0.00,
        estimated_hours INTEGER,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(learner_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY(subject_id) REFERENCES subjects(subject_id)
      );

      CREATE TABLE IF NOT EXISTS badges (
        badge_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        icon_url TEXT,
        criteria TEXT,
        badge_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_badges (
        user_badge_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        badge_id INTEGER NOT NULL,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        context TEXT,
        FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY(badge_id) REFERENCES badges(badge_id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        message_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        booking_id INTEGER,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        read_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(sender_id) REFERENCES users(user_id),
        FOREIGN KEY(receiver_id) REFERENCES users(user_id),
        FOREIGN KEY(booking_id) REFERENCES bookings(booking_id)
      );
    `;

    const statements = schema.split(';').filter(s => s.trim());
    statements.forEach(statement => {
      try {
        db.run(statement);
      } catch (error) {
        // Table already exists
      }
    });

    saveDatabase();
    console.log('✅ SQLite database schema initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
};

export default db;
