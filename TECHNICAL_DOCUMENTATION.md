# DelayPilot Technical Documentation

## 1. System Architecture

DelayPilot is structured as a three-service system:

- React frontend on port `3000`
- Express/Node.js backend on port `5000`
- FastAPI prediction pipeline on port `8000`

The React frontend is the user-facing application. It handles authentication, dashboards, flight views, simulation controls, mitigation workflows, and the public passenger lookup page. The frontend talks primarily to the Express backend through `/api/...` endpoints configured in `src/config/api.js`.

The Express backend is the operational application server. It handles authentication, role-aware business endpoints, mitigation case persistence, comments, reactions, settings, login logs, deletion requests, and WebSocket-based collaboration. It also acts as the integration layer between the frontend and the FastAPI service.

The FastAPI pipeline is the prediction and live-data service. It exposes flight, weather, prediction, propagation, simulation, and pipeline-health endpoints. Express proxies these calls so the frontend has a single backend base URL.

### Service Communication Flow

1. React calls Express at `http://localhost:5000/api`.
2. Express handles local business/database routes directly.
3. For prediction routes, Express forwards requests to FastAPI at `FASTAPI_URL` (default `http://127.0.0.1:8000`).
4. FastAPI returns prediction/data responses to Express.
5. Express returns normalized JSON back to React.

### Database Role

PostgreSQL hosted through Supabase is the operational database for DelayPilot. It stores:

- users and access-control metadata
- login logs
- account deletion requests
- mitigation cases
- mitigation comments and reactions
- system settings
- delay trend history snapshots

The pipeline data itself is consumed through FastAPI, while Express stores application-side operational data in PostgreSQL.

### Express Proxy Pattern to FastAPI

`backend/routes/predictions.js` proxies frontend requests to FastAPI. Examples:

- `GET /api/predictions/flights` -> `GET {FASTAPI}/flights`
- `GET /api/predictions/weather` -> `GET {FASTAPI}/weather/current`
- `POST /api/predictions/predict` -> `POST {FASTAPI}/predict/from-db`
- `GET /api/predictions/propagation` -> `GET {FASTAPI}/flights/propagation`
- `POST /api/predictions/simulate` -> `POST {FASTAPI}/simulate`

This keeps the frontend decoupled from direct pipeline URLs and lets Express add validation, auth context, error normalization, and trend-history persistence.

## 2. Technology Stack

### Frontend

- React 18
- styled-components
- axios
- Chart.js via `react-chartjs-2`
- native browser WebSocket API

Requested architecture notes mention `recharts`, but the current frontend package manifest and source files show Chart.js/`react-chartjs-2` usage instead.

### Backend

- Node.js
- Express.js
- bcrypt
- jsonwebtoken (JWT)
- pg (`node-postgres`)
- axios for FastAPI proxy calls

### Database

- PostgreSQL via Supabase (cloud-hosted)

### External Service

- FastAPI prediction/data pipeline on port `8000`

## 3. Project Directory Structure

### Root

- `src/`: React application source
- `public/`: static frontend assets
- `package.json`: frontend dependencies and scripts
- `TECHNICAL_DOCUMENTATION.md`: this file
- `SYSTEM_OVERVIEW.md`: stakeholder-facing overview

### Frontend Source

- `src/App.js`
  Main application controller. Switches between landing, login, and authenticated app views; keeps simulation state at the app level so results persist across tab switches; periodically revalidates tokens; manages global alerts and admin deletion-request notifications.

- `src/config/api.js`
  Defines the frontend base API URL. Default is `http://localhost:5000/api`.

- `src/services/predictionService.js`
  Frontend prediction data layer. Contains:
  - all pipeline API calls
  - `fetchFlights()`, `fetchWeather()`, `predictFlight()`, `simulateFlight()`, `fetchPropagation()`
  - `postTrendSnapshot()` and `fetchTrendHistory()`
  - `mapFlight()` normalization logic
  - tiered delay-source selection logic
  - AOC helpers `filterFlightsForAoc()` and `filterCasesForAoc()`
  - KPI helper `computeKPIs()`

