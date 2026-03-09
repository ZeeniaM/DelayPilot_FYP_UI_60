/**
 * VisualAnalytics.js
 * ─────────────────────────────────────────────────────────────────
 * Derives trend + cause breakdown directly from the liveFlights array
 * passed from Dashboard — the same data driving KPI cards and the
 * flights table. No separate API call needed.
 *
 * liveFlights entries are already tier-priority resolved by
 * predictionService.mapFlight():
 *   status       — 'On Time' / 'Minor Delay' / 'Major Delay' / 'Early' / ...
 *   delay_min    — confirmed_delay_min → ml_minutes_ui → y_delay_min
 *   delaySource  — 'confirmed' / 'fids' / 'model'
 *   ml_cause     — from flight_predictions batch output
 *   sched_utc    — scheduled time UTC string
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
};

// ── Derive 24-hour delay trend ────────────────────────────────────────────────
// Uses sched_utc converted to local time (Europe/Berlin) so hour buckets
// match what the user sees in the flights table.
const buildTrend = (flights) => {
  const total   = {};
  const delayed = {};
  for (let h = 0; h < 24; h++) {
    total[h]   = 0;
    delayed[h] = 0;
  }

  flights.forEach(f => {
    if (!f.sched_utc) return;
    const localHour = new Date(f.sched_utc).getHours(); // browser local time
    total[localHour]++;
    if (f.status === 'Minor Delay' || f.status === 'Major Delay') {
      delayed[localHour]++;
    }
  });

  return Array.from({ length: 24 }, (_, h) => ({
    hour:    `${String(h).padStart(2, '0')}:00`,
    total:   total[h],
    delayed: delayed[h],
  }));
};

// ── Derive cause breakdown ────────────────────────────────────────────────────
// Priority: ml_cause from batch predictions (real signal).
// Fallback: classify by delay magnitude as proxy when ml_cause not available.
const buildCauses = (flights) => {
  const delayedFlights = flights.filter(
    f => f.status === 'Minor Delay' || f.status === 'Major Delay'
  );
  if (delayedFlights.length === 0) return null;

  const counts = {};

  delayedFlights.forEach(f => {
    let cause = f.ml_cause || null;

    if (!cause) {
      // Fallback heuristic: classify by delay band
      const d = f.delay_min || 0;
      if (d < 20)      cause = 'Reactionary';
      else if (d < 45) cause = 'Congestion';
      else             cause = 'Weather';
    }

    counts[cause] = (counts[cause] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
};

// ── Component ─────────────────────────────────────────────────────────────────
const VisualAnalytics = ({ liveFlights = null }) => {
  const trend  = useMemo(() => liveFlights ? buildTrend(liveFlights)  : null, [liveFlights]);
  const causes = useMemo(() => liveFlights ? buildCauses(liveFlights) : null, [liveFlights]);

  const hasFlights = liveFlights && liveFlights.length > 0;
  const hasCauses  = causes && causes.length > 0;

  // Trend data — zeros when no data yet
  const trendData = trend ?? Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}:00`, total: 0, delayed: 0,
  }));

  // Cause data — show proportional placeholder when no delays detected
  const causeData = hasCauses ? causes : [
    { name: 'No delays detected', value: 1 },
  ];
  const causeColors = hasCauses
    ? [CHART_COLORS.blue, CHART_COLORS.orange, CHART_COLORS.purple, CHART_COLORS.silver]
    : ['#e2e8f0'];

  // ── Chart configs ─────────────────────────────────────────────────────────
  const lineData = {
    labels: trendData.map(d => d.hour),
    datasets: [{
      label: 'Delayed Flights',
      data:  trendData.map(d => d.delayed),
      borderColor:     CHART_COLORS.blue,
      backgroundColor: 'rgba(100,149,237,0.1)',
      tension:     0.35,
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
      y: {
        ticks: { color: '#666', precision: 0 },
        beginAtZero: true,
        grid: { color: '#f1f3f4' },
      },
    },
  };

  const doughnutData = {
    labels: causeData.map(c => c.name),
    datasets: [{
      data:            causeData.map(c => c.value),
      backgroundColor: causeColors,
      borderWidth:  0,
      hoverOffset:  6,
    }],
  };

  const doughnutOptions = {
    cutout: '62%',
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } },
      tooltip: { enabled: hasCauses },
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  // ── Subtitles ─────────────────────────────────────────────────────────────
  const totalDelayed = liveFlights
    ? liveFlights.filter(f => f.status === 'Minor Delay' || f.status === 'Major Delay').length
    : 0;

  const trendSubtitle = hasFlights
    ? `${liveFlights.length} flights · ${totalDelayed} delayed`
    : 'Awaiting data…';

  const causeSubtitle = hasFlights && !hasCauses
    ? 'No delays in current window'
    : null;

  return (
    <AnalyticsSection>
      <AnalyticsGrid>

        <AnalyticsCard>
          <AnalyticsTitle>
            Delay Trend – Today by Hour
            <span style={{ fontSize: 11, color: '#666', fontWeight: 400, marginLeft: 8 }}>
              {trendSubtitle}
            </span>
          </AnalyticsTitle>
          <div style={{ width: '100%', height: 260 }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        </AnalyticsCard>

        <AnalyticsCard>
          <AnalyticsTitle>
            Delay Cause Breakdown
            {hasCauses && (
              <span style={{ fontSize: 11, color: '#666', fontWeight: 400, marginLeft: 8 }}>
                {totalDelayed} delayed flights
              </span>
            )}
          </AnalyticsTitle>
          {causeSubtitle && (
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
              {causeSubtitle}
            </div>
          )}
          <div style={{ width: '100%', height: 260 }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </AnalyticsCard>

      </AnalyticsGrid>
    </AnalyticsSection>
  );
};

export default VisualAnalytics;