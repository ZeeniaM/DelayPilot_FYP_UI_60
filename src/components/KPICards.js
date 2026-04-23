/**
 * KPICards.js
 * ─────────────────────────────────────────────────────────────────
 * Displays 4 KPI cards + Refresh + KPI Report buttons.
 * Notification bell/dropdown moved to NavigationBar (global, App.js owned).
 * Refresh button shows a spinner while loading=true (matches FlightsPage UX).
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import KPIReportModal from './KPIReportModal';
import {
  KPIContainer, KPIRow, KPIRowHeader,
  KPICard, KPITitle, KPIMetric, KPINumber, KPISubLabel,
  KPILiveTag, KPILiveDot,
  IconCircleButton,
} from '../styles/components.styles';

// Fallback static data (Munich Airport daily averages)
const FALLBACK_KPI = {
  totalFlights:      381,
  delayedFlights:    57,
  majorDelays:       9,
  averageDelay:      22,
  onTimePerformance: 85.1,
};

const KPICards = ({ loading = false, onRefresh, liveKPIs = null, liveFlights = null, liveWeather = null, userName = '' }) => {
  const [reportOpen, setReportOpen] = useState(false);

  const isLive = !!liveKPIs;
  const kpi = isLive ? {
    totalFlights:      liveKPIs.totalFlights,
    delayedFlights:    liveKPIs.delayed15Count,
    majorDelays:       liveKPIs.delayed30Count,
    averageDelay:      parseFloat(liveKPIs.avgDelayMin),
    onTimePerformance: parseFloat(liveKPIs.onTimePct),
  } : FALLBACK_KPI;

  const kpiCards = [
    {
      title: 'Total Flights',
      value: kpi.totalFlights.toLocaleString(),
      sub:   'in current FIDS window',
    },
    {
      title: 'Delayed Flights',
      value: kpi.delayedFlights,
      sub:   isLive ? `${kpi.majorDelays} major · rest minor` : 'Minor + Major delays',
    },
    {
      title: 'Avg. Delay',
      value: `${Math.round(kpi.averageDelay)} min`,
      sub:   'among delayed flights',
    },
    {
      title: 'On-Time Performance',
      value: `${kpi.onTimePerformance}%`,
      sub:   'IATA OTP (excl. cancelled)',
    },
  ];

  return (
    <KPIContainer>
      <KPIRowHeader>
        <KPIRow>
          {kpiCards.map(card => (
            <KPICard key={card.title}>
              <KPITitle>{card.title}</KPITitle>
              <KPIMetric>
                <KPINumber>{card.value}</KPINumber>
                <KPISubLabel>{card.sub}</KPISubLabel>
              </KPIMetric>
              <KPILiveTag live={isLive}>
                <KPILiveDot live={isLive} />
                {isLive ? 'Live' : 'Demo'}
              </KPILiveTag>
            </KPICard>
          ))}
        </KPIRow>

        {/* ── Action buttons stacked right of cards ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 14, flexShrink: 0 }}>

          {/* Refresh — spins while loading */}
          <IconCircleButton
            onClick={onRefresh}
            title="Refresh all data"
            disabled={loading}
            style={{
              width: 40, height: 40, fontSize: 18,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <span style={{
              display: 'inline-block',
              animation: loading ? 'spin 0.8s linear infinite' : 'none',
            }}>↻</span>
          </IconCircleButton>

          {/* KPI Report */}
          <button
            onClick={() => setReportOpen(true)}
            title="Generate KPI Report"
            style={{
              background: 'linear-gradient(180deg,#1A4B8F,#0f3a73)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '7px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(26,75,143,0.3)',
              lineHeight: 1.3,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              width: 40,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="12" width="4" height="9"/>
              <rect x="10" y="7" width="4" height="14"/>
              <rect x="17" y="3" width="4" height="18"/>
            </svg>
            KPI
          </button>

          {/* CSS keyframe for spinner */}
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </KPIRowHeader>

      <KPIReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        kpiSource={{ kpis: {
          totalFlights:      kpi.totalFlights,
          delayedFlights:    kpi.delayedFlights,
          averageDelay:      kpi.averageDelay,
          onTimePerformance: kpi.onTimePerformance,
        }, liveFlights, liveWeather}}
        userName={userName}
      />
    </KPIContainer>
  );
};

export default KPICards;
