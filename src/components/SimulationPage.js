/**
 * SimulationPage.js
 * ─────────────────────────────────────────────────────────────────
 * What-if delay simulator for real pipeline flights.
 *
 * Parameters exposed (mapped to actual model features):
 *   Weather group:
 *     wind_speed_10m       → wx_muc_wind_speed_10m  (+ flag_strong_wind_muc)
 *     wind_gusts_10m       → wx_muc_wind_gusts_10m  (+ flag_gusts_muc)
 *     precipitation        → wx_muc_precipitation   (+ flag_any_precip_muc)
 *     snowfall             → wx_muc_snowfall         (+ flag_any_snow_muc)
 *     visibility           → wx_muc_visibility
 *
 *   Reactionary group:
 *     prev_delay_min_safe  → prev_delay_min_safe (inbound aircraft rotation delay)
 *
 *   Congestion group:
 *     muc_arr_1h           → rolling arrival count at MUC ±1h
 *     muc_dep_1h           → rolling departure count at MUC ±1h
 *
 * Disabled parameters are shown but grayed out so the user understands
 * what the model uses even when they cannot edit historical features.
 *
 * Guard: if flight has already landed → simulation blocked with message.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import NavigationBar from './NavigationBar';
import { PageLayout } from './PageLayout';
import {
  PageContainer, MainContent, ContentArea,
  PageHeaderRow, PageTitle,
  SimPanels, SimControlPanel, SimResultPanel,
  SimLabel, SimInput, SimSelect, SimRunButton,
  Button, Card, Spinner, LoadingText,
  tokens,
} from '../styles/components.styles';
import { fetchFlights, simulateFlight } from '../services/predictionService';
import styled from 'styled-components';

/* ── Local styled atoms (simulation-specific, not reused elsewhere) ─ */
const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: ${tokens.primary};
  text-transform: uppercase;
  letter-spacing: 0.7px;
  margin: 18px 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid ${tokens.border};
`;

const Helper = styled.div`
  font-size: 11px;
  color: ${tokens.textMuted};
  margin-top: 2px;
`;

const RangeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RangeValue = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: ${tokens.text};
  min-width: 48px;
  text-align: right;
`;

const Range = styled.input`
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 999px;
  background: #fde7cc;
  outline: none;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #F57C00;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

/* Result panel atoms */
const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

const ResultCard = styled.div`
  background: ${tokens.white};
  border: 1px solid ${tokens.borderLight};
  border-radius: ${tokens.radius};
  padding: 16px;
  box-shadow: ${tokens.shadow};
`;

const ResultValue = styled.div`
  font-size: 26px;
  font-weight: 700;
  color: ${props => props.color || tokens.text};
  line-height: 1;
  margin-bottom: 4px;
`;

const ResultLabel = styled.div`
  font-size: 11px;
  color: ${tokens.textMuted};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DeltaTag = styled.span`
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${props => props.positive ? tokens.redBg : tokens.greenBg};
  color: ${props => props.positive ? tokens.redText : tokens.greenText};
  margin-left: 6px;
`;

const CompareRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const CompareCard = styled.div`
  flex: 1;
  background: ${props => props.highlight ? tokens.primaryLight : tokens.surfaceHover};
  border: 1px solid ${props => props.highlight ? tokens.primary : tokens.border};
  border-radius: ${tokens.radiusSm};
  padding: 14px;
`;

const CompareTitleRow = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: ${props => props.highlight ? tokens.primary : tokens.textMuted};
  margin-bottom: 10px;
  letter-spacing: 0.5px;
`;

const CompareItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: ${tokens.text};
  padding: 4px 0;
  border-bottom: 1px solid ${tokens.border};
  &:last-child { border-bottom: none; }
`;

const ProbBarWrap = styled.div`
  height: 6px;
  background: #e1e5e9;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;
`;

const ProbBarFill = styled.div`
  height: 100%;
  width: ${p => p.pct}%;
  background: ${p => p.pct > 50 ? tokens.red : p.pct > 25 ? tokens.amber : tokens.green};
  border-radius: 3px;
  transition: width 0.4s ease;
`;

