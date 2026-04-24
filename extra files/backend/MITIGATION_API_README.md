# Backend Mitigation API Implementation Summary

## ✅ STEP 1: Created Backend Routes & Middleware

### 1. New File: `backend/middleware/auth.js`
- **Purpose**: Shared JWT token verification middleware for all protected routes
- **Exports**: `verifyToken` middleware
- **Functionality**: Extracts JWT token from `Authorization: Bearer <token>` header and attaches user data to `req.user` (id, username, role)

### 2. New File: `backend/routes/mitigation.js`
**Full CRUD Express router with 8 endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/mitigation/cases` | List all **active** (non-closed) mitigation cases |
| POST | `/api/mitigation/cases` | Create new mitigation case from alert/flight |
| PATCH | `/api/mitigation/cases/:id/status` | Move case between columns (drag-drop status update) |
| PATCH | `/api/mitigation/cases/:id` | Update case details (tags, deadline, risk level, etc.) |
| DELETE | `/api/mitigation/cases/:id` | Soft-close case (set status='closed', preserves audit trail) |
| GET | `/api/mitigation/cases/closed` | List all **closed** cases for archive/history |
| GET | `/api/mitigation/cases/:id/comments` | Fetch all comments on a case |
| POST | `/api/mitigation/cases/:id/comments` | Add new comment to case |

#### Key Implementation Details:

**Request/Response Contracts:**

```json
// POST /api/mitigation/cases
{
  "flight_number": "LH204",
  "sched_utc": "2026-04-21T14:30:00Z",
  "airline_code": "LH",
  "route": "MUC → FRA",
  "predicted_delay_min": 45,
  "risk_level": "high",
  "likely_cause": "Weather",
  "tagged_causes": ["Weather"],
  "deadline": null
}

// PATCH /api/mitigation/cases/:id/status
{ "status": "inProgress" }
// Valid statuses: delayNoted, inProgress, verified, resolved, closed

// POST /api/mitigation/cases/:id/comments
{ "comment_text": "Crew is being reassigned", "author_username": "apoc" }
// author_username is optional; defaults to logged-in user
```

**Features:**
- ✅ All endpoints protected with `verifyToken` middleware
- ✅ User ID (`req.user.id`) attached to all created records for audit trail
- ✅ Logged-in user's username auto-captured for comments
- ✅ PostgreSQL array handling for `tagged_causes` field
- ✅ Timestamp management (created_at, updated_at, resolved_at, closed_at)
- ✅ Comprehensive error handling with meaningful error messages

### 3. Updated: `backend/server.js`
**Added route registration:**
```javascript
app.use('/api/mitigation', require('./routes/mitigation'));
```

---

## ✅ STEP 2: Verified Database Tables

### `mitigation_cases` Table
All columns present and correctly defined:
```sql
id                  SERIAL PRIMARY KEY
flight_number       VARCHAR(20)  NOT NULL
sched_utc           TIMESTAMPTZ  NOT NULL
airline_code        VARCHAR(10)
route               VARCHAR(30)
predicted_delay_min FLOAT
risk_level          VARCHAR(20)
likely_cause        VARCHAR(50)
tagged_causes       TEXT[]       NOT NULL DEFAULT '{}'
status              VARCHAR(30)  NOT NULL DEFAULT 'delayNoted'
deadline            TIMESTAMPTZ
created_by_user_id  INTEGER      REFERENCES users(id) ON DELETE SET NULL
created_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
resolved_at         TIMESTAMPTZ
closed_at           TIMESTAMPTZ
```

**Indexes:** status, (flight_number, sched_utc), created_at

### `case_comments` Table
All columns present and correctly defined:
```sql
id                SERIAL PRIMARY KEY
case_id           INTEGER      NOT NULL REFERENCES mitigation_cases(id) ON DELETE CASCADE
author_user_id    INTEGER      REFERENCES users(id) ON DELETE SET NULL
author_username   VARCHAR(100) NOT NULL  (denormalized for audit trail)
comment_text      TEXT         NOT NULL
created_at        TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
```

**Indexes:** case_id, created_at

**Relationships:**
- ✅ `case_id` → `mitigation_cases(id)` with **ON DELETE CASCADE** (comments removed with case)
- ✅ `author_user_id` → `users(id)` with **ON DELETE SET NULL** (comments survive account deletion)

---

## 🚀 Ready to Test

**Startup:**
```bash
cd backend
npm install  # if needed
npm start
```

**Health Check:**
```
GET http://localhost:5000/api/health
```

**Example Requests (with token):**
```bash
# Get active cases
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/mitigation/cases

# Create new case
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"flight_number":"LH204","sched_utc":"2026-04-21T14:30:00Z",...}' \
  http://localhost:5000/api/mitigation/cases

# Update case status (drag-drop column)
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"inProgress"}' \
  http://localhost:5000/api/mitigation/cases/1/status
```

---

## 📋 Database Auto-Migration

The `initDatabase()` function in `database.js` automatically:
1. Creates tables if they don't exist
2. Creates all indexes
3. Runs on every server startup (idempotent via `CREATE TABLE IF NOT EXISTS`)

**No manual migrations needed.** Just restart the Express server to sync the database.

---

## ✨ Architecture Notes

- **Array Handling**: PostgreSQL native `TEXT[]` arrays for `tagged_causes` with client-side parsing
- **Audit Trail**: `created_by_user_id` + `created_at`/`updated_at`/`resolved_at`/`closed_at` timestamps
- **Data Integrity**: Foreign key constraints with appropriate cascade rules
- **Performance**: Indexes on frequently queried columns (status, flight key, timestamps)
- **Denormalization**: `author_username` stored with comments for readable chat history even after user deletion
