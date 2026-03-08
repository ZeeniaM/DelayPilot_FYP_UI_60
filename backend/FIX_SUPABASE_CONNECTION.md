# Fix Supabase Connection - Action Required

## 🔴 Current Issue

Your connection string cannot resolve the hostname:
- Host: `db.sktinyoalzasqsuscpsb.supabase.co`
- Error: `getaddrinfo ENOTFOUND` (hostname not found)

This means either:
1. **Your Supabase project is paused or doesn't exist**
2. **The connection string is incorrect**
3. **The project reference is wrong**

## ✅ What You Need to Do

### Step 1: Verify Your Supabase Project

1. **Go to https://supabase.com**
2. **Log in to your account**
3. **Check if your project exists and is ACTIVE**
   - Projects show as "Active" when running
   - Paused projects won't connect
   - Deleted projects won't show up

### Step 2: Get a Fresh Connection String

1. **In Supabase dashboard, select your project**
2. **Click Settings (⚙️ gear icon) → Database**
3. **Scroll down to "Connection string" section**

You'll see multiple connection string options. **Use the URI tab**:

#### Format A: Direct Connection (Port 5432)
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

OR

#### Format B: Transaction Pooler (Port 6543) - RECOMMENDED
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Important:**
- `[PROJECT-REF]` is your project reference (like `sktinyoalzasqsuscpsb`)
- `[YOUR-PASSWORD]` is your database password
- `[REGION]` is your region (like `us-east-1`, `eu-west-1`, etc.)

### Step 3: Update Your .env File

1. **Open `backend/.env` file**
2. **Replace the entire `DATABASE_URL` line** with the fresh connection string from Supabase

**Example of correct format:**
```env
DATABASE_URL=postgresql://postgres.sktinyoalzasqsuscpsb:your_password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
DB_SSL=true
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**⚠️ IMPORTANT:**
- **Copy directly from Supabase dashboard** (don't type manually)
- **Replace `[YOUR-PASSWORD]`** with your actual password (remove brackets)
- **No spaces** in the connection string
- **Keep on one line**

### Step 4: Test the Connection

After updating `.env`:

```bash
cd backend
npm run test-connection
```

You should see:
```
✅ Connection successful!
✅ Users table exists
🎉 Everything looks good!
```

## 🔍 Common Mistakes to Avoid

❌ **Wrong:** `postgresql://postgres:[PASSWORD]@db.sktinyoalzasqsuscpsb.supabase.co:5432/postgres`
✅ **Right:** `postgresql://postgres.sktinyoalzasqsuscpsb:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

❌ **Wrong:** Using old/direct connection format when project requires pooler
✅ **Right:** Use the connection string exactly as shown in Supabase dashboard

❌ **Wrong:** Keeping `[YOUR-PASSWORD]` placeholder
✅ **Right:** Replace with actual password

❌ **Wrong:** Connection string has line breaks
✅ **Right:** Everything on one line

## 📋 Quick Checklist

Before testing, verify:

- [ ] Supabase project is **Active** (not paused)
- [ ] Connection string copied directly from Supabase dashboard
- [ ] Password replaced (no brackets `[]`)
- [ ] Connection string is on **one line** only
- [ ] `.env` file saved after editing

## 🚨 If Project Doesn't Exist

If your Supabase project doesn't exist or was deleted:

1. **Create a new project:**
   - Go to https://supabase.com
   - Click "New Project"
   - Fill in details (name, password, region)
   - Wait 2-3 minutes for provisioning

2. **Get connection string from new project**
3. **Update `.env` file**
4. **Test connection**

## ✅ After Successful Connection

Once `npm run test-connection` succeeds:

1. **Start the backend server:**
   ```bash
   npm start
   ```

2. **You should see:**
   ```
   ✅ Connected to PostgreSQL database
   ✅ Database tables initialized successfully
   ✅ Default admin user created
   🚀 Server is running on http://localhost:5000
   ```

3. **Test login:**
   - Username: `admin`
   - Password: `admin123`
   - Role: `Admin`

## Need Help?

If connection still fails after following these steps:
1. Verify project is active in Supabase dashboard
2. Try resetting database password in Supabase
3. Check Supabase status page for outages
4. Create a new project if current one is inaccessible