const ReactCard = styled.div`
  min-width: 200px;
  background: ${tokens.white};
  border: 1px solid ${tokens.borderLight};
  border-radius: ${tokens.radiusSm};
  padding: 12px 14px;
  box-shadow: ${tokens.shadow};
`;

const ReactFlightNo = styled.div`
  font-weight: 700;
  color: ${tokens.primary};
  font-size: 14px;
  margin-bottom: 4px;
`;

const ReactDelayBadge = styled.span`
  font-size: 12px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  color: ${p => p.severity === 'high' ? tokens.redText : p.severity === 'moderate' ? tokens.amberText : tokens.greenText};
  background: ${p => p.severity === 'high' ? tokens.redBg : p.severity === 'moderate' ? tokens.amberBg : tokens.greenBg};
`;

const FlightSearchResult = styled.div`
  border: 1px solid ${tokens.border};
  border-radius: ${tokens.radiusSm};
  max-height: 200px;
  overflow-y: auto;
  background: ${tokens.white};
  box-shadow: ${tokens.shadowMd};
  position: absolute;
  width: 100%;
  z-index: 20;
`;

const FlightSearchItem = styled.div`
  padding: 10px 14px;
  cursor: pointer;
  font-size: 13px;
  border-bottom: 1px solid #f1f3f4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &:hover { background: ${tokens.primaryLight}; }
  &:last-child { border-bottom: none; }
`;

const BlockedMessage = styled.div`
  background: ${tokens.amberBg};
  color: ${tokens.amberText};
  border-radius: ${tokens.radiusSm};
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 500;
  margin-top: 12px;
`;

const EmptyResultMessage = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${tokens.textMuted};
  font-size: 14px;
  gap: 8px;
  padding: 40px 20px;
  text-align: center;
