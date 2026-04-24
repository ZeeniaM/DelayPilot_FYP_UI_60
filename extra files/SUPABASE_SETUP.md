# Supabase Setup Guide for DelayPilot

This guide will help you set up Supabase (cloud PostgreSQL) for your DelayPilot authentication system.

## Why Supabase?

- ✅ Free tier available (perfect for development)
- ✅ No local PostgreSQL installation needed
- ✅ Automatic backups and security
- ✅ Web dashboard for database management
- ✅ Built-in connection pooling
- ✅ Real-time capabilities (for future use)

## Step-by-Step Setup

### 1. Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign in"
3. Sign up with GitHub, Google, or email
4. Verify your email if required

### 2. Create a New Project

1. Click "New Project" button
2. **Choose organization** (or create one)
3. **Project details:**
   - Name: `delaypilot` (or your preferred name)
   - Database Password: Create a strong password (⚠️ **SAVE THIS PASSWORD!**)
   - Region: Choose closest to you
4. Click "Create new project"
5. Wait ~2 minutes for database provisioning

### 3. Get Your Database Connection String

1. In your Supabase project dashboard, click the **Settings** (gear icon) on the left sidebar
2. Click **Database** in the settings menu
3. Scroll down to **Connection string** section
4. Select the **URI** tab
5. You'll see a connection string like:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   
   **OR** for direct connection:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

6. Copy this connection string

### 4. Configure Backend Environment

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Create `.env` file (copy from `env.template`):
   ```bash
   # Windows PowerShell
   Copy-Item env.template .env
   ```

3. Edit `.env` file and add your Supabase connection string:
   ```env
   # Supabase Connection (Replace with your actual connection string)
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@db.xxxxx.supabase.co:5432/postgres
   DB_SSL=true
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

   **Important:** 
   - Replace `YOUR_PASSWORD_HERE` with the database password you set when creating the project
   - Make sure the connection string is on a single line (no line breaks)

### 5. Install Backend Dependencies

In the `backend` folder:
```bash
npm install
```

### 6. Start the Backend Server

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

### 7. Verify in Supabase Dashboard

1. Go back to your Supabase project
2. Click **Table Editor** in the left sidebar
3. You should see the `users` table
4. Click on it to see the default admin user

### 8. Start Frontend and Test

1. In a new terminal, navigate to project root:
   ```bash
   cd ..
   npm start
   ```

2. Open browser to `http://localhost:3000`
3. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`
   - Role: `Admin`

## Troubleshooting

### Error: "Connection refused" or "Cannot connect to database"

- Check your `DATABASE_URL` in `.env` file
- Make sure you replaced `[YOUR-PASSWORD]` with actual password
- Verify the connection string format is correct
- Check if your Supabase project is fully provisioned (wait a few minutes)

### Error: "password authentication failed"

- Verify your database password in Supabase project settings
- Make sure the password in `DATABASE_URL` matches exactly
- Check if you need to URL-encode special characters in password

### Error: "SSL connection required"

- Make sure `DB_SSL=true` in your `.env` file
- Supabase requires SSL connections

### Connection String Format

Make sure your connection string looks like this:
```
postgresql://postgres:PASSWORD@db.PROJECT-REF.supabase.co:5432/postgres
```

**Not like this:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

The second format is for connection pooling and may not work with the direct connection. Use the direct connection string from the **URI** tab.

## Managing Users in Supabase

### Via Supabase Dashboard

1. Go to **Table Editor** > `users`
2. Click **Insert row** to add new users
3. **Note:** Passwords must be hashed with bcrypt before inserting

### Via API

Use the registration endpoint:
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

## Supabase Free Tier Limits

- 500 MB database space (plenty for development)
- 2 GB bandwidth per month
- Unlimited API requests
- 50,000 monthly active users

Perfect for development and small projects!

## Next Steps

- ✅ Database connected to Supabase
- ✅ Authentication working
- 🔄 You can now use Supabase features like:
  - Real-time subscriptions
  - Storage buckets
  - Row Level Security (RLS)
  - API auto-generation

## Security Notes

- Keep your `.env` file secure and never commit it to git
- The `.gitignore` file already excludes `.env`
- Change default admin password in production
- Use environment variables in production deployments


