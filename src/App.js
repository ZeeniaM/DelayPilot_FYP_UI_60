/**
 * App.js — COMPLETE REPLACEMENT
 */
import React, { useState, useCallback, useRef } from 'react';
import LandingPage     from './components/LandingPage';
import LoginPage       from './components/LoginPage';
import Dashboard       from './components/Dashboard';
import FlightsPage     from './components/FlightsPage';
import SimulationPage  from './components/SimulationPage';
import MitigationBoard from './components/MitigationBoard';
import UserManagement  from './components/UserManagement';
import Settings        from './components/Settings';
import Profile         from './components/Profile';
import { createCase }  from './services/mitigationService';
import './App.css';
import { GlobalFonts } from './styles/components.styles';

const VIEW = { LANDING: 'landing', LOGIN: 'login', APP: 'app' };

function App() {
  const [view,           setView]           = useState(VIEW.LANDING);
  const [userRole,       setUserRole]       = useState('APOC');
  const [userName,       setUserName]       = useState('');
  const [activeTab,      setActiveTab]      = useState('Dashboard');
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [hasNew,         setHasNew]         = useState(false);
  const [dashRefreshKey, setDashRefreshKey] = useState(0);

  // ── Persistent alert store ────────────────────────────────────
  // Map<flightNo → entry> lives in a ref so it is never lost across
  // re-renders or tab changes. liveAlerts (useState) is the derived
  // display array — always rebuilt from the Map, never replaced wholesale.
  const storeRef  = useRef(new Map());   // flightNo → alertEntry
  const nextId    = useRef(1);
  const [liveAlerts, setLiveAlerts] = useState([]);

  // Rebuild display array from the Map after every mutation
  const sync = () => {
    const arr = Array.from(storeRef.current.values())
      .filter(a => !a.isDismissed)
      .sort((a, b) => a.id - b.id);
    setLiveAlerts(arr);
    return arr;
  };

  // Called by Dashboard after each flight fetch.
  // MERGES new major-delay flights in — never replaces existing entries.
  const handleAlertsMerge = useCallback((incoming) => {
    let added = 0;
    incoming.forEach(a => {
      if (!storeRef.current.has(a.flightNo)) {
        storeRef.current.set(a.flightNo, {
          id:          nextId.current++,
          flightNo:    a.flightNo,
          severity:    a.severity || 'high',
          message:     a.message  || '',
          time:        a.time     || '',
          flight:      a.flight   || null,
          isOnBoard:   false,
          isDismissed: false,
        });
        added++;
      }
      // existing entry → keep untouched (preserves isOnBoard / isDismissed)
    });
    const arr = sync();
    if (added > 0 && arr.length > 0) setHasNew(true);
  }, []);

  // Dismiss: mark entry as dismissed, remove from display
  const handleAlertDismiss = useCallback((flightNo) => {
    const entry = storeRef.current.get(flightNo);
    if (entry) storeRef.current.set(flightNo, { ...entry, isDismissed: true });
    sync();
  }, []);

  // Add to Board: mark isOnBoard and create a case in the DB
  // User sees button turn green immediately, navigates manually.
  // Also attempts to create the case in the mitigation database asynchronously
  const handleAlertAddToBoard = useCallback((flightNo) => {
    const entry = storeRef.current.get(flightNo);
    if (entry) {
      storeRef.current.set(flightNo, { ...entry, isOnBoard: true });
      sync();

      // Async: create the case in the database
      if (entry.flight) {
        const flight = entry.flight;
        try {
          createCase({
            flight_number: flight.flightNo,
            sched_utc: flight.sched_utc,
            airline_code: flight.airline_code,
            route: flight.route,
            predicted_delay_min: flight.delay_min || null,
            risk_level: flight.status === 'Major Delay' ? 'high' : 'medium',
            likely_cause: flight.likelyCause || null,
            tagged_causes: flight.likelyCause ? [flight.likelyCause] : [],
          }).catch(e => {
            console.warn('Case creation from alert failed:', e);
          });
        } catch (e) {
          console.warn('Case creation from alert error:', e);
        }
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUserRole(userData.role);
    setUserName(userData.name || userData.username || '');
    setView(VIEW.APP);
    setActiveTab(userData.role === 'Admin' ? 'User Management' : 'Dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    storeRef.current.clear();
    setLiveAlerts([]);
    setNotifOpen(false);
    setHasNew(false);
    setView(VIEW.LANDING);
    setUserName('');
    setActiveTab('Dashboard');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setNotifOpen(false);
  };

  const handleBellClick = () => {
    setNotifOpen(v => !v);
    setHasNew(false);
  };

  const navProps = {
    userRole,
    userName,
    onLogout:          handleLogout,
    activeTab,
    onTabChange:       handleTabChange,
    notifCount:        liveAlerts.length,
    hasNewNotif:       hasNew,
    notifOpen,
    liveAlerts,
    onNotifClick:      handleBellClick,
    onNotifClose:      () => setNotifOpen(false),
    onAlertDismiss:    handleAlertDismiss,
    onAlertAddToBoard: handleAlertAddToBoard,
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <Dashboard
            {...navProps}
            refreshKey={dashRefreshKey}
            onRefreshRequest={() => setDashRefreshKey(k => k + 1)}
            onAlertsUpdate={handleAlertsMerge}
          />
        );
      case 'Flights':          return <FlightsPage    {...navProps} />;
      case 'Simulation':       return <SimulationPage {...navProps} />;
      case 'Mitigation Board': return <MitigationBoard {...navProps} />;
      case 'User Management':  return <UserManagement  {...navProps} />;
      case 'Settings':         return <Settings        {...navProps} />;
      case 'Profile':          return <Profile         {...navProps} />;
      default:
        return userRole === 'Admin'
          ? <UserManagement {...navProps} />
          : <Dashboard
              {...navProps}
              refreshKey={dashRefreshKey}
              onRefreshRequest={() => setDashRefreshKey(k => k + 1)}
              onAlertsUpdate={handleAlertsMerge}
            />;
    }
  };

  if (view === VIEW.LANDING) return <LandingPage onGoToLogin={() => setView(VIEW.LOGIN)} />;

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

  return (
    <>
      <GlobalFonts />
      <div className="App">{renderActivePage()}</div>
    </>
  );
}

export default App;