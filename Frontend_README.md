# DelayPilot - Aviation Flight Delay Management System (UI/ Frontend focused)

DelayPilot is a comprehensive React-based web application designed for aviation operations centers to manage, predict, and mitigate flight delays. The system provides real-time monitoring, simulation capabilities, and collaborative mitigation tracking for airline operations teams.

## ⚡ Quick Start Guide

**Get up and running in 5 minutes:**

1. **Install dependencies:**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   npm install
   cd ..
   ```

2. **Set up backend database:**
   - See [Backend Setup](#backend-setup) for Supabase configuration
   - Or use local PostgreSQL with connection parameters

3. **Start backend server:**
   ```bash
   cd backend
   npm start
   ```
   Backend runs on `http://localhost:5000`

4. **Start frontend (in a new terminal):**
   ```bash
   npm start
   ```
   Frontend runs on `http://localhost:3000`

5. **Login with default credentials:**
   - Username: `admin`
   - Password: `admin123`
   - Role: `Admin`

**That's it!** Your application should now be running. See [Troubleshooting](#troubleshooting) if you encounter any issues.

## 🚀 Features

### Core Modules

#### 1. **Dashboard**
- **KPI Cards**: Real-time flight delay metrics with refresh functionality
- **Visual Analytics**: Interactive charts showing delay trends and patterns
- **Flight Table**: Live flight status updates with filtering capabilities
- **Weather Panel**: Current weather conditions affecting operations
- **Quick Actions**: Fast access to common operational tasks
- **Alerts Panel**: Real-time notifications for critical delays

#### 2. **Flights Overview**
- **Comprehensive Flight Table**: Detailed flight information with real-time updates
- **Advanced Filtering**: Filter by airline, destination, status, and delay severity
- **Flight Detail Drawer**: Detailed view with cause breakdown and propagation impact
- **Status Management**: Track flights from On-Time to Major Delay
- **Add to Mitigation Board**: Direct integration with mitigation tracking

#### 3. **Simulation Tool**
- **Flight Delay Simulation**: Test impact of various delay scenarios
- **Weather Conditions**: Simulate different weather scenarios (Clear, Rain, Fog, Thunderstorm, Snow)
- **Traffic Load Control**: Adjustable traffic congestion levels
- **Time Adjustments**: Modify departure/arrival times based on flight direction
- **Impact Analysis**: View connected flight effects and KPI summaries
- **Real-time Results**: Instant feedback on simulation outcomes

#### 4. **Mitigation Tracker Board**
- **Kanban Workflow**: Four-stage process (Delay Noted → In Progress → Verified → Resolved)
- **Drag & Drop**: Intuitive card movement between workflow stages
- **Case Management**: Detailed case tracking with flight information
- **Cause Tagging**: Categorize delays (Weather, Traffic, Reactionary, Technical)
- **Comments System**: Collaborative chat-style communication
- **Notification System**: Real-time updates with visual indicators
- **Closed Cases**: Archive completed mitigation cases

#### 5. **Authentication & Role Management**
- **Multi-Role Support**: Admin, APOC, AOC, ATC user roles
- **Role-Based Access**: Different permissions for each user type
- **Secure Login**: Username/password authentication with role selection
- **Password Recovery**: Forgot password functionality with email verification

## 🎨 Design System

### Color Scheme
- **Primary Blue**: #1A4B8F (DelayPilot Blue)
- **Background**: #F7F9FB (Light Blue-Gray)
- **Success**: #166534 (Green)
- **Warning**: #92400E (Orange)
- **Error**: #991B1B (Red)
- **Neutral**: #333333 (Dark Gray)

### Typography
- **Font Family**: System fonts (Inter fallback)
- **Headings**: 28px, weight 600
- **Body Text**: 14px, weight 400
- **Small Text**: 12px, weight 400

### UI Components
- **Cards**: White background with subtle shadows
- **Buttons**: Rounded corners (8px), primary/secondary variants
- **Badges**: Color-coded severity indicators
- **Modals**: Overlay with backdrop blur
- **Drawers**: Slide-in panels for detailed views

## 🛠 Tech Stack

