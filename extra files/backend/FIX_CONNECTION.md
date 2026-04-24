# Fix Supabase Connection Issue

## Issue Found

The connection test shows:
```
Error: getaddrinfo ENOTFOUND db.sktinyoalzasqsuscpsb.supabase.co
```

This means the hostname cannot be found. This is usually because:

1. **Wrong connection string format** - You might be using the wrong type of connection string
2. **Incorrect project reference** - The project reference might be wrong
3. **Need to use pooler connection** - Some Supabase projects require connection pooling

## Solution Steps

### Step 1: Get the Correct Connection String

1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon) → **Database**
3. Scroll to **Connection string** section

### Step 2: Try Different Connection String Formats

**Option A: Direct Connection (Transaction Mode)**
- Use the **URI** tab
- Should look like: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- This is what you currently have

**Option B: Connection Pooler (Recommended)**
- Use the **Connection pooling** tab
- Should look like: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
- This is often more reliable

### Step 3: Update Your .env File

In `backend/.env`, try **BOTH** formats:

**Format 1 (Direct - Current):**
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.sktinyoalzasqsuscpsb.supabase.co:5432/postgres
```

**Format 2 (Pooler - Try This):**
```env
DATABASE_URL=postgresql://postgres.sktinyoalzasqsuscpsb:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Step 4: Verify Project Status

1. Check if your Supabase project is **Active**
2. Make sure it's not paused or deleted
3. Check the project reference matches your connection string

### Step 5: Test Again

After updating `.env`:
```bash
npm run test-connection
```

## Alternative: Use Individual Parameters

If connection strings don't work, you can use individual parameters:

```env
DB_HOST=db.sktinyoalzasqsuscpsb.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_SSL=true
```

## Quick Fix Checklist

- [ ] Verified project is active in Supabase dashboard
- [ ] Copied connection string directly from Supabase (didn't type manually)
- [ ] Replaced `[YOUR-PASSWORD]` with actual password (no brackets)
- [ ] Tried connection pooler format (port 6543)
- [ ] Tried direct connection format (port 5432)
- [ ] Checked password for special characters (may need URL encoding)

## URL Encoding Special Characters

If your password has special characters, they need to be URL-encoded:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

## Still Having Issues?

1. Double-check your Supabase project is active
2. Verify the project reference in the connection string matches your project
3. Try resetting your database password in Supabase
4. Contact Supabase support if the hostname doesn't resolve


