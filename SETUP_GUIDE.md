# Setup Guide - PostgreSQL Authentication with Supabase

This guide will help you set up Supabase (cloud PostgreSQL) and connect it to your DelayPilot application.

## Prerequisites

1. **Supabase account** (free tier available)
   - Sign up at: https://supabase.com
   - No local PostgreSQL installation needed!

2. **Node.js** (already installed for React)

## Step-by-Step Setup

### Option A: Using Supabase (Recommended) ⭐

Supabase provides a free PostgreSQL database in the cloud - no local installation needed!

#### 1. Create Supabase Account and Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up (free)
3. Create a new project:
   - Name: `delaypilot`
   - Set a strong database password (⚠️ **SAVE THIS!**)
   - Choose region closest to you
   - Wait ~2 minutes for provisioning

#### 2. Get Your Database Connection String

1. In Supabase dashboard, click **Settings** (gear icon) → **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

#### 3. Configure Backend Environment

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Create a `.env` file (copy from `env.template`):
   ```bash
   # Windows PowerShell
   Copy-Item env.template .env
   ```

3. Edit the `.env` file with your Supabase connection:
   ```env
   # Supabase Connection (replace with your actual connection string)
   DATABASE_URL=postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres
   DB_SSL=true
   
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

   **Important:** 
   - Replace `your_password` with your Supabase database password
   - Replace `xxxxx` with your project reference
   - Keep it on a single line

📖 **Detailed Supabase setup:** See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

### Option B: Using Local PostgreSQL

If you prefer to use a local PostgreSQL installation:

#### 1. Install PostgreSQL (if not already installed)

Download from: https://www.postgresql.org/download/
- Note your PostgreSQL password
- Default port: `5432`
- Default user: `postgres`

#### 2. Create the Database

**Using pgAdmin:**
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click "Databases" → "Create" → "Database"
4. Name: `delaypilot`

**Using psql:**
```sql
CREATE DATABASE delaypilot;
```

#### 3. Configure Backend Environment

1. Navigate to backend folder:
   ```bash
   cd backend
   ```

2. Create `.env` file:
   ```bash
   Copy-Item env.template .env
   ```

3. Edit `.env` with local PostgreSQL credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=delaypilot
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password_here
   DB_SSL=false
   
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

### 4. Install Backend Dependencies

In the `backend` folder, run:
```bash
npm install
```

This will install:
- express (web server)
- pg (PostgreSQL client)
- bcrypt (password hashing)
- jsonwebtoken (JWT tokens)
- cors (CORS middleware)
- dotenv (environment variables)

### 5. Install Frontend Dependencies (axios)

In the root project folder, run:
```bash
npm install
```

This will install axios for API calls.

### 6. Start the Backend Server

In the `backend` folder:
```bash
npm start
```

You should see:
```
✅ Connected to PostgreSQL database
✅ Database tables initialized successfully
✅ Default admin user created (username: admin, password: admin123)
🚀 Server is running on http://localhost:5000
```

**Keep this terminal open!** The backend server must be running.

### 7. Start the Frontend Server

Open a **new terminal** window, navigate to the project root, and run:
```bash
npm start
```

The React app will start on `http://localhost:3000`

### 8. Test Login

1. Open your browser to `http://localhost:3000`
2. Use the default admin credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
   - **Role:** `Admin`
3. Click "Login"

The login should now authenticate against your PostgreSQL database!

## Default Admin User

On first backend startup, a default admin user is automatically created:
- **Username:** admin
- **Password:** admin123
- **Role:** Admin

⚠️ **SECURITY WARNING:** Change this password in production!

## Creating Additional Users

You can create additional users using the registration endpoint or directly in the database:

**Using the API:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123",
    "role": "APOC",
    "email": "user@example.com"
  }'
```

**Or directly in PostgreSQL:**
```sql
INSERT INTO users (username, password, role, email) 
VALUES ('username', 'hashed_password', 'APOC', 'email@example.com');
```

(Note: Passwords must be hashed with bcrypt in the database)

## Troubleshooting

### Supabase Connection Issues

**Error: "Connection refused" or "Cannot connect to database"**
- Check your `DATABASE_URL` in `.env` file
- Make sure you replaced the password in the connection string
- Verify the connection string format is correct (should include `@db.` not `@aws-0-`)
- Check if your Supabase project is fully provisioned (wait a few minutes after creation)

**Error: "password authentication failed"**
- Verify your database password in Supabase project settings
- Make sure the password in `DATABASE_URL` matches exactly
- Check if you need to URL-encode special characters in password

**Error: "SSL connection required"**
- Make sure `DB_SSL=true` in your `.env` file for Supabase

### Local PostgreSQL Issues

**Error: "Failed to connect to server"**
- Make sure PostgreSQL is running
- Check your `.env` file has correct database credentials
- Verify the database `delaypilot` exists

**Error: "password authentication failed"**
- Check your PostgreSQL password in the `.env` file
- Try resetting your PostgreSQL password if needed

### General Issues

**Error: "relation 'users' does not exist"**
- The database tables should be created automatically
- Make sure the backend server started successfully
- Check the backend terminal for initialization messages

**Port 5000 already in use**
- Change the PORT in `backend/.env` file
- Update `REACT_APP_API_URL` in frontend `.env` (if you create one) or update `src/config/api.js`

**CORS errors**
- Make sure `FRONTEND_URL` in `backend/.env` matches your React app URL (default: http://localhost:3000)

## Database Schema

The `users` table structure:
- `id` - Auto-incrementing primary key
- `username` - Unique username (VARCHAR 100)
- `password` - Hashed password (VARCHAR 255)
- `role` - User role: Admin, APOC, AOC, or ATC (VARCHAR 50)
- `email` - Optional email address (VARCHAR 255)
- `created_at` - Timestamp of account creation
- `updated_at` - Timestamp of last update

## Next Steps

- ✅ Login page now authenticates against PostgreSQL
- 🔄 User data is stored in the database
- 🔄 Passwords are securely hashed
- 🔄 JWT tokens are used for authentication

You can now add more features like:
- Password reset functionality
- User profile management
- Session management
- Role-based access control improvements