`;

/* ── WMO weather code options ──────────────────────────────────── */
const WEATHER_CODES = [
  { value: 0,  label: '☀️  Clear sky' },
  { value: 2,  label: '🌤  Partly cloudy' },
  { value: 3,  label: '☁️  Overcast' },
  { value: 45, label: '🌫  Foggy' },
  { value: 51, label: '🌦  Light drizzle' },
  { value: 61, label: '🌧  Light rain' },
  { value: 63, label: '🌧  Moderate rain' },
  { value: 65, label: '🌧  Heavy rain' },
  { value: 71, label: '❄️  Light snow' },
  { value: 73, label: '❄️  Moderate snow' },
  { value: 75, label: '❄️  Heavy snow' },
  { value: 95, label: '⛈  Thunderstorm' },
  { value: 99, label: '⛈  Thunderstorm + hail' },
];

/* ── Helpers ───────────────────────────────────────────────────── */
const pctColor = (pct) =>
  pct > 50 ? tokens.red : pct > 25 ? tokens.amber : tokens.green;

const fmtPct = (v) => `${Math.round((v || 0) * 100)}%`;
const fmtMin = (v) => (v && v > 0) ? `+${Math.round(v)} min` : 'On Time';

/* ══════════════════════════════════════════════════════════════════
   Component
══════════════════════════════════════════════════════════════════ */
const SimulationPage = ({ userRole = 'APOC', userName, onLogout, activeTab, onTabChange,
  notifCount = 0, hasNewNotif = false, notifOpen = false, liveAlerts = [], onNotifClick, onNotifClose
}) => {

  /* ── Flight selection ─────────────────────────────────────── */
  const [allFlights,     setAllFlights]     = useState([]);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchFocused,  setSearchFocused]  = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);   // full mapped flight object

  /* ── Simulation parameters ────────────────────────────────── */
  // Weather
  const [windSpeed,     setWindSpeed]     = useState(null);
  const [windGusts,     setWindGusts]     = useState(null);
  const [precipitation, setPrecipitation] = useState(null);
  const [snowfall,      setSnowfall]      = useState(null);
  const [visibility,    setVisibility]    = useState(null);
  const [weatherCode,   setWeatherCode]   = useState(null);
  // Reactionary
  const [prevDelay,     setPrevDelay]     = useState(null);
  // Congestion
  const [mucArr1h,      setMucArr1h]      = useState(null);
  const [mucDep1h,      setMucDep1h]      = useState(null);

  /* ── Run state ────────────────────────────────────────────── */
  const [running,  setRunning]  = useState(false);
  const [result,   setResult]   = useState(null);    // API response
  const [blocked,  setBlocked]  = useState(false);   // landed guard
  const [notFound, setNotFound] = useState(false);

  /* ── Load all flights on mount ────────────────────────────── */
  useEffect(() => {
    fetchFlights().then(f => { if (f) setAllFlights(f); });
  }, []);

  /* ── Search filtering ─────────────────────────────────────── */
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allFlights
      .filter(f => f.flightNo.toLowerCase().includes(q) || f.airline.toLowerCase().includes(q))
      .slice(0, 12);
  }, [allFlights, searchQuery]);

  /* ── Select a flight → pre-populate sliders with current values ─ */
  const handleSelectFlight = useCallback((flight) => {
    setSelectedFlight(flight);
    setSearchQuery(`${flight.flightNo} — ${flight.airline}`);
    setSearchFocused(false);
    setResult(null);
    setBlocked(false);
    setNotFound(false);
    // Reset overrides to null (no override = use real data)
    setWindSpeed(null);
    setWindGusts(null);
    setPrecipitation(null);
    setSnowfall(null);
    setVisibility(null);
    setWeatherCode(null);
    setPrevDelay(null);
    setMucArr1h(null);
    setMucDep1h(null);
  }, []);

  /* ── Run ──────────────────────────────────────────────────── */
  const handleRun = async () => {
    if (!selectedFlight) return;
    setRunning(true);
    setResult(null);
    setBlocked(false);
    setNotFound(false);

    // Build overrides — only include fields the user actually changed
    const overrides = {};
    if (windSpeed     !== null) overrides.wind_speed_10m      = windSpeed;
    if (windGusts     !== null) overrides.wind_gusts_10m      = windGusts;
    if (precipitation !== null) overrides.precipitation       = precipitation;
    if (snowfall      !== null) overrides.snowfall            = snowfall;
    if (visibility    !== null) overrides.visibility          = visibility * 1000; // UI in km, model in m
    if (weatherCode   !== null) overrides.weather_code        = weatherCode;
    if (prevDelay     !== null) overrides.prev_delay_min_safe = prevDelay;
    if (mucArr1h      !== null) overrides.muc_arr_1h          = mucArr1h;
    if (mucDep1h      !== null) overrides.muc_dep_1h          = mucDep1h;

    const res = await simulateFlight(selectedFlight.flightNo, selectedFlight.sched_utc, overrides);
    setRunning(false);

    if (!res)              return;
    if (res._landed)       { setBlocked(true);   return; }
    if (res._not_found)    { setNotFound(true);  return; }
    setResult(res);
  };

  const handleReset = () => {
    setWindSpeed(null); setWindGusts(null); setPrecipitation(null);
    setSnowfall(null);  setVisibility(null); setWeatherCode(null);
    setPrevDelay(null); setMucArr1h(null);  setMucDep1h(null);
    setResult(null); setBlocked(false);
  };

  /* ── Helpers for display ──────────────────────────────────── */
  const overrideCount = [
    windSpeed, windGusts, precipitation, snowfall,
    visibility, weatherCode, prevDelay, mucArr1h, mucDep1h,
  ].filter(v => v !== null).length;

  return (
    <PageLayout>
      <PageContainer>
        <NavigationBar
          userRole={userRole} userName={userName}
          onLogout={onLogout} activeTab={activeTab} onTabChange={onTabChange}
          notifCount={notifCount}
          hasNewNotif={hasNewNotif}
          notifOpen={notifOpen}
          liveAlerts={liveAlerts || []}
          onNotifClick={onNotifClick}
          onNotifClose={onNotifClose}
        />

        <MainContent>
          <ContentArea>
            <PageHeaderRow>
              <PageTitle>Delay Simulation Tool</PageTitle>
              {overrideCount > 0 && (
                <span style={{ fontSize: 12, background: tokens.primaryLight,
                               color: tokens.primary, padding: '4px 10px',
                               borderRadius: 999, fontWeight: 600 }}>
                  {overrideCount} parameter{overrideCount > 1 ? 's' : ''} overridden
                </span>
              )}
            </PageHeaderRow>

            <SimPanels>

              {/* ══ LEFT: control panel ══════════════════════════ */}
              <SimControlPanel>

                {/* Flight search */}
                <SectionLabel>Select Flight</SectionLabel>
                <FieldGroup style={{ position: 'relative' }}>
                  <SimLabel>Search by flight number or airline</SimLabel>
                  <SimInput
                    type="text"
                    placeholder="e.g. LH 638, Lufthansa…"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setSelectedFlight(null); }}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  />
                  {searchFocused && searchResults.length > 0 && (
                    <FlightSearchResult>
                      {searchResults.map(f => (
                        <FlightSearchItem key={f.id} onMouseDown={() => handleSelectFlight(f)}>
                          <span>
                            <strong style={{ color: tokens.primary }}>{f.flightNo}</strong>
                            {' · '}{f.airline}{' · '}{f.route}
                          </span>
                          <span style={{ fontSize: 11, color: tokens.textMuted }}>
                            {f.scheduledTime} {f.movement === 'departure' ? '🛫' : '🛬'}
                          </span>
                        </FlightSearchItem>
                      ))}
                    </FlightSearchResult>
                  )}
                </FieldGroup>

                {/* Selected flight info strip */}
                {selectedFlight && (
                  <div style={{
                    background: tokens.primaryLight, borderRadius: tokens.radiusSm,
                    padding: '10px 14px', marginBottom: 8, fontSize: 13,
                  }}>
                    <div style={{ fontWeight: 700, color: tokens.primary }}>
                      {selectedFlight.flightNo} — {selectedFlight.airline}
                    </div>
                    <div style={{ color: tokens.textMuted, marginTop: 2 }}>
                      {selectedFlight.route} · Sched: {selectedFlight.scheduledTime}
                      {' · '}{selectedFlight.movement === 'departure' ? '🛫 Departure' : '🛬 Arrival'}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: tokens.textMuted }}>
                      Baseline status: <strong>{selectedFlight.status}</strong>
                      {selectedFlight.predictedDelay > 0 && ` · ${selectedFlight.predictedDelay} min predicted`}
                    </div>
                  </div>
                )}

                {blocked && (
                  <BlockedMessage>
                    ⚠️ This flight has already landed. Simulation is not available for completed flights.
                  </BlockedMessage>
                )}

                {notFound && (
                  <BlockedMessage>
                    Flight not found in the prediction pipeline. It may not have features computed yet.
                  </BlockedMessage>
                )}

                {/* ── Weather parameters ──────────────────────── */}
                <SectionLabel>Weather Conditions (MUC)</SectionLabel>
                <Helper style={{ marginBottom: 10 }}>
                  These override the live weather joined to the flight's feature row.
                  Leave unchanged to use real weather data.
                </Helper>

                <FieldGroup>
                  <SimLabel>Weather Condition (WMO Code)</SimLabel>
                  <SimSelect
                    value={weatherCode ?? ''}
                    onChange={e => setWeatherCode(e.target.value === '' ? null : Number(e.target.value))}
                  >
                    <option value="">— Use real data —</option>
                    {WEATHER_CODES.map(w => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </SimSelect>
                </FieldGroup>

                <FieldGroup>
                  <SimLabel>Wind Speed: {windSpeed !== null ? `${windSpeed} km/h` : '— real data —'}</SimLabel>
                  <RangeRow>
                    <Range type="range" min={0} max={120} step={5}
                      value={windSpeed ?? 0}
                      onChange={e => setWindSpeed(Number(e.target.value))}
                    />
                    <RangeValue>{windSpeed !== null ? `${windSpeed}` : '—'}</RangeValue>
                    {windSpeed !== null && (
                      <button style={{ border: 'none', background: 'none', color: tokens.red, cursor: 'pointer', fontSize: 12 }}
                        onClick={() => setWindSpeed(null)}>✕</button>
                    )}
                  </RangeRow>
                  <Helper>
                    ⚑ Strong wind flag triggers at ≥50 km/h · Gusts flag at ≥70 km/h
                  </Helper>
                </FieldGroup>

                <FieldGroup>
                  <SimLabel>Wind Gusts: {windGusts !== null ? `${windGusts} km/h` : '— real data —'}</SimLabel>
                  <RangeRow>
                    <Range type="range" min={0} max={150} step={5}
                      value={windGusts ?? 0}
                      onChange={e => setWindGusts(Number(e.target.value))}
                    />
                    <RangeValue>{windGusts !== null ? `${windGusts}` : '—'}</RangeValue>
                    {windGusts !== null && (
                      <button style={{ border: 'none', background: 'none', color: tokens.red, cursor: 'pointer', fontSize: 12 }}
                        onClick={() => setWindGusts(null)}>✕</button>
                    )}
                  </RangeRow>
                </FieldGroup>

                <FieldGroup>
                  <SimLabel>Precipitation: {precipitation !== null ? `${precipitation} mm` : '— real data —'}</SimLabel>
                  <RangeRow>
                    <Range type="range" min={0} max={50} step={1}
                      value={precipitation ?? 0}
                      onChange={e => setPrecipitation(Number(e.target.value))}
                    />
                    <RangeValue>{precipitation !== null ? `${precipitation}` : '—'}</RangeValue>
                    {precipitation !== null && (
                      <button style={{ border: 'none', background: 'none', color: tokens.red, cursor: 'pointer', fontSize: 12 }}
                        onClick={() => setPrecipitation(null)}>✕</button>
                    )}
                  </RangeRow>
                </FieldGroup>

                <FieldGroup>
                  <SimLabel>Snowfall: {snowfall !== null ? `${snowfall} mm` : '— real data —'}</SimLabel>
                  <RangeRow>
                    <Range type="range" min={0} max={30} step={1}
                      value={snowfall ?? 0}
                      onChange={e => setSnowfall(Number(e.target.value))}
                    />
                    <RangeValue>{snowfall !== null ? `${snowfall}` : '—'}</RangeValue>
                    {snowfall !== null && (
                      <button style={{ border: 'none', background: 'none', color: tokens.red, cursor: 'pointer', fontSize: 12 }}
                        onClick={() => setSnowfall(null)}>✕</button>
                    )}
                  </RangeRow>
                </FieldGroup>

                <FieldGroup>
                  <SimLabel>Visibility: {visibility !== null ? `${visibility} km` : '— real data —'}</SimLabel>
                  <RangeRow>
                    <Range type="range" min={0} max={10} step={0.5}
                      value={visibility ?? 10}
                      onChange={e => setVisibility(Number(e.target.value))}
                    />
                    <RangeValue>{visibility !== null ? `${visibility}` : '—'}</RangeValue>
                    {visibility !== null && (
                      <button style={{ border: 'none', background: 'none', color: tokens.red, cursor: 'pointer', fontSize: 12 }}
                        onClick={() => setVisibility(null)}>✕</button>
                    )}
                  </RangeRow>
                  <Helper>Low visibility (&lt;1 km) significantly impacts operations</Helper>
                </FieldGroup>

                {/* ── Reactionary parameter ───────────────────── */}
                <SectionLabel>Reactionary Delay</SectionLabel>
                <Helper style={{ marginBottom: 10 }}>
                  Delay of the inbound aircraft on its previous rotation.
                  This is the strongest single predictor in the model.
                </Helper>

                <FieldGroup>
                  <SimLabel>
                    Previous Aircraft Delay:{' '}
                    {prevDelay !== null ? `${prevDelay} min` : '— real data —'}
                  </SimLabel>
                  <RangeRow>
                    <Range type="range" min={0} max={120} step={5}
                      value={prevDelay ?? 0}
                      onChange={e => setPrevDelay(Number(e.target.value))}
                    />
                    <RangeValue>{prevDelay !== null ? `${prevDelay}` : '—'}</RangeValue>
                    {prevDelay !== null && (
                      <button style={{ border: 'none', background: 'none', color: tokens.red, cursor: 'pointer', fontSize: 12 }}
                        onClick={() => setPrevDelay(null)}>✕</button>
                    )}
                  </RangeRow>
                  <Helper>0 = aircraft arrived on time · 120 = severe inbound delay</Helper>
                </FieldGroup>

                {/* ── Congestion parameters ───────────────────── */}
                <SectionLabel>Airport Congestion (MUC)</SectionLabel>
                <Helper style={{ marginBottom: 10 }}>
                  Number of flights at MUC in the ±1 hour window around this flight's scheduled time.
                </Helper>

                <FieldGroup>
                  <SimLabel>
                    Arrivals ±1h: {mucArr1h !== null ? mucArr1h : '— real data —'}
                  </SimLabel>
                  <RangeRow>
                    <Range type="range" min={0} max={60} step={1}
                      value={mucArr1h ?? 20}
                      onChange={e => setMucArr1h(Number(e.target.value))}
                    />
                    <RangeValue>{mucArr1h !== null ? mucArr1h : '—'}</RangeValue>
                    {mucArr1h !== null && (
                      <button style={{ border: 'none', background: 'none', color: tokens.red, cursor: 'pointer', fontSize: 12 }}
                        onClick={() => setMucArr1h(null)}>✕</button>
                    )}
                  </RangeRow>
                </FieldGroup>

                <FieldGroup>
                  <SimLabel>
                    Departures ±1h: {mucDep1h !== null ? mucDep1h : '— real data —'}
                  </SimLabel>
                  <RangeRow>
                    <Range type="range" min={0} max={60} step={1}
                      value={mucDep1h ?? 20}
                      onChange={e => setMucDep1h(Number(e.target.value))}
                    />
                    <RangeValue>{mucDep1h !== null ? mucDep1h : '—'}</RangeValue>
                    {mucDep1h !== null && (
                      <button style={{ border: 'none', background: 'none', color: tokens.red, cursor: 'pointer', fontSize: 12 }}
                        onClick={() => setMucDep1h(null)}>✕</button>
                    )}
                  </RangeRow>
                </FieldGroup>

                <ActionRow>
                  <SimRunButton
                    onClick={handleRun}
                    disabled={!selectedFlight || running || blocked}
                  >
                    {running ? 'Running…' : '▶ Run Simulation'}
                  </SimRunButton>
                  <Button onClick={handleReset} disabled={running}>Reset</Button>
                </ActionRow>

              </SimControlPanel>

              {/* ══ RIGHT: results panel ═════════════════════════ */}
              <SimResultPanel>
                {running && (
                  <LoadingText>
                    <Spinner style={{ margin: '0 auto 8px' }} />
                    Running simulation against ML model…
                  </LoadingText>
                )}

                {!running && !result && (
                  <EmptyResultMessage>
                    <span style={{ fontSize: 32 }}>🧪</span>
                    Select a flight and adjust parameters, then click Run Simulation.
                    <span style={{ fontSize: 12, color: tokens.textLight }}>
                      Parameters left at "— real data —" use the actual pipeline values for that flight.
                    </span>
                  </EmptyResultMessage>
                )}

                {!running && result && (() => {
                  const { baseline, simulated, delta, reactionary_impact } = result;
                  const b15  = Math.round((baseline.p_delay_15  || 0) * 100);
                  const s15  = Math.round((simulated.p_delay_15 || 0) * 100);
                  const b30  = Math.round((baseline.p_delay_30  || 0) * 100);
                  const s30  = Math.round((simulated.p_delay_30 || 0) * 100);
                  const bMin = baseline.minutes_ui  || 0;
                  const sMin = simulated.minutes_ui || 0;
                  const d15  = s15 - b15;
                  const d30  = s30 - b30;
                  const dMin = Math.round(sMin - bMin);

                  return (
                    <>
                      {/* Top KPI row */}
                      <ResultGrid>
                        <ResultCard>
                          <ResultLabel>Simulated Delay</ResultLabel>
                          <ResultValue color={sMin > 30 ? tokens.red : sMin > 0 ? tokens.amber : tokens.green}>
                            {fmtMin(sMin)}
                          </ResultValue>
                          {dMin !== 0 && (
                            <DeltaTag positive={dMin > 0}>
                              {dMin > 0 ? `+${dMin}` : dMin} min vs baseline
                            </DeltaTag>
                          )}
                        </ResultCard>
                        <ResultCard>
                          <ResultLabel>P(Delay ≥15 min)</ResultLabel>
                          <ResultValue color={pctColor(s15)}>{s15}%</ResultValue>
                          {d15 !== 0 && <DeltaTag positive={d15 > 0}>{d15 > 0 ? `+${d15}` : d15}pp</DeltaTag>}
                          <ProbBarWrap><ProbBarFill pct={s15} /></ProbBarWrap>
                        </ResultCard>
                        <ResultCard>
                          <ResultLabel>P(Delay ≥30 min)</ResultLabel>
                          <ResultValue color={pctColor(s30)}>{s30}%</ResultValue>
                          {d30 !== 0 && <DeltaTag positive={d30 > 0}>{d30 > 0 ? `+${d30}` : d30}pp</DeltaTag>}
                          <ProbBarWrap><ProbBarFill pct={s30} /></ProbBarWrap>
                        </ResultCard>
                      </ResultGrid>

                      {/* Baseline vs Simulated comparison */}
                      <CompareRow>
                        <CompareCard>
                          <CompareTitleRow>📊 Baseline (real data)</CompareTitleRow>
                          <CompareItem>
                            <span>Delay ≥15 min</span><strong>{b15}%</strong>
                          </CompareItem>
                          <CompareItem>
                            <span>Delay ≥30 min</span><strong>{b30}%</strong>
                          </CompareItem>
                          <CompareItem>
                            <span>Est. delay</span><strong>{fmtMin(bMin)}</strong>
                          </CompareItem>
                        </CompareCard>
                        <CompareCard highlight>
                          <CompareTitleRow highlight>
                            🧪 Simulated ({overrideCount} override{overrideCount !== 1 ? 's' : ''})
                          </CompareTitleRow>
                          <CompareItem>
                            <span>Delay ≥15 min</span>
                            <strong style={{ color: pctColor(s15) }}>{s15}%</strong>
                          </CompareItem>
                          <CompareItem>
                            <span>Delay ≥30 min</span>
                            <strong style={{ color: pctColor(s30) }}>{s30}%</strong>
                          </CompareItem>
                          <CompareItem>
                            <span>Est. delay</span>
                            <strong style={{ color: sMin > 0 ? tokens.red : tokens.green }}>{fmtMin(sMin)}</strong>
                          </CompareItem>
                        </CompareCard>
                      </CompareRow>

                      {/* Reactionary impact */}
                      <div>
                        <div style={{ fontWeight: 700, color: tokens.text, marginBottom: 8 }}>
                          Reactionary Impact on Connected Flights
                          {reactionary_impact.length === 0 && (
                            <span style={{ fontWeight: 400, color: tokens.textMuted, fontSize: 13, marginLeft: 8 }}>
                              — no downstream impact detected
                            </span>
                          )}
                        </div>
                        {reactionary_impact.length > 0 && (
                          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
                            {reactionary_impact.map((cf, i) => (
                              <ReactCard key={i}>
                                <ReactFlightNo>{cf.flight}</ReactFlightNo>
                                <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 6 }}>
                                  {cf.sched ? new Date(cf.sched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                </div>
                                <ReactDelayBadge severity={cf.severity}>+{cf.added_min} min</ReactDelayBadge>
                              </ReactCard>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Overrides summary */}
                      {Object.keys(result.overrides).length > 0 && (
                        <div style={{ background: tokens.surfaceHover, borderRadius: tokens.radiusSm, padding: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted,
                                        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                            Parameters Overridden
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {Object.entries(result.overrides).map(([k, v]) => (
                              <span key={k} style={{
                                background: tokens.primaryLight, color: tokens.primary,
                                fontSize: 12, fontWeight: 600, padding: '3px 9px',
                                borderRadius: 999,
                              }}>
                                {k.replace(/_/g, ' ')}: {typeof v === 'number' ? v : v}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </SimResultPanel>

            </SimPanels>
          </ContentArea>
        </MainContent>
      </PageContainer>
    </PageLayout>
  );
};

export default SimulationPage;