/**
 * Dashboard.js
 * ─────────────────────────────────────────────────────────────────
 * Data flow:
 *   App.js owns: refreshKey, liveAlerts, notifOpen, notifCount
 *   Dashboard fetches flights + weather, passes results up via:
 *     onAlertsUpdate(alerts) → App.js stores them → NavBar bell uses them
 *
 *   Refresh button: re-increments App-level refreshKey (via onRefreshRequest)
 *   which triggers useEffect → re-runs load() → re-fetches all data
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import NavigationBar from './NavigationBar';
import { PageLayoutWithBackground } from './PageLayout';
import KPICards from './KPICards';
import FlightsTable from './FlightsTable';
import WeatherPanel from './WeatherPanel';
import VisualAnalytics from './VisualAnalytics';
import QuickActions from './QuickActions';
import {
  PageContainer, MainContent, ContentArea,
} from '../styles/components.styles';
import {
  fetchFlights, fetchWeather, computeKPIs,
} from '../services/predictionService';

// Build alerts list from delayed flights using status field (matches flights table)
const buildAlerts = (flights) => {
  if (!flights) return [];
  return flights
    .filter(f => f.status === 'Minor Delay' || f.status === 'Major Delay')
    .slice(0, 10)
    .map((f, i) => ({
      id: i + 1,
      flightNo:  f.flightNo,
      severity:  f.status === 'Major Delay' ? 'high' : 'moderate',
      message:   f.status === 'Major Delay'
        ? `Major delay (≥30 min). Route: ${f.route}. Est. delay: ${f.predictedDelay} min.`
        : `Minor delay (≥15 min). Route: ${f.route}. Est. delay: ${f.predictedDelay} min.`,
      time: 'just now',
    }));
};

const Dashboard = ({
  userRole = 'APOC', userName, onLogout, activeTab, onTabChange,
  // Bell props from App.js — passed straight through to NavigationBar
  notifCount, hasNewNotif, notifOpen, liveAlerts: appAlerts,
  onNotifClick, onNotifClose,
  // Refresh wiring from App.js
  refreshKey = 0, onRefreshRequest, onAlertsUpdate,
}) => {
  const [liveFlights, setLiveFlights] = useState(null);
  const [liveWeather, setLiveWeather] = useState(null);
  const [liveKPIs,    setLiveKPIs]    = useState(null);
  const [loading,     setLoading]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [flights, weather] = await Promise.all([
        fetchFlights(),
        fetchWeather(),
      ]);

      if (flights) {
        setLiveFlights(flights);
        setLiveKPIs(computeKPIs(flights));
        const alerts = buildAlerts(flights);
        onAlertsUpdate && onAlertsUpdate(alerts); // push up to App.js
      }
      if (weather) setLiveWeather(weather);
    } finally {
      setLoading(false);
    }
  }, [onAlertsUpdate]);

  // Re-fetch whenever App.js increments refreshKey
  useEffect(() => { load(); }, [load, refreshKey]);

  return (
    <PageLayoutWithBackground>
      <PageContainer>
        <NavigationBar
          userRole={userRole}
          userName={userName}
          onLogout={onLogout}
          activeTab={activeTab}
          onTabChange={onTabChange}
          notifCount={notifCount}
          hasNewNotif={hasNewNotif}
          notifOpen={notifOpen}
          liveAlerts={appAlerts || []}
          onNotifClick={onNotifClick}
          onNotifClose={onNotifClose}
        />
        <MainContent>
          <ContentArea>
            <KPICards
              loading={loading}
              onRefresh={onRefreshRequest}   // triggers App-level refreshKey bump
              liveKPIs={liveKPIs}
            />
            <VisualAnalytics liveFlights={liveFlights} />
            <FlightsTable liveFlights={liveFlights} />
            <QuickActions onTabChange={onTabChange} />
          </ContentArea>
          <WeatherPanel liveWeather={liveWeather} />
        </MainContent>
      </PageContainer>
    </PageLayoutWithBackground>
  );
};

export default Dashboard;