- `src/services/mitigationService.js`
  Frontend service wrapper for mitigation CRUD, comments, and reactions.

- `src/styles/components.styles.js`
  Central shared styled-components library. Contains design tokens, shared layout primitives, navigation styling, KPI card styling, flights table styling, analytics styling, mitigation board styling, simulation styling, and shared UI atoms.

### `src/components/`

This folder contains the application pages and reusable UI modules:

- `LandingPage.js`: public-facing passenger portal and operator entry page
- `LoginPage.js`: authenticated login flow with role selection and client-side lockout timer
- `Dashboard.js`: operational dashboard shell and KPI refresh orchestration
- `FlightsPage.js`: full flights table with filter/search/drawer details
- `FlightsTable.js`: compact dashboard flights table widget
- `VisualAnalytics.js`: delay charts and analytics visualizations
- `WeatherPanel.js`: live weather summary panel
- `KPICards.js`: KPI cards for total flights, on-time %, delay counts, etc.
- `QuickActions.js`: quick action buttons on dashboard pages
- `AlertsPanel.js`: role-visible alert display and add-to-board actions
- `SimulationPage.js`: what-if delay simulation UI
- `MitigationBoard.js`: Kanban-style mitigation tracker with comments, reactions, propagation display, and WebSocket logic
- `NavigationBar.js`: top navigation, notification UI, and role-specific tabs
- `PageLayout.js`: common page composition helper
- `Profile.js`: user profile, deletion request flow, password change UI
- `UserManagement.js`: admin user CRUD page
- `Settings.js`: admin settings page for role permissions and refresh settings
- `KPIReportModal.js`: KPI reporting modal
- `ForgotPasswordModal.js`: forgot/reset password dialog

### Backend

- `backend/server.js`
  Express entry point. Initializes DB, mounts route modules, enables CORS and JSON parsing, creates the HTTP server, and attaches a WebSocket server on the same port.

- `backend/config/database.js`
  PostgreSQL connection pool setup, `initDatabase()` table creation/bootstrap logic, default user seeding, settings seeding, and query retry behavior through `queryWithRetry()`.

- `backend/middleware/auth.js`
  Shared JWT verification middleware for authenticated routes.

- `backend/routes/auth.js`
  Authentication and user-management routes:
  - login
  - forgot/reset password
  - register
  - user CRUD
  - status toggle
  - profile retrieval
  - password change
  - deletion requests
  - login logs
  - settings
  Also defines `verifyAdmin` and `verifyUser` route-specific middleware.

- `backend/routes/mitigation.js`
  Mitigation case CRUD, case state transitions, comment CRUD, emoji reactions, archive retrieval, and permanent deletion for already closed cases.

- `backend/routes/predictions.js`
  Proxy routes to FastAPI plus local trend snapshot/trend history persistence.

## 4. Database Schema

All operational tables are created or updated from `backend/config/database.js`.

### `users`

Purpose: authenticated system users.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `SERIAL` | primary key |
| `username` | `VARCHAR(100)` | unique, not null |
| `password` | `VARCHAR(255)` | not null, bcrypt hash |
| `role` | `VARCHAR(50)` | not null |
| `name` | `VARCHAR(255)` | nullable |
| `email` | `VARCHAR(255)` | nullable in schema, required by route validation for created users |
| `airline` | `VARCHAR(100)` | nullable, used for AOC scoping |
| `status` | `VARCHAR(20)` | default `'active'` |
| `created_at` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMP` | default `CURRENT_TIMESTAMP` |
| `last_login` | `TIMESTAMPTZ` | added conditionally for existing DBs |

Indexes:

- `idx_users_username`

### `login_logs`

Purpose: records successful logins.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `SERIAL` | primary key |
| `user_id` | `INTEGER` | FK -> `users(id)`, `ON DELETE SET NULL` |
| `username` | `VARCHAR(100)` | nullable |
| `role` | `VARCHAR(50)` | nullable |
| `logged_in_at` | `TIMESTAMPTZ` | not null, default `NOW()` |
| `ip_address` | `VARCHAR(45)` | nullable |

Indexes:

- `idx_login_logs_logged_in_at`
- `idx_login_logs_user_id`

### `deletion_requests`

Purpose: user-submitted account deletion workflow.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `SERIAL` | primary key |
| `user_id` | `INTEGER` | not null, FK -> `users(id)`, `ON DELETE CASCADE` |
| `username` | `VARCHAR(100)` | not null |
| `name` | `VARCHAR(255)` | nullable |
| `role` | `VARCHAR(50)` | nullable |
| `requested_at` | `TIMESTAMPTZ` | not null, default `NOW()` |
| `status` | `VARCHAR(20)` | not null, default `'pending'` |
| `handled_at` | `TIMESTAMPTZ` | nullable |
| `handled_by` | `INTEGER` | FK -> `users(id)`, `ON DELETE SET NULL` |

Indexes / constraints:

- unique partial index `idx_deletion_requests_user_pending` on one pending request per user
- `idx_deletion_requests_status`

### `mitigation_cases`

Purpose: operational mitigation tracker cards.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `SERIAL` | primary key |
| `flight_number` | `VARCHAR(20)` | not null |
| `sched_utc` | `TIMESTAMPTZ` | not null |
| `airline_code` | `VARCHAR(10)` | nullable |
| `route` | `VARCHAR(30)` | nullable |
| `predicted_delay_min` | `FLOAT` | nullable |
| `risk_level` | `VARCHAR(20)` | nullable |
| `likely_cause` | `VARCHAR(50)` | nullable |
| `tagged_causes` | `TEXT[]` | not null, default empty array |
| `movement` | `VARCHAR(20)` | nullable |
| `status` | `VARCHAR(30)` | not null, default `'delayNoted'` |
| `deadline` | `TIMESTAMPTZ` | nullable |
| `version` | `INTEGER` | not null, default `1` |
| `created_by_user_id` | `INTEGER` | FK -> `users(id)`, `ON DELETE SET NULL` |
| `created_at` | `TIMESTAMPTZ` | not null, default `CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMPTZ` | not null, default `CURRENT_TIMESTAMP` |
| `resolved_at` | `TIMESTAMPTZ` | nullable |
| `closed_at` | `TIMESTAMPTZ` | nullable |

Indexes:

- `idx_cases_status`
- `idx_cases_flight`
- `idx_cases_created_at`

### `case_comments`

Purpose: mitigation case discussion thread.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `SERIAL` | primary key |
| `case_id` | `INTEGER` | not null, FK -> `mitigation_cases(id)`, `ON DELETE CASCADE` |
| `author_user_id` | `INTEGER` | FK -> `users(id)`, `ON DELETE SET NULL` |
| `author_username` | `VARCHAR(100)` | not null |
| `comment_text` | `TEXT` | not null |
| `parent_comment_id` | `INTEGER` | self-FK -> `case_comments(id)`, `ON DELETE CASCADE`, nullable |
| `created_at` | `TIMESTAMPTZ` | not null, default `CURRENT_TIMESTAMP` |

Indexes:

- `idx_comments_case_id`
- `idx_comments_created_at`

### `comment_reactions`

Purpose: emoji reactions on mitigation comments.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `SERIAL` | primary key |
| `comment_id` | `INTEGER` | not null, FK -> `case_comments(id)`, `ON DELETE CASCADE` |
| `user_id` | `INTEGER` | not null, FK -> `users(id)`, `ON DELETE CASCADE` |
| `emoji` | `VARCHAR(10)` | not null |
| `created_at` | `TIMESTAMPTZ` | not null, default `NOW()` |

Constraints:

- unique on (`comment_id`, `user_id`, `emoji`)

Indexes:

- `idx_reactions_comment_id`

### `system_settings`

Purpose: simple key-value configuration store.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `SERIAL` | primary key |
| `key` | `VARCHAR(100)` | unique, not null |
| `value` | `TEXT` | not null |
| `updated_at` | `TIMESTAMPTZ` | default `NOW()` |

### `delay_trend_history`

Purpose: persisted hourly KPI snapshots for trend charts.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `SERIAL` | primary key |
| `snapshot_hour` | `TIMESTAMPTZ` | not null, unique |
| `total_flights` | `INTEGER` | not null, default `0` |
| `delayed_flights` | `INTEGER` | not null, default `0` |
| `avg_delay_min` | `FLOAT` | nullable |
| `date` | `DATE` | not null |
| `created_at` | `TIMESTAMPTZ` | not null, default `NOW()` |
| `updated_at` | `TIMESTAMPTZ` | not null, default `NOW()` |

Indexes:

- `idx_delay_trend_date`

### Additional Table Present in Code

`password_reset_tokens` also exists in the current implementation for forgot/reset password support, although it was not part of the requested schema list.

## 5. Authentication and Security

### JWT-Based Authentication

- On successful login, the backend signs a JWT containing `id`, `username`, and `role`.
- Token expiry is `24h`.
- The frontend stores the token in `localStorage` under `token`.
- Authenticated frontend requests send `Authorization: Bearer <token>`.

### Password Hashing

- Passwords are hashed with `bcrypt.hash(..., 10)`.
- Password checks use `bcrypt.compare(...)`.

### Access Control

Roles used in the system:

- `Admin`
- `APOC`
- `AOC`
- `ATC`

Enforcement mechanisms:

- `verifyToken` in `backend/middleware/auth.js` protects mitigation routes
- `verifyAdmin` in `backend/routes/auth.js` restricts admin-only auth/settings/user routes
- `verifyUser` in `backend/routes/auth.js` protects authenticated profile/deletion flows

### Login Lockout

Login lockout is implemented client-side in `src/components/LoginPage.js`:

- 3 wrong-password attempts trigger a 15-second password lockout
- state is persisted in `localStorage` using:
  - `login_password_attempts`
  - `login_lockout_until`
- this persistence survives tab switches and reloads during the lockout window

### Step-by-Step Login Logic

Backend login flow in `POST /api/auth/login`:

1. Validate that username, password, and role were submitted
2. Check whether the username exists
3. Check whether the selected role matches the user record
4. Check whether the account status is `active`
5. Compare password hash with bcrypt
6. Generate JWT
7. Insert login log row
8. Return token and user payload

## 6. API Endpoints

The list below documents the current implementation. A few requested endpoints differ slightly in code:

- `PUT /api/auth/profile` is not currently implemented
- requested `POST /api/auth/change-password` exists instead as `PUT /api/auth/profile/password`
- `GET /api/auth/verify`, `POST /api/auth/forgot-password`, and `POST /api/auth/reset-password` also exist
- `DELETE /api/mitigation/cases/:id/permanent` also exists

### Auth Routes (`/api/auth/...`)

#### `POST /login`

- Auth: no
- Body: `{ username, password, role, airline? }`
- Response: `{ success, message, token, user }`

#### `POST /register`

- Auth: admin only
- Body: `{ username, password, role, email, name?, airline? }`
- Response: `{ success, message, user }`

#### `GET /users`

- Auth: admin only
- Params: none
- Response: `{ success, users: [...] }`

#### `PUT /users/:id`

- Auth: admin only
- Params: `id`
- Body: any of `{ username, password, role, email, name, airline }`
- Response: `{ success, message, user }`

#### `DELETE /users/:id`

- Auth: admin only
- Params: `id`
- Response: `{ success, message }`

#### `PATCH /users/:id/status`

- Auth: admin only
- Params: `id`
- Body: none
- Response: `{ success, message, user }`

#### `GET /profile`

- Auth: authenticated user
- Params: none
- Response: `{ success, user }`

#### `PUT /profile`

- Requested in outline, but not present in current backend code.

#### `POST /change-password`

- Requested in outline, but not present in current backend code.

#### `PUT /profile/password`

- Auth: authenticated user
- Body: `{ currentPassword, newPassword, confirmPassword }`
- Response: `{ success, message }`

#### `POST /deletion-request`

- Auth: authenticated user
- Body: none
- Response: `{ success, message }`

#### `GET /deletion-request/status`

- Auth: authenticated user
- Params: none
- Response: `{ success, hasPending, wasRejected }`

#### `GET /deletion-requests`

- Auth: admin only
- Response: `{ success, requests }`

#### `DELETE /deletion-requests/:id`

- Auth: admin only
- Params: `id`
- Body: `{ action: "approve" | "reject" }`
- Response: `{ success, message }`

#### `GET /login-logs`

- Auth: admin only
- Response: `{ success, logs }`

#### `GET /settings`

- Auth: admin only
- Response: `{ success, settings }`

#### `PUT /settings`

- Auth: admin only
- Body: `{ key, value }`
- Response: `{ success, message }`

#### Additional Auth Endpoints Present

- `GET /verify`
- `POST /forgot-password`
- `POST /reset-password`

### Mitigation Routes (`/api/mitigation/...`)

All current mitigation routes require JWT auth via `verifyToken`.

#### `GET /cases`

- Response: `{ success, cases }`

#### `GET /cases/closed`

- Response: `{ success, cases }`

#### `POST /cases`

- Body: `{ flight_number, sched_utc, airline_code?, route?, predicted_delay_min?, risk_level?, likely_cause?, tagged_causes?, movement?, deadline? }`
- Response: `{ success, message, case }`

#### `PATCH /cases/:id`

- Body: any of `{ tagged_causes, deadline, risk_level, likely_cause, route, airline_code, version? }`
- Response: `{ success, message, case }`

#### `PATCH /cases/:id/status`

- Body: `{ status, version? }`
- Response: `{ success, message, case }`

#### `DELETE /cases/:id`

- Behavior: soft-close case by setting status to `closed`
- Body: `{ version? }`
- Response: `{ success, message, case }`

#### `GET /cases/:id/comments`

- Response: `{ success, comments }`

#### `POST /cases/:id/comments`

- Body: `{ comment_text, author_username?, parent_comment_id? }`
- Response: `{ success, message, comment }`

#### `DELETE /cases/:caseId/comments/:commentId`

- Response: `{ success }`

#### `POST /cases/:caseId/comments/:commentId/reactions`

- Body: `{ emoji }`
- Response: `{ success, reactions }`

#### Additional Mitigation Endpoint Present

- `DELETE /cases/:id/permanent` for permanently deleting already-closed cases

### Prediction Routes (`/api/predictions/...`)

These are implemented as Express-to-FastAPI proxy routes, plus local trend persistence.

#### `GET /health`

- Auth: no route-level auth in current code
- Response on success: `{ pipeline: "connected", fastapi: ... }`
- Response on failure: `{ pipeline: "disconnected" }`

#### `GET /pipeline-logs`

- Auth: no route-level auth in current code
- Response: pipeline log payload or fallback `{ logs, health }`

#### `GET /flights`

- Auth: no route-level auth in current code
- Query: `date`
- Response: array of flight rows from FastAPI

#### `GET /weather`

- Auth: no route-level auth in current code
- Response: current weather object enriched with `timestamp` and `data_hour`

#### `POST /predict`

- Auth: no route-level auth in current code
- Body: `{ number_raw, sched_utc }`
- Response: FastAPI prediction payload

#### `GET /propagation`

- Auth: no route-level auth in current code
- Query: `number_raw`, `sched_utc`
- Response: propagation / connected flight payload

#### `POST /simulate`

- Auth: no route-level auth in current code
- Body: simulation override payload
- Response: simulation result or normalized pipeline error

#### `POST /trend-snapshot`

- Auth: no route-level auth in current code
- Body: `{ total_flights, delayed_flights, avg_delay_min }`
- Response: `{ success: true }`

#### `GET /trend-history`

- Auth: no route-level auth in current code
- Query: `days`
- Response: `{ success, history }`

## 7. Real-Time Features

### WebSocket Server

- WebSocket server is attached in `backend/server.js`
- It runs on the same HTTP server and port as Express (`5000`)
- Implementation uses the `ws` package server-side and native `WebSocket` in the browser

### Room-Based Model

- Server keeps `Map<caseId, Set<WebSocket>>`
- Each mitigation case acts as a room
- Clients join/leave rooms using messages after auth

### WebSocket Authentication

The first client message must be:

- `{ type: "auth", token }`

The backend verifies the JWT before allowing the socket session to continue.

### Message Types

Broadcast message types used in the mitigation board:

- `comment`
- `comment_deleted`
- `reaction_update`

### Fallback Behavior

In `MitigationBoard.js`, the frontend falls back to polling case comments every 5 seconds whenever the WebSocket is not open.

## 8. Frontend Data Flow

### Flight Loading

`fetchFlights()` flow:

1. frontend calls `GET /api/predictions/flights`
2. Express proxies to FastAPI `GET /flights`
3. FastAPI returns joined flight/prediction/status data
4. frontend maps raw rows through `mapFlight()`

Per the requested architecture, this data comes from `featured_muc_rxn_wx3_fe` joined with `flight_predictions` and `flight_status_live`.

### `mapFlight()` Normalization

`mapFlight()` in `src/services/predictionService.js` applies a tiered delay-source strategy:

1. confirmed status API delay
2. FIDS observed delay
3. ML model delay estimate
4. FIDS binary labels as last resort

It computes:

- UI status
- delay source
- delay magnitude
- route labels
- likely cause
- parsed `cause_scores`
- derived status flags

### AOC Filtering

- `filterFlightsForAoc()` filters flights client-side for AOC users
- `filterCasesForAoc()` filters mitigation cases client-side for AOC users
- both rely on airline mapping derived from the logged-in user’s `airline` field

### KPI Computation

`computeKPIs()` derives:

- total flights
- on-time count and percentage
- delayed counts
- average delay minutes
- cancelled/diverted counts

### Simulation State Persistence

Simulation state is lifted to `src/App.js`:

- selected flight
- parameter overrides
- latest simulation result

This preserves simulation context across tab switches.

## 9. Role-Based Access Control

### Admin

- access to `User Management`, `Settings`, and profile/admin workflows
- no operational dashboard pages by default

### APOC

- full operational access across dashboard, flights, simulation, alerts, and mitigation board

### AOC

- same operational feature set as APOC
- data is visually scoped to the user’s airline on the frontend

### ATC

- view-only operational access
- no simulation execution
- no mitigation editing when role permissions are enforced

### AOC Airline Field

- stored in `users.airline`
- returned on login
- used on the frontend for airline-scoped filtering
- not enforced as a backend row-level database restriction in current code

## 10. Environment Configuration

### Backend `.env`

- `DATABASE_URL`: Supabase PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `PORT`: Express port, default `5000`
- `FRONTEND_URL`: CORS origin allow-list value for production mode
- `FASTAPI_URL`: FastAPI pipeline URL, default `http://127.0.0.1:8000`

