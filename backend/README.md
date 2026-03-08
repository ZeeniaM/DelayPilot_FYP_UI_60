# DelayPilot Backend API

Backend server for DelayPilot authentication and user management with PostgreSQL.

## Setup

### Prerequisites
- Node.js (v14 or higher)
- Supabase account (free tier available) or local PostgreSQL
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Set up Supabase database:**
   - Go to [Supabase](https://supabase.com) and create a free account
   - Create a new project
   - Wait for the database to be provisioned (takes ~2 minutes)
   - Go to Settings > Database
   - Copy the Connection string (URI format)
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

3. **Configure environment variables:**
   - Copy `env.template` to `.env`
   - Update the Supabase connection string in `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres
   DB_SSL=true
   ```

   **OR** for local PostgreSQL:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=delaypilot
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_SSL=false
   ```

4. **Start the server:**
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server will start on `http://localhost:5000`

**Note:** The server will automatically:
- Connect to your database
- Create the `users` table if it doesn't exist
- Create default users for all roles (if they don't exist)
- Set up database indexes for optimal performance

## Default Users

On first startup, default users will be created for each role:

### Admin User
- **Username:** admin
- **Password:** admin123
- **Role:** Admin
- **Email:** admin@delaypilot.com

### APOC User (Airline Operations Control)
- **Username:** apoc
- **Password:** apoc123
- **Role:** APOC
- **Email:** apoc@delaypilot.com

### ATC User (Air Traffic Control)
- **Username:** atc
- **Password:** atc123
- **Role:** ATC
- **Email:** atc@delaypilot.com

### AOC User (Airline Operations Center)
- **Username:** aoc
- **Password:** aoc123
- **Role:** AOC
- **Email:** aoc@delaypilot.com

**⚠️ IMPORTANT:** Change these default passwords in production!

## API Endpoints

### Authentication

#### POST `/api/auth/login`
Login with username, password, and role.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123",
  "role": "Admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "Admin",
    "email": "admin@delaypilot.com"
  }
}
```

#### POST `/api/auth/register`
Register a new user (optional).

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "role": "APOC",
  "email": "user@example.com"
}
```

#### GET `/api/auth/verify`
Verify JWT token validity and get current user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "Admin",
    "email": "admin@delaypilot.com"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

#### GET `/api/health`
Health check endpoint to verify server status.

**Response:**
```json
{
  "success": true,
  "message": "DelayPilot Backend API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Database Schema

The users table will be automatically created on first server start with all necessary indexes.

### Users Table
- `id` (SERIAL PRIMARY KEY) - Auto-incrementing unique identifier
- `username` (VARCHAR(100) UNIQUE NOT NULL) - Unique username for login
- `password` (VARCHAR(255) NOT NULL) - Bcrypt hashed password
- `role` (VARCHAR(50) NOT NULL) - User role: Admin, APOC, AOC, or ATC
- `email` (VARCHAR(255)) - Optional email address
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP) - Account creation timestamp
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP) - Last update timestamp

### Indexes
- `idx_users_username` - Index on username column for fast lookups during login

### Automatic Initialization
On server start, the system will:
1. Create the `users` table if it doesn't exist
2. Create the username index if it doesn't exist
3. Check for default users (Admin, APOC, ATC, AOC) and create them if missing

## Using Supabase

### Getting Your Connection String

1. **Log in to Supabase:**
   - Go to https://supabase.com
   - Sign in or create an account

2. **Create a Project:**
   - Click "New Project"
   - Choose organization, name your project
   - Set a database password (save this!)
   - Select a region
   - Wait ~2 minutes for provisioning

3. **Get Connection String:**
   - Go to Settings (gear icon) > Database
   - Scroll to "Connection string"
   - Select "URI" tab
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your actual database password

4. **Add to .env:**
   ```env
   DATABASE_URL=postgresql://postgres:your_actual_password@db.xxxxx.supabase.co:5432/postgres
   DB_SSL=true
   ```

### Supabase Dashboard

You can view and manage your database tables through the Supabase dashboard:
- Go to Table Editor in your Supabase project
- View the `users` table created automatically
- Manage user records directly if needed
- View connection logs and performance metrics

### Connection String Formats

**Direct Connection (Port 5432):**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Connection Pooler (Port 6543 - Recommended):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Note:** If you experience connection issues with the direct connection, try the pooler format. The retry logic will help with temporary connection failures, but incorrect connection strings will still fail.

### Troubleshooting Connection Issues

**Common Errors:**

1. **`ENOTFOUND` Error**: Hostname cannot be resolved
   - Check your connection string format
   - Verify your Supabase project is active (not paused)
   - Try using the connection pooler format instead

2. **`08006` Error**: Connection failure during authentication
   - Verify your database password is correct
   - Check if your Supabase project is paused
   - The retry logic will attempt to reconnect automatically

3. **Connection Timeout**: Takes too long to connect
   - Check your internet connection
   - Verify Supabase service status
   - Try the connection pooler format

**Testing Connection:**
```bash
npm run test-connection
```

This will verify your connection string and database connectivity.

## Recent Updates & Improvements

### Database Connection Enhancements

#### Connection Retry Logic
- **Automatic Retry**: All database queries now automatically retry up to 3 times on connection failures
- **Exponential Backoff**: Retry delays increase exponentially (1s, 2s, 3s) to avoid overwhelming the database
- **Error Handling**: Handles connection errors (`08006`, `ENOTFOUND`, `ETIMEDOUT`) gracefully
- **Non-Blocking**: Server continues running even if individual queries fail

#### Connection Pool Configuration
- **Maximum Connections**: 20 concurrent database connections
- **Idle Timeout**: Connections close after 30 seconds of inactivity
- **Connection Timeout**: 10-second timeout for establishing new connections
- **Error Recovery**: Pool errors no longer crash the server; connections are retried automatically

#### Implementation Details
- **Query Function**: New `query()` function exported from `database.js` with built-in retry logic
- **All Routes Updated**: Authentication routes now use the retry-enabled query function
- **Initialization**: Database initialization also uses retry logic for reliability

### Code Changes

**File: `backend/config/database.js`**
- Added `queryWithRetry()` function with exponential backoff
- Added connection pool configuration (max, timeouts)
- Improved error handling (no process exit on pool errors)
- Exported new `query()` function for use in routes

**File: `backend/routes/auth.js`**
- Updated all database queries to use new `query()` function instead of `pool.query()`
- All queries now have automatic retry on connection failures
- Better error messages and logging

## Running the Server

### Starting the Backend

**Basic Start:**
```bash
cd backend
npm start
```

**Development Mode (with auto-reload):**
```bash
cd backend
npm run dev
```

**Test Database Connection:**
```bash
cd backend
npm run test-connection
```

### Port Conflicts

If you see `EADDRINUSE: address already in use :::5000`:

**Windows:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

### Server Status

Once running, you should see:
- `✅ Connected to PostgreSQL database`
- `✅ Database tables initialized successfully`
- `🚀 Server is running on http://localhost:5000`
- `📡 API endpoints available at http://localhost:5000/api`

### Health Check

Test if the server is running:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "DelayPilot Backend API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security Features

- **Password Hashing**: Bcrypt with salt rounds (10)
- **JWT Token Authentication**: Secure token-based authentication with 24-hour expiration
- **CORS Protection**: Configured for frontend origin (`http://localhost:3000`)
- **Input Validation**: All endpoints validate required fields
- **SQL Injection Protection**: Parameterized queries prevent SQL injection
- **Error Handling**: Secure error messages (no sensitive data exposed)
- **Connection Security**: SSL/TLS support for database connections

