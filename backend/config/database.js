const { Pool } = require('pg');
require('dotenv').config();

// Support Supabase connection string or individual parameters
let poolConfig;

if (process.env.DATABASE_URL) {
  // Use Supabase connection string (preferred for Supabase)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  };
} else {
  // Use individual parameters (for local PostgreSQL or custom setup)
  poolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'delaypilot',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  // Don't exit process, let it try to reconnect
});

// Helper function to execute queries with retry logic
const queryWithRetry = async (text, params, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      // If it's a connection error and we have retries left, wait and retry
      if ((error.code === '08006' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') && i < retries - 1) {
        console.warn(`⚠️ Connection error, retrying... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
};

// Initialize database tables
const initDatabase = async () => {
  try {
    // Create users table if it doesn't exist
    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add name column if it doesn't exist (for existing databases)
    try {
      const nameColumnCheck = await queryWithRetry(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='name'
      `);
      
      if (nameColumnCheck.rows.length === 0) {
        await queryWithRetry(`ALTER TABLE users ADD COLUMN name VARCHAR(255)`);
        console.log('✅ Added name column to users table');
      }
    } catch (error) {
      if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
        console.warn('Warning: Could not add name column:', error.message);
      }
    }

    // Add status column if it doesn't exist (for existing databases)
    try {
      const statusColumnCheck = await queryWithRetry(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='status'
      `);
      
      if (statusColumnCheck.rows.length === 0) {
        await queryWithRetry(`ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'`);
        // Update existing users to have active status
        await queryWithRetry(`UPDATE users SET status = 'active' WHERE status IS NULL`);
        console.log('✅ Added status column to users table');
      }
    } catch (error) {
      if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
        console.warn('Warning: Could not add status column:', error.message);
      }
    }

    // Create index on username for faster lookups
    await queryWithRetry(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `);

    console.log('✅ Database tables initialized successfully');
    
    const bcrypt = require('bcrypt');
    
    // Default users to create
    const defaultUsers = [
      { username: 'admin', password: 'admin123', role: 'Admin', email: 'admin@delaypilot.com' },
      { username: 'apoc', password: 'apoc123', role: 'APOC', email: 'apoc@delaypilot.com' },
      { username: 'atc', password: 'atc123', role: 'ATC', email: 'atc@delaypilot.com' },
      { username: 'aoc', password: 'aoc123', role: 'AOC', email: 'aoc@delaypilot.com' }
    ];
    
    // Check and create default users if they don't exist
    for (const user of defaultUsers) {
      const userCheck = await queryWithRetry('SELECT * FROM users WHERE username = $1', [user.username]);
      if (userCheck.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await queryWithRetry(
          'INSERT INTO users (username, password, role, email, status) VALUES ($1, $2, $3, $4, $5)',
          [user.username, hashedPassword, user.role, user.email, 'active']
        );
        console.log(`✅ Default ${user.role} user created (username: ${user.username}, password: ${user.password})`);
      }
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Export a query function with retry logic
const query = async (text, params) => {
  return queryWithRetry(text, params);
};

module.exports = {
  pool,
  initDatabase,
  query
};

