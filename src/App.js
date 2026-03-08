/**
 * App.js
 * ─────────────────────────────────────────────────────────────────
 * Notification state is lifted here so the bell persists across all
 * page navigations. liveAlerts and notif toggle are passed down to
 * every page via props, and NavigationBar receives them globally.
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useState, useRef, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import FlightsPage from './components/FlightsPage';
import SimulationPage from './components/SimulationPage';
import MitigationBoard from './components/MitigationBoard';
import UserManagement from './components/UserManagement';
import Settings from './components/Settings';
import Profile from './components/Profile';
import './App.css';

function App() {
  const [isLoggedIn,  setIsLoggedIn]  = useState(false);
  const [userRole,    setUserRole]    = useState('APOC');
  const [userName,    setUserName]    = useState('');
  const [activeTab,   setActiveTab]   = useState('Dashboard');

  // ── Global notification state (persists across page changes) ──
  const [liveAlerts,  setLiveAlerts]  = useState([]);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [hasNew,      setHasNew]      = useState(false);

  // Dashboard refresh counter — incrementing this causes Dashboard to re-fetch
  const [dashRefreshKey, setDashRefreshKey] = useState(0);

  const handleLogin = (userData) => {
    setUserRole(userData.role);
    setUserName(userData.name || userData.username || '');
    setIsLoggedIn(true);
    setActiveTab(userData.role === 'Admin' ? 'User Management' : 'Dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserName('');
    setActiveTab('Dashboard');
    setLiveAlerts([]);
    setNotifOpen(false);
    setHasNew(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setNotifOpen(false); // close dropdown on navigation
  };

  // Called by Dashboard when it recomputes alerts after a fetch
  const handleAlertsUpdate = useCallback((alerts) => {
    setLiveAlerts(alerts);
    if (alerts.length > 0) setHasNew(true);
  }, []);

  const handleBellClick = () => {
    setNotifOpen(v => !v);
    setHasNew(false);
  };

  // Shared nav props injected into every page
  const navProps = {
    userRole,
    userName,
    onLogout:     handleLogout,
    activeTab,
    onTabChange:  handleTabChange,
    // Bell props — always present regardless of active page
    notifCount:   liveAlerts.length,
    hasNewNotif:  hasNew,
    notifOpen,
    liveAlerts,
    onNotifClick: handleBellClick,
    onNotifClose: () => setNotifOpen(false),
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <Dashboard
            {...navProps}
            refreshKey={dashRefreshKey}
            onRefreshRequest={() => setDashRefreshKey(k => k + 1)}
            onAlertsUpdate={handleAlertsUpdate}
          />
        );
      case 'Flights':
        return <FlightsPage {...navProps} />;
      case 'Simulation':
        return <SimulationPage {...navProps} />;
      case 'Mitigation Board':
        return <MitigationBoard {...navProps} />;
      case 'User Management':
        return <UserManagement {...navProps} />;
      case 'Settings':
        return <Settings {...navProps} />;
      case 'Profile':
        return <Profile {...navProps} />;
      default:
        return userRole === 'Admin'
          ? <UserManagement {...navProps} />
          : <Dashboard {...navProps} refreshKey={dashRefreshKey} onRefreshRequest={() => setDashRefreshKey(k => k + 1)} onAlertsUpdate={handleAlertsUpdate} />;
    }
  };

  return (
    <div className={`App${!isLoggedIn ? ' login-view' : ''}`}>
      {isLoggedIn ? renderActivePage() : <LoginPage onLogin={handleLogin} />}
    </div>
  );
}

export default App;