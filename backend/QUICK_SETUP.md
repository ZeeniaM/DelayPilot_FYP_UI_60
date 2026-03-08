# Quick Setup - Connect to Supabase

## Option 1: Automated Setup (Easiest)

Run this command and follow the prompts:

```bash
cd backend
node create-env.js
```

It will ask you to:
1. Paste your Supabase connection string
2. Enter JWT secret (or use default)

The `.env` file will be created automatically!

## Option 2: Manual Setup

### Step 1: Create .env File

1. Create a new file named `.env` in the `backend` folder
2. Copy this content into it:

```env
# Supabase Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres

# SSL Configuration
DB_SSL=true

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Step 2: Get Your Supabase Connection String

1. **Go to https://supabase.com**
2. **Log in** to your account
3. **Select your project** (or create one if needed)
4. **Click Settings** (gear icon) → **Database**
5. **Scroll to "Connection string"** section
6. **Click "URI" tab**
7. **Copy the connection string**

It will look like one of these:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

OR

```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Step 3: Update .env File

1. Open `backend/.env` in a text editor
2. Replace the `DATABASE_URL` line with your connection string
3. **IMPORTANT:** Replace `[PASSWORD]` or `[YOUR-PASSWORD]` with your actual password
4. Save the file

**Example:**
```env
DATABASE_URL=postgresql://postgres.sktinyoalzasqsuscpsb:mypassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Step 4: Test Connection

```bash
cd backend
npm run test-connection
```

**Expected output:**
```
✅ DATABASE_URL found in .env
✅ Connection successful!
✅ Users table exists
🎉 Everything looks good!
```

### Step 5: Start Server

```bash
npm start
```

**Expected output:**
```
✅ Connected to PostgreSQL database
✅ Database tables initialized successfully
✅ Default admin user created
🚀 Server is running on http://localhost:5000
```

## 🎯 Quick Checklist

- [ ] `.env` file created in `backend` folder
- [ ] `DATABASE_URL` set with your Supabase connection string
- [ ] Password replaced (no brackets `[]`)
- [ ] `DB_SSL=true` for Supabase
- [ ] Connection tested successfully
- [ ] Server started successfully

## 🆘 Troubleshooting

**Error: "DATABASE_URL is not set"**
- Make sure `.env` file exists in `backend` folder
- Check that `DATABASE_URL` is on its own line

**Error: "Connection failed"**
- Verify your Supabase project is active
- Check connection string format
- Make sure password is correct
- Try using Connection Pooler format (port 6543)

**Error: "password authentication failed"**
- Double-check your database password
- Make sure you replaced `[PASSWORD]` with actual password

## ✅ Success!

Once connected, you can:
- Login with default credentials:
  - Username: `admin`
  - Password: `admin123`
  - Role: `Admin`
- Start the frontend: `npm start` (in project root)
- Access your Supabase dashboard to view the `users` table


