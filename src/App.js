/**
 * App.js
 * ─────────────────────────────────────────────────────────────────
 * Three-state routing:
 *   1. Landing page  (public, default)
 *   2. Login page    (operator, from landing or direct)
 *   3. App pages     (authenticated)
 *
 * Notification state lifted here so the bell persists across all
 * page navigations. liveAlerts and notif toggle are passed down to
 * every page via props, and NavigationBar receives them globally.
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useState, useCallback } from 'react';
import LandingPage    from './components/LandingPage';
import LoginPage      from './components/LoginPage';
import Dashboard      from './components/Dashboard';
import FlightsPage    from './components/FlightsPage';
import SimulationPage from './components/SimulationPage';
import MitigationBoard from './components/MitigationBoard';
import UserManagement from './components/UserManagement';
import Settings       from './components/Settings';
import Profile        from './components/Profile';
import './App.css';
import { GlobalFonts } from './styles/components.styles';

// ── view states ───────────────────────────────────────────────────
const VIEW = { LANDING: 'landing', LOGIN: 'login', APP: 'app' };

function App() {
  const [view,       setView]       = useState(VIEW.LANDING);
  const [userRole,   setUserRole]   = useState('APOC');
  const [userName,   setUserName]   = useState('');
  const [activeTab,  setActiveTab]  = useState('Dashboard');

  // ── Global notification state ────────────────────────────────
  const [liveAlerts,  setLiveAlerts]  = useState([]);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [hasNew,      setHasNew]      = useState(false);
  const [dashRefreshKey, setDashRefreshKey] = useState(0);

  const handleLogin = (userData) => {
    setUserRole(userData.role);
    setUserName(userData.name || userData.username || '');
    setView(VIEW.APP);
    setActiveTab(userData.role === 'Admin' ? 'User Management' : 'Dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView(VIEW.LANDING);
    setUserName('');
    setActiveTab('Dashboard');
    setLiveAlerts([]);
    setNotifOpen(false);
    setHasNew(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setNotifOpen(false);
  };

  const handleAlertsUpdate = useCallback((alerts) => {
    setLiveAlerts(alerts);
    if (alerts.length > 0) setHasNew(true);
  }, []);

  const handleBellClick = () => {
    setNotifOpen(v => !v);
    setHasNew(false);
  };

  const navProps = {
    userRole,
    userName,
    onLogout:     handleLogout,
    activeTab,
    onTabChange:  handleTabChange,
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
      case 'Flights':        return <FlightsPage    {...navProps} />;
      case 'Simulation':     return <SimulationPage {...navProps} />;
      case 'Mitigation Board': return <MitigationBoard {...navProps} />;
      case 'User Management':  return <UserManagement {...navProps} />;
      case 'Settings':       return <Settings  {...navProps} />;
      case 'Profile':        return <Profile   {...navProps} />;
      default:
        return userRole === 'Admin'
          ? <UserManagement {...navProps} />
          : <Dashboard {...navProps} refreshKey={dashRefreshKey} onRefreshRequest={() => setDashRefreshKey(k => k + 1)} onAlertsUpdate={handleAlertsUpdate} />;
    }
  };

  // ── landing ───────────────────────────────────────────────────
  if (view === VIEW.LANDING) {
    return <LandingPage onGoToLogin={() => setView(VIEW.LOGIN)} />;
  }

  // ── login ─────────────────────────────────────────────────────
  if (view === VIEW.LOGIN) {
    return (
      <>
        <GlobalFonts />
        <div className="App login-view">
          <LoginPage onLogin={handleLogin} onGoBack={() => setView(VIEW.LANDING)} />
        </div>
      </>
    );
  }

  // ── app ───────────────────────────────────────────────────────
  return (
    <>
      <GlobalFonts />
      <div className="App">
        {renderActivePage()}
      </div>
    </>
  );
}

export default App;