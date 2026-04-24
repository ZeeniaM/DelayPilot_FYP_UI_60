# Quick Start Guide - Connect to Supabase

## Step 1: Get Your Supabase Connection String

1. Go to https://supabase.com and log in
2. Select your project
3. Click **Settings** (gear icon) → **Database**
4. Scroll to **Connection string** section
5. Click the **URI** tab
6. Copy the connection string (looks like):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

**IMPORTANT:** Replace `[YOUR-PASSWORD]` with your actual database password!

## Step 2: Create .env File

1. In the `backend` folder, create a file named `.env`
2. Add this content (replace with your actual connection string):

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@db.xxxxx.supabase.co:5432/postgres
DB_SSL=true
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Make sure to:**
- Replace `YOUR_PASSWORD_HERE` with your actual Supabase password
- Replace `xxxxx` with your project reference
- Keep everything on one line

## Step 3: Test Connection

Run this command to test your connection:

```bash
cd backend
node test-connection.js
```

If successful, you'll see:
```
✅ Connection successful!
✅ Users table exists
🎉 Everything looks good!
```

## Step 4: Start the Server

Once connection is verified:

```bash
npm start
```

You should see:
```
✅ Connected to PostgreSQL database
✅ Database tables initialized successfully
✅ Default admin user created
🚀 Server is running on http://localhost:5000
```

## Troubleshooting

**"DATABASE_URL is not set"**
- Make sure `.env` file exists in `backend` folder
- Check that the file is named exactly `.env` (not `.env.txt`)

**"password authentication failed"**
- Double-check your password in the connection string
- Make sure you replaced `[YOUR-PASSWORD]` with actual password

**"Connection refused"**
- Check your internet connection
- Verify your Supabase project is active
- Make sure connection string format is correct

## Need Help?

See `SUPABASE_SETUP.md` for detailed instructions.


