# How to Start the Project

## You need to start TWO servers:

### 1. Backend Server (Database & API)

**Open Terminal 1:**
```bash
cd "FYP mocksss\FYP mocksss\backend"
npm start
```

**Wait until you see:**
```
✅ Connected to PostgreSQL database
✅ Database tables initialized successfully
✅ Default admin user created
🚀 Server is running on http://localhost:5000
```

**Keep this terminal open!** The backend must stay running.

---

### 2. Frontend Server (React App)

**Open Terminal 2 (new terminal window):**
```bash
cd "FYP mocksss\FYP mocksss"
npm start
```

**Wait until you see:**
```
Compiled successfully!
webpack compiled successfully
```

The browser should automatically open to `http://localhost:3000`

---

## Quick Start Commands

### Terminal 1 - Backend:
```bash
cd backend
npm start
```

### Terminal 2 - Frontend:
```bash
npm start
```

---

## ✅ Success Checklist

- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:3000
- [ ] Browser opens automatically
- [ ] Login page appears

---

## 🔑 Default Login Credentials

- **Username:** `admin`
- **Password:** `admin123`
- **Role:** `Admin`

---

## 🆘 Troubleshooting

**Backend won't start:**
- Check if port 5000 is already in use
- Verify `.env` file has correct `DATABASE_URL`
- Run `npm run test-connection` to verify database connection

**Frontend won't start:**
- Check if port 3000 is already in use
- Make sure you're in the correct directory (`FYP mocksss\FYP mocksss`)
- Try deleting `node_modules` and running `npm install` again


