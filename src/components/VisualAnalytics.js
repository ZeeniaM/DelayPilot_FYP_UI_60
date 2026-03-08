/**
 * VisualAnalytics.js
 * ─────────────────────────────────────────────────────────────────
 * Styled-components from components.styles.js.
 * Props:
 *   liveFlights — array from predictionService (or null → use mock data)
 *
 * When liveFlights is available:
 *   • Delay Trend: bins flights by hour using sched_utc, counts delayed ones
 *   • Cause Breakdown: classifies by delay magnitude as proxy for cause
 *     (until pipeline exposes cause_groups, which is a future TODO)
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useMemo } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Legend, ArcElement,
} from 'chart.js';
import {
  AnalyticsSection, AnalyticsGrid, AnalyticsCard, AnalyticsTitle,
} from '../styles/components.styles';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ArcElement);

const CHART_COLORS = {
  blue:   '#6495ED',
  orange: '#F5A623',
  purple: '#7B1FA2',
  silver: '#c4aead',
  green:  '#2ECC71',
};

// ── Mock fallback data ───────────────────────────────────────────
const MOCK_TREND = Array.from({ length: 24 }, (_, i) => ({
  hour:    `${String(i).padStart(2, '0')}:00`,
  delayed: Math.max(0, Math.round(10 + 15 * Math.sin((i / 24) * Math.PI * 2) + (i % 5))),
}));

const MOCK_CAUSES = [
  { name: 'Reactionary', value: 42 },
  { name: 'Congestion',  value: 25 },
  { name: 'Weather',     value: 23 },
  { name: 'Other',       value: 10 },
];

// ── Derive hourly trend from live flights ────────────────────────
const buildTrend = (flights) => {
  const buckets = {};
  for (let h = 0; h < 24; h++) buckets[String(h).padStart(2, '0')] = 0;

  flights.forEach(f => {
    if (!f.sched_utc) return;
    const h = String(new Date(f.sched_utc).getUTCHours()).padStart(2, '0');
    if (f.is_delayed_15) buckets[h] = (buckets[h] || 0) + 1;
  });

  return Object.entries(buckets).map(([h, delayed]) => ({
    hour: `${h}:00`,
    delayed,
  }));
};

// ── Derive cause breakdown proxy from delay magnitudes ───────────
const buildCauses = (flights) => {
  const delayed = flights.filter(f => f.delay_min > 0);
  if (delayed.length === 0) return MOCK_CAUSES;

  // Proxy classification by delay band:
  //   0–20 min  → likely Reactionary (small propagated delays)
  //   20–45 min → likely Congestion
  //   45+ min   → likely Weather or Major Reactionary
  let reactionary = 0, congestion = 0, weather = 0, other = 0;
  delayed.forEach(f => {
    if (f.delay_min < 20)     reactionary++;
    else if (f.delay_min < 45) congestion++;
    else                       weather++;
  });
  other = Math.max(0, Math.round(delayed.length * 0.05));

  return [
    { name: 'Reactionary', value: reactionary },
    { name: 'Congestion',  value: congestion  },
    { name: 'Weather',     value: weather     },
    { name: 'Other',       value: other       },
  ].filter(c => c.value > 0);
};

// ── Component ────────────────────────────────────────────────────
const VisualAnalytics = ({ liveFlights = null }) => {
  const trend  = useMemo(() => liveFlights ? buildTrend(liveFlights)  : MOCK_TREND,  [liveFlights]);
  const causes = useMemo(() => liveFlights ? buildCauses(liveFlights) : MOCK_CAUSES, [liveFlights]);

  const lineData = {
    labels: trend.map(d => d.hour),
    datasets: [{
      label: 'Delayed Flights',
      data: trend.map(d => d.delayed),
      borderColor: CHART_COLORS.blue,
      backgroundColor: 'rgba(100,149,237,0.1)',
      tension: 0.35,
      borderWidth: 2,
      pointRadius: 3,
    }],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { intersect: false } },
    scales: {
      x: { ticks: { color: '#666', maxTicksLimit: 8 } },
      y: { ticks: { color: '#666', precision: 0 }, grid: { color: '#f1f3f4' } },
    },
  };

  const doughnutData = {
    labels: causes.map(c => c.name),
    datasets: [{
      data: causes.map(c => c.value),
      backgroundColor: [CHART_COLORS.blue, CHART_COLORS.orange, CHART_COLORS.purple, CHART_COLORS.silver],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const doughnutOptions = {
    cutout: '62%',
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } } },
    maintainAspectRatio: false,
    responsive: true,
  };

  const subtitle = liveFlights
    ? `${liveFlights.length} flights today`
    : 'Demo data';

  return (
    <AnalyticsSection>
      <AnalyticsGrid>
        <AnalyticsCard>
          <AnalyticsTitle>
            Delay Trend – Today by Hour
            <span style={{ fontSize: 11, color: '#666', fontWeight: 400, marginLeft: 8 }}>
              {subtitle}
            </span>
          </AnalyticsTitle>
          <div style={{ width: '100%', height: 260 }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        </AnalyticsCard>

        <AnalyticsCard>
          <AnalyticsTitle>Delay Cause Breakdown</AnalyticsTitle>
          <div style={{ width: '100%', height: 260 }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </AnalyticsCard>
      </AnalyticsGrid>
    </AnalyticsSection>
  );
};

export default VisualAnalytics;