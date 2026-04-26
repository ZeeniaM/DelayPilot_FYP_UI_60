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

const CAUSE_DISPLAY_MAP = {
  'Weather (MUC)':        'Weather',
  'En-Route Weather':     'Weather',
  'ATC / Congestion':     'Congestion',
  'Airline / Turnaround': 'Airline',
  'Reactionary':          'Reactionary',
  'Historical Patterns':  'Historical',
  'Congestion':           'Congestion',
  'Weather':              'Weather',
  'Historical':           'Historical',
};

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

const buildExtendedTrend = (history) => {
  if (!history || history.length === 0) return null;
  return history.map((row) => ({
    hour: (() => {
      const d = new Date(row.snapshot_hour);
      const dayStr = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
      const hrStr = `${String(d.getHours()).padStart(2, '0')}:00`;
      return `${dayStr} ${hrStr}`;
    })(),
    total: row.total_flights,
    delayed: row.delayed_flights,
    delay_rate: parseFloat(row.delay_rate || 0),
  }));
};

// ── Derive cause breakdown ────────────────────────────────────────────────────
const buildCauses = (flights) => {
  const delayedFlights = flights.filter(
    f => f.status === 'Minor Delay' || f.status === 'Major Delay'
  );
  if (delayedFlights.length === 0) return null;

  const counts = {};

  delayedFlights.forEach(f => {
    let cause = null;

    if (f.ml_cause) {
      cause = CAUSE_DISPLAY_MAP[f.ml_cause] || f.ml_cause;

    } else if (f.cause_scores && Object.keys(f.cause_scores).length > 0) {
      const best = Object.entries(f.cause_scores)
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)[0];
      if (best) {
        const raw = best[0];
        cause = CAUSE_DISPLAY_MAP[raw] || raw;
      }

    } else if (f.likelyCause) {
      cause = CAUSE_DISPLAY_MAP[f.likelyCause] || f.likelyCause;
    }

    if (!cause) cause = 'Congestion';

    counts[cause] = (counts[cause] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
};

// ── Component ─────────────────────────────────────────────────────────────────
const VisualAnalytics = ({ liveFlights = null, trendHistory = [] }) => {
  const trend  = useMemo(() => liveFlights ? buildTrend(liveFlights)  : null, [liveFlights]);
  const extendedTrend = useMemo(() => buildExtendedTrend(trendHistory), [trendHistory]);
  const causes = useMemo(() => liveFlights ? buildCauses(liveFlights) : null, [liveFlights]);

  const hasFlights = liveFlights && liveFlights.length > 0;
  const hasCauses  = causes && causes.length > 0;

  const trendData = (() => {
    const raw = (extendedTrend && extendedTrend.length > 1)
      ? extendedTrend
      : (trend ?? []);
    const filtered = raw.filter(h => h.delayed > 0);
    return filtered.length > 0 ? filtered : raw;
  })();

  const chartTitle = (extendedTrend && extendedTrend.length > 24)
    ? '7-Day Delay Trend'
    : "Today's Delay Trend";

  // Cause data — show proportional placeholder when no delays detected
  const causeData = hasCauses ? causes : [
    { name: 'No delays detected', value: 1 },
  ];
  const PIE_COLORS = [
    '#0ea5e9',  // sky blue    — Congestion
    '#f59e0b',  // amber       — Weather
    '#10b981',  // emerald     — Airline
    '#f97316',  // orange      — Reactionary
    '#8b5cf6',  // soft violet — Historical
    '#ec4899',  // rose        — other/rare
  ];
  const causeColors = hasCauses ? PIE_COLORS.slice(0, causeData.length) : ['#e5e7eb'];

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
      x: { ticks: { color: '#666', maxTicksLimit: chartTitle === '7-Day Delay Trend' ? 10 : 8 } },
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
      borderWidth:     2,
      borderColor:     '#ffffff',
      hoverOffset:     6,
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
            {chartTitle}
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
