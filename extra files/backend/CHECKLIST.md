# Supabase Connection Checklist

Use this checklist to verify your setup:

## ✅ Prerequisites

- [ ] Supabase account created at https://supabase.com
- [ ] Supabase project created
- [ ] Database password saved (you'll need this!)

## ✅ Backend Setup

- [ ] Backend dependencies installed (`npm install` in backend folder)
- [ ] `.env` file created in `backend` folder
- [ ] `DATABASE_URL` added to `.env` file with your Supabase connection string
- [ ] `DB_SSL=true` set in `.env` file
- [ ] `JWT_SECRET` set in `.env` file

## ✅ Connection String Format

Your `DATABASE_URL` should look like:
```
postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

**Check:**
- [ ] Connection string includes `supabase.co`
- [ ] Password replaced (no `[YOUR-PASSWORD]` placeholder)
- [ ] No spaces or line breaks in connection string
- [ ] Starts with `postgresql://`

## ✅ Test Connection

Run test command:
```bash
cd backend
npm run test-connection
```

Expected output:
- [ ] ✅ DATABASE_URL found in .env
- [ ] ✅ Connection successful!
- [ ] ✅ Users table exists (or will be created)

## ✅ Start Server

Once test passes:
```bash
npm start
```

Expected output:
- [ ] ✅ Connected to PostgreSQL database
- [ ] ✅ Database tables initialized successfully
- [ ] ✅ Default admin user created
- [ ] 🚀 Server is running on http://localhost:5000

## Common Issues & Solutions

### Issue: "DATABASE_URL is not set"
**Solution:** Make sure `.env` file exists in `backend` folder and contains `DATABASE_URL=...`

### Issue: "password authentication failed"
**Solution:** 
- Double-check password in connection string
- Make sure you're using the database password (not your Supabase account password)
- Password should be URL-encoded if it contains special characters

### Issue: Connection string format wrong
**Solution:** 
- Use the connection string from Supabase dashboard: Settings > Database > URI tab
- Make sure it's the direct connection (not pooler) for the format: `db.xxxxx.supabase.co:5432`

### Issue: SSL errors
**Solution:** Make sure `DB_SSL=true` in your `.env` file

## Next Steps

Once connected:
1. ✅ Backend server running
2. ✅ Test login with default credentials:
   - Username: `admin`
   - Password: `admin123`
   - Role: `Admin`

## Need Help?

- See `QUICK_START.md` for step-by-step guide
- See `SUPABASE_SETUP.md` for detailed instructions
- Run `npm run test-connection` to diagnose issues