### Frontend
- **React 18.2.0**: Modern React with hooks
- **Styled Components 5.3.5**: CSS-in-JS styling
- **Chart.js 4.5.0**: Data visualization
- **React Chart.js 2 5.3.0**: React Chart.js integration
- **React Router DOM 6.3.0**: Client-side routing

### Development Tools
- **Create React App**: Development environment
- **ESLint**: Code linting
- **Jest**: Testing framework
- **Web Vitals**: Performance monitoring

## 📱 Responsive Design

### Breakpoints
- **Desktop**: >1024px (Full layout)
- **Tablet**: 768px-1024px (Adapted layout)
- **Mobile**: <768px (Stacked layout)

### Adaptations
- **Grid Systems**: Responsive grid layouts
- **Navigation**: Collapsible navigation on mobile
- **Cards**: Stacked card layouts on smaller screens
- **Modals**: Full-screen modals on mobile devices

## 👥 User Roles & Permissions

### APOC (Airline Operations Control)
- **Full Access**: All features and editing capabilities
- **Drag & Drop**: Can move cases between workflow stages
- **Case Management**: Create, edit, and close mitigation cases
- **Tag Management**: Add/remove cause tags
- **Comments**: Full commenting system access

### AOC (Airline Operations Center)
- **Full Access**: Same as APOC
- **Operational Control**: Manage flight operations
- **Mitigation Authority**: Handle delay mitigation processes

### ATC (Air Traffic Control)
- **View-Only Access**: Read-only permissions
- **Flight Monitoring**: View flight status and delays
- **No Editing**: Cannot modify cases or tags
- **Information Access**: View all operational data

### Admin
- **System Administration**: Full system access
- **User Management**: Manage user accounts and permissions
- **Data Management**: Access to all system data
- **Reassignment**: Can reassign cases to different users

