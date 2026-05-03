import pool from './postgresql.js';

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration...');
    await client.query('BEGIN');

    // Add unique constraint to matches table
    try {
      await client.query(`
        ALTER TABLE matches 
        ADD CONSTRAINT unique_learner_tutor_match UNIQUE (learner_id, tutor_id)
      `);
      console.log('✅ Added unique constraint to matches');
    } catch (e) {
      console.log('ℹ️  matches constraint:', e.message.includes('already exists') ? 'already exists' : e.message);
    }

    // Add offers_trial column to tutor_profiles
    try {
      await client.query(`
        ALTER TABLE tutor_profiles 
        ADD COLUMN offers_trial BOOLEAN DEFAULT false,
        ADD COLUMN trial_duration INTEGER DEFAULT 30,
        ADD COLUMN stripe_account_id VARCHAR(255)
      `);
      console.log('✅ Added columns to tutor_profiles');
    } catch (e) {
      console.log('ℹ️  tutor_profiles columns:', e.message);
    }

    // Add is_trial column to bookings  
    try {
      await client.query(`
        ALTER TABLE bookings 
        ADD COLUMN is_trial BOOLEAN DEFAULT false
      `);
      console.log('✅ Added is_trial to bookings');
    } catch (e) {
      console.log('ℹ️  bookings columns:', e.message);
    }

    // Add new columns to sessions
    try {
      await client.query(`
        ALTER TABLE sessions 
        ADD COLUMN duration_actual INTEGER,
        ADD COLUMN session_summary TEXT,
        ADD COLUMN ai_summary TEXT,
        ADD COLUMN is_recording BOOLEAN DEFAULT false
      `);
      console.log('✅ Added columns to sessions');
    } catch (e) {
      console.log('ℹ️  sessions columns:', e.message);
    }

    // Add missing columns to users
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN is_suspended BOOLEAN DEFAULT false,
        ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email',
        ADD COLUMN google_id VARCHAR(255),
        ADD COLUMN facebook_id VARCHAR(255),
        ADD COLUMN timezone VARCHAR(100),
        ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en',
        ADD COLUMN preferred_currency VARCHAR(10) DEFAULT 'USD'
      `);
      console.log('✅ Added columns to users');
    } catch (e) {
      console.log('ℹ️  users columns:', e.message);
    }

    await client.query('COMMIT');
    console.log('✅ Migration complete!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', e.message);
    throw e;
  } finally {
    client.release();
  }
}

migrate().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(e => {
  console.error('Failed:', e);
  process.exit(1);
});
