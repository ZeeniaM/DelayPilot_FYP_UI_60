# DelayPilot SafeFYP1 - Complete Technical Documentation

**Last Updated:** March 7, 2026  
**Project Type:** Full-Stack Web Application (React + Node.js + PostgreSQL)  
**Purpose:** Aviation Flight Delay Management System for Airline Operations Centers

---

## 📑 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Data Flow](#architecture--data-flow)
3. [Technology Stack](#technology-stack)
4. [Directory Structure](#directory-structure)
5. [Backend Files Explained](#backend-files-explained)
6. [Frontend Files Explained](#frontend-files-explained)
7. [Database Configuration](#database-configuration)
8. [Authentication Flow](#authentication-flow)
9. [API Endpoints](#api-endpoints)
10. [File Dependencies](#file-dependencies)
11. [Unused/Extra Files](#unusedextra-files)
12. [Setup & Execution](#setup--execution)
13. [Detailed Technical Working](#detailed-technical-working)

---

## 🎯 Project Overview

**DelayPilot** is a comprehensive aviation flight delay management system designed for airline operations centers. It provides:

- **Real-time Flight Monitoring** - Dashboard with KPI metrics, weather data, and alerts
- **Flight Management** - Detailed flight overview with filtering and search capabilities
- **Delay Simulation** - Test impact of various delay scenarios
- **Mitigation Tracking** - Kanban-style workflow for managing delay cases
- **Role-Based Access Control** - Different permissions for Admin, APOC, AOC, ATC users
- **Authentication & Security** - JWT-based secure authentication with bcrypt password hashing

**Target Users:**
- APOC (Airline Operations Control) - Full access
- AOC (Airline Operations Center) - Full access
- ATC (Air Traffic Control) - Read-only access
- Admin - System administration and user management

---

## 🏗️ Architecture & Data Flow

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
│                     (Web Browser - :3000)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    HTTP/AXIOS Requests
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    FRONTEND: React App                           │
│                  (http://localhost:3000)                         │
│                                                                   │
│  • LoginPage (Authentication)                                    │
│  • Dashboard (KPIs, Alerts, Weather)                             │
│  • FlightsPage (Flight Management)                               │
│  • SimulationPage (Delay Simulation)                             │
│  • MitigationBoard (Case Tracking)                               │
│  • UserManagement (Admin Panel)                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    AXIOS HTTP Calls
                  /api/auth/*, /api/health
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    BACKEND: Express API                          │
│                  (http://localhost:5000)                         │
│                                                                   │
│  Server Entry: server.js                                         │
│  • CORS enabled (:3000)                                          │
│  • Health check endpoint                                         │
│  • Authentication routes (routes/auth.js)                        │
│  • Database connection (config/database.js)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                 PostgreSQL Connection String
                 (DATABASE_URL in .env)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                  DATABASE: PostgreSQL                            │
│                                                                   │
│  Option 1: Supabase Cloud (Recommended) ⭐                      │
│  • Connection: db.[PROJECT-REF].supabase.co:5432                │
│  • SSL Required: true                                            │
│                                                                   │
│  Option 2: Local PostgreSQL                                      │
│  • Connection: localhost:5432                                    │
│  • SSL: false                                                    │
│                                                                   │
│  Tables:                                                         │
│  └─ users (id, username, password, role, email, name, status)  │
└────────────────────────────────────────────────────────────────┘
```

### Detailed Data Flow: User Login

```
1. USER INPUT
   └─> LoginPage.js collects username, password, role

2. FRONTEND VALIDATION & API CALL
   └─> axios.post('http://localhost:5000/api/auth/login', {...})

3. BACKEND AUTHENTICATION
   └─> routes/auth.js:
       ├─ Receive request
       ├─ Query PostgreSQL: "SELECT FROM users WHERE username=$1 AND role=$2"
       ├─ Validate password using bcrypt.compare()
       ├─ Generate JWT token (24h expiry)
       └─ Return token + user data

4. FRONTEND TOKEN STORAGE
   └─> localStorage.setItem('token', token)
   └─> localStorage.setItem('user', userDataJSON)

5. SUBSEQUENT API CALLS
   └─> axios defaults include:
       ├─ Headers: { Authorization: 'Bearer <token>' }
       └─> Token sent with every API request

6. BACKEND VERIFICATION
   └─> Middleware extracts token from header
   └─> jwt.verify() validates signature & expiry
   └─> User ID extracted from token payload
   └─ Request processed
```

---

## 🛠️ Technology Stack

### Frontend Stack

| Library | Version | Purpose |
|---------|---------|---------|
| **React** | 18.2.0 | UI component framework |
| **React Router DOM** | 6.3.0 | Client-side routing & navigation |
| **Styled Components** | 5.3.5 | CSS-in-JS styling system |
| **Axios** | 1.13.2 | HTTP client for API calls |
| **Chart.js** | 4.5.0 | Data visualization library |
| **React Chart.js 2** | 5.3.0 | React wrapper for Chart.js |
| **React Scripts** | 5.0.1 | Create React App build tools |

### Backend Stack

| Library | Version | Purpose |
|---------|---------|---------|
| **Node.js** | Latest | JavaScript runtime |
| **Express** | 4.18.2 | Web framework for API server |
| **PostgreSQL Driver (pg)** | 8.11.3 | Database connection |
| **Bcrypt** | 5.1.1 | Password hashing & verification |
| **JsonWebToken (jwt)** | 9.0.2 | JWT token generation & verification |
| **CORS** | 2.8.5 | Cross-origin request handling |
| **dotenv** | 16.3.1 | Environment variable management |
| **Nodemon** | 3.0.2 | (Dev) Auto-restart on code changes |

### Database

| Type | Option | Configuration |
|------|--------|---|
| **PostgreSQL** | Supabase Cloud (Default) | `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres` |
| **PostgreSQL** | Local Installation | `localhost:5432/delaypilot` |

---

## 📁 Directory Structure

### Complete Project Layout

```
SafeFYP1/
│
├── 📄 README.md                          ← Project overview
├── 📄 SETUP_GUIDE.md                     ← Setup instructions
├── 📄 Frontend_README.md                 ← Frontend docs
├── 📄 START_PROJECT.md                   ← How to start servers
├── 📄 SUPABASE_SETUP.md                  ← Supabase configuration
├── 📄 BACKEND_CONNECTION_SUMMARY.md      ← Backend overview
│
├── 🔧 backend/                           ← Node.js/Express Server
│   ├── server.js                         ✅ MAIN FILE: Express app setup & startup
│   ├── package.json                      ✅ Backend dependencies & scripts
│   │
│   ├── 📁 config/
│   │   └── database.js                   ✅ PostgreSQL connection & table init
│   │
│   ├── 📁 routes/
│   │   └── auth.js                       ✅ Authentication endpoints (login, register)
│   │
│   ├── .env                              ⚙️ REQUIRED: Database credentials (NOT in git)
│   ├── env.template                      📝 Template for .env file
│   │
│   ├── 📝 Setup Guides (Auxiliary):
│   │   ├── QUICK_START.md
│   │   ├── QUICK_SETUP.md
│   │   ├── README.md
│   │   ├── README_SETUP.md
│   │   ├── ADD_DATABASE_URL.md
│   │   ├── CHECKLIST.md
│   │   ├── CONNECTION_STATUS.md
│   │   ├── FINAL_SETUP_STEPS.md
│   │   ├── FIX_CONNECTION.md
│   │   ├── FIX_SUPABASE_CONNECTION.md
│   │   ├── SETUP_INSTRUCTIONS.txt
│   │   └── WHAT_TO_DO_NEXT.txt
│   │
│   ├── 🔧 Helper Scripts (Utilities):
│   │   ├── create-env.js                 🛠️ Interactive helper to create .env
│   │   ├── update-env.js                 🛠️ Helper to update .env with connection string
│   │   ├── fix-connection-string.js      🛠️ Helper to fix connection issues
│   │   ├── test-connection.js            🧪 Test database connection
│   │   └── test-both-formats.js          🧪 Test different connection formats
│   │
│   ├── node_modules/                     (Generated) Installed packages
│   ├── package-lock.json                 (Generated) Dependency lock file
│   └── .gitignore
│
├── 🎨 src/                               ← React Frontend
│   ├── App.js                            ✅ MAIN FILE: Root component with routing
│   ├── App.css                           🎨 Root styles
│   ├── index.js                          ✅ React entry point (mounts to #root)
│   ├── index.css                         🎨 Global styles
│   │
│   ├── 📁 config/
│   │   └── api.js                        ⚙️ API base URL configuration (port settings)
│   │
│   ├── 📁 components/                    ← All React Components (18 files)
│   │   ├── LoginPage.js                  ✅ Authentication UI (connects to /api/auth/login)
│   │   ├── Dashboard.js                  ✅ Main dashboard view
│   │   ├── FlightsPage.js                ✅ Flight management page
│   │   ├── FlightsTable.js               ✅ Reusable flights table component
│   │   ├── SimulationPage.js             ✅ Delay simulation tool
│   │   ├── MitigationBoard.js            ✅ Kanban-style mitigation tracking
│   │   ├── UserManagement.js             ✅ Admin user management (role: Admin only)
│   │   ├── Settings.js                   ✅ User settings page
│   │   ├── Profile.js                    ✅ User profile page
│   │   ├── NavigationBar.js              ✅ Top navigation with tabs
│   │   ├── PageLayout.js                 ✅ Layout wrapper component
│   │   ├── KPICards.js                   ✅ Key Performance Indicators display
│   │   ├── VisualAnalytics.js            ✅ Chart.js for data visualization
│   │   ├── WeatherPanel.js               ✅ Weather information display
│   │   ├── AlertsPanel.js                ✅ Alert notifications
│   │   ├── QuickActions.js               ✅ Quick action buttons
│   │   ├── KPIReportModal.js             ✅ Reports modal
│   │   └── ForgotPasswordModal.js        ✅ Password recovery modal
│   │
│   └── (node_modules, .env, etc)
│
├── 📁 public/
│   ├── index.html                        ✅ HTML template (root #root div)
│   └── (favicon, manifest, etc)
│
├── package.json                          ✅ Frontend dependencies & scripts
├── package-lock.json                     (Generated) Lock file
├── .gitignore
└── node_modules/                         (Generated) Installed packages

```

### Legend
- ✅ **CORE FILES**: Essential for application function
- ⚙️ **CONFIG FILES**: Needed for setup/configuration
- 📝 **DOCUMENTATION**: Guides and help files
- 🛠️ **UTILITIES**: Helper scripts for development/setup
- 🧪 **TEST FILES**: Connection & testing scripts
- 🎨 **STYLE FILES**: CSS and styling

---

## 🔧 Backend Files Explained

### Core Backend Files (Essential)

#### **server.js** ✅ Main Entry Point
**Purpose:** Express server initialization and startup  
**Runs on:** `http://localhost:5000`

**Key Responsibilities:**
```javascript
1. Import dependencies (express, cors, dotenv, routes/database)
2. Load environment variables from .env
3. Create Express app with middleware:
   - CORS (allows requests from http://localhost:3000)
   - JSON body parser
   - Request logging middleware
4. Set up routes:
   - GET /api/health → Health check endpoint
   - POST /api/auth/login → User authentication
   - POST /api/auth/register → User registration
   - GET /api/auth/verify → Token verification
5. Error handling middleware (500 errors)
6. 404 handler for undefined routes
7. Initialize database and start listening on PORT (default 5000)
```

**Code Entry Point:**
```javascript
const startServer = async () => {
  await initDatabase();  // Create tables, default users
  app.listen(PORT);      // Start server
};
startServer();
```

---

#### **config/database.js** ✅ Database Connection & Schema
**Purpose:** PostgreSQL connection pool management and table initialization

**Key Responsibilities:**
1. **Connection Pool Setup:**
   - Reads `DATABASE_URL` from .env (Supabase preferred)
   - Falls back to individual DB parameters if DATABASE_URL not set
   - Configures SSL for Supabase (rejectUnauthorized: false)
   - Pool max connections: 20
   - Idle timeout: 30 seconds
   - Connection timeout: 10 seconds

2. **Connection Retry Logic:**
   - Implements exponential backoff for failed connections
   - Retries up to 3 times on connection errors
   - Handles transient network issues

3. **Database Initialization (initDatabase function):**
   - Creates `users` table if not exists:
     ```sql
     CREATE TABLE users (
       id SERIAL PRIMARY KEY,
       username VARCHAR(100) UNIQUE NOT NULL,
       password VARCHAR(255) NOT NULL,
       role VARCHAR(50) NOT NULL,
       name VARCHAR(255),
       email VARCHAR(255),
       status VARCHAR(20) DEFAULT 'active',
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
     ```
   - Creates index on username column for fast login lookups
   - Adds missing columns to existing databases (name, status)
   - **Creates default users on first startup:**
     - admin / admin123 (Admin role)
     - apoc / apoc123 (APOC role)
     - atc / atc123 (ATC role)
     - aoc / aoc123 (AOC role)

4. **Query Function with Retry:**
   - Exports `query()` function for parameterized queries
   - Prevents SQL injection using $1, $2 placeholders
   - Used by routes/auth.js for database operations

---

#### **routes/auth.js** ✅ Authentication Endpoints
**Purpose:** Implement authentication logic and user management endpoints

**Endpoints Implemented:**

##### **POST /api/auth/login** (Main Auth Endpoint)
```
Request Body:
{
  "username": "admin",
  "password": "admin123",
  "role": "Admin"
}

Response Success (200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "Admin",
    "email": "admin@delaypilot.com",
    "name": "Administrator"
  }
}

Response Error (401):
{
  "success": false,
  "message": "Password or username is invalid"
}
```

**Login Process:**
1. Validate username, password, role not empty
2. Query database: `SELECT * FROM users WHERE username=$1 AND role=$2`
3. Check if user exists, if not return 401
4. Check user account status (must be 'active')
5. Use bcrypt.compare() to verify password hash
6. If valid, generate JWT token:
   ```javascript
   jwt.sign({ id, username, role }, JWT_SECRET, { expiresIn: '24h' })
   ```
7. Return token and user data (excluding password)

**Security Features:**
- Bcrypt password verification (not plain text comparison)
- Passwords stored as bcrypt hashes (not reversible)
- JWT tokens expire in 24 hours
- Account status checks (inactive users blocked)
- Generic error messages (don't leak username existence)

##### **POST /api/auth/register** (User Registration)
- Creates new user account
- Validates username (4-20 chars, alphanumeric only)
- Validates password (min 8 chars, must have letters & numbers)
- Hashes password with bcrypt (10 salt rounds)
- Stores in users table

##### **GET /api/auth/verify** (Token Verification)
- Extracts JWT from Authorization header: `Bearer <token>`
- Verifies token signature and expiry
- Returns current user data if valid
- Returns 401 if invalid or expired

**Middleware Functions:**
- `verifyAdmin()` - Checks if user has Admin role (used for admin-only endpoints)
- Password validation functions
- Username validation functions

---

### Configuration Files

#### **.env** ⚙️ REQUIRED - Database Credentials
**IMPORTANT:** This file is **generated from env.template** and contains sensitive data
- **NOT committed to git** (listed in .gitignore)
- **Must be created manually** for each environment

**Required Variables:**
```env
# Supabase Connection (Recommended)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DB_SSL=true

# OR Local PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=delaypilot
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Server Config
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

#### **env.template** 📝 Template for .env
- Provided as a reference
- Contains all required variables with examples
- Copy to `.env` and fill in actual values
- Never commit `.env` to version control

---

### Utility & Helper Files (Optional but useful)

#### **create-env.js** 🛠️ Interactive Setup Helper
```bash
Usage: node create-env.js
```
- Prompts user to enter Supabase connection string
- Creates `.env` file automatically
- Useful for first-time setup

#### **update-env.js** 🛠️ Update Connection String
```bash
Usage: node update-env.js
```
- Helps update DATABASE_URL in existing .env
- Useful if connection string changes

#### **test-connection.js** 🧪 Connection Verification
```bash
Usage: npm run test-connection
```
Output on success:
```
✅ DATABASE_URL found in .env
✅ Connection successful!
✅ Users table exists
🎉 Everything looks good!
```
Tests:
1. Reads DATABASE_URL from .env
2. Attempts connection to PostgreSQL
3. Verifies users table exists
4. Helps debug connection issues

#### **test-both-formats.js** 🧪 Format Compatibility Test
- Tests both direct connection and pooler formats
- Useful for Supabase setup troubleshooting

---

### Dependency Management

#### **package.json** (Backend)
```json
{
  "name": "delaypilot-backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",          // ← Runs production
    "dev": "nodemon server.js",         // ← Dev with auto-reload
    "test-connection": "node test-connection.js"
  },
  "dependencies": {
    "express": "4.18.2",          // Web framework
    "pg": "8.11.3",               // PostgreSQL driver
    "bcrypt": "5.1.1",            // Password hashing
    "jsonwebtoken": "9.0.2",      // JWT tokens
    "cors": "2.8.5",              // CORS middleware
    "dotenv": "16.3.1"            // Load .env variables
  }
}
```

---

## 🎨 Frontend Files Explained

### Core Frontend Files (Essential)

#### **src/index.js** ✅ React Entry Point
**Purpose:** Initialize React and mount to DOM

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Find <div id="root"></div> in public/index.html
// Render <App /> component into it
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Process:**
1. Loads when page opens in browser
2. Imports App component
3. Renders App into `#root` div from public/index.html

---

#### **src/App.js** ✅ Main App Component
**Purpose:** Main routing and state management for entire application

**Key State Variables:**
```javascript
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [userRole, setUserRole] = useState('APOC');
const [userName, setUserName] = useState('');
const [activeTab, setActiveTab] = useState('Dashboard');
```

**Main Functions:**
1. **handleLogin(userData):**
   - Called when user successfully logs in
   - Receives token and user data from LoginPage
   - Stores token in localStorage: `localStorage.setItem('token', token)`
   - Stores user data in localStorage: `localStorage.setItem('user', userJSON)`
   - Redirects Admin users to User Management, others to Dashboard
   - Sets isLoggedIn = true

2. **handleLogout():**
   - Clears localStorage: removes token and user
   - Resets all state variables

3. **handleTabChange(tab):**
   - Updates activeTab state
   - Causes renderActivePage() to display new component

4. **renderActivePage():**
   - Switch statement based on activeTab
   - Renders appropriate component:
     - Dashboard → Dashboard.js
     - Flights → FlightsPage.js
     - Simulation → SimulationPage.js
     - Mitigation Board → MitigationBoard.js
     - User Management → UserManagement.js (Admin only)
     - Settings → Settings.js
     - Profile → Profile.js

**Conditional Rendering:**
```javascript
if (!isLoggedIn) {
  return <LoginPage onLogin={handleLogin} />;  // Show if not logged in
} else {
  return renderActivePage();  // Show appropriate page based on tab
}
```

---

#### **src/config/api.js** ⚙️ API Configuration
**Purpose:** Central configuration for backend API URL

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export default API_BASE_URL;
```

**⚠️ IMPORTANT ISSUE:**
- Currently points to `http://localhost:8000` (FastAPI server)
- **Should be changed to** `http://localhost:5000` (Express server used in this project)
- Either:
  - Edit directly: Change '8000' to '5000'
  - Create `.env` file: Set `REACT_APP_API_URL=http://localhost:5000`

**Usage by Components:**
```javascript
import API_BASE_URL from '../config/api';
axios.post(`${API_BASE_URL}/auth/login`, { ... });
```

---

#### **src/components/LoginPage.js** ✅ Authentication Component
**Purpose:** User login interface and authentication

**Key Functionality:**
1. **Renders form with:**
   - Username input field
   - Password input field
   - Role dropdown (Admin, APOC, AOC, ATC)
   - Login button
   - Forgot password link

2. **Form Submission:**
   ```javascript
   async handleLoginSubmit(e) {
     e.preventDefault();
     
     // Make API call to backend
     const response = await axios.post(
       `${API_BASE_URL}/auth/login`,
       { username, password, role }
     );
     
     if (response.data.success) {
       // Backend returned token and user data
       tokenData = response.data;
       onLogin(tokenData.user);    // Pass to App.js
     } else {
       // Show error message
     }
   }
   ```

3. **Error Handling:**
   - Network errors displayed to user
   - Invalid credentials shown as alert
   - Loading state while request pending

4. **Local Storage:**
   - Token stored: `localStorage.setItem('token', response.data.token)`
   - User data stored: `localStorage.setItem('user', JSON.stringify(userData))`
   - Used for subsequent API calls as Authorization header

---

### Dashboard Components

#### **src/components/Dashboard.js** ✅ Main Dashboard
**Purpose:** Home page showing overview of flight operations

**Sub-components Used:**
- NavigationBar - Top navigation with tabs
- KPICards - Key performance indicators
- FlightsTable - List of flights
- WeatherPanel - Weather information
- VisualAnalytics - Charts and graphs
- QuickActions - Quick action buttons
- AlertsPanel - Alert notifications

**Data Display:**
- Real-time flight metrics
- Delay statistics
- Weather conditions
- System alerts
- Quick access to other modules

---

#### **src/components/NavigationBar.js** ✅ Navigation Header
**Purpose:** Top navigation bar with tab switching

**Features:**
- DelayPilot logo (left)
- Navigation tabs (center):
  - Dashboard
  - Flights
  - Simulation
  - Mitigation Board
  - User Management (Admin only)
  - Settings
  - Profile
- User info and Logout button (right)

**Functionality:**
- Sticky positioned (stays at top)
- Role-based tab visibility (User Management only for Admin)
- Tab click triggers onTabChange() in App.js
- Logout button clears session

---

### Flight Management Components

#### **src/components/FlightsPage.js** ✅ Flights Overview
**Purpose:** Comprehensive flight management and tracking

**Features:**
- Displays FlightsTable component
- Advanced filtering options
- Flight status updates
- Delay tracking
- Integration with Mitigation Board

---

#### **src/components/FlightsTable.js** ✅ Reusable Flights Table
**Purpose:** Tabular display of flight data

**Features:**
- Sortable columns
- Filtering capabilities
- Real-time status updates
- Click for detailed view

---

### Operations Components

#### **src/components/SimulationPage.js** ✅ Delay Simulation Tool
**Purpose:** Test impact of hypothetical delay scenarios

**Simulation Features:**
- Weather condition selection (Clear, Rain, Fog, Thunderstorm, Snow)
- Traffic load adjustment
- Time modifications
- Impact analysis on connected flights
- Real-time KPI updates

---

#### **src/components/MitigationBoard.js** ✅ Kanban Mitigation Tracker
**Purpose:** Track delay mitigation cases through workflow

**Workflow Stages:**
1. Delay Noted - New cases
2. In Progress - Being handled
3. Verified - Completed and verified
4. Resolved - Closed cases

**Features:**
- Drag & drop between stages
- Case detail editing
- Cause tagging system
- Comment/collaboration notes
- Real-time status updates

---

### Admin & Settings Components

#### **src/components/UserManagement.js** ✅ User Administration
**Purpose:** Manage user accounts and permissions (Admin role only)

**Features:**
- View all users
- Create/edit/delete users
- Assign roles
- Manage permissions
- Account status control

---

#### **src/components/Settings.js** ✅ User Settings
**Purpose:** User preference and configuration management

**Features:**
- Profile settings
- Notification preferences
- Display preferences
- Password change

---

#### **src/components/Profile.js** ✅ User Profile
**Purpose:** Display and edit user information

**Shows:**
- Username
- Role
- Email
- Name
- Account created date

---

### UI & Data Visualization Components

#### **src/components/KPICards.js** ✅ Key Performance Indicators
**Purpose:** Display important flight metrics

**Metrics Shown:**
- Total flights
- On-time percentage
- Average delay
- Cancellations
- Alerts count

---

#### **src/components/VisualAnalytics.js** ✅ Chart.js Integration
**Purpose:** Data visualization with charts

**Chart Types:**
- Line charts - Delay trends
- Bar charts - Delay by airline
- Pie charts - Delay breakdown
- Uses Chart.js + React Chart.js 2

---

#### **src/components/WeatherPanel.js** ✅ Weather Information
**Purpose:** Display weather conditions affecting operations

**Shows:**
- Current weather
- Temperature
- Visibility
- Wind speed
- Weather alerts

---

#### **src/components/AlertsPanel.js** ✅ Notifications
**Purpose:** Display system alerts and notifications

**Features:**
- Alert severity levels
- Real-time updates
- Alert dismiss/acknowledge
- Alert history

---

#### **src/components/QuickActions.js** ✅ Quick Access Buttons
**Purpose:** Fast shortcuts to common operations

**Actions:**
- Create simulation
- Add to mitigation board
- View detailed reports
- Search flights

---

### Modal & Helper Components

#### **src/components/ForgotPasswordModal.js** ✅ Password Recovery
**Purpose:** Password reset functionality

**Process:**
1. User enters email
2. Recovery email sent
3. Link opens password reset form

---

#### **src/components/KPIReportModal.js** ✅ Reports Generation
**Purpose:** Generate and display KPI reports

**Features:**
- Date range selection
- Report export options
- Excel/PDF download

---

#### **src/components/PageLayout.js** ✅ Layout Wrapper
**Purpose:** Consistent layout structure for pages

**Provides:**
- Responsive grid system
- Consistent spacing
- Mobile adaptations

---

### Styling Files

#### **src/App.css** 🎨 Root Styles
- Global application styles
- Main layout CSS

#### **src/index.css** 🎨 Global Styles
- CSS reset
- Global variables
- Base element styles

---

### Frontend Dependencies

#### **package.json** (Frontend)
```json
{
  "dependencies": {
    "react": "18.2.0",              // UI framework
    "react-dom": "18.2.0",          // React DOM rendering
    "react-router-dom": "6.3.0",    // Routing (if used)
    "react-scripts": "5.0.1",       // CRA build tools
    "styled-components": "5.3.5",   // CSS-in-JS styling
    "axios": "1.13.2",              // HTTP client
    "chart.js": "4.5.0",            // Charts
    "react-chartjs-2": "5.3.0"      // React wrapper for charts
  }
}
```

---

## 💾 Database Configuration

### Supabase Cloud PostgreSQL (Recommended) ⭐

**Why Supabase?**
- Free tier available
- No local installation needed
- Automatic backups and security
- Web-based management dashboard
- Connection pooling included
- Real-time capabilities for future use
- HTTPS/SSL by default
- Scalable billing

**Connection Details:**
```
Protocol: PostgreSQL
Host: db.[PROJECT-REF].supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [Your database password set during project creation]
SSL: Required (true)
```

**Connection String Format:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Setup Steps:**
1. Go to https://supabase.com
2. Sign up/login
3. Create new project (set database password)
4. Wait 2-3 minutes for provisioning
5. Go to Settings → Database → Connection String → URI tab
6. Copy connection string
7. Replace [PASSWORD] with actual password
8. Paste into .env as DATABASE_URL

---

### Local PostgreSQL (Alternative)

**Connection Details:**
```
Host: localhost
Port: 5432
Database: delaypilot
User: postgres
Password: [Your PostgreSQL password]
SSL: false
```

**Connection Configuration:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=delaypilot
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
```

**Setup Steps:**
1. Install PostgreSQL from postgresql.org
2. Create database: `CREATE DATABASE delaypilot;`
3. Update .env with credentials
4. No SSL setup needed

---

### Database Schema

**Users Table (Auto-created on startup):**
```sql
TABLE users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(100) UNIQUE NOT NULL,
  password        VARCHAR(255) NOT NULL,
  role            VARCHAR(50) NOT NULL,  -- Admin, APOC, AOC, ATC
  name            VARCHAR(255),
  email           VARCHAR(255),
  status          VARCHAR(20) DEFAULT 'active',  -- active/inactive
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Index for fast login lookups
CREATE INDEX idx_users_username ON users(username);
```

**Default Users (Auto-created):**
| Username | Password | Role | Email |
|----------|----------|------|-------|
| admin | admin123 | Admin | admin@delaypilot.com |
| apoc | apoc123 | APOC | apoc@delaypilot.com |
| atc | atc123 | ATC | atc@delaypilot.com |
| aoc | aoc123 | AOC | aoc@delaypilot.com |

⚠️ **Change default passwords before production!**

---

## 🔐 Authentication Flow

### Step-by-Step Process

```
USER INTERACTION → FRONTEND (React) → BACKEND (Express) → DATABASE (PostgreSQL)
```

### Detailed Flow with Code

#### 1. **User Input** (LoginPage.js)
```javascript
// User enters credentials in LoginPage form
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [role, setRole] = useState('Admin');

// Form submitted
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Make API request to backend
  const response = await axios.post(
    'http://localhost:5000/api/auth/login',
    { username, password, role }
  );
```

#### 2. **Frontend Validation** (LoginPage.js)
```javascript
// Basic client-side validation
if (!username || !password) {
  setError('Username and password required');
  return;
}

// API call prepared
const payload = { username, password, role };
```

#### 3. **HTTP Request** (Axios)
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "role": "Admin"
}
```

#### 4. **Backend Processing** (server.js + routes/auth.js)
```javascript
// Express receives request at POST /api/auth/login

// From routes/auth.js:
const { username, password, role } = req.body;

// Validate input
if (!username || !password || !role) {
  return res.status(400).json({ success: false });
}

// Query database
const result = await query(
  'SELECT * FROM users WHERE username = $1 AND role = $2',
  [username, role]
);

// Check if user exists
if (result.rows.length === 0) {
  return res.status(401).json({
    success: false,
    message: 'Password or username is invalid'
  });
}

const user = result.rows[0];

// Verify password using bcrypt
const isValidPassword = await bcrypt.compare(password, user.password);

if (!isValidPassword) {
  return res.status(401).json({
    success: false,
    message: 'Password or username is invalid'
  });
}
```

#### 5. **Token Generation** (routes/auth.js)
```javascript
// Generate JWT token (valid for 24 hours)
const token = jwt.sign(
  {
    id: user.id,
    username: user.username,
    role: user.role
  },
  process.env.JWT_SECRET,  // 'your-super-secret-jwt-key-...'
  { expiresIn: '24h' }
);

// Send response
res.json({
  success: true,
  message: 'Login successful',
  token: token,  // Encoded JWT
  user: {
    id: user.id,
    username: user.username,
    role: user.role,
    email: user.email,
    name: user.name
  }
});
```

#### 6. **Frontend Token Storage** (App.js - handleLogin)
```javascript
const handleLogin = (userData) => {
  // User returns from LoginPage after successful login
  
  // Store token in localStorage (persists across page refreshes)
  localStorage.setItem('token', responseData.token);
  
  // Store user data in localStorage
  localStorage.setItem('user', JSON.stringify(userData));
  
  // Update app state
  setUserRole(userData.role);
  setUserName(userData.username);
  setIsLoggedIn(true);
  
  // Redirect to appropriate page
  setActiveTab('Dashboard');
};
```

#### 7. **Subsequent API Calls** (All Components)
```javascript
// When making API calls, include token
const config = {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
};

// Example
axios.get('http://localhost:5000/api/auth/verify', config);
```

#### 8. **Backend Token Verification** (routes/auth.js)
```javascript
// Middleware to verify token
const verifyToken = (req, res, next) => {
  // Extract token from Authorization header
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }
  
  // Verify JWT signature and expiry
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // If valid, decoded contains: { id, username, role }
    req.user = decoded;
    next();  // Allow request to proceed
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};
```

### Security Mechanisms

**1. Password Hashing (bcrypt)**
```
User Password: "admin123" (plain text)
         ↓ bcrypt hash with 10 salt rounds
Stored: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/D.." 
         (cannot be reversed to get original password)
         ↓ on login
Input: "admin123"
         ↓ bcrypt.compare()
Stored Hash: Match? → YES → Login allowed
```

**2. JWT Token**
```
Header:   { alg: "HS256", typ: "JWT" }
Payload:  { id: 1, username: "admin", role: "Admin", exp: 1742745600 }
Signature: HMACSHA256(base64(header) + "." + base64(payload), JWT_SECRET)
         ↓ Encoded
TOKEN: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwi...

Token expires after 24 hours (exp timestamp)
Changing JWT_SECRET invalidates all existing tokens
```

**3. CORS Protection**
```javascript
// Only allow requests from http://localhost:3000
const corsOptions = {
  origin: process.env.NODE_ENV === 'development'
    ? true
    : 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));
```

**4. SQL Injection Prevention**
```javascript
// ❌ UNSAFE (vulnerable to SQL injection)
query = `SELECT * FROM users WHERE username = '${username}'`;

// ✅ SAFE (parameterized query)
query(
  'SELECT * FROM users WHERE username = $1',
  [username]  // Parameter passed separately
);
```

---

## 📡 API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### **POST /api/auth/login** - User Login
**Purpose:** Authenticate user and return JWT token

**Request:**
```http
POST /api/auth/login HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "role": "Admin"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "Admin",
    "email": "admin@delaypilot.com",
    "name": "Administrator"
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Password or username is invalid"
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Username, password, and role are required"
}
```

---

#### **POST /api/auth/register** - User Registration
**Purpose:** Create new user account

**Request:**
```http
POST /api/auth/register HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "username": "newuser",
  "password": "SecurePass123",
  "role": "APOC",
  "email": "user@example.com"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 5,
    "username": "newuser",
    "role": "APOC",
    "email": "user@example.com"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Username must be between 4 and 20 characters"
}
```

---

#### **GET /api/auth/verify** - Token Verification
**Purpose:** Verify JWT token and get current user

**Request:**
```http
GET /api/auth/verify HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "Admin",
    "email": "admin@delaypilot.com"
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

### Health Check Endpoint

#### **GET /api/health** - Server Status
**Purpose:** Check if backend server is running

**Request:**
```http
GET /api/health HTTP/1.1
Host: localhost:5000
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "DelayPilot Backend API is running",
  "timestamp": "2026-03-07T12:34:56.789Z"
}
```

---

## 🔗 File Dependencies

### Frontend Component Dependencies

```
App.js (Root)
├── LoginPage.js
│   └── api.js (API URL)
│   └── ForgotPasswordModal.js
│   └── axios (HTTP client)
│
├── Dashboard.js
│   ├── NavigationBar.js
│   ├── KPICards.js
│   ├── FlightsTable.js
│   ├── WeatherPanel.js
│   ├── VisualAnalytics.js (Chart.js)
│   ├── QuickActions.js
│   └── AlertsPanel.js
│
├── FlightsPage.js
│   ├── NavigationBar.js
│   └── FlightsTable.js
│
├── SimulationPage.js
│   └── NavigationBar.js
│
├── MitigationBoard.js
│   └── NavigationBar.js
│
├── UserManagement.js
│   └── NavigationBar.js
│
├── Settings.js
│   └── NavigationBar.js
│
└── Profile.js
    └── NavigationBar.js
```

### Backend Function Call Chain

```
server.js (Entry point)
├── config/database.js
│   ├── Pool connection to PostgreSQL
│   ├── initDatabase() - Create tables & default users
│   └── query() - Helper for parameterized queries
│
└── routes/auth.js (POST, GET endpoints)
    ├── Uses query() from database.js
    ├── bcrypt for password verification
    ├── jwt for token generation
    └── Validation functions (username, password)
```

### API Communication Flow

```
Frontend (port :3000)
└── axios.post/get('http://localhost:5000/api/...')
    ↓
server.js (port :5000)
├── CORS middleware (allows :3000)
├── express.json() parser
└── routes/auth.js handler
    └── config/database.js
        └── PostgreSQL connection pool
            └── Users table query
```

---

## ⚙️ Unused/Extra Files

### Documentation Files (Reference Only)
These files are **NOT used by the application** but provide setup guidance:

**Root Level:**
- `README.md` - Project overview
- `SETUP_GUIDE.md` - Setup instructions
- `Frontend_README.md` - Frontend docs
- `START_PROJECT.md` - Startup guide
- `SUPABASE_SETUP.md` - Supabase configuration
- `BACKEND_CONNECTION_SUMMARY.md` - Backend overview

**Backend Setup Guides:**
- `backend/README.md` - Backend API docs
- `backend/QUICK_START.md` - Quick setup
- `backend/QUICK_SETUP.md` - Setup variants
- `backend/README_SETUP.md` - Supabase guide
- `backend/ADD_DATABASE_URL.md` - Connection help
- `backend/CHECKLIST.md` - Setup checklist
- `backend/CONNECTION_STATUS.md` - Diagnostics
- `backend/FINAL_SETUP_STEPS.md` - Final steps
- `backend/FIX_CONNECTION.md` - Troubleshooting
- `backend/FIX_SUPABASE_CONNECTION.md` - Supabase fixes
- `backend/SETUP_INSTRUCTIONS.txt` - Instructions
- `backend/WHAT_TO_DO_NEXT.txt` - Next steps

**Status:** Reference only (not executed by app)

---

### Utility Files (Helper Scripts - Optional)
These files help with setup but are **NOT core to application execution**:

**Backend Utilities:**
- `backend/create-env.js` - Interactive .env creator (optional)
- `backend/update-env.js` - .env updater (optional)
- `backend/fix-connection-string.js` - Connection helper (optional)
- `backend/test-connection.js` - Connection tester (useful for debugging)
- `backend/test-both-formats.js` - Format tester (useful for debugging)

**Status:** Useful for development, not required for production

---

### Configuration Templates (Not Executed)
- `backend/env.template` - Template reference only

---

### Auto-Generated Files (Not Edited)
- `node_modules/` - Installed packages (generated)
- `package-lock.json` - Dependency lock (auto-generated)
- `.gitignore` - Git configuration

---

## 🚀 Setup & Execution

### Prerequisites

## 📋 Prerequisites

**System Requirements:**
- Node.js v14+ (~500MB)
- npm (comes with Node.js)
- PostgreSQL (if using local) OR Supabase account (free)
- ~2GB disk space for project + node_modules

**Accounts Needed:**
- Supabase account (FREE TIER available):
  - Go to https://supabase.com
  - Sign up with GitHub/Google/Email
  - Create project (wait 2-3 min for provisioning)

---

### Complete Setup Steps

#### **Step 1: Backend Database Setup**

**OPTION A: Supabase (Recommended)**

1. **Create Supabase Project:**
   - Visit https://supabase.com → Sign up
   - Create new project
   - Set database password (save this!)
   - Wait 2-3 minutes for provisioning

2. **Get Connection String:**
   - In Supabase dashboard: Settings → Database
   - Scroll to "Connection string"
   - Click "URI" tab
   - Copy full connection string

3. **Create .env File in backend:**
   ```bash
   cd backend
   Copy-Item env.template .env  # PowerShell
   # OR
   cp env.template .env  # macOS/Linux
   ```

4. **Edit .env File:**
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT].supabase.co:5432/postgres
   DB_SSL=true
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

   Replace `[YOUR_PASSWORD]` and `[YOUR_PROJECT]` with actual values

5. **Test Connection:**
   ```bash
   npm run test-connection
   ```
   Expected output:
   ```
   ✅ CONNECTION successful!
   ✅ Users table exists
   🎉 Everything looks good!
   ```

---

**OPTION B: Local PostgreSQL**

1. **Install PostgreSQL:**
   - Download from https://www.postgresql.org/download/
   - Run installer
   - Note the password you set
   - Default port: 5432

2. **Create Database:**
   - Open pgAdmin (comes with PostgreSQL)
   - Right-click "Databases" → Create → Database
   - Name: `delaypilot`

3. **Create .env File:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=delaypilot
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password_here
   DB_SSL=false
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

4. **Test Connection:**
   ```bash
   npm run test-connection
   ```

---

#### **Step 2: Install Dependencies**

**Backend:**
```bash
cd backend
npm install
```
Installs: express, pg, bcrypt, jwt, cors, dotenv

**Frontend (in project root):**
```bash
npm install
```
Installs: react, react-router, styled-components, axios, chart.js

---

#### **Step 3: Start Servers (Two Terminals)**

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

Expected output:
```
✅ Connected to PostgreSQL database
✅ Database tables initialized successfully
✅ Default admin user created (username: admin, password: admin123)
🚀 Server is running on http://localhost:5000
```

**Keep this terminal open!** Backend must stay running.

---

**Terminal 2 - Frontend:**
```bash
npm start
```

Expected output:
```
webpack compiled successfully
Compiled!
On Your Network: http://192.168.x.x:3000
```

Browser automatically opens to http://localhost:3000

---

#### **Step 4: Login**

Default credentials:
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** `Admin`

---

### Troubleshooting

**Backend won't start:**
```
❌ Error: getaddrinfo ENOTFOUND db.xxxxx.supabase.co

Solution:
1. Check .env DATABASE_URL is correct
2. Verify Supabase project is active (not paused)
3. Check internet connection
4. Try using connection pooler format (port 6543)
```

**Frontend won't compile:**
```
❌ Error: PORT 3000 already in use

Solution:
1. Kill process on port 3000
2. Or set PORT=3001 npm start
```

**API calls failing:**
```
❌ Error: Cannot POST /api/auth/login

Solution:
1. Check backend is running (see "Server running on :5000")
2. Update src/config/api.js to use correct port (5000, not 8000)
3. Verify CORS is enabled in backend
```

---

## 🎯 Detailed Technical Working

### Complete User Journey

#### **Scenario: User Logs In and Views Dashboard**

```
┌─────────────────────────────────────────────────────────┐
│ 1. USER OPENS APPLICATION                               │
└─────────────────────────────────────────────────────────┘
   ↓
   Browser loads http://localhost:3000
   └─ public/index.html loads
   └─ Renders <div id="root"></div>
   └─ Calls src/index.js
      └─ Import React & App component
      └─ ReactDOM.createRoot('#root').render(<App />)
      └─ App.js renders LoginPage (isLoggedIn = false)

┌─────────────────────────────────────────────────────────┐
│ 2. LOGIN PAGE DISPLAYED                                  │
└─────────────────────────────────────────────────────────┘
   ↓
   LoginPage.js renders form with:
   ├─ Username input field
   ├─ Password input field
   ├─ Role dropdown (Admin, APOC, AOC, ATC)
   ├─ Login button
   └─ Forgot password link

┌─────────────────────────────────────────────────────────┐
│ 3. USER ENTERS CREDENTIALS                              │
└─────────────────────────────────────────────────────────┘
   ↓
   User types:
   ├─ Username: admin
   ├─ Password: admin123
   ├─ Role: Admin
   └─ Clicks "Login"

┌─────────────────────────────────────────────────────────┐
│ 4. FORM SUBMISSION & VALIDATION                         │
└─────────────────────────────────────────────────────────┘
   ↓
   LoginPage.js handleSubmit() executes:
   ├─ Prevent default form submission
   ├─ Validate inputs not empty
   ├─ Set loading state
   └─ Prepare API call

┌─────────────────────────────────────────────────────────┐
│ 5. AXIOS API CALL (Frontend → Backend)                  │
└─────────────────────────────────────────────────────────┘
   ↓
   axios.post('http://localhost:5000/api/auth/login', {
     username: 'admin',
     password: 'admin123',
     role: 'Admin'
   })
   
   Network Request:
   POST http://localhost:5000/api/auth/login
   Content-Type: application/json
   
   {
     "username": "admin",
     "password": "admin123",
     "role": "Admin"
   }

┌─────────────────────────────────────────────────────────┐
│ 6. BACKEND RECEIVES REQUEST                             │
└─────────────────────────────────────────────────────────┘
   ↓
   Express server.js (port 5000)
   ├─ CORS middleware allows :3000
   ├─ express.json() parses body
   ├─ Request logging middleware logs request
   └─ Routes to /api/auth → routes/auth.js

┌─────────────────────────────────────────────────────────┐
│ 7. AUTHENTICATION LOGIC (routes/auth.js)                │
└─────────────────────────────────────────────────────────┘
   ↓
   POST /api/auth/login handler executes:
   
   a) INPUT VALIDATION
      if (!username || !password || !role)
         return error 400
      
   b) DATABASE QUERY
      query = 'SELECT * FROM users WHERE username=$1 AND role=$2'
      result = await query(query, ['admin', 'Admin'])
      
   c) USER CHECK
      if (result.rows.length === 0)
         return error 401 "Invalid credentials"
      user = result.rows[0]
      
   d) ACCOUNT STATUS CHECK
      if (user.status !== 'active')
         return error 403 "Account inactive"
      
   e) PASSWORD VERIFICATION
      isValid = await bcrypt.compare('admin123', user.password)
      // Hashed password: $2b$10$N9qo8uLOickgx2ZMRZoMyeI...
      // Match? YES
      
   f) TOKEN GENERATION
      token = jwt.sign(
        { id: 1, username: 'admin', role: 'Admin' },
        'your-super-secret-jwt-key-change-this-in-production',
        { expiresIn: '24h' }
      )
      // Encoded JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
      
   g) RESPONSE CREATION
      return {
        success: true,
        message: 'Login successful',
        token: 'eyJhbGciOiJ...',
        user: {
          id: 1,
          username: 'admin',
          role: 'Admin',
          email: 'admin@delaypilot.com',
          name: 'Administrator'
        }
      }

┌─────────────────────────────────────────────────────────┐
│ 8. HTTP RESPONSE SENT (Backend → Frontend)              │
└─────────────────────────────────────────────────────────┘
   ↓
   Status: 200 OK
   Content-Type: application/json
   
   {
     "success": true,
     "message": "Login successful",
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwi...",
     "user": {
       "id": 1,
       "username": "admin",
       "role": "Admin",
       "email": "admin@delaypilot.com",
       "name": "Administrator"
     }
   }

┌─────────────────────────────────────────────────────────┐
│ 9. FRONTEND PROCESSES RESPONSE                          │
└─────────────────────────────────────────────────────────┘
   ↓
   LoginPage.js axios.then() handler executes:
   
   if (response.data.success) {
     a) STORE TOKEN IN BROWSER
        localStorage.setItem(
          'token',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        )
        
     b) STORE USER DATA IN BROWSER
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: 1,
            username: 'admin',
            role: 'Admin',
            email: 'admin@delaypilot.com',
            name: 'Administrator'
          })
        )
        
     c) CALL PARENT HANDLER
        props.onLogin(response.data.user)
   }

┌─────────────────────────────────────────────────────────┐
│ 10. APP.JS HANDLES LOGIN                                │
└─────────────────────────────────────────────────────────┘
   ↓
   App.js handleLogin() executes:
   
   handleLogin = (userData) => {
     setUserRole(userData.role);          // 'Admin'
     setUserName(userData.username);      // 'admin'
     setIsLoggedIn(true);                 // Change to true!
     setActiveTab('User Management');     // Admin users go here
   }

┌─────────────────────────────────────────────────────────┐
│ 11. APP RE-RENDERS (State Changed)                      │
└─────────────────────────────────────────────────────────┘
   ↓
   React detects state changes
   └─ isLoggedIn: false → true
   └─ activeTab: 'Dashboard' → 'User Management'
   └─ Triggers re-render

┌─────────────────────────────────────────────────────────┐
│ 12. CONDITIONAL RENDERING                               │
└─────────────────────────────────────────────────────────┘
   ↓
   App.js render logic:
   
   if (!isLoggedIn) {
     return <LoginPage onLogin={handleLogin} />;
   } else {
     return renderActivePage();
   }
   
   // Since isLoggedIn = true, calls renderActivePage()
   // activeTab = 'User Management'
   // switch(activeTab):
   //   case 'User Management': return <UserManagement ... />

┌─────────────────────────────────────────────────────────┐
│ 13. USER MANAGEMENT PAGE RENDERS                        │
└─────────────────────────────────────────────────────────┘
   ↓
   UserManagement.js component renders with:
   ├─ NavigationBar (tabs, logout button)
   ├─ User list table
   ├─ Create user form
   ├─ User details editor
   ├─ Delete user button
   └─ All pass props:
      ├─ userRole='Admin'
      ├─ userName='admin'
      ├─ onLogout={handleLogout}
      ├─ activeTab='User Management'
      ├─ onTabChange={handleTabChange}

┌─────────────────────────────────────────────────────────┐
│ 14. USER SEES INTERFACE                                 │
└─────────────────────────────────────────────────────────┘
   ↓
   Browser displays:
   ├─ Navigation bar with tabs & logout
   ├─ User management interface
   └─ All styled with styled-components CSS

┌─────────────────────────────────────────────────────────┐
│ 15. FUTURE API CALLS (With Authentication)              │
└─────────────────────────────────────────────────────────┘
   ↓
   When component needs to call backend API:
   
   const response = await axios.get('http://localhost:5000/api/endpoint', {
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('token')}`
     }
   });
   
   Backend verifies token → Processes request → Returns data

┌─────────────────────────────────────────────────────────┐
│ 16. LOGOUT                                               │
└─────────────────────────────────────────────────────────┘
   ↓
   User clicks "Logout" button
   └─ Calls handleLogout()
      ├─ localStorage.removeItem('token')
      ├─ localStorage.removeItem('user')
      ├─ setIsLoggedIn(false)
      └─ React re-renders LoginPage

   After logout:
   ├─ Token deleted from browser
   ├─ User data deleted from browser
   ├─ Future API calls without token rejected by backend
   └─ Back to login screen
```

---

### Data Storage Persistence

**Browser LocalStorage:**
```javascript
// After login, stored in localStorage:

localStorage.token =
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwi...'

localStorage.user =
'{"id":1,"username":"admin","role":"Admin","email":"admin@delaypilot.com"}'

// Persists across:
✓ Page refreshes
✓ Tab navigation
✓ Browser restart (until manually deleted)

// Deleted on logout or manual clear
```

**Server Database (PostgreSQL):**
```sql
-- Users table stores permanently:
SELECT * FROM users WHERE username='admin';

id | username | password (hashed) | role  | email                   | status | created_at
1  | admin    | $2b$10$N9qo8u... | Admin | admin@delaypilot.com    | active | 2024-01-01

-- Persists until:
✓ User deleted from admin panel
✓ Database deleted
✓ Supabase project deleted
```

---

### Security Layers

```
Layer 1: Client-Side (Frontend)
├─ HTTPS recommended (not enforced in local development)
├─ LocalStorage only holds token (not password)
└─ Token sent in Authorization header (not in URL)

Layer 2: Transport (Network)
├─ CORS origin whitelist (only http://localhost:3000)
├─ HTTP in dev (HTTPS recommended for production)
└─ axios requests use Content-Type: application/json

Layer 3: Application (Backend)
├─ Input validation (username, password length & format)
├─ SQL injection prevention (parameterized queries)
├─ JWT signature validation (HMACSHA256 with JWT_SECRET)
├─ JWT expiry check (24 hours)
└─ Request logging for audit trail

Layer 4: Database (PostgreSQL)
├─ User passwords hashed with bcrypt (10 salt rounds)
└─ Usernames indexed for fast secure lookups
```

---

## 📊 Comparison: Frontend vs Backend

| Aspect | Frontend (React) | Backend (Express) |
|--------|---|---|
| **Language** | JavaScript (JSX) | JavaScript (Node.js) |
| **Port** | 3000 | 5000 |
| **Purpose** | User Interface | API & Logic |
| **State** | React useState, props | Database tables, JWT tokens |
| **Styling** | Styled Components CSS | N/A |
| **Dependencies** | React, Axios, Chart.js | Express, PostgreSQL, bcrypt |
| **Execution** | Browser (Client-side) | Server (Server-side) |
| **Data** | Displays data, cached in localStorage | Stores in PostgreSQL, processes logic |
| **Security** | Token in localStorage | Password storage, token generation |
| **Startup** | `npm start` on :3000 | `npm start` on :5000 |

---

## 🎓 Key Concepts Summary

### **Client-Server Architecture**
```
CLIENT (Browser)             SERVER (Node.js)               DATABASE
├─ React renders UI          ├─ Express handles requests    ├─ PostgreSQL stores data
├─ User interactions        ├─ Validates input            ├─ Users table
├─ Axios API calls          ├─ Authenticates              ├─ Query execution
└─ LocalStorage for tokens  └─ Queries database           └─ Data persistence
```

### **Request-Response Cycle**
```
1. Browser → HTTP REQUEST → Server
2. Server processes logic
3. Server queries database
4. Database returns data
5. Server → HTTP RESPONSE → Browser
6. Browser updates UI with data
```

### **Authentication Method**
```
Password-based with JWT tokens:
1. Username + Password → Server
2. Server verifies against hashed password
3. Server generates JWT token
4. Browser stores token
5. Token sent with future requests
6. Server verifies token signature + expiry
```

---

## ✅ Project Status Summary

### ✅ Complete & Functional
- Backend Express server (port 5000)
- PostgreSQL database connection (Supabase or local)
- Authentication system (login, register, verify)
- JWT token generation and verification
- Bcrypt password hashing
- React frontend with routing
- 18 UI components (dashboard, flights, simulation, etc.)
- CORS configuration
- Database schema and initialization
- Default users auto-creation

### ⚠️ Configuration Required
- **Create .env file** with DATABASE_URL (Supabase or local)
- **Update api.js** if backend port differs from 5000
- **Change default passwords** before production

### 🚀 Ready to Use
- Run `npm install` (backend & frontend)
- Run `npm start` (backend on :5000)
- Run `npm start` (frontend on :3000)
- Login with: admin / admin123

---

## 🔍 Quick Reference: How to Find Things

| Want to... | Look in... |
|---|---|
| Add new page | src/components/[NewPage].js |
| Add API endpoint | backend/routes/auth.js |
| Change database | backend/.env |
| Modify styling | src/components/[Component].js (styled-components) |
| Change API URL | src/config/api.js |
| Add new user roles | backend/routes/auth.js, database schema |
| Debug database | backend/test-connection.js |
| Change server port | backend/.env (PORT=5000)  |
| Change frontend port | src/config/api.js  |
| Add authentication | backend/routes/auth.js |

---

**END OF DOCUMENTATION**

*This document serves as a complete technical reference for understanding and maintaining the DelayPilot SafeFYP1 project.*
