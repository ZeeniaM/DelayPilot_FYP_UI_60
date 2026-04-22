const { Pool } = require('pg');
require('dotenv').config();

// Support Supabase connection string or individual parameters
let poolConfig;

if (process.env.DATABASE_URL) {
  // Use Supabase connection string (preferred for Supabase)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
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
});

// Helper function to execute queries with retry logic
const queryWithRetry = async (text, params, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      if (
        (error.code === '08006' ||
          error.code === 'ENOTFOUND' ||
          error.code === 'ETIMEDOUT') &&
        i < retries - 1
      ) {
        console.warn(`⚠️ Connection error, retrying... (${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
};

// Initialize database tables
const initDatabase = async () => {
  try {
    // ─────────────────────────────────────────────────────────────
    // EXISTING TABLE: users
    // ─────────────────────────────────────────────────────────────
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
      if (
        !error.message.includes('already exists') &&
        !error.message.includes('duplicate')
      ) {
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
        await queryWithRetry(
          `ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'`
        );
        await queryWithRetry(
          `UPDATE users SET status = 'active' WHERE status IS NULL`
        );
        console.log('✅ Added status column to users table');
      }
    } catch (error) {
      if (
        !error.message.includes('already exists') &&
        !error.message.includes('duplicate')
      ) {
        console.warn('Warning: Could not add status column:', error.message);
      }
    }

    // Index on username for fast login lookups
    await queryWithRetry(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `);

    // ─────────────────────────────────────────────────────────────
    // NEW TABLE: mitigation_cases
    //
    // One row per Kanban card on the Mitigation Tracker Board.
    // A case is linked to a flight by (flight_number, sched_utc) —
    // the same composite key the pipeline uses — so no foreign key
    // into pipeline tables is needed.
    //
    // created_by_user_id references users(id) with ON DELETE SET NULL
    // so cases survive account deletion.
    //
    // tagged_causes is a native PostgreSQL TEXT[] array, which keeps
    // the schema simple and avoids JSON parsing overhead.
    //
    // status lifecycle (matches STD-1 in SDS):
    //   'delayNoted' → 'inProgress' → 'verified' → 'resolved' → 'closed'
    //   Any status can transition directly to 'closed'.
    // ─────────────────────────────────────────────────────────────
    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS mitigation_cases (
        id                  SERIAL PRIMARY KEY,
        flight_number       VARCHAR(20)  NOT NULL,
        sched_utc           TIMESTAMPTZ  NOT NULL,
        airline_code        VARCHAR(10),
        route               VARCHAR(30),
        predicted_delay_min FLOAT,
        risk_level          VARCHAR(20),
        likely_cause        VARCHAR(50),
        tagged_causes       TEXT[]       NOT NULL DEFAULT '{}',
        movement            VARCHAR(20),
        status              VARCHAR(30)  NOT NULL DEFAULT 'delayNoted',
        deadline            TIMESTAMPTZ,
        created_by_user_id  INTEGER      REFERENCES users(id) ON DELETE SET NULL,
        created_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at         TIMESTAMPTZ,
        closed_at           TIMESTAMPTZ
      )
    `);

    await queryWithRetry(`
      CREATE INDEX IF NOT EXISTS idx_cases_status
        ON mitigation_cases(status)
    `);

    await queryWithRetry(`
      CREATE INDEX IF NOT EXISTS idx_cases_flight
        ON mitigation_cases(flight_number, sched_utc)
    `);

    await queryWithRetry(`
      CREATE INDEX IF NOT EXISTS idx_cases_created_at
        ON mitigation_cases(created_at DESC)
    `);

    // Add version column for optimistic locking (safe on existing tables)
    await queryWithRetry(`
      ALTER TABLE mitigation_cases
        ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1
    `);

    // Add movement column (safe on existing tables)
    try {
      const movementColumnCheck = await queryWithRetry(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='mitigation_cases' AND column_name='movement'
      `);
      if (movementColumnCheck.rows.length === 0) {
        await queryWithRetry(`
          ALTER TABLE mitigation_cases
            ADD COLUMN movement VARCHAR(20)
        `);
        console.log('✅ Added movement column to mitigation_cases table');
      }
    } catch (error) {
      if (
        !error.message.includes('already exists') &&
        !error.message.includes('duplicate')
      ) {
        console.warn('Warning: Could not add movement column:', error.message);
      }
    }

    console.log('✅ Mitigation_cases table ready');

    // ─────────────────────────────────────────────────────────────
    // NEW TABLE: case_comments
    //
    // Internal chat messages attached to a mitigation case.
    // ON DELETE CASCADE means all comments are automatically
    // removed when their parent case is hard-deleted.
    //
    // author_username is stored redundantly (denormalised) at write
    // time so that chat history remains readable even after a user
    // account is deleted (author_user_id becomes NULL via SET NULL,
    // but the username string is preserved).
    // ─────────────────────────────────────────────────────────────
    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS case_comments (
        id                SERIAL PRIMARY KEY,
        case_id           INTEGER      NOT NULL
                            REFERENCES mitigation_cases(id)
                            ON DELETE CASCADE,
        author_user_id    INTEGER      REFERENCES users(id) ON DELETE SET NULL,
        author_username   VARCHAR(100) NOT NULL,
        comment_text      TEXT         NOT NULL,
        created_at        TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryWithRetry(`
      CREATE INDEX IF NOT EXISTS idx_comments_case_id
        ON case_comments(case_id)
    `);

    await queryWithRetry(`
      CREATE INDEX IF NOT EXISTS idx_comments_created_at
        ON case_comments(created_at ASC)
    `);

    console.log('✅ Case_comments table ready');

    // ─────────────────────────────────────────────────────────────
    // All tables initialised
    // ─────────────────────────────────────────────────────────────
    console.log('✅ Database tables initialized successfully');

    // ─────────────────────────────────────────────────────────────
    // Default users (unchanged from original)
    // ─────────────────────────────────────────────────────────────
    const bcrypt = require('bcrypt');

    const defaultUsers = [
      { username: 'admin', password: 'admin123', role: 'Admin',  email: 'admin@delaypilot.com' },
      { username: 'apoc',  password: 'apoc123',  role: 'APOC',   email: 'apoc@delaypilot.com'  },
      { username: 'atc',   password: 'atc123',   role: 'ATC',    email: 'atc@delaypilot.com'   },
      { username: 'aoc',   password: 'aoc123',   role: 'AOC',    email: 'aoc@delaypilot.com'   },
    ];

    for (const user of defaultUsers) {
      const userCheck = await queryWithRetry(
        'SELECT * FROM users WHERE username = $1',
        [user.username]
      );
      if (userCheck.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await queryWithRetry(
          'INSERT INTO users (username, password, role, email, status) VALUES ($1, $2, $3, $4, $5)',
          [user.username, hashedPassword, user.role, user.email, 'active']
        );
        console.log(
          `✅ Default ${user.role} user created (username: ${user.username}, password: ${user.password})`
        );
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
  query,
};
