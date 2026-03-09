/**
 * SimulationPage.js — compact, scroll-isolated parameter panel
 * Parameters map to featured_muc_rxn_wx3_fe feature columns.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import NavigationBar from './NavigationBar';
import { PageLayout } from './PageLayout';
import {
  PageContainer, MainContent, ContentArea,
  PageHeaderRow, PageTitle,
  SimLabel, SimInput, SimSelect, SimRunButton,
  Button, Spinner, LoadingText,
  tokens,
} from '../styles/components.styles';
import { fetchFlights, simulateFlight } from '../services/predictionService';
import styled from 'styled-components';

/* ── Layout — panels fill viewport height, left panel scrolls internally ── */
const Panels = styled.div`
  display: flex;
  gap: 20px;
  height: calc(100vh - 140px);
  min-height: 520px;
  @media (max-width: 960px) { flex-direction: column; height: auto; }
`;

const ControlPanel = styled.div`
  flex: 0 0 380px;
  min-width: 320px;
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
  background: ${tokens.white};
  border: 1px solid ${tokens.borderLight};
  border-radius: ${tokens.radius};
  box-shadow: ${tokens.shadow};
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: ${tokens.border}; border-radius: 2px; }
`;

/* ── Parameter atoms ──────────────────────────────────────────── */
const SecHead = styled.div`
  font-size: 10px; font-weight: 700; color: ${tokens.primary};
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
  font-size: 11px; font-weight: 600; color: ${tokens.text};
`;

const SliderVal = styled.span`
  font-size: 12px; font-weight: 700;
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
  font-size: 10px; color: ${tokens.textMuted}; margin-top: 1px;
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
  padding: 8px 12px; margin-bottom: 10px; font-size: 12px;
`;

const SearchDropdown = styled.div`
  position: absolute; top: 100%; left: 0; right: 0; z-index: 30;
  background: ${tokens.white}; border: 1px solid ${tokens.border};
  border-radius: ${tokens.radiusSm}; max-height: 180px; overflow-y: auto;
  box-shadow: ${tokens.shadowMd}; margin-top: 3px;
`;

const SearchItem = styled.div`
  padding: 8px 12px; cursor: pointer; font-size: 12px;
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

/* Result atoms */
const KPIRow = styled.div`
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
`;
const KPICard = styled.div`
  background: ${tokens.white}; border: 1px solid ${tokens.borderLight};
  border-radius: ${tokens.radius}; padding: 14px 12px;
  box-shadow: ${tokens.shadow};
`;
const KPIVal = styled.div`
  font-size: 24px; font-weight: 700; color: ${p => p.color || tokens.text};
  line-height: 1; margin-bottom: 3px;
`;
const KPILabel = styled.div`
  font-size: 10px; color: ${tokens.textMuted}; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.4px;
`;
const DeltaChip = styled.span`
  font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 999px;
  background: ${p => p.up ? tokens.redBg : tokens.greenBg};
  color: ${p => p.up ? tokens.redText : tokens.greenText};
  margin-left: 5px;
`;
const ProbBar = styled.div`
  height: 5px; background: #e1e5e9; border-radius: 3px; overflow: hidden; margin-top: 5px;
`;
const ProbFill = styled.div`
  height: 100%; border-radius: 3px; transition: width 0.4s ease;
  width: ${p => p.pct}%;
  background: ${p => p.pct > 50 ? tokens.red : p.pct > 25 ? tokens.amber : tokens.green};
`;
const CmpRow = styled.div` display: flex; gap: 10px; `;
const CmpCard = styled.div`
  flex: 1;
  background: ${p => p.hi ? tokens.primaryLight : tokens.surfaceHover};
  border: 1px solid ${p => p.hi ? tokens.primary : tokens.border};
  border-radius: ${tokens.radiusSm}; padding: 12px;
`;
const CmpTitle = styled.div`
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
  color: ${p => p.hi ? tokens.primary : tokens.textMuted}; margin-bottom: 8px;
`;
const CmpItem = styled.div`
  display: flex; justify-content: space-between; font-size: 12px;
  padding: 3px 0; border-bottom: 1px solid ${tokens.border};
  &:last-child { border-bottom: none; }
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
  font-size: 13px; text-align: center; padding: 32px;
`;
const OverrideChips = styled.div`
  display: flex; flex-wrap: wrap; gap: 5px;
`;
const Chip = styled.span`
  background: ${tokens.primaryLight}; color: ${tokens.primary};
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
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
const pctColor = p => p > 50 ? tokens.red : p > 25 ? tokens.amber : tokens.green;
const fmtMin   = v => (v && v > 0) ? `+${Math.round(v)} min` : 'On Time';
const pct      = (v, min, max) => Math.round(((v - min) / (max - min)) * 100);

