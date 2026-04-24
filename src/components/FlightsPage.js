/**
 * FlightsPage.js
 * ─────────────────────────────────────────────────────────────────
 * All styled-components from components.styles.js.
 * Data: fetches from predictionService on mount.
 * On row click: opens drawer using pre-computed ml_* fields from mapFlight() — no extra API call.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createGlobalStyle } from 'styled-components';
import NavigationBar from './NavigationBar';
import { PageLayout } from './PageLayout';
import { createCase } from '../services/mitigationService';
import {
  PageContainer, MainContent, ContentArea,
  PageTitle, IconCircleButton,
  FilterBar, SearchBox, FilterSelect,
  FullTableContainer, Table, TableHead, FullTableHeaderCell, TableBody, TableRow, TableCell,
  FlightNumber, AirlineInfo, RouteInfo, TimeCell, ScheduledTime, ActualTime,
  DelayValue, CauseTag, StatusPill, ChevronIcon,
  DetailDrawer, DrawerHeader, DrawerTitle, DrawerSubtitle,
  DrawerContent, DrawerSection, DrawerSectionTitle, DrawerFooter, DrawerButton,
  PredictionBlock, PredictionRow, PredictionLabel, PredictionValue,
  ProbBar, ProbFill,
  CauseBreakdown, CauseItem, CauseLabel, CauseBar, CauseFill, CausePercentage,
  DrawerBackdrop, LoadingText, ErrorText, Spinner,
} from '../styles/components.styles';
import { fetchFlights, fetchPropagation, formatTime, filterFlightsForAoc } from '../services/predictionService';

// ── Global style: lock background to solid blue across all interactions ────
// The background split (blue nav / white body) shifts on drawer open/close
// because body padding-right is added for scrollbar compensation. 
// Setting a consistent background on html+body prevents any white flash.
const GlobalBlueBackground = createGlobalStyle`
  html, body, #root {
    background-color: #1A4B8F !important;
    min-height: 100vh;
  }
`;

// ── Helpers ──────────────────────────────────────────────────────
// Label for delay data source shown in drawer
const delaySourceLabel = (source) => {
  if (source === 'confirmed') return 'Confirmed (Flight Status API)';
  if (source === 'model')     return 'Predictive Intelligence';
  if (source === 'fids')      return 'FIDS Estimate';
  return 'Unknown';
};

// OP status display label
const opStatusLabel = (s) => {
  const map = { Scheduled: 'Scheduled', EnRoute: 'En Route', Landed: 'Landed',
                Cancelled: 'Cancelled', Diverted: 'Diverted', Unknown: 'Unknown' };
  return map[s] || s || 'Scheduled';
};

const STATUS_SORT_ORDER = {
  'Major Delay': 0,
  'Minor Delay': 1,
  'On Time': 2,
  Scheduled: 3,
  'En Route': 4,
  Early: 5,
  Landed: 6,
  Cancelled: 7,
  Diverted: 8,
};

// ── Component ────────────────────────────────────────────────────
const FlightsPage = ({ userRole = 'APOC', userName, onLogout, activeTab, onTabChange,
  notifCount = 0, hasNewNotif = false, notifOpen = false, liveAlerts = [], onNotifClick, onNotifClose,
  onAlertDismiss, onAlertAddToBoard, ...navExtras
}) => {
  const [flights,           setFlights]           = useState([]);
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState(null);
  const [refreshKey,        setRefreshKey]        = useState(0);

  const [searchTerm,        setSearchTerm]        = useState('');
  const [statusFilter,      setStatusFilter]      = useState('All');
  const [movementFilter,    setMovementFilter]    = useState('All');
  const [timeFilter,        setTimeFilter]        = useState('Today');

  const [selectedFlight,    setSelectedFlight]    = useState(null);
  const [drawerOpen,        setDrawerOpen]        = useState(false);
  const [prediction,        setPrediction]        = useState(null);
  const [predLoading,       setPredLoading]       = useState(false);

  const [propagationData,   setPropagationData]   = useState(null);
  const [propagationLoading, setPropagationLoading] = useState(false);

  // Fetch flights
  const loadFlights = useCallback(async () => {
    setLoading(true);
    setError(null);
    const data = await fetchFlights();
    if (data) {
      setFlights(data);
    } else {
      setError('Could not load flights from pipeline. Showing cached data.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadFlights(); }, [loadFlights, refreshKey]);

  const displayFlights = useMemo(
    () => filterFlightsForAoc(flights || [], userRole),
    [flights, userRole]
  );

  const filteredFlights = useMemo(() => {
    const filtered = displayFlights.filter(f => {
      const q = searchTerm.toLowerCase();
      const matchSearch    = f.flightNo.toLowerCase().includes(q) || f.airline.toLowerCase().includes(q);
      const matchStatus    = statusFilter    === 'All' || f.status    === statusFilter;
      const matchMovement  = movementFilter  === 'All' || f.movement  === movementFilter;
      return matchSearch && matchStatus && matchMovement;
    });

    // Sort: delayed (major → minor) first, then on time, en route, early/landed last.
    // Within the same status, preserve chronological order (sched_utc ascending).
    return [...filtered].sort((a, b) => {
      const orderA = STATUS_SORT_ORDER[a.status] ?? 9;
      const orderB = STATUS_SORT_ORDER[b.status] ?? 9;
      if (orderA !== orderB) return orderA - orderB;
      // Same status → sort by scheduled time ascending
      return (a.sched_utc || '').localeCompare(b.sched_utc || '');
    });
  }, [displayFlights, searchTerm, statusFilter, movementFilter]);

  // Row click → open drawer with pre-computed data and fetch propagation
  const handleFlightClick = (flight) => {
    setSelectedFlight(flight);
    setDrawerOpen(true);
    setPropagationLoading(true);
    setPropagationData(null);

    (async () => {
      try {
        const result = await fetchPropagation(flight.flightNo, flight.sched_utc);
        setPropagationData(result);
      } finally {
        setPropagationLoading(false);
      }
    })();
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedFlight(null);
    setPropagationData(null);
    setPropagationLoading(false);
  };

  const handleAddToMitigation = async () => {
    if (!selectedFlight) return;
    try {
      const f = selectedFlight;
      await createCase({
        flight_number: f.flightNo,
        sched_utc: f.sched_utc,
        airline_code: f.airlineCode || f.airline_iata || null,
        route: f.route,
        predicted_delay_min: f.delay_min || f.ml_minutes_ui,
        risk_level: f.status === 'Major Delay' ? 'high' : f.status === 'Minor Delay' ? 'medium' : 'low',
        likely_cause: f.likelyCause || null,
        tagged_causes: f.likelyCause ? [f.likelyCause] : [],
      });
      handleCloseDrawer();
      onTabChange('Mitigation Board');
    } catch (error) {
      console.error('Failed to add flight to mitigation board:', error);
      alert('Failed to add to mitigation board. Please try again.');
    }
  };

  return (
    <>
      <GlobalBlueBackground />
      <PageLayout>
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
          liveAlerts={liveAlerts || []}
          onNotifClick={onNotifClick}
          onNotifClose={onNotifClose}
          onAlertDismiss={onAlertDismiss}
          onAlertAddToBoard={onAlertAddToBoard}
          {...navExtras}
        />

        <MainContent>
          <ContentArea>
            {/* Title centered; refresh button sits in the filter bar replacing toggles */}
            <div style={{ textAlign: 'center', padding: '18px 0 10px' }}>
              <PageTitle style={{ display: 'inline-block', margin: 0 }}>Flights Overview</PageTitle>
            </div>

            {error && <ErrorText>{error}</ErrorText>}

            <FilterBar>
              <SearchBox
                type="text"
                placeholder="Search flight number or airline…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />

              <FilterSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="On Time">On Time</option>
                <option value="Minor Delay">Minor Delay</option>
                <option value="Major Delay">Major Delay</option>
                <option value="En Route">En Route</option>
                <option value="Early">Early</option>
                <option value="Landed">Landed</option>
                <option value="Cancelled">Cancelled</option>
              </FilterSelect>

              <FilterSelect value={movementFilter} onChange={e => setMovementFilter(e.target.value)}>
                <option value="All">Arrivals & Departures</option>
                <option value="departure">Departures</option>
                <option value="arrival">Arrivals</option>
              </FilterSelect>

              {/* Refresh button — replaces time-range toggles */}
              <IconCircleButton
                onClick={() => setRefreshKey(k => k + 1)}
                title="Refresh flights"
                style={{ marginLeft: 'auto', fontSize: 18, width: 36, height: 36 }}
              >↻</IconCircleButton>
            </FilterBar>

            <FullTableContainer>
              {loading && <LoadingText><Spinner /> Loading flights…</LoadingText>}

              <Table>
                <TableHead>
                  <tr>
                    <FullTableHeaderCell>Flight No.</FullTableHeaderCell>
                    <FullTableHeaderCell>Airline</FullTableHeaderCell>
                    <FullTableHeaderCell>Route</FullTableHeaderCell>
                    <FullTableHeaderCell>Scheduled</FullTableHeaderCell>
                    <FullTableHeaderCell>Actual / Est.</FullTableHeaderCell>
                    <FullTableHeaderCell>Pred. Delay</FullTableHeaderCell>
                    <FullTableHeaderCell>Cause</FullTableHeaderCell>
                    <FullTableHeaderCell>Status</FullTableHeaderCell>
                    <FullTableHeaderCell></FullTableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {filteredFlights.map(f => (
                    <TableRow key={f.id} clickable onClick={() => handleFlightClick(f)}>
                      <TableCell><FlightNumber>{f.flightNo}</FlightNumber></TableCell>
                      <TableCell>
                        <AirlineInfo>{f.airline}</AirlineInfo>
                      </TableCell>
                      <TableCell>
                        <RouteInfo>
                          <span style={{ fontSize: 12 }}>{f.movement === 'departure' ? '🛫' : '🛬'}</span>
                          {f.route}
                        </RouteInfo>
                      </TableCell>
                      <TableCell><ScheduledTime>{f.scheduledTime || '—'}</ScheduledTime></TableCell>
                      <TableCell>
                        <TimeCell>
                          {/* Color: red/orange = delayed, green = on time or early, grey = unknown */}
                          <ActualTime delayed={f.status === 'Minor Delay' || f.status === 'Major Delay'}>
                            {f.actualTime || (f.scheduledTime ? `~${f.scheduledTime}` : '—')}
                          </ActualTime>
                        </TimeCell>
                      </TableCell>
                      <TableCell>
                        <DelayValue value={f.predictedDelay}>
                          {/* Only show delay value when the status reflects a real delay */}
                          {(f.status === 'Minor Delay' || f.status === 'Major Delay') && f.predictedDelay > 0
                            ? `+${f.predictedDelay} min`
                            : '—'}
                        </DelayValue>
                      </TableCell>
                      <TableCell>
                        {f.likelyCause
                          ? <CauseTag cause={f.likelyCause}>{f.likelyCause}</CauseTag>
                          : <span style={{ color: '#aaa' }}>—</span>}
                      </TableCell>
                      <TableCell><StatusPill status={f.status}>{f.status}</StatusPill></TableCell>
                      <TableCell><ChevronIcon>›</ChevronIcon></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </FullTableContainer>
          </ContentArea>
        </MainContent>

        {/* Detail drawer — all data from pre-computed mapFlight() object, no extra API call */}
        <DetailDrawer isOpen={drawerOpen}>
          {selectedFlight && (() => {
            const f = selectedFlight;

            // ── Derived booleans ──────────────────────────────────────────────
            // f.status and f.delay_min are ALWAYS from the same tier (API → ML → FIDS).
            // predictionService.mapFlight() guarantees this after the tier-priority fix.
            // ml_minutes_ui is the raw ML output — when delaySource==='model', this IS
            // what drove f.delay_min and f.status, so they will be consistent.
            const hasML      = f.ml_minutes_ui != null;
            const isDelayed  = f.status === 'Minor Delay' || f.status === 'Major Delay';
            // mlDelayed: the ML model itself predicts a delay (>= 5 min threshold)
            const mlDelayed  = hasML && f.ml_minutes_ui >= 5;
            const p15pct     = hasML ? Math.round((f.ml_p_delay_15 || 0) * 100) : null;
            const p30pct     = hasML ? Math.round((f.ml_p_delay_30 || 0) * 100) : null;

            // ── Section 1 data: what does the Flight Status API say? ──────────
            // isConfirmed = confirmed_delay_min came from flight_status_live (API).
            // delay_min is the tier-priority value (same source as the table row).
            // If source is 'confirmed' → the delay in the table IS from the status API.
            // If source is 'model'/'fids' → status API has no confirmed delay yet.
            const apiDelayMin = f.isConfirmed ? f.delay_min : null;
            const apiDelayDisplay = apiDelayMin != null
              ? (apiDelayMin >= 0 ? `+${Math.round(apiDelayMin)} min` : `${Math.round(apiDelayMin)} min (early)`)
              : '—';

            // Actual/Est. time label — coloured only when there is a real delay
            const actualColor = isDelayed ? '#dc2626' : f.status === 'Early' ? '#16a34a' : '#1e293b';

            // ── Which source drove the status shown in the table? ─────────────
            // 'confirmed' → Flight Status API  |  'model' → ML batch prediction
            // 'fids'      → FIDS y_delay label
            const sourceNote = f.delaySource === 'confirmed'
              ? 'Confirmed — Flight Status API'
              : f.delaySource === 'fids'
                ? 'Observed — Flight Schedule data'
                : 'Predicted — ML model';

            // ── Cause data ────────────────────────────────────────────────────
            // cause_scores come from run_batch_predictions._derive_cause_scores().
            // They are grounded in real feature signal strengths — NOT fabricated.
            // Show them for ANY flight where model ran, not just those showing delay
            // in the table (model may predict delay risk even if FIDS says on time).
            const causeScores = f.cause_scores;
            const hasCauseScores = causeScores && Object.keys(causeScores).length > 0;
            const sortedCauses = hasCauseScores
              ? Object.entries(causeScores).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a)
              : [];
            // Primary cause: highest-scoring category, or heuristic if no batch scores
            const primaryCause = f.ml_cause || (isDelayed ? f.likelyCause : null);
            // Show cause section when: flight is delayed OR model predicts delay risk
            const showCause = isDelayed || mlDelayed || (hasCauseScores && sortedCauses[0]?.[1] > 20);



            return (
              <>
                <DrawerHeader>
                  <DrawerTitle>{f.flightNo}</DrawerTitle>
                  <DrawerSubtitle>
                    {f.route} · {f.airline} ·{' '}
                    {f.movement === 'departure' ? '🛫 Departure' : '🛬 Arrival'}
                  </DrawerSubtitle>
                </DrawerHeader>

                <DrawerContent>

                  {/* ══ Section 1: Flight Details (Status API data) ══════════════ */}
                  <DrawerSection>
                    <DrawerSectionTitle>Flight Details</DrawerSectionTitle>
                    <PredictionBlock>

                      <PredictionRow>
                        <PredictionLabel>Scheduled</PredictionLabel>
                        <PredictionValue>{f.scheduledTime || '—'}</PredictionValue>
                      </PredictionRow>

                      <PredictionRow>
                        <PredictionLabel>Actual / Est.</PredictionLabel>
                        <PredictionValue style={{ color: actualColor, fontWeight: isDelayed ? 600 : 400 }}>
                          {f.actualTime || `~${f.scheduledTime}` || '—'}
                        </PredictionValue>
                      </PredictionRow>

                      {/* Observed/confirmed delay row — label and value adapt to the active tier */}
                      <PredictionRow>
                        <PredictionLabel>
                          {f.delaySource === 'confirmed' ? 'Delay (confirmed)' : 'Delay (estimated)'}
                        </PredictionLabel>
                        <PredictionValue style={{
                          color: (() => {
                            const d = f.delaySource === 'confirmed' ? apiDelayMin : f.delay_min;
                            return d > 0 ? '#dc2626' : d < 0 ? '#16a34a' : '#64748b';
                          })(),
                          fontWeight: 400,
                        }}>
                          {(() => {
                            // Show the value from the tier that drove the status
                            const d = f.delaySource === 'confirmed' ? apiDelayMin
                                    : f.delaySource === 'fids'      ? f.delay_min
                                    : null;   // 'model' tier — delay shown in ML section below
                            if (d == null && f.delaySource === 'model') {
                              return <span style={{ fontSize: 11, color: '#94a3b8' }}>see ML prediction below</span>;
                            }
                            if (d == null) {
                              return <span style={{ fontSize: 11, color: '#94a3b8' }}>not yet available</span>;
                            }
                            return d >= 0 ? `+${Math.round(d)} min` : `${Math.round(d)} min (early)`;
                          })()}
                        </PredictionValue>
                      </PredictionRow>

                      <PredictionRow>
                        <PredictionLabel>Delay Status</PredictionLabel>
                        <PredictionValue>
                          <StatusPill status={f.status}>{f.status}</StatusPill>
                        </PredictionValue>
                      </PredictionRow>

                      <PredictionRow>
                        <PredictionLabel>Op. Status</PredictionLabel>
                        <PredictionValue style={{ color: '#475569', fontSize: 12 }}>
                          {opStatusLabel(f.op_status)}
                        </PredictionValue>
                      </PredictionRow>

                      <PredictionRow>
                        <PredictionLabel>Delay Source</PredictionLabel>
                        <PredictionValue style={{ color: '#64748b', fontSize: 11 }}>
                          {sourceNote}
                        </PredictionValue>
                      </PredictionRow>

                    </PredictionBlock>
                  </DrawerSection>

                  {/* ══ Section 2: Delay Intelligence ════════════════════════════ */}
                  <DrawerSection>
                    <DrawerSectionTitle>Delay Intelligence</DrawerSectionTitle>
                    {hasML ? (
                      <PredictionBlock>

                        {/* Compute combined risk score from p15pct and p30pct */}
                        {(() => {
                          const combined_risk = Math.round((p15pct * 0.5) + (p30pct * 0.5));
                          let riskLabel, riskColor, riskBackground;

                          if (combined_risk >= 60) {
                            riskLabel = 'High Risk';
                            riskColor = '#dc2626';
                            riskBackground = '#fee2e2';
                          } else if (combined_risk >= 35) {
                            riskLabel = 'Moderate Risk';
                            riskColor = '#92400e';
                            riskBackground = '#fef9c3';
                          } else if (combined_risk > 0) {
                            riskLabel = 'Low Risk';
                            riskColor = '#166534';
                            riskBackground = '#dcfce7';
                          } else {
                            riskLabel = 'No Delay Risk';
                            riskColor = '#166534';
                            riskBackground = '#dcfce7';
                          }

                          return (
                            <>
                              {/* a) Risk label row */}
                              <PredictionRow>
                                <PredictionLabel>Delay Risk</PredictionLabel>
                                <div style={{
                                  display: 'inline-block',
                                  backgroundColor: riskBackground,
                                  color: riskColor,
                                  fontWeight: 700,
                                  fontSize: 12,
                                  padding: '3px 10px',
                                  borderRadius: 999,
                                }}>
                                  {riskLabel}
                                </div>
                              </PredictionRow>

                              {/* b) Combined risk progress bar */}
                              <div style={{ marginTop: 10 }}>
                                <ProbBar><ProbFill pct={combined_risk} style={{ backgroundColor: riskColor }} /></ProbBar>
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                                  {combined_risk}% delay probability
                                </div>
                              </div>

                              {/* c) Delay prediction sentence */}
                              <div style={{
                                fontSize: 13,
                                color: mlDelayed ? riskColor : '#64748b',
                                fontWeight: mlDelayed ? 600 : 400,
                                marginTop: 10,
                              }}>
                                {mlDelayed
                                  ? `System estimates approximately ${Math.round(f.ml_minutes_ui)} min delay for this flight.`
                                  : 'No significant delay currently predicted for this flight.'}
                              </div>

                              {/* d) Source attribution note when model drives the table row */}
                              {f.delaySource === 'model' && isDelayed && (
                                <div style={{ fontSize: 11, color: '#1A4B8F', background: '#eff6ff',
                                  borderRadius: 6, padding: '5px 8px', marginTop: 8 }}>
                                  This estimate is the basis for the delay shown in the flights table.
                                </div>
                              )}
                              {f.delaySource === 'model' && !isDelayed && mlDelayed && (
                                <div style={{ fontSize: 11, color: '#92400e', background: '#fffbeb',
                                  borderRadius: 6, padding: '5px 8px', marginTop: 8 }}>
                                  ⚠ Model predicts a delay risk. Flight currently shows On Time in the table
                                  (below the 15-min classification threshold).
                                </div>
                              )}
                            </>
                          );
                        })()}

                      </PredictionBlock>
                    ) : (
                      <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                        ML predictions computed after each FIDS refresh cycle.
                        {f.isConfirmed && f.delay_min != null && (
                          <span style={{ display: 'block', marginTop: 6, color: '#1A4B8F', fontWeight: 600, fontSize: 12 }}>
                            Confirmed delay: {apiDelayDisplay} (Flight Status API)
                          </span>
                        )}
                      </div>
                    )}
                  </DrawerSection>

                  {/* ══ Section 3: Delay Cause ═══════════════════════════════════ */}
                  <DrawerSection>
                    <DrawerSectionTitle>Delay Cause</DrawerSectionTitle>

                    {!showCause ? (
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>
                        No significant delay risk identified for this flight.
                      </div>
                    ) : (
                      <>
                        {/* Primary cause badge + source note */}
                        <div style={{ marginBottom: 12 }}>
                          <PredictionRow>
                            <PredictionLabel>Primary Cause</PredictionLabel>
                            <PredictionValue>
                              {primaryCause
                                ? <CauseTag cause={primaryCause}>{primaryCause}</CauseTag>
                                : <span style={{ color: '#94a3b8' }}>Undetermined</span>}
                            </PredictionValue>
                          </PredictionRow>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                            {f.ml_cause ? 'Based on model feature signals' : 'Based on available flight data'}
                          </div>
                        </div>

                        {/* Feature-signal contribution bars */}
                        {hasCauseScores && sortedCauses.length > 0 ? (
                          <CauseBreakdown>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                              Cause contribution by feature signal strength:
                            </div>
                            {sortedCauses.map(([label, pct]) => (
                              <CauseItem key={label}>
                                <CauseLabel style={{ fontSize: 12, minWidth: 140 }}>{label}</CauseLabel>
                                <CauseBar><CauseFill cause={label} percentage={Math.round(pct)} /></CauseBar>
                                <CausePercentage>{Math.round(pct)}%</CausePercentage>
                              </CauseItem>
                            ))}
                          </CauseBreakdown>
                        ) : null}
                      </>
                    )}
                  </DrawerSection>

                  {/* ══ Section 4: Propagation Impact ════════════════════════════ */}
                  <DrawerSection>
                    <DrawerSectionTitle>Propagation Impact</DrawerSectionTitle>
                    {propagationLoading ? (
                      <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
                        Checking connected rotations...
                      </div>
                    ) : !propagationData || propagationData.length === 0 ? (
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>
                        No connected rotations detected in current FIDS window.
                      </div>
                    ) : (
                      <>
                        {propagationData.map((item, idx) => {
                          // Determine border color based on delay status
                          const borderColor = item.delay_status === 'Major Delay' ? '#dc2626'
                            : item.delay_status === 'Minor Delay' ? '#f59e0b' : '#166534';

                          // Determine source label and styling
                          let sourceLabel, sourceBg, sourceFg;
                          if (item.delay_source === 'confirmed') {
                            sourceLabel = '✓ Confirmed delay';
                            sourceBg = '#dcfce7';
                            sourceFg = '#166534';
                          } else if (item.delay_source === 'fids') {
                            sourceLabel = 'FIDS observed';
                            sourceBg = '#dbeafe';
                            sourceFg = '#1e40af';
                          } else if (item.delay_source === 'model') {
                            sourceLabel = 'ML direct prediction';
                            sourceBg = '#ede9fe';
                            sourceFg = '#6d28d9';
                          } else if (item.delay_source === 'model_propagation') {
                            sourceLabel = 'Propagation estimate';
                            sourceBg = '#fef9c3';
                            sourceFg = '#92400e';
                          } else {
                            sourceLabel = 'No data';
                            sourceBg = '#f3f4f6';
                            sourceFg = '#6b7280';
                          }

                          // Determine delay value color
                          let delayColor;
                          if (item.resolved_delay_min == null) {
                            delayColor = '#94a3b8';
                          } else if (item.resolved_delay_min >= 30) {
                            delayColor = '#dc2626';
                          } else if (item.resolved_delay_min >= 5) {
                            delayColor = '#f59e0b';
                          } else if (item.resolved_delay_min < 0) {
                            delayColor = '#16a34a';
                          } else {
                            delayColor = '#94a3b8';
                          }

                          return (
                            <div key={idx} style={{
                              background: 'white',
                              border: '1px solid #e8eef8',
                              borderLeft: `3px solid ${borderColor}`,
                              borderRadius: 8,
                              padding: 12,
                              marginBottom: 8,
                            }}>
                              {/* Top row: flight number and status pill */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: '#1A4B8F' }}>
                                  {item.number_raw}
                                </div>
                                <StatusPill status={item.delay_status}>{item.delay_status}</StatusPill>
                              </div>

                              {/* Route */}
                              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                                {item.route}
                              </div>

                              {/* Scheduled time and delay */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                  Sched: {formatTime(item.sched_utc)}
                                </div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: delayColor }}>
                                  {item.resolved_delay_min != null
                                    ? `+${Math.round(item.resolved_delay_min)} min`
                                    : '—'}
                                </div>
                              </div>

                              {/* Source label */}
                              <div style={{ marginTop: 6 }}>
                                <span style={{
                                  display: 'inline-block',
                                  backgroundColor: sourceBg,
                                  color: sourceFg,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                }}>
                                  {sourceLabel}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Footnote if any item is propagated */}
                        {propagationData.some(item => item.is_propagated) && (
                          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                            Propagation estimates use 60% absorption of the source flight's predicted delay.
                          </div>
                        )}
                      </>
                    )}
                  </DrawerSection>

                </DrawerContent>

                <DrawerFooter>
                  <DrawerButton
                    primary
                    onClick={handleAddToMitigation}
                    disabled={f.status === 'On Time' || f.status === 'Landed' || f.status === 'Early'}
                  >
                    Add to Mitigation Board
                  </DrawerButton>
                  <DrawerButton onClick={handleCloseDrawer}>Close</DrawerButton>
                </DrawerFooter>
              </>
            );
          })()}
        </DetailDrawer>

        {drawerOpen && <DrawerBackdrop onClick={handleCloseDrawer} />}
      </PageContainer>
    </PageLayout>
    </>
  );
};

export default FlightsPage;
