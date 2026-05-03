import pool from './postgresql.js';
import createTables from './schema.js';

export async function runMigrations() {
  try {
    console.log('Running database migrations...');
    await createTables();
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

export async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Seed subjects
    const subjects = [
      { name: 'Mathematics', description: 'Algebra, Calculus, Geometry, Statistics', tags: ['math', 'science'], category: 'Academic', icon: 'calculator' },
      { name: 'English', description: 'Literature, Writing, Grammar, ESL', tags: ['language', 'writing'], category: 'Language', icon: 'book' },
      { name: 'Science', description: 'Physics, Chemistry, Biology', tags: ['science', 'stem'], category: 'Academic', icon: 'flask' },
      { name: 'Programming', description: 'Web Development, Python, Java, JavaScript', tags: ['coding', 'tech'], category: 'Technology', icon: 'code' },
      { name: 'Spanish', description: 'Spanish Language Learning', tags: ['language', 'spanish'], category: 'Language', icon: 'globe' },
      { name: 'French', description: 'French Language Learning', tags: ['language', 'french'], category: 'Language', icon: 'globe' },
      { name: 'History', description: 'World History, US History, European History', tags: ['history', 'social studies'], category: 'Academic', icon: 'landmark' },
      { name: 'Economics', description: 'Microeconomics, Macroeconomics, Business', tags: ['business', 'economics'], category: 'Business', icon: 'chart' },
      { name: 'Test Prep', description: 'SAT, ACT, GRE, GMAT Preparation', tags: ['test', 'exam'], category: 'Test Prep', icon: 'pencil' },
      { name: 'Music', description: 'Guitar, Piano, Music Theory', tags: ['music', 'arts'], category: 'Arts', icon: 'music' },
      { name: 'Art & Design', description: 'Drawing, Painting, Graphic Design', tags: ['art', 'design'], category: 'Arts', icon: 'palette' },
      { name: 'Business', description: 'Management, Marketing, Entrepreneurship', tags: ['business', 'career'], category: 'Business', icon: 'briefcase' }
    ];

    for (const subject of subjects) {
      await client.query(
        `INSERT INTO subjects (name, description, tags, category, icon)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) DO NOTHING`,
        [subject.name, subject.description, subject.tags, subject.category, subject.icon]
      );
    }

    // Seed admin user
    const bcrypt = await import('bcryptjs');
    const bcryptjs = bcrypt.default;
    const adminPassword = await bcryptjs.hash('admin123', 12);
    
    await client.query(
      `INSERT INTO users (email, password_hash, name, role, is_verified)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@tutorxpert.com', adminPassword, 'Admin User', 'admin', true]
    );

    // Seed sample tutors
    const tutorData = [
      { email: 'sarah.johnson@tutorxpert.com', name: 'Sarah Johnson', role: 'tutor', subjects: ['Mathematics', 'Science'], experience: 5, rate: 45 },
      { email: 'mike.chen@tutorxpert.com', name: 'Mike Chen', role: 'tutor', subjects: ['Programming', 'Mathematics'], experience: 8, rate: 60 },
      { email: 'emma.wilson@tutorxpert.com', name: 'Emma Wilson', role: 'tutor', subjects: ['English', 'History'], experience: 4, rate: 40 },
      { email: 'david.garcia@tutorxpert.com', name: 'David Garcia', role: 'tutor', subjects: ['Spanish', 'English'], experience: 6, rate: 35 },
      { email: 'lisa.taylor@tutorxpert.com', name: 'Lisa Taylor', role: 'tutor', subjects: ['Music', 'Art & Design'], experience: 10, rate: 50 }
    ];

    for (const tutor of tutorData) {
      const password = await bcryptjs.hash('tutor123', 12);
      
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, name, role, bio, is_verified)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (email) DO NOTHING
         RETURNING user_id`,
        [tutor.email, password, tutor.name, tutor.role, `Experienced ${tutor.subjects[0]} tutor with ${tutor.experience} years of teaching experience.`]
      );

      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].user_id;
        
        // Get subject IDs
        const subjectResult = await client.query(
          `SELECT subject_id FROM subjects WHERE name = ANY($1)`,
          [tutor.subjects]
        );
        const subjectIds = subjectResult.rows.map(r => r.subject_id);

        await client.query(
          `INSERT INTO tutor_profiles (user_id, subjects, experience_years, hourly_rate, languages, availability, introduction, is_available)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, true)`,
          [
            userId,
            subjectIds,
            tutor.experience,
            tutor.rate,
            ['English'],
            JSON.stringify([
              { day: 'Monday', slots: ['9:00-12:00', '14:00-18:00'] },
              { day: 'Wednesday', slots: ['9:00-12:00', '14:00-18:00'] },
              { day: 'Friday', slots: ['9:00-12:00'] }
            ]),
            `Hello! I'm ${tutor.name}, a passionate educator specializing in ${tutor.subjects.join(' and ')}. I believe in making learning engaging and accessible for all students.`
          ]
        );
      }
    }

    // Seed sample learner
    const learnerPassword = await bcryptjs.hash('learner123', 12);
    
    const learnerResult = await client.query(
      `INSERT INTO users (email, password_hash, name, role, is_verified)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (email) DO NOTHING
       RETURNING user_id`,
      ['student@example.com', learnerPassword, 'Alex Student', 'learner']
    );

    if (learnerResult.rows.length > 0) {
      const learnerId = learnerResult.rows[0].user_id;
      
      const subjectResult = await client.query(
        `SELECT subject_id FROM subjects WHERE name IN ('Mathematics', 'Programming')`
      );
      const subjectIds = subjectResult.rows.map(r => r.subject_id);

      await client.query(
        `INSERT INTO learner_profiles (user_id, preferred_subjects, learning_goals, timezone)
         VALUES ($1, $2, $3, $4)`,
        [learnerId, subjectIds, ['Improve math skills', 'Learn web development'], 'America/New_York']
      );
    }

    // Seed badges
    const badges = [
      { name: 'First Session', description: 'Complete your first tutoring session', icon_url: '/badges/first-session.png', badge_type: 'milestone' },
      { name: 'Super Tutor', description: 'Complete 100 sessions with 4.8+ rating', icon_url: '/badges/super-tutor.png', badge_type: 'achievement' },
      { name: 'Quick Responder', description: 'Maintain 95%+ response rate for 30 days', icon_url: '/badges/quick-responder.png', badge_type: 'performance' },
      { name: 'Subject Expert', description: 'Teach 50+ sessions in one subject', icon_url: '/badges/subject-expert.png', badge_type: 'specialization' },
      { name: 'Rising Star', description: 'Receive 10 five-star reviews', icon_url: '/badges/rising-star.png', badge_type: 'achievement' },
      { name: 'Dedicated Learner', description: 'Complete 20 learning sessions', icon_url: '/badges/dedicated-learner.png', badge_type: 'milestone' },
      { name: 'Streak Master', description: 'Maintain a 30-day learning streak', icon_url: '/badges/streak-master.png', badge_type: 'consistency' },
      { name: 'Community Helper', description: 'Post 50 helpful answers in community', icon_url: '/badges/community-helper.png', badge_type: 'community' }
    ];

    for (const badge of badges) {
      try {
        await client.query(
          `INSERT INTO badges (name, description, icon_url, badge_type)
           VALUES ($1, $2, $3, $4)`,
          [badge.name, badge.description, badge.icon_url, badge.badge_type]
        );
      } catch (e) {
        // Skip if already exists
      }
    }

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (process.argv[2] === 'migrate') {
  runMigrations().then(() => process.exit(0)).catch(() => process.exit(1));
} else if (process.argv[2] === 'seed') {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