## 🚀 Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager
- Backend server running (see [Backend Setup](#backend-setup))

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd delaypilot-frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure API endpoint** (optional):
   - The frontend is configured to connect to `http://localhost:5000/api` by default
   - To change this, create a `.env` file in the root directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**:
```bash
npm start
```

5. **Open your browser**:
   - The app will automatically open at [http://localhost:3000](http://localhost:3000)
   - If it doesn't open automatically, navigate to the URL manually

### Backend Setup

**IMPORTANT:** The frontend requires the backend server to be running. See the [Backend README](./backend/README.md) for detailed setup instructions.

**Quick Backend Start:**
```bash
# In a separate terminal, navigate to the backend directory
cd backend
npm install
npm start
```

The backend should be running on `http://localhost:5000` before starting the frontend.

### Available Scripts

- `npm start` - Runs the app in development mode on port 3000
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

### Running Both Frontend and Backend

**Option 1: Separate Terminals (Recommended)**
1. **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm start
   ```
   Backend will run on `http://localhost:5000`

2. **Terminal 2 - Frontend:**
   ```bash
   npm start
   ```
   Frontend will run on `http://localhost:3000`

**Option 2: Background Processes**
- Both can run in the background, but separate terminals are recommended for easier debugging

### Troubleshooting

#### Port Already in Use

If you see `Something is already running on port 3000`:

**Windows:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with the actual process ID)
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

#### Backend Connection Issues

If the frontend cannot connect to the backend:
1. Verify the backend is running on `http://localhost:5000`
2. Check the API configuration in `src/config/api.js`
3. Verify CORS is enabled in the backend (should be configured for `http://localhost:3000`)
4. Check browser console for CORS or network errors

## 📁 Project Structure

```
delaypilot/
├── backend/                    # Backend API server
│   ├── config/
│   │   └── database.js        # Database configuration with retry logic
│   ├── routes/
│   │   └── auth.js            # Authentication routes (login, register, verify)
│   ├── server.js              # Express server setup
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment variables (not in repo)
│   └── README.md              # Backend documentation
├── src/                        # Frontend React application
│   ├── components/
│   │   ├── AlertsPanel.js          # Real-time alerts and notifications
│   │   ├── Dashboard.js            # Main dashboard with KPIs and analytics
│   │   ├── FlightsPage.js          # Flight overview and management
│   │   ├── FlightsTable.js         # Flight data table component
│   │   ├── ForgotPasswordModal.js  # Password recovery modal
│   │   ├── KPICards.js             # Key Performance Indicator cards
│   │   ├── KPIReportModal.js       # KPI reporting modal
│   │   ├── LoginPage.js            # User authentication page
│   │   ├── MitigationBoard.js     # Kanban-style mitigation tracker
│   │   ├── NavigationBar.js       # Top navigation component
│   │   ├── QuickActions.js        # Quick action buttons
│   │   ├── SimulationPage.js      # Flight delay simulation tool
│   │   ├── Settings.js            # Settings page
│   │   ├── UserManagement.js      # User management interface
│   │   ├── VisualAnalytics.js     # Charts and data visualization
│   │   └── WeatherPanel.js        # Weather information panel
│   ├── config/
│   │   └── api.js              # API endpoint configuration
│   ├── App.js                  # Main application component
│   ├── App.css                 # Global application styles
│   ├── index.js                # Application entry point
│   └── index.css               # Global CSS styles
├── public/
│   └── index.html              # HTML template
├── package.json                # Frontend dependencies
├── README.md                   # This file
└── .env                        # Frontend environment variables (optional)
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory (optional):
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_VERSION=1.0.0
```

**Note:** If not specified, the frontend defaults to `http://localhost:5000/api` as configured in `src/config/api.js`.

### Styling Configuration
The application uses styled-components for styling. Key configuration files:
- `src/App.css` - Global styles
- `src/index.css` - Base styles and CSS variables
- Component-specific styles in each component file

## 📊 Data Flow

### State Management
- **React Hooks**: useState, useMemo for local state
- **Component Props**: Data passing between components
- **Mock Data**: Static data for development and demonstration
- **API Integration**: Axios for backend communication

### Key Data Structures
- **Flight Data**: Flight numbers, airlines, routes, delays, causes
- **Case Data**: Mitigation cases with workflow status
- **User Data**: Role-based user information with JWT tokens
- **Notification Data**: Real-time alerts and updates
- **Authentication Data**: User sessions, tokens, and role permissions

### API Communication
- **Base URL**: `http://localhost:5000/api` (configurable via environment variables)
- **Authentication**: JWT token-based authentication
- **Endpoints**: 
  - `/api/auth/login` - User login
  - `/api/auth/register` - User registration
  - `/api/auth/verify` - Token verification
  - `/api/health` - Server health check

## 🔒 Security Features

### Authentication
- **JWT Token Authentication**: Secure token-based authentication with 24-hour expiration
- **Role-Based Access Control**: Different permissions per user role (Admin, APOC, AOC, ATC)
- **Session Management**: Token-based session handling with automatic expiration
- **Password Security**: Bcrypt hashing on backend (passwords never sent in plain text)
- **Secure Storage**: Tokens stored securely (consider using httpOnly cookies in production)

### Data Protection
- **Input Validation**: Form validation and sanitization on both frontend and backend
- **XSS Protection**: React's built-in XSS protection
- **CORS Protection**: Backend configured with specific frontend origin
- **SQL Injection Protection**: Parameterized queries prevent SQL injection
- **Error Handling**: Secure error messages (no sensitive data exposed)

### Backend Security
- **Password Hashing**: Bcrypt with 10 salt rounds
- **Token Expiration**: JWT tokens expire after 24 hours
- **Connection Security**: SSL/TLS support for database connections
- **Environment Variables**: Sensitive data stored in `.env` files (not committed to repo)

## 🌐 Browser Support

### Supported Browsers
- **Chrome**: Latest version
- **Firefox**: Latest version
- **Safari**: Latest version
- **Edge**: Latest version

### Mobile Support
- **iOS Safari**: Latest version
- **Chrome Mobile**: Latest version
- **Responsive Design**: Optimized for mobile devices

## 🧪 Testing

### Testing the Application

**1. Test Backend Connection:**
```bash
cd backend
npm run test-connection
```

**2. Test Backend Health:**
```bash
curl http://localhost:5000/api/health
```

**3. Test Login (using curl or Postman):**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","role":"Admin"}'
```

**4. Test Frontend:**
- Open browser to `http://localhost:3000`
- Try logging in with default credentials:
  - Username: `admin`
  - Password: `admin123`
  - Role: `Admin`

### Default Test Credentials

**Admin User (Auto-created on first backend start):**
- Username: `admin`
- Password: `admin123`
- Role: `Admin`

**⚠️ IMPORTANT:** Change the default password in production!

## 🚀 Deployment

### Production Build

**Frontend:**
```bash
npm run build
```
This creates an optimized production build in the `build/` directory.

**Backend:**
```bash
cd backend
npm start
```
For production, consider using:
- PM2 for process management
- Environment variables for configuration
- HTTPS/SSL certificates
- Production database (not development)

### Deployment Options

**Frontend:**
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: CloudFront, Cloudflare
- **Container**: Docker deployment
- **Cloud Platforms**: AWS S3 + CloudFront, Azure Static Web Apps, Google Cloud Storage

**Backend:**
- **Node.js Hosting**: Heroku, Railway, Render
- **Container**: Docker + Kubernetes
- **Cloud Platforms**: AWS EC2/ECS, Azure App Service, Google Cloud Run
- **Serverless**: AWS Lambda, Vercel Functions

### Environment Variables for Production

**Frontend `.env.production`:**
```env
REACT_APP_API_URL=https://your-api-domain.com/api
```

**Backend `.env`:**
```env
DATABASE_URL=your_production_database_url
DB_SSL=true
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
JWT_SECRET=your_strong_random_secret_key
```

## 🔄 Recent Updates & Improvements

### Database Connection Enhancements (Latest)
- **Connection Retry Logic**: Automatic retry mechanism with exponential backoff for database queries
- **Connection Pool Optimization**: Improved pool configuration with:
  - Maximum 20 connections
  - 30-second idle timeout
  - 10-second connection timeout
- **Error Handling**: Better error handling that prevents server crashes on connection failures
- **Resilient Queries**: All database queries now automatically retry up to 3 times on connection errors

### Authentication System
- **JWT Token Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Support for Admin, APOC, AOC, and ATC roles
- **Password Security**: Bcrypt hashing for secure password storage
- **Default Admin User**: Automatically created on first startup (username: `admin`, password: `admin123`)

### Backend Integration
- **RESTful API**: Full REST API for authentication and user management
- **CORS Configuration**: Properly configured for frontend-backend communication
- **Health Check Endpoint**: `/api/health` endpoint for server status monitoring

## 🔮 Future Enhancements

### Planned Features
- **Real-time Backend Integration**: Enhanced backend connection with WebSocket support
- **WebSocket Support**: Live data updates for real-time flight status
- **Advanced Analytics**: Machine learning predictions for delay forecasting
- **Mobile App**: React Native mobile application
- **API Integration**: External aviation data sources (weather, flight tracking)
- **Advanced Reporting**: Comprehensive reporting system with export capabilities
- **Multi-language Support**: Internationalization (i18n)
- **Dark Mode**: Theme switching capability

### Technical Improvements
- **State Management**: Redux or Zustand integration for global state
- **Testing**: Comprehensive test coverage (unit, integration, e2e)
- **Performance**: Code splitting and lazy loading for faster load times
- **Accessibility**: WCAG 2.1 AA compliance
- **PWA Support**: Progressive Web App features for offline capability

## 🤝 Contributing

### Development Guidelines
1. Follow React best practices
2. Use styled-components for styling
3. Maintain responsive design principles
4. Write clean, readable code
5. Add comments for complex logic

### Code Style
- **ESLint**: Follow configured linting rules
- **Prettier**: Code formatting (if configured)
- **Naming**: Use descriptive variable and function names
- **Structure**: Organize components logically

## 📞 Support

### Documentation
- **Component Documentation**: Inline comments and JSDoc
- **API Documentation**: Backend integration guides
- **User Manual**: End-user documentation

### Contact
For technical support or feature requests, please contact the development team.

## 📄 License

This project is proprietary software developed for aviation operations management.

---

**DelayPilot** - Empowering aviation operations with intelligent delay management.
