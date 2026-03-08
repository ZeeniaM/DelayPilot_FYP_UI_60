// Test script to verify Supabase connection
require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Testing Supabase Connection...\n');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not set in .env file');
  console.log('\n📝 Please add your Supabase connection string to backend/.env:');
  console.log('   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres\n');
  process.exit(1);
}

console.log('✅ DATABASE_URL found in .env');
console.log('   Connection string format: ' + (process.env.DATABASE_URL.includes('supabase') ? '✅ Supabase' : '⚠️  Not Supabase'));

// Create connection
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

const pool = new Pool(poolConfig);

// Test connection
(async () => {
  try {
    console.log('\n🔄 Attempting to connect...');
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Connection successful!');
    console.log('   Current time:', result.rows[0].current_time);
    console.log('   PostgreSQL version:', result.rows[0].pg_version.split(',')[0]);
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('\n✅ Users table exists');
      const userCount = await pool.query('SELECT COUNT(*) FROM users');
      console.log('   Total users:', userCount.rows[0].count);
    } else {
      console.log('\n⚠️  Users table does not exist yet');
      console.log('   It will be created automatically when you start the server');
    }
    
    console.log('\n🎉 Everything looks good! You can now start the server with: npm start');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('   Error:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Tip: Check your database password in the connection string');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('\n💡 Tip: Check your connection string format and network connection');
    } else if (error.message.includes('SSL')) {
      console.log('\n💡 Tip: SSL connection issue - make sure DB_SSL=true in .env');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
})();


