/**
 * Dashboard.js — COMPLETE REPLACEMENT
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
  fetchFlights, fetchWeather, computeKPIs, postTrendSnapshot, fetchTrendHistory,
  filterFlightsForAoc,
} from '../services/predictionService';

// Major Delay only — one entry per flight, carries full flight object
const buildAlerts = (flights) => {
  if (!flights) return [];
  return flights
    .filter(f => f.status === 'Major Delay')
    .map(f => ({
      flightNo: f.flightNo,
      severity: 'high',
      message:  `Major delay — ${f.route}. Est. delay: ${f.predictedDelay} min.${f.likelyCause ? ` Cause: ${f.likelyCause}.` : ''}`,
      time:     f.scheduledTime || '—',
      flight:   f,
    }));
};

const Dashboard = ({
  userRole = 'APOC', userName, onLogout, activeTab, onTabChange,
  notifCount, hasNewNotif, notifOpen, liveAlerts: appAlerts,
  onNotifClick, onNotifClose,
  onAlertDismiss, onAlertAddToBoard,
  refreshKey = 0, onRefreshRequest,
  onAlertsUpdate,   // App.js passes handleAlertsMerge here
  ...navExtras
}) => {
  const [liveFlights, setLiveFlights] = useState(null);
  const [liveWeather, setLiveWeather] = useState(null);
  const [liveKPIs,    setLiveKPIs]    = useState(null);
  const [trendHistory, setTrendHistory] = useState([]);
  const [loading,     setLoading]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [flights, weather] = await Promise.all([
        fetchFlights(),
        fetchWeather(),
      ]);
      if (flights) {
        const filteredFlights = filterFlightsForAoc(flights, userRole);
        setLiveFlights(filteredFlights);
        setLiveKPIs(computeKPIs(filteredFlights));
        // Merge (not replace) alerts in App.js store
        onAlertsUpdate && onAlertsUpdate(buildAlerts(filteredFlights));
        postTrendSnapshot(filteredFlights);
      }
      if (weather) setLiveWeather(weather);
      if (userRole === 'AOC') {
        setTrendHistory([]);
      } else {
        fetchTrendHistory().then(setTrendHistory).catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  }, [onAlertsUpdate, userRole]);

  useEffect(() => { load(); }, [load, refreshKey]);

  useEffect(() => {
    const weatherInterval = setInterval(async () => {
      try {
        const weather = await fetchWeather();
        if (weather) setLiveWeather(weather);
      } catch (error) {
        console.warn('Error auto-refreshing weather:', error);
      }
    }, 300000);
    return () => clearInterval(weatherInterval);
  }, []);

  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const weather = await fetchWeather();
          if (weather) setLiveWeather(weather);
        } catch {}
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

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
          onAlertDismiss={onAlertDismiss}
          onAlertAddToBoard={onAlertAddToBoard}
          {...navExtras}
        />
        <MainContent>
          <ContentArea>
            {userRole === 'AOC' && (() => {
              try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                return user.airline ? (
                  <div style={{
                    fontSize: 12,
                    color: '#64748b',
                    fontWeight: 500,
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <span style={{ fontSize: 14 }}>✈️</span>
                    <span>
                      Showing data for <strong style={{ color: '#1A4B8F' }}>{user.airline}</strong> only
                    </span>
                  </div>
                ) : null;
              } catch {
                return null;
              }
            })()}
            <KPICards
              loading={loading}
              onRefresh={onRefreshRequest}
              liveKPIs={liveKPIs}
              liveFlights={liveFlights}
              liveWeather={liveWeather}
              userName={userName}
            />
            <VisualAnalytics liveFlights={liveFlights} trendHistory={trendHistory} />
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