/* ── Slider component ────────────────────────────────────────── */
const Slider = ({ label, unit, value, onChange, min, max, step, baseline, disabled }) => {
  const isOn = value !== null;
  const display = isOn ? value : (baseline ?? min);
  const fillPct = pct(display, min, max);
  return (
    <SliderCell disabled={disabled}>
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
  liveAlerts = [], onNotifClick, onNotifClose,
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
  const [result,   setResult]   = useState(null);
  const [blocked,  setBlocked]  = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchFlights().then(f => { if (f) setAllFlights(f); });
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || selectedFlight) return [];
    const q = searchQuery.toLowerCase();
    return allFlights
      .filter(f => f.flightNo?.toLowerCase().includes(q) || f.airline?.toLowerCase().includes(q))
      .slice(0, 10);
  }, [allFlights, searchQuery, selectedFlight]);

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
    setSearchQuery(`${flight.flightNo} — ${flight.airline}`);
    setSearchFocused(false);
    setResult(null); setBlocked(false); setNotFound(false);
    setWindSpeed(null); setWindGusts(null); setPrecipitation(null);
    setVisibilityKm(null); setWeatherCode(null);
    setPrevDelay(null); setMucArr1h(null); setMucDep1h(null);
  }, []);

  const handleRun = async () => {
    if (!selectedFlight || running) return;
    setRunning(true); setResult(null); setBlocked(false); setNotFound(false);

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
    setResult(res);
  };

  const handleReset = () => {
    setWindSpeed(null); setWindGusts(null); setPrecipitation(null);
    setVisibilityKm(null); setWeatherCode(null);
    setPrevDelay(null); setMucArr1h(null); setMucDep1h(null);
    setResult(null); setBlocked(false);
  };

  const overrideCount = [
    windSpeed, windGusts, precipitation, visibilityKm, weatherCode,
    isDeparture ? prevDelay : null, mucArr1h, mucDep1h,
  ].filter(v => v !== null).length;

  return (
    <PageLayout>
      <PageContainer>
        <NavigationBar
          userRole={userRole} userName={userName} onLogout={onLogout}
          activeTab={activeTab} onTabChange={onTabChange}
          notifCount={notifCount} hasNewNotif={hasNewNotif}
          notifOpen={notifOpen} liveAlerts={liveAlerts || []}
          onNotifClick={onNotifClick} onNotifClose={onNotifClose}
        />
        <MainContent>
          <ContentArea>
            <PageHeaderRow>
              <PageTitle>Delay Simulation</PageTitle>
              {overrideCount > 0 && (
                <span style={{ fontSize: 12, background: tokens.primaryLight,
                  color: tokens.primary, padding: '4px 10px', borderRadius: 999, fontWeight: 600 }}>
                  {overrideCount} override{overrideCount > 1 ? 's' : ''}
                </span>
              )}
            </PageHeaderRow>

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
                      onChange={e => { setSearchQuery(e.target.value); setSelectedFlight(null); setResult(null); }}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
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
                  <SecHead>☁️ Weather (MUC)</SecHead>

                  <div style={{ marginBottom: 10 }}>
                    <SimLabel style={{ fontSize: 11, marginBottom: 4 }}>
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
                      style={{ fontSize: 12, padding: '7px 10px' }}
                    >
                      <option value="">— Real data —</option>
                      {WEATHER_CODES.map(w => (
                        <option key={w.value} value={w.value}>{w.label}</option>
                      ))}
                    </SimSelect>
                  </div>

                  <SliderGrid>
                    <Slider label="Wind Speed" unit=" km/h"
                      value={windSpeed} onChange={setWindSpeed}
                      min={0} max={100} step={5} baseline={B.windSpeed} />
                    <Slider label="Wind Gusts" unit=" km/h"
                      value={windGusts} onChange={setWindGusts}
                      min={0} max={130} step={5} baseline={B.windGusts} />
                    <Slider label="Precipitation" unit=" mm"
                      value={precipitation} onChange={setPrecipitation}
                      min={0} max={40} step={1} baseline={B.precipitation} />
                    <Slider label="Visibility" unit=" km"
                      value={visibilityKm} onChange={setVisibilityKm}
                      min={0} max={10} step={0.5} baseline={B.visibilityKm} />
                  </SliderGrid>

                  {/* Reactionary */}
                  <SecHead>✈️ Reactionary</SecHead>
                  {isArrival ? (
                    <DisabledNote>Not applicable for arrival flights.</DisabledNote>
                  ) : (
                    <SliderGrid>
                      <Slider label="Prev. Aircraft Delay" unit=" min"
                        value={prevDelay} onChange={setPrevDelay}
                        min={0} max={120} step={5} baseline={B.prevDelay}
                        disabled={isArrival} />
                    </SliderGrid>
                  )}

                  {/* Congestion */}
                  <SecHead>🚦 Congestion (±1h)</SecHead>
                  <SliderGrid>
                    <Slider label="Arrivals" unit=""
                      value={mucArr1h} onChange={setMucArr1h}
                      min={0} max={60} step={1} baseline={B.mucArr1h} />
                    <Slider label="Departures" unit=""
                      value={mucDep1h} onChange={setMucDep1h}
                      min={0} max={60} step={1} baseline={B.mucDep1h} />
                  </SliderGrid>

                </ControlScroll>

                {/* Sticky footer buttons */}
                <ControlFooter>
                  <SimRunButton
                    onClick={handleRun}
                    disabled={!selectedFlight || running || blocked}
                    style={{ flex: 1 }}
                  >
                    {running ? 'Running…' : '▶  Run Simulation'}
                  </SimRunButton>
                  <Button onClick={handleReset} disabled={running}
                    style={{ flexShrink: 0 }}>Reset</Button>
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

                {!running && !result && (
                  <EmptyMsg>
                    <span style={{ fontSize: 36 }}>🧪</span>
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

                {!running && result && (() => {
                  const { baseline: bl, simulated: sm, reactionary_impact: ri } = result;
                  const b15 = Math.round((bl?.p_delay_15 || 0) * 100);
                  const s15 = Math.round((sm?.p_delay_15 || 0) * 100);
                  const b30 = Math.round((bl?.p_delay_30 || 0) * 100);
                  const s30 = Math.round((sm?.p_delay_30 || 0) * 100);
                  const bMn = Math.round(bl?.minutes_ui || 0);
                  const sMn = Math.round(sm?.minutes_ui || 0);
                  const d15 = s15 - b15, d30 = s30 - b30, dMn = sMn - bMn;
                  return (
                    <>
                      <KPIRow>
                        <KPICard>
                          <KPILabel>Simulated Delay</KPILabel>
                          <KPIVal color={sMn >= 30 ? tokens.red : sMn >= 5 ? tokens.amber : tokens.green}>
                            {fmtMin(sMn)}
                          </KPIVal>
                          {dMn !== 0 && <DeltaChip up={dMn > 0}>{dMn > 0 ? `+${dMn}` : dMn} min</DeltaChip>}
                        </KPICard>
                        <KPICard>
                          <KPILabel>P(≥15 min)</KPILabel>
                          <KPIVal color={pctColor(s15)}>{s15}%</KPIVal>
                          {d15 !== 0 && <DeltaChip up={d15 > 0}>{d15 > 0 ? `+${d15}` : d15}pp</DeltaChip>}
                          <ProbBar><ProbFill pct={s15} /></ProbBar>
                        </KPICard>
                        <KPICard>
                          <KPILabel>P(≥30 min)</KPILabel>
                          <KPIVal color={pctColor(s30)}>{s30}%</KPIVal>
                          {d30 !== 0 && <DeltaChip up={d30 > 0}>{d30 > 0 ? `+${d30}` : d30}pp</DeltaChip>}
                          <ProbBar><ProbFill pct={s30} /></ProbBar>
                        </KPICard>
                      </KPIRow>

                      <CmpRow>
                        <CmpCard>
                          <CmpTitle>📊 Baseline</CmpTitle>
                          <CmpItem><span>P(≥15 min)</span><strong>{b15}%</strong></CmpItem>
                          <CmpItem><span>P(≥30 min)</span><strong>{b30}%</strong></CmpItem>
                          <CmpItem><span>Est. delay</span><strong>{fmtMin(bMn)}</strong></CmpItem>
                        </CmpCard>
                        <CmpCard hi>
                          <CmpTitle hi>🧪 Simulated ({overrideCount} override{overrideCount !== 1 ? 's' : ''})</CmpTitle>
                          <CmpItem><span>P(≥15 min)</span><strong style={{ color: pctColor(s15) }}>{s15}%</strong></CmpItem>
                          <CmpItem><span>P(≥30 min)</span><strong style={{ color: pctColor(s30) }}>{s30}%</strong></CmpItem>
                          <CmpItem><span>Est. delay</span><strong style={{ color: sMn > 0 ? tokens.red : tokens.green }}>{fmtMin(sMn)}</strong></CmpItem>
                        </CmpCard>
                      </CmpRow>

                      {Array.isArray(ri) && ri.length > 0 && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: tokens.text, marginBottom: 8 }}>
                            Downstream Reactionary Impact
                          </div>
                          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                            {ri.map((cf, i) => (
                              <RctCard key={i}>
                                <div style={{ fontWeight: 700, color: tokens.primary, fontSize: 12, marginBottom: 2 }}>{cf.flight}</div>
                                <div style={{ fontSize: 10, color: tokens.textMuted, marginBottom: 5 }}>
                                  {cf.sched ? new Date(cf.sched).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '—'}
                                </div>
                                <RctBadge s={cf.severity}>+{cf.added_min} min</RctBadge>
                              </RctCard>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.overrides && Object.keys(result.overrides).length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: tokens.textMuted,
                            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                            Overrides Applied
                          </div>
                          <OverrideChips>
                            {Object.entries(result.overrides).map(([k, v]) => (
                              <Chip key={k}>{k.replace(/_/g, ' ')}: {typeof v === 'number' ? v : String(v)}</Chip>
                            ))}
                          </OverrideChips>
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