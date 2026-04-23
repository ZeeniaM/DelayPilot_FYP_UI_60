/**
 * App.js — COMPLETE REPLACEMENT
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import API_BASE_URL    from './config/api';
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
  const [adminDeletionRequests, setAdminDeletionRequests] = useState([]);
  const [adminHasNewRequests, setAdminHasNewRequests] = useState(false);
  const [dashRefreshKey,    setDashRefreshKey]    = useState(0);
  const [simulationResult,  setSimulationResult]  = useState(null);

  // ── Persistent alert store ────────────────────────────────────
  // Map<flightNo → entry> lives in a ref so it is never lost across
  // re-renders or tab changes. liveAlerts (useState) is the derived
  // display array — always rebuilt from the Map, never replaced wholesale.
  const storeRef  = useRef(new Map());   // flightNo → alertEntry
  const nextId    = useRef(1);
  const tokenValidationIntervalRef = useRef(null);
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

  const fetchAdminDeletionRequests = useCallback(async () => {
    if (userRole !== 'Admin') return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/auth/deletion-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const mappedRequests = (data.requests || []).map(row => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          username: row.username,
          role: row.role,
          requestTime: row.requested_at ? new Date(row.requested_at).toLocaleString() : 'Unknown'
        }));

        setAdminDeletionRequests(prev => {
          if (mappedRequests.length > prev.length) {
            setAdminHasNewRequests(true);
          }
          return mappedRequests;
        });
      }
    } catch (error) {
      // Polling should stay silent; NavigationBar will simply keep the last known state.
    }
  }, [userRole]);

  const handleLogout = useCallback((message) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    storeRef.current.clear();
    setLiveAlerts([]);
    setNotifOpen(false);
    setHasNew(false);
    setAdminDeletionRequests([]);
    setAdminHasNewRequests(false);
    setView(VIEW.LANDING);
    setUserName('');
    setActiveTab('Dashboard');
    if (message) {
      window.alert(message);
    }
  }, []);

  useEffect(() => {
    if (view !== VIEW.APP) {
      if (tokenValidationIntervalRef.current) {
        clearInterval(tokenValidationIntervalRef.current);
        tokenValidationIntervalRef.current = null;
      }
      return undefined;
    }

    const revalidateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        handleLogout();
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
          handleLogout();
          return;
        }

        const data = await response.json();
        if (!data.success || !data.user) {
          handleLogout();
          return;
        }

        if (data.user.status === 'inactive') {
          handleLogout('Your account has been deactivated. Please contact an administrator.');
          return;
        }

        const nextRole = data.user.role;
        const nextName = data.user.name || data.user.username || '';

        setUserRole(prevRole => {
          if (prevRole !== nextRole) {
            setActiveTab(currentTab => {
              const adminTabs = ['User Management', 'Settings', 'Profile'];
              const userTabs = ['Dashboard', 'Flights', 'Simulation', 'Mitigation Board', 'Profile'];
              if (nextRole === 'Admin' && !adminTabs.includes(currentTab)) {
                return 'User Management';
              }
              if (nextRole !== 'Admin' && !userTabs.includes(currentTab)) {
                return 'Dashboard';
              }
              return currentTab;
            });
          }
          return nextRole;
        });
        setUserName(prevName => (prevName === nextName ? prevName : nextName));
      } catch (error) {
        console.error('Token re-validation failed:', error);
        handleLogout();
      }
    };

    tokenValidationIntervalRef.current = setInterval(revalidateToken, 5 * 60 * 1000);

    return () => {
      if (tokenValidationIntervalRef.current) {
        clearInterval(tokenValidationIntervalRef.current);
        tokenValidationIntervalRef.current = null;
      }
    };
  }, [handleLogout, view]);

  useEffect(() => {
    if (view !== VIEW.APP || userRole !== 'Admin') {
      return undefined;
    }

    fetchAdminDeletionRequests();
    const deletionRequestsInterval = setInterval(fetchAdminDeletionRequests, 60 * 1000);
    return () => clearInterval(deletionRequestsInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, userRole]);

  const handleAdminDeletionDismiss = useCallback((requestId) => {
    setAdminDeletionRequests(prev => prev.filter(request => request.id !== requestId));
  }, []);

  const handleAdminRequestsRead = useCallback(() => {
    setAdminHasNewRequests(false);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setNotifOpen(false);
  };

  const handleBellClick = () => {
    setNotifOpen(v => !v);
    setHasNew(false);
    handleAdminRequestsRead();
  };

  const handleSimulationResult = (res) => setSimulationResult(res);

  const navProps = {
    userRole,
    userName,
    onLogout:            handleLogout,
    activeTab,
    onTabChange:         handleTabChange,
    notifCount:          liveAlerts.length,
    hasNewNotif:         hasNew,
    notifOpen,
    liveAlerts,
    adminDeletionRequests,
    adminHasNewRequests,
    onNotifClick:        handleBellClick,
    onNotifClose:        () => setNotifOpen(false),
    onAdminRequestsDismiss: handleAdminDeletionDismiss,
    onAdminRequestsRead: handleAdminRequestsRead,
    onAlertDismiss:      handleAlertDismiss,
    onAlertAddToBoard:   handleAlertAddToBoard,
    simulationResult,
    onSimulationResult:  handleSimulationResult,
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
