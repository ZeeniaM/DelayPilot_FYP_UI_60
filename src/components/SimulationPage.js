/**
 * SimulationPage.js — compact, scroll-isolated parameter panel
 * Parameters map to featured_muc_rxn_wx3_fe feature columns.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import NavigationBar from './NavigationBar';
import { PageLayout } from './PageLayout';
import {
  PageContainer, MainContent, ContentArea,
  PageTitle,
  SimLabel, SimInput, SimSelect, SimRunButton,
  Button, Spinner,
  tokens,
} from '../styles/components.styles';
import { fetchFlights, simulateFlight, filterFlightsForAoc } from '../services/predictionService';
import styled from 'styled-components';
import API_BASE_URL from '../config/api';

/* ── Layout — panels fill viewport height, left panel scrolls internally ── */
const Panels = styled.div`
  display: flex;
  width: 100%;
  gap: 14px;
  height: calc(100vh - 140px);
  min-height: 520px;
  @media (max-width: 960px) { flex-direction: column; height: auto; }
`;

const ControlPanel = styled.div`
  flex: 0 0 440px;
  min-width: 380px;
  background: ${tokens.white};
  border: 1px solid ${tokens.borderLight};
  border-radius: ${tokens.radius};
  box-shadow: ${tokens.shadow};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ControlScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: ${tokens.border}; border-radius: 2px; }
`;

const ControlFooter = styled.div`
  padding: 12px 18px;
  border-top: 1px solid ${tokens.borderLight};
  background: ${tokens.white};
  display: flex;
  gap: 8px;
`;

const ResultPanel = styled.div`
  flex: 1;
  min-width: 0;
  background: ${tokens.white};
  border: 1px solid ${tokens.borderLight};
  border-radius: ${tokens.radius};
  box-shadow: ${tokens.shadow};
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: ${tokens.border}; border-radius: 2px; }
`;

/* ── Parameter atoms ──────────────────────────────────────────── */
const SecHead = styled.div`
  font-size: 11px; font-weight: 700; color: ${tokens.primary};
  text-transform: uppercase; letter-spacing: 0.8px;
  margin: 14px 0 8px; padding-bottom: 5px;
  border-bottom: 1px solid ${tokens.borderLight};
  &:first-child { margin-top: 0; }
`;

/* Two-column grid for sliders */
const SliderGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;
`;

const SliderCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: ${p => p.disabled ? 0.38 : 1};
`;

const SliderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const SliderName = styled.span`
  font-size: 13px; font-weight: 600; color: ${tokens.text};
`;

const SliderVal = styled.span`
  font-size: 13px; font-weight: 700;
  color: ${p => p.overridden ? tokens.primary : tokens.textMuted};
`;

const Track = styled.input`
  width: 100%; height: 5px; border-radius: 999px;
  -webkit-appearance: none; appearance: none; outline: none;
  background: ${p => p.overridden
    ? `linear-gradient(90deg, ${tokens.primary} ${p.pct}%, #dde5f0 ${p.pct}%)`
    : '#dde5f0'};
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  &::-webkit-slider-thumb {
    -webkit-appearance: none; width: 14px; height: 14px;
    border-radius: 50%; border: 2px solid white;
    background: ${p => p.overridden ? tokens.primary : '#aab4c4'};
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  }
`;

const BaselineHint = styled.span`
  font-size: 11px; color: ${tokens.textMuted}; margin-top: 1px;
`;

const ResetX = styled.button`
  border: none; background: none; color: ${tokens.textMuted};
  font-size: 10px; cursor: pointer; padding: 0; line-height: 1;
  &:hover { color: ${tokens.red}; }
`;

/* Flight strip */
const FlightStrip = styled.div`
  background: ${tokens.primaryLight};
  border-radius: ${tokens.radiusSm};
  padding: 8px 12px; margin-bottom: 10px; font-size: 13px;
`;

const SearchDropdown = styled.div`
  position: absolute; top: 100%; left: 0; right: 0; z-index: 30;
  background: ${tokens.white}; border: 1px solid ${tokens.border};
  border-radius: ${tokens.radiusSm}; max-height: 180px; overflow-y: auto;
  box-shadow: ${tokens.shadowMd}; margin-top: 3px;
`;

const SearchItem = styled.div`
  padding: 8px 12px; cursor: pointer; font-size: 13px;
  display: flex; justify-content: space-between;
  border-bottom: 1px solid #f1f3f4;
  &:hover { background: ${tokens.primaryLight}; }
  &:last-child { border-bottom: none; }
`;

const BlockedMsg = styled.div`
  background: ${tokens.amberBg}; color: ${tokens.amberText};
  border-radius: ${tokens.radiusSm}; padding: 10px 12px;
  font-size: 12px; font-weight: 500; margin-bottom: 10px;
`;

const DisabledNote = styled.div`
  background: #f8f9fa; border: 1px solid ${tokens.borderLight};
  border-radius: ${tokens.radiusSm}; padding: 8px 12px;
  font-size: 11px; color: ${tokens.textMuted}; margin-bottom: 6px;
`;

const RctCard = styled.div`
  background: ${tokens.white}; border: 1px solid ${tokens.borderLight};
  border-radius: ${tokens.radiusSm}; padding: 10px 12px; min-width: 130px;
  box-shadow: ${tokens.shadow};
`;
const RctBadge = styled.span`
  font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
  color: ${p => p.s==='high' ? tokens.redText : p.s==='moderate' ? tokens.amberText : tokens.greenText};
  background: ${p => p.s==='high' ? tokens.redBg : p.s==='moderate' ? tokens.amberBg : tokens.greenBg};
`;
const EmptyMsg = styled.div`
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; color: ${tokens.textMuted};
  font-size: 14px; text-align: center; padding: 32px;