Additional backend variables supported in `database.js` for non-`DATABASE_URL` setups:

- `DB_USER`
- `DB_HOST`
- `DB_NAME`
- `DB_PASSWORD`
- `DB_PORT`
- `DB_SSL`

### Frontend `.env`

- `REACT_APP_API_URL`: Express backend API base, default `http://localhost:5000/api`

## 11. Setup and Run Instructions

1. Clone the repository and open the `UI_60` / project root folder.
2. Run `npm install` in the root to install React dependencies.
3. Run `cd backend` then `npm install` to install backend dependencies.
4. Create `backend/.env` and set at least:
   - `DATABASE_URL`
   - `JWT_SECRET`
5. Start Express from `backend/` with `npm start`.
6. Start React from the root with `npm start`.
7. Ensure the FastAPI pipeline is running separately on port `8000`.

## 12. Implementation Notes

- The requested documentation outline mentions `recharts`, but the current frontend uses Chart.js through `react-chartjs-2`.
- The requested outline mentions `verifyAdmin` in `auth.js` and `verifyToken` generally; the current code uses:
  - `verifyToken` in `backend/middleware/auth.js`
  - `verifyAdmin` and `verifyUser` defined inside `backend/routes/auth.js`
- `GET /api/auth/profile` exists, but `PUT /api/auth/profile` does not currently exist.
- Password change exists as `PUT /api/auth/profile/password`, not `POST /api/auth/change-password`.
- Prediction routes are currently unauthenticated at route level in `backend/routes/predictions.js`, even though the frontend usually sends JWT headers through `predictionService`.
