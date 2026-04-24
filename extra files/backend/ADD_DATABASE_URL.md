# Add DATABASE_URL to Your .env File

## What You Have Now

✅ You've added:
- `REACT_APP_SUPABASE_URL` - Good for frontend
- `REACT_APP_SUPABASE_ANON_KEY` - Good for frontend

## What You Need to Add

❌ You still need:
- `DATABASE_URL` - **This is required for backend database connection**

## How to Get DATABASE_URL

The `DATABASE_URL` is different from the Supabase URL. It's a **PostgreSQL connection string**.

### Step 1: Go to Supabase Dashboard

1. Open: https://supabase.com
2. Log in and select your project
3. Click **Settings** (gear icon ⚙️) → **Database**

### Step 2: Get Connection String

1. Scroll down to **"Connection string"** section
2. Click the **"URI"** tab
3. You'll see a connection string like:

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

OR

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Step 3: Copy the Connection String

Copy the entire connection string, then **replace `[YOUR-PASSWORD]` with your actual database password**.

## Add to .env File

Open `backend/.env` file and add this line at the top:

```env
DATABASE_URL=postgresql://postgres.sktinyoalzasqsuscpsb:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
DB_SSL=true
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Keep your existing values:
REACT_APP_SUPABASE_URL=https://sktinyoalzasqsuscpsb.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** Replace `YOUR_PASSWORD` with your actual Supabase database password!

## Quick Way: Use Helper Script

Run this command and it will guide you:

```bash
node update-env.js
```

It will ask you to paste the connection string and will add it to your .env file automatically.

## After Adding DATABASE_URL

1. **Test the connection:**
   ```bash
   npm run test-connection
   ```

2. **If successful, start the server:**
   ```bash
   npm start
   ```

## Your Complete .env Should Have:

```env
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
DB_SSL=true
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
REACT_APP_SUPABASE_URL=https://sktinyoalzasqsuscpsb.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```