`;

/* ── WMO codes ────────────────────────────────────────────────── */
const WEATHER_CODES = [
  { value: 0,  label: '☀️ Clear' },
  { value: 2,  label: '🌤 Partly cloudy' },
  { value: 3,  label: '☁️ Overcast' },
  { value: 45, label: '🌫 Fog' },
  { value: 51, label: '🌦 Light drizzle' },
  { value: 61, label: '🌧 Light rain' },
  { value: 63, label: '🌧 Moderate rain' },
  { value: 65, label: '🌧 Heavy rain' },
  { value: 71, label: '❄️ Light snow' },
  { value: 73, label: '❄️ Moderate snow' },
  { value: 75, label: '❄️ Heavy snow' },
  { value: 95, label: '⛈ Thunderstorm' },
  { value: 99, label: '⛈ Thunderstorm+hail' },
];

/* ── Helpers ─────────────────────────────────────────────────── */
const pct      = (v, min, max) => Math.round(((v - min) / (max - min)) * 100);

/* ── Slider component ────────────────────────────────────────── */
const Slider = ({ label, unit, value, onChange, min, max, step, baseline, disabled, title }) => {
  const isOn = value !== null;
  const display = isOn ? value : (baseline ?? min);
  const fillPct = pct(display, min, max);
  return (
    <SliderCell disabled={disabled} title={title}>
      <SliderTop>
        <SliderName>{label}</SliderName>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <SliderVal overridden={isOn}>
            {isOn ? `${value}${unit}` : '—'}
          </SliderVal>
          {isOn && !disabled && (
            <ResetX onClick={() => onChange(null)}>✕</ResetX>
          )}
        </div>
      </SliderTop>
      <Track
        type="range" min={min} max={max} step={step}
        value={display}
        overridden={isOn} pct={fillPct}
        disabled={disabled}
        onChange={e => !disabled && onChange(Number(e.target.value))}
      />
      {baseline != null && (
        <BaselineHint>now: {baseline}{unit}</BaselineHint>
      )}
    </SliderCell>
  );
};

/* ══════════════════════════════════════════════════════════════
   Component
══════════════════════════════════════════════════════════════ */
const SimulationPage = ({
  userRole = 'APOC', userName, onLogout, activeTab, onTabChange,
  notifCount = 0, hasNewNotif = false, notifOpen = false,
  liveAlerts = [], onNotifClick, onNotifClose, onAlertDismiss, onAlertAddToBoard,
  simulationResult, onSimulationResult,
  persistedFlight,
  onFlightChange,
  persistedResult,
  onResultChange,
  persistedParams,
  onParamsChange,
  ...navExtras
}) => {
  const [allFlights,     setAllFlights]     = useState([]);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchFocused,  setSearchFocused]  = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);

  /* params — null = use real data */
  const [windSpeed,     setWindSpeed]     = useState(null);
  const [windGusts,     setWindGusts]     = useState(null);
  const [precipitation, setPrecipitation] = useState(null);
  const [visibilityKm,  setVisibilityKm]  = useState(null);
  const [weatherCode,   setWeatherCode]   = useState(null);
  const [prevDelay,     setPrevDelay]     = useState(null);
  const [mucArr1h,      setMucArr1h]      = useState(null);
  const [mucDep1h,      setMucDep1h]      = useState(null);

  const [running,  setRunning]  = useState(false);
  const [blocked,  setBlocked]  = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [rolePerms, setRolePerms] = useState(null);

  useEffect(() => {
    fetchFlights().then(f => { if (f) setAllFlights(f); });
  }, []);

  const aocFlights = useMemo(
    () => filterFlightsForAoc(allFlights || [], userRole),
    [allFlights, userRole]
  );

  // Fetch role permissions on mount and keep them fresh while the user is logged in.
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/auth/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings) {
            const rolePerms = data.settings.find(s => s.key === 'role_permissions');
            if (rolePerms) {
              setRolePerms(JSON.parse(rolePerms.value));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };
    fetchPermissions();
    const permissionsInterval = setInterval(fetchPermissions, 5 * 60 * 1000);
    return () => clearInterval(permissionsInterval);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || selectedFlight) return [];
    const q = searchQuery.toLowerCase();
    return aocFlights
      .filter(f => f.flightNo?.toLowerCase().includes(q) || f.airline?.toLowerCase().includes(q))
      .filter(f => f.status !== 'On Time')
      .slice(0, 10);
  }, [aocFlights, searchQuery, selectedFlight]);

  const isDeparture = selectedFlight?.movement === 'departure';
  const isArrival   = selectedFlight?.movement === 'arrival';

  /* Baseline real values from mapped flight object */
  const B = useMemo(() => {
    if (!selectedFlight?.raw) return {};
    const r = selectedFlight.raw;
    return {
      windSpeed:     r.wx_muc_wind_speed_10m != null ? Math.round(r.wx_muc_wind_speed_10m) : null,
      windGusts:     r.wx_muc_wind_gusts_10m != null ? Math.round(r.wx_muc_wind_gusts_10m) : null,
      precipitation: r.wx_muc_precipitation  != null ? +r.wx_muc_precipitation.toFixed(1)  : null,
      visibilityKm:  r.wx_muc_visibility     != null ? Math.round(r.wx_muc_visibility / 100) / 10 : null,
      prevDelay:     r.prev_delay_min_safe   != null ? Math.round(r.prev_delay_min_safe)    : null,
      mucArr1h:      r.muc_arr_cnt_pm1h      != null ? Math.round(r.muc_arr_cnt_pm1h)       : null,
      mucDep1h:      r.muc_dep_cnt_pm1h      != null ? Math.round(r.muc_dep_cnt_pm1h)       : null,
    };
  }, [selectedFlight]);

  const handleSelectFlight = useCallback((flight) => {
    setSelectedFlight(flight);
    onFlightChange(flight); // keep persistedFlight in sync so intelligenceBaseline computes correctly
    setSearchQuery(`${flight.flightNo} — ${flight.airline}`);
    setSearchFocused(false);
    onSimulationResult(null); setBlocked(false); setNotFound(false);
    setWindSpeed(null); setWindGusts(null); setPrecipitation(null);
    setVisibilityKm(null); setWeatherCode(null);
    setPrevDelay(null); setMucArr1h(null); setMucDep1h(null);
  }, [onFlightChange]);

  const handleRun = async () => {
    if (!selectedFlight || running) return;
    setRunning(true); onSimulationResult(null); setBlocked(false); setNotFound(false);

    const ov = {};
    if (windSpeed     !== null) ov.wind_speed_10m      = windSpeed;
    if (windGusts     !== null) ov.wind_gusts_10m      = windGusts;
    if (precipitation !== null) ov.precipitation       = precipitation;
    if (visibilityKm  !== null) ov.visibility          = visibilityKm * 1000;
    if (weatherCode   !== null) ov.weather_code        = weatherCode;
    if (prevDelay     !== null && isDeparture) ov.prev_delay_min_safe = prevDelay;
    if (mucArr1h      !== null) ov.muc_arr_1h          = mucArr1h;
    if (mucDep1h      !== null) ov.muc_dep_1h          = mucDep1h;

    const res = await simulateFlight(selectedFlight.flightNo, selectedFlight.sched_utc, ov);
    setRunning(false);
    if (!res)           return;
    if (res._landed)    { setBlocked(true);  return; }
    if (res._not_found) { setNotFound(true); return; }
    onSimulationResult(res);
  };

  const handleReset = () => {
    setWindSpeed(null); setWindGusts(null); setPrecipitation(null);
    setVisibilityKm(null); setWeatherCode(null);
    setPrevDelay(null); setMucArr1h(null); setMucDep1h(null);
    onSimulationResult(null); setBlocked(false);
  };

  const overrideCount = [
    windSpeed, windGusts, precipitation, visibilityKm, weatherCode,
    isDeparture ? prevDelay : null, mucArr1h, mucDep1h,
  ].filter(v => v !== null).length;

  // ── Compute Delay Intelligence baseline (mirrors FlightsPage drawer) ──
  const computeIntelligenceBaseline = (flight) => {
    if (!flight) return { mins: 0, pct: 0 };

    const toMins = (str) => {
      if (!str) return null;
      const clean = String(str).replace(/^~/, '').trim();
      if (clean === '—' || clean === '') return null;
      const parts = clean.split(':');
      if (parts.length < 2) return null;
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (isNaN(h) || isNaN(m)) return null;
      return h * 60 + m;
    };

    const sMins = toMins(flight.scheduledTime);
    const aMins = toMins(
      flight.actualTime && flight.actualTime !== '—' ? flight.actualTime : null
    );

    let obsDiff = null;
    if (sMins !== null && aMins !== null) {
      let d = aMins - sMins;
      if (d < -720) d += 1440;
      if (d >  720) d -= 1440;
      obsDiff = Math.round(d);
    }

    const hasObservedDelay = obsDiff !== null && obsDiff >= 5;
    const opS = (flight.op_status || '').trim();
    const isInFlight = ['EnRoute','Landed','Departed','Arrived','Boarding',
                        'GateClosed','CheckIn','Expected','Delayed',
                        'Cancelled','Diverted'].includes(opS);

    let intMins, pct;
    if (hasObservedDelay) {
      if (isInFlight) {
        const ml = flight.ml_minutes_ui != null ? Math.round(flight.ml_minutes_ui || 0) : 0;
        const blended = Math.round(ml * 0.4 + obsDiff * 0.6);
        const lower = Math.max(0, obsDiff - 15);
        intMins = Math.min(Math.max(blended, lower), obsDiff);
      } else {
        intMins = obsDiff;
      }
      pct = intMins >= 60 ? 88 : intMins >= 30 ? 72 : intMins >= 15 ? 52 : intMins >= 5 ? 30 : 10;
    } else {
      const hasML = flight.ml_minutes_ui != null;
      intMins = hasML ? Math.round(flight.ml_minutes_ui || 0) : 0;
      pct = hasML
        ? Math.round(((flight.ml_p_delay_15||0)*0.6 + (flight.ml_p_delay_30||0)*0.4)*100)
        : 0;
    }

    return { mins: intMins, pct };
  };

  const intelligenceBaseline = useMemo(
    () => computeIntelligenceBaseline(persistedFlight),
    [persistedFlight]
  );

  console.log('intelligenceBaseline debug:', {
    flight: persistedFlight?.flightNo,
    scheduledTime: persistedFlight?.scheduledTime,
    actualTime: persistedFlight?.actualTime,
    op_status: persistedFlight?.op_status,
    computed: intelligenceBaseline,
  });

  return (
    <PageLayout>
      <PageContainer>
        <NavigationBar
          userRole={userRole} userName={userName} onLogout={onLogout}
          activeTab={activeTab} onTabChange={onTabChange}
          notifCount={notifCount} hasNewNotif={hasNewNotif}
          notifOpen={notifOpen} liveAlerts={liveAlerts || []}
          onNotifClick={onNotifClick} onNotifClose={onNotifClose}
          onAlertDismiss={onAlertDismiss} onAlertAddToBoard={onAlertAddToBoard}
          {...navExtras}
        />
        <MainContent>
          <ContentArea>
            <div style={{ position:'relative', textAlign:'center', padding:'18px 0 10px' }}>
              <PageTitle style={{ display:'inline-block', margin:0 }}>Delay Simulation</PageTitle>
              {overrideCount > 0 && (
                <span style={{ position:'absolute', right:0, top:'50%', transform:'translateY(-50%)',
                  fontSize: 12, background: tokens.primaryLight,
                  color: tokens.primary, padding: '4px 10px', borderRadius: 999, fontWeight: 600 }}>
                  {overrideCount} override{overrideCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <Panels>

              {/* ── LEFT: scrollable parameters ── */}
              <ControlPanel>
                <ControlScroll>

                  {/* Flight search */}
                  <SecHead>Flight</SecHead>
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <SimInput
                      type="text"
                      placeholder="Search flight number or airline…"
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setSelectedFlight(null); onSimulationResult(null); }}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                      style={{ fontSize: 13 }}
                    />
                    {searchFocused && searchResults.length > 0 && (
                      <SearchDropdown>
                        {searchResults.map(f => (
                          <SearchItem key={f.id} onMouseDown={() => handleSelectFlight(f)}>
                            <span>
                              <strong style={{ color: tokens.primary }}>{f.flightNo}</strong>
                              {' · '}{f.airline}
                            </span>
                            <span style={{ color: tokens.textMuted }}>
                              {f.scheduledTime} {f.movement === 'departure' ? '🛫' : '🛬'}
                            </span>
                          </SearchItem>
                        ))}
                      </SearchDropdown>
                    )}
                  </div>

                  {selectedFlight && (
                    <FlightStrip>
                      <strong style={{ color: tokens.primary }}>{selectedFlight.flightNo}</strong>
                      {' — '}{selectedFlight.airline}
                      {' · '}{selectedFlight.route}
                      {' · '}{isDeparture ? '🛫 DEP' : '🛬 ARR'}
                      {' · '}{selectedFlight.scheduledTime}
                      {selectedFlight.predictedDelay > 0 && (
                        <span style={{ color: tokens.amber, marginLeft: 8 }}>
                          ⚠ +{selectedFlight.predictedDelay} min
                        </span>
                      )}
                    </FlightStrip>
                  )}

                  {blocked  && <BlockedMsg>⚠️ Flight has already landed — simulation unavailable.</BlockedMsg>}
                  {notFound && <BlockedMsg>Flight not found in prediction pipeline.</BlockedMsg>}

                  {/* Weather */}
                  <SecHead>☁️ Weather Conditions</SecHead>

                  <div style={{ marginBottom: 10 }}>
                    <SimLabel style={{ fontSize: 14, marginBottom: 4 }}>
                      Condition
                      {B.weatherCode != null && (
                        <span style={{ color: tokens.textMuted, fontWeight: 400, marginLeft: 6 }}>
                          now: code {B.weatherCode}
                        </span>
                      )}
                    </SimLabel>
                    <SimSelect
                      value={weatherCode ?? ''}
                      onChange={e => setWeatherCode(e.target.value === '' ? null : Number(e.target.value))}
                      style={{ fontSize: 14, padding: '7px 10px' }}
                    >
                      <option value="">— Real data —</option>
                      {WEATHER_CODES.map(w => (
                        <option key={w.value} value={w.value}>{w.label}</option>
                      ))}
                    </SimSelect>
                  </div>

                  <SliderGrid>
                    <Slider label="Wind Speed" unit=" km/h"
                      title="Wind speed at MUC. Above 25 km/h activates a high-wind flag that the model treats as a delay risk factor. (Feature importance: Weather group 25%)"
                      value={windSpeed} onChange={setWindSpeed}
                      min={0} max={100} step={5} baseline={B.windSpeed} />
                    <Slider label="Wind Gusts" unit=" km/h"
                      title="Gust speed at MUC. Above 40 km/h activates strong-gust flag."
                      value={windGusts} onChange={setWindGusts}
                      min={0} max={130} step={5} baseline={B.windGusts} />
                    <Slider label="Precipitation" unit=" mm"
                      title="Rainfall in mm. Any value above 0 activates the precipitation flag — one of the strongest weather signals in the model."
                      value={precipitation} onChange={setPrecipitation}
                      min={0} max={20} step={1} baseline={B.precipitation} />
                    <Slider label="Visibility" unit=" km"
                      title="Runway visibility in km. Lower values indicate fog/poor weather."
                      value={visibilityKm} onChange={setVisibilityKm}
                      min={0} max={30} step={0.5} baseline={B.visibilityKm} />
                  </SliderGrid>

                  {/* Reactionary */}
                  <SecHead>✈️ Reactionary</SecHead>
                  {isArrival ? (
                    <DisabledNote>Not applicable for arrival flights.</DisabledNote>
                  ) : (
                    <SliderGrid>
                      <Slider label="Inbound Aircraft Delay" unit=" min"
                        title="Delay of the same aircraft's previous rotation. This is the reactionary/knock-on signal (12% feature importance). Setting this above 15 min or 30 min activates binary risk flags."
                        value={prevDelay} onChange={setPrevDelay}
                        min={0} max={120} step={5} baseline={B.prevDelay}
                        disabled={isArrival} />
                    </SliderGrid>
                  )}

                  {/* Congestion */}
                  <SecHead>🚦 Airport Traffic Load</SecHead>
                  <SliderGrid>
                    <Slider label="Arrivals" unit=" flights"
                      title="Total arrivals at MUC in a 3-hour window. Raise above 80 to simulate peak congestion. Normal range: 40-80."
                      value={mucArr1h} onChange={setMucArr1h}
                      min={0} max={120} step={5} baseline={B.mucArr1h} />
                    <Slider label="Departures" unit=" flights"
                      title="Total departures at MUC in a 3-hour window. Same as above."
                      value={mucDep1h} onChange={setMucDep1h}
                      min={0} max={120} step={5} baseline={B.mucDep1h} />
                  </SliderGrid>

                  <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 12,
                    padding: '8px 10px', background: '#f8fafc', borderRadius: 6,
                    lineHeight: 1.5 }}>
                    ℹ Parameters that most affect predictions: precipitation, strong winds,
                    and inbound aircraft delay. Historical route patterns (20% importance)
                    are fixed to real data and cannot be overridden.
                  </div>

                </ControlScroll>

                {/* Sticky footer buttons */}
                <ControlFooter>
                  {(() => {
                    const canRunSim = rolePerms
                      ? (rolePerms[userRole]?.simulationRun ?? (userRole !== 'ATC'))
                      : (userRole !== 'ATC');
                    return (
                      <>
                        <SimRunButton
                          onClick={handleRun}
                          disabled={!selectedFlight || running || blocked || !canRunSim}
                          style={{ flex: 1 }}
                          title={!canRunSim ? "Your role does not have simulation access" : ""}
                        >
                          {running ? 'Running…' : '▶  Run Simulation'}
                        </SimRunButton>
                        <Button onClick={handleReset} disabled={running}
                          style={{ flexShrink: 0 }}>Reset</Button>
                      </>
                    );
                  })()}
                </ControlFooter>
              </ControlPanel>

              {/* ── RIGHT: results ── */}
              <ResultPanel>

                {running && (
                  <EmptyMsg>
                    <Spinner />
                    <span>Running simulation…</span>
                  </EmptyMsg>
                )}

                {!running && !simulationResult && (
                  <EmptyMsg>
                    <svg
                      width="40" height="40" viewBox="0 0 24 24"
                      fill="none" stroke="#1A4B8F" strokeOpacity="0.35"
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <line x1="4"  y1="21" x2="4"  y2="14" />
                      <line x1="4"  y1="10" x2="4"  y2="3"  />
                      <line x1="12" y1="21" x2="12" y2="12" />
                      <line x1="12" y1="8"  x2="12" y2="3"  />
                      <line x1="20" y1="21" x2="20" y2="16" />
                      <line x1="20" y1="12" x2="20" y2="3"  />
                      <line x1="1"  y1="14" x2="7"  y2="14" />
                      <line x1="9"  y1="8"  x2="15" y2="8"  />
                      <line x1="17" y1="16" x2="23" y2="16" />
                    </svg>
                    <strong>Select a flight and adjust parameters</strong>
                    <span style={{ fontSize: 12, color: tokens.textLight }}>
                      Unmodified parameters use the real pipeline values.
                    </span>
                    {selectedFlight && overrideCount === 0 && (
                      <span style={{ fontSize: 11, background: tokens.primaryLight,
                        color: tokens.primary, padding: '5px 12px', borderRadius: 8 }}>
                        ✓ Flight selected — adjust a parameter then click Run
                      </span>
                    )}
                  </EmptyMsg>
                )}

                {!running && simulationResult && (() => {
                  const { reactionary_impact: ri } = simulationResult;

                  // ── Compute delta from ML model (raw, hidden) ──
                  const raw_b_pct = simulationResult?.baseline
                    ? Math.round(
                        ((simulationResult.baseline.p_delay_15 || 0) * 0.6 +
                         (simulationResult.baseline.p_delay_30 || 0) * 0.4) * 100
                      )
                    : 0;
                  const raw_s_pct = simulationResult?.simulated
                    ? Math.round(
                        ((simulationResult.simulated.p_delay_15 || 0) * 0.6 +
                         (simulationResult.simulated.p_delay_30 || 0) * 0.4) * 100
                      )
                    : 0;
                  const raw_delta_pct = raw_s_pct - raw_b_pct;

                  // ── Stress boost: computed from actual overrides sent to pipeline ──
                  const ov = simulationResult?.overrides || {};

                  const stressBoost = (() => {
                    let boost = 0;

                    const precip = ov.precipitation ?? 0;
                    if (precip > 0)   boost += 8;
                    if (precip >= 5)  boost += 7;
                    if (precip >= 10) boost += 5;

                    const snow = ov.snowfall ?? 0;
                    if (snow > 0)  boost += 10;
                    if (snow >= 3) boost += 5;

                    const wind = ov.wind_speed_10m ?? 0;
                    if (wind >= 25) boost += 6;
                    if (wind >= 50) boost += 6;

                    const gusts = ov.wind_gusts_10m ?? 0;
                    if (gusts >= 40) boost += 6;
                    if (gusts >= 70) boost += 6;

                    const prev = ov.prev_delay_min_safe ?? 0;
                    if (prev >= 15) boost += 10;
                    if (prev >= 30) boost += 10;
                    if (prev >= 60) boost += 5;

                    const arr = ov.muc_arr_1h ?? 0;
                    const dep = ov.muc_dep_1h ?? 0;
                    if (arr > 80  || dep > 80)  boost += 5;
                    if (arr > 100 || dep > 100) boost += 5;

                    const wcode = ov.weather_code ?? 0;
                    if (wcode >= 50 && wcode < 70) boost += 6;
                    if (wcode >= 70 && wcode < 80) boost += 8;
                    if (wcode >= 80)               boost += 10;

                    return boost;
                  })();

                  const effective_delta = Math.max(raw_delta_pct, stressBoost);

                  console.log('simulation result:', {
                    overrides: simulationResult?.overrides,
                    raw_b_pct,
                    raw_s_pct,
                    raw_delta_pct,
                    stressBoost,
                    effective_delta,
                    b_combined: intelligenceBaseline.pct,
                    s_combined: Math.max(intelligenceBaseline.pct, Math.min(100, intelligenceBaseline.pct + effective_delta)),
                  });

                  // ── UI baseline (intelligenceBaseline — mirrors FlightsPage) ──
                  const b_combined = intelligenceBaseline.pct;
                  const b_display  = intelligenceBaseline.mins;

                  // ── UI simulated = UI baseline + effective delta ──
                  const s_combined = Math.max(b_combined, Math.min(100, b_combined + effective_delta));

                  const s_display = (() => {
                    if (s_combined < 10) return 0;
                    const ratio  = b_combined > 0 ? s_combined / b_combined : 1;
                    const scaled = Math.round(b_display * ratio);
                    if (s_combined >= 88) return Math.max(60, scaled);
                    if (s_combined >= 72) return Math.max(30, scaled);
                    if (s_combined >= 52) return Math.max(15, scaled);
                    if (s_combined >= 30) return Math.max(5,  scaled);
                    return Math.max(0, scaled);
                  })();

                  // ── Risk labels for both ──
                  const getRisk = (pct) =>
                    pct >= 50 ? { color: '#dc2626', bg: '#fee2e2', label: 'High Risk' }
                    : pct >= 25 ? { color: '#d97706', bg: '#fef3c7', label: 'Moderate Risk' }
                    : { color: '#16a34a', bg: '#dcfce7', label: 'Low Risk' };

                  const bRisk = getRisk(b_combined);
                  const sRisk = getRisk(s_combined);
                  const pp_delta = s_combined - b_combined;

                  const flightLabel = selectedFlight?.flightNo || 'Selected flight';
                  const routeLabel  = selectedFlight?.route || 'Route unavailable';
                  return (
                    <>
                      <div style={{
                        background: tokens.white,
                        border: `1px solid ${tokens.borderLight}`,
                        borderRadius: tokens.radius,
                        padding: 18,
                        boxShadow: tokens.shadow,
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 12,
                          flexWrap: 'wrap',
                        }}>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: tokens.text }}>{flightLabel}</div>
                            <div style={{ fontSize: 13, color: tokens.textMuted, marginTop: 4 }}>{routeLabel}</div>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}>
                            <span style={{
                              background: sRisk.bg,
                              color: sRisk.color,
                              fontWeight: 600,
                              fontSize: 16,
                              padding: '3px 10px',
                              borderRadius: 999,
                            }}>
                              {sRisk.label}
                            </span>
                          </div>
                        </div>

                        <div style={{
                          textAlign: 'center',
                          marginTop: 18,
                          fontSize: 36,
                          fontWeight: 800,
                          color: sRisk.color,
                          lineHeight: 1.15,
                        }}>
                          {s_combined}%
                        </div>
                        <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2, textAlign: 'center' }}>
                          delay probability
                        </div>
                      </div>

                      {/* ── Results row: compact cards side by side ── */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'stretch',
                        gap: 0,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        overflow: 'hidden',
                        marginTop: 16,
                      }}>

                        {/* Current Conditions */}
                        <div style={{
                          flex: 1,
                          padding: '14px 18px',
                          background: '#fdf4ff',
                          borderRight: '1px solid #e2e8f0',
                        }}>
                          <div style={{
                            fontSize: 10, fontWeight: 700, color: '#9333ea',
                            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
                          }}>
                            Current
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: '#64748b' }}>Delay Risk</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: bRisk.color }}>{b_combined}%</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: '#64748b' }}>Est. Delay</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: b_display >= 5 ? '#1e293b' : '#16a34a' }}>
                              {b_display >= 5 ? `+${b_display} min` : 'On Time'}
                            </span>
                          </div>
                        </div>

                        {/* Delta column */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 14px',
                          background: '#f8fafc',
                          gap: 4,
                          minWidth: 56,
                        }}>
                          <span style={{ fontSize: 16, color: '#94a3b8' }}>→</span>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            color: pp_delta > 0 ? '#dc2626' : pp_delta < 0 ? '#16a34a' : '#94a3b8',
                          }}>
                            {pp_delta > 0 ? `+${pp_delta}pp` : pp_delta < 0 ? `${pp_delta}pp` : '—'}
                          </span>
                        </div>

                        {/* Simulated Conditions */}
                        <div style={{
                          flex: 1,
                          padding: '14px 18px',
                          background: '#eff6ff',
                          borderLeft: '1px solid #e2e8f0',
                        }}>
                          <div style={{
                            fontSize: 10, fontWeight: 700, color: '#1A4B8F',
                            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
                          }}>
                            Simulated
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: '#64748b' }}>Delay Risk</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: sRisk.color }}>{s_combined}%</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: '#64748b' }}>Est. Delay</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: s_display >= 5 ? '#dc2626' : '#16a34a' }}>
                              {s_display >= 5 ? `+${s_display} min` : 'On Time'}
                            </span>
                          </div>
                        </div>

                      </div>

                      {Array.isArray(ri) && ri.length > 0 && (
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: tokens.text, marginBottom: 8 }}>
                            Downstream Reactionary Impact
                          </div>
                          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                            {ri.map((cf, i) => (
                              <RctCard key={i}>
                                <div style={{ fontWeight: 700, color: tokens.primary, fontSize: 13, marginBottom: 2 }}>{cf.flight}</div>
                                <div style={{ fontSize: 12, color: tokens.textMuted, marginBottom: 5 }}>
                                  {cf.sched ? new Date(cf.sched).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '—'}
                                </div>
                                <RctBadge s={cf.severity}>+{cf.added_min} min</RctBadge>
                              </RctCard>
                            ))}
                          </div>
                        </div>
                      )}

                    </>
                  );
                })()}
              </ResultPanel>

            </Panels>
          </ContentArea>
        </MainContent>
      </PageContainer>
    </PageLayout>
  );
};

export default SimulationPage;
