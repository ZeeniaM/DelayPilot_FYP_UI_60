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
import {
  PageContainer, MainContent, ContentArea,
  PageTitle, IconCircleButton,
  FilterBar, SearchBox, FilterSelect,
  FullTableContainer, Table, TableHead, FullTableHeaderCell, TableBody, TableRow, TableCell,
  FlightNumber, AirlineInfo, RouteInfo, TimeCell, ScheduledTime, ActualTime,
  DelayValue, CauseTag, StatusPill, ChevronIcon,
  SideAlertsPanel, SideAlertsHeader, SideAlertsTitle, SideAlertIcon,
  SideAlertsContent, SideAlertCard, SideAlertFlight, SideAlertMessage,
  DetailDrawer, DrawerHeader, DrawerTitle, DrawerSubtitle,
  DrawerContent, DrawerSection, DrawerSectionTitle, DrawerFooter, DrawerButton,
  PredictionBlock, PredictionRow, PredictionLabel, PredictionValue,
  ProbBar, ProbFill,
  CauseBreakdown, CauseItem, CauseLabel, CauseBar, CauseFill, CausePercentage,
  DrawerBackdrop, LoadingText, ErrorText, Spinner,
} from '../styles/components.styles';
import { fetchFlights } from '../services/predictionService';

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
  if (source === 'model')     return 'ML Model Prediction';
  if (source === 'fids')      return 'FIDS Estimate';
  return 'Unknown';
};

// OP status display label
const opStatusLabel = (s) => {
  const map = { Scheduled: 'Scheduled', EnRoute: 'En Route', Landed: 'Landed',
                Cancelled: 'Cancelled', Diverted: 'Diverted', Unknown: 'Unknown' };
  return map[s] || s || 'Scheduled';
};

// Build alerts from delayed flights
const buildAlerts = (flights) =>
  flights.filter(f => f.is_delayed_15).slice(0, 6).map((f, i) => ({
    id: i + 1,
    flightNo: f.flightNo,
    severity: f.is_delayed_30 ? 'high' : 'moderate',
    message: `${f.is_delayed_30 ? 'Major' : 'Minor'} delay predicted. Route: ${f.route}. Est: ${f.predictedDelay} min.`,
  }));

