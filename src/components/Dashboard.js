/**
 * Dashboard.js
 * ─────────────────────────────────────────────────────────────────
 * Orchestrator: fetches pipeline data once, passes as props to children.
 * Children never fetch independently → single source of truth.
 *
 * Data flow:
 *   Dashboard
 *     → fetchFlights()     → liveFlights  → KPICards, FlightsTable, AlertsPanel
 *     → fetchWeather()     → liveWeather  → WeatherPanel
 *     → computeKPIs()      → liveKPIs     → KPICards
 *     → buildAlerts()      → liveAlerts   → AlertsPanel, KPICards (bell)
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import NavigationBar from './NavigationBar';
import { PageLayout } from './PageLayout';
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

// Build alerts list from delayed flights
const buildAlerts = (flights) => {
  if (!flights) return [];
  return flights
    .filter(f => f.is_delayed_15)
    .slice(0, 10)
    .map((f, i) => ({
      id: i + 1,
      flightNo: f.flightNo,
      severity: f.is_delayed_30 ? 'high' : 'moderate',
      message: f.is_delayed_30
        ? `Major delay predicted (≥30 min). Route: ${f.route}. Est. delay: ${f.predictedDelay} min.`
        : `Minor delay predicted (≥15 min). Route: ${f.route}. Est. delay: ${f.predictedDelay} min.`,
      time: 'just now',
    }));
};

const Dashboard = ({ userRole = 'APOC', userName, onLogout, activeTab, onTabChange }) => {
  const [liveFlights, setLiveFlights] = useState(null);
  const [liveWeather, setLiveWeather] = useState(null);
  const [liveKPIs,    setLiveKPIs]    = useState(null);
  const [liveAlerts,  setLiveAlerts]  = useState([]);
  const [refreshKey,  setRefreshKey]  = useState(0);

  const load = useCallback(async () => {
    const [flights, weather] = await Promise.all([
      fetchFlights(),
      fetchWeather(),
    ]);

    if (flights) {
      setLiveFlights(flights);
      setLiveKPIs(computeKPIs(flights));
      setLiveAlerts(buildAlerts(flights));
    }
    if (weather) setLiveWeather(weather);
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  return (
    <PageLayout>
      <PageContainer>
        <NavigationBar
          userRole={userRole}
          userName={userName}
          onLogout={onLogout}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
        <MainContent>
          <ContentArea>
            <KPICards
              refreshKey={refreshKey}
              onRefresh={handleRefresh}
              liveKPIs={liveKPIs}
              liveAlerts={liveAlerts}
            />
            <VisualAnalytics liveFlights={liveFlights} />
            <FlightsTable liveFlights={liveFlights} />
            <QuickActions onTabChange={onTabChange} />
          </ContentArea>
          <WeatherPanel liveWeather={liveWeather} />
        </MainContent>
      </PageContainer>
    </PageLayout>
  );
};

export default Dashboard;