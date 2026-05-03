import pool from './postgresql.js';

async function fixSchema() {
  const client = await pool.connect();
  try {
    await client.query('ALTER TABLE users ALTER COLUMN profile_pic TYPE TEXT;');
    console.log('✅ profile_pic column changed to TEXT');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

fixSchema();