// ── Component ────────────────────────────────────────────────────
const FlightsPage = ({ userRole = 'APOC', userName, onLogout, activeTab, onTabChange,
  notifCount = 0, hasNewNotif = false, notifOpen = false, liveAlerts = [], onNotifClick, onNotifClose
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
  const [dismissedAlerts,   setDismissedAlerts]   = useState(new Set());
  const [boardFlights,      setBoardFlights]      = useState([]);
  const [prediction,        setPrediction]        = useState(null);
  const [predLoading,       setPredLoading]       = useState(false);

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

  // Filtered view
  // Status sort order: delayed first (severity desc), then on time, en route, early/landed last
  const STATUS_SORT_ORDER = {
    'Major Delay': 0,
    'Minor Delay': 1,
    'On Time':     2,
    'Scheduled':   3,
    'En Route':    4,
    'Early':       5,
    'Landed':      6,
    'Cancelled':   7,
    'Diverted':    8,
  };

  const filteredFlights = useMemo(() => {
    const filtered = flights.filter(f => {
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
  }, [flights, searchTerm, statusFilter, movementFilter]);

  const alerts = useMemo(() => buildAlerts(flights), [flights]);

  // Row click → open drawer with pre-computed data (no extra API call)
  const handleFlightClick = (flight) => {
    setSelectedFlight(flight);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedFlight(null);
  };

  const handleAddToMitigation = () => {
    console.log(`Adding ${selectedFlight?.flightNo} to mitigation board`);
    handleCloseDrawer();
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

          {/* Side alerts panel */}
          <SideAlertsPanel>
            <SideAlertsHeader>
              <SideAlertsTitle>
                <SideAlertIcon>⚠</SideAlertIcon>
                Active Alerts
              </SideAlertsTitle>
            </SideAlertsHeader>
            <SideAlertsContent>
              {(() => {
                const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));
                if (visibleAlerts.length === 0) {
                  return <div style={{ padding: 12, color: '#666', fontSize: 13 }}>No active alerts.</div>;
                }
                return visibleAlerts.map(a => {
                  const onBoard = boardFlights.includes(a.flightNo);
                  return (
                    <SideAlertCard key={a.id} severity={a.severity}>
                      <SideAlertFlight>{a.flightNo}</SideAlertFlight>
                      <SideAlertMessage>{a.message}</SideAlertMessage>
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button
                          style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#f1f3f4', color: '#333', cursor: 'pointer', fontSize: 11 }}
                          onClick={e => {
                            e.stopPropagation();
                            setDismissedAlerts(prev => new Set([...prev, a.id]));
                          }}
                        >Dismiss</button>
                        <button
                          style={{
                            padding: '5px 10px', borderRadius: 6, border: 'none',
                            background: onBoard ? '#166534' : '#1A4B8F',
                            color: '#fff', cursor: 'pointer', fontSize: 11,
                            transition: 'background 0.2s',
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            if (!onBoard) setBoardFlights(prev => [...prev, a.flightNo]);
                          }}
                        >{onBoard ? '✓ On Board' : 'Add to Board'}</button>
                      </div>
                    </SideAlertCard>
                  );
                });
              })()}
            </SideAlertsContent>
          </SideAlertsPanel>
        </MainContent>

        {/* Detail drawer — all data from pre-computed mapFlight() object, no extra API call */}
        <DetailDrawer isOpen={drawerOpen}>
          {selectedFlight && (() => {
            const f = selectedFlight;
            const hasML = f.ml_minutes_ui != null;
            const isDelayed = f.status === 'Minor Delay' || f.status === 'Major Delay';
            const p15pct = hasML ? Math.round((f.ml_p_delay_15 || 0) * 100) : null;
            const p30pct = hasML ? Math.round((f.ml_p_delay_30 || 0) * 100) : null;

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

                  {/* ── Section 1: Flight Details ── */}
                  <DrawerSection>
                    <DrawerSectionTitle>Flight Details</DrawerSectionTitle>
                    <PredictionBlock>
                      <PredictionRow>
                        <PredictionLabel>Scheduled</PredictionLabel>
                        <PredictionValue>{f.scheduledTime || '—'}</PredictionValue>
                      </PredictionRow>
                      <PredictionRow>
                        <PredictionLabel>Actual / Est.</PredictionLabel>
                        <PredictionValue
                          style={{ color: isDelayed ? '#dc2626' : f.status === 'Early' ? '#16a34a' : '#1e293b' }}
                        >
                          {f.actualTime || `~${f.scheduledTime}` || '—'}
                        </PredictionValue>
                      </PredictionRow>
                      <PredictionRow>
                        <PredictionLabel>Status</PredictionLabel>
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
                      {f.isConfirmed && f.delay_min != null && (
                        <PredictionRow>
                          <PredictionLabel>Confirmed Delay</PredictionLabel>
                          <PredictionValue style={{ color: f.delay_min >= 5 ? '#dc2626' : '#16a34a' }}>
                            {f.delay_min >= 0 ? `+${Math.round(f.delay_min)} min` : `${Math.round(f.delay_min)} min (early)`}
                          </PredictionValue>
                        </PredictionRow>
                      )}
                      <PredictionRow>
                        <PredictionLabel>Delay Source</PredictionLabel>
                        <PredictionValue style={{ color: '#64748b', fontSize: 11 }}>
                          {delaySourceLabel(f.delaySource)}
                        </PredictionValue>
                      </PredictionRow>
                    </PredictionBlock>
                  </DrawerSection>

                  {/* ── Section 2: ML Model Prediction ── */}
                  <DrawerSection>
                    <DrawerSectionTitle>ML Model Prediction</DrawerSectionTitle>
                    {hasML ? (
                      <PredictionBlock>
                        <PredictionRow>
                          <PredictionLabel>Predicted Delay</PredictionLabel>
                          <PredictionValue style={{ color: f.ml_minutes_ui > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                            {f.ml_minutes_ui > 0 ? `+${Math.round(f.ml_minutes_ui)} min` : 'On Time'}
                          </PredictionValue>
                        </PredictionRow>
                        <PredictionRow>
                          <PredictionLabel>Delay ≥15 min predicted</PredictionLabel>
                          <PredictionValue>{f.ml_pred_delay_15 ? 'Yes' : 'No'}</PredictionValue>
                        </PredictionRow>
                        <PredictionRow>
                          <PredictionLabel>Delay ≥30 min predicted</PredictionLabel>
                          <PredictionValue>{f.ml_pred_delay_30 ? 'Yes' : 'No'}</PredictionValue>
                        </PredictionRow>
                        <div style={{ marginTop: 10 }}>
                          <PredictionLabel>P(delay ≥15 min): {p15pct}%</PredictionLabel>
                          <ProbBar><ProbFill pct={p15pct} /></ProbBar>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <PredictionLabel>P(delay ≥30 min): {p30pct}%</PredictionLabel>
                          <ProbBar><ProbFill pct={p30pct} /></ProbBar>
                        </div>
                      </PredictionBlock>
                    ) : (
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>
                        ML predictions not yet available for this flight.
                        They are computed after each FIDS refresh cycle.
                      </div>
                    )}
                  </DrawerSection>

                  {/* ── Section 3: Delay Cause ── */}
                  <DrawerSection>
                    <DrawerSectionTitle>Delay Cause</DrawerSectionTitle>
                    {!isDelayed ? (
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>No delay identified for this flight.</div>
                    ) : (() => {
                      // cause_scores: {cause_label: pct} from run_batch_predictions.py
                      // Each score is grounded in real pipeline feature values.
                      // Computed by _derive_cause_scores() — NOT fabricated percentages.
                      const causeScores = f.cause_scores;
                      const hasCauseScores = causeScores && Object.keys(causeScores).length > 0;

                      // Filter to causes with score > 0 and sort descending
                      const sortedCauses = hasCauseScores
                        ? Object.entries(causeScores)
                            .filter(([, pct]) => pct > 0)
                            .sort(([, a], [, b]) => b - a)
                        : [];

                      return (
                        <>
                          {/* Primary cause badge */}
                          <div style={{ marginBottom: 12 }}>
                            <PredictionRow>
                              <PredictionLabel>Primary Cause</PredictionLabel>
                              <PredictionValue>
                                {f.likelyCause
                                  ? <CauseTag cause={f.likelyCause}>{f.likelyCause}</CauseTag>
                                  : <span style={{ color: '#94a3b8' }}>Unknown</span>}
                              </PredictionValue>
                            </PredictionRow>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                              {f.ml_cause
                                ? 'Determined by ML pipeline feature signals'
                                : 'Heuristic fallback (weather code + delay magnitude)'}
                            </div>
                          </div>

                          {/* Cause contribution breakdown — real feature-signal scores */}
                          {hasCauseScores ? (
                            <CauseBreakdown>
                              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                                Cause contribution (feature signal strength):
                              </div>
                              {sortedCauses.map(([label, pct]) => (
                                <CauseItem key={label}>
                                  <CauseLabel style={{ fontSize: 12, minWidth: 140 }}>{label}</CauseLabel>
                                  <CauseBar><CauseFill cause={label} percentage={pct} /></CauseBar>
                                  <CausePercentage>{pct}%</CausePercentage>
                                </CauseItem>
                              ))}
                            </CauseBreakdown>
                          ) : (
                            <div style={{ fontSize: 13, color: '#94a3b8' }}>
                              Cause breakdown will be available after next pipeline refresh.
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </DrawerSection>

                </DrawerContent>

                <DrawerFooter>
                  <DrawerButton
                    primary
                    onClick={handleAddToMitigation}
                    disabled={f.status === 'On Time' || f.status === 'Landed'}
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