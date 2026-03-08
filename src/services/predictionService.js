/**
 * predictionService.js
 * ─────────────────────────────────────────────────────────────────
 * React service layer — all calls to Express :5000/api/predictions/*
 * No component imports styles from here; this is pure data logic.
 * ─────────────────────────────────────────────────────────────────
 */

import axios from 'axios';
import API_BASE_URL from '../config/api';

// Axios instance with JWT header attached
const authAxios = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

// ── Airline IATA → full name lookup ─────────────────────────────
const AIRLINE_NAMES = {
  LH: 'Lufthansa',      AF: 'Air France',         BA: 'British Airways',
  KL: 'KLM',            EW: 'Eurowings',           OS: 'Austrian Airlines',
  LX: 'Swiss',          SN: 'Brussels Airlines',   FR: 'Ryanair',
  U2: 'easyJet',        VY: 'Vueling',             IB: 'Iberia',
  AZ: 'ITA Airways',    TK: 'Turkish Airlines',    EK: 'Emirates',
  QR: 'Qatar Airways',  ET: 'Ethiopian Airlines',  AA: 'American Airlines',
  DL: 'Delta',          UA: 'United Airlines',     EN: 'Air Dolomiti',
  CX: 'Cathay Pacific', SK: 'SAS',                 AY: 'Finnair',
  TP: 'TAP Portugal',   WX: 'CityJet',             AB: 'airberlin',
};

export const getAirlineName = (iata) => {
  if (!iata) return 'Unknown';
  const code = iata.trim().toUpperCase();
  return AIRLINE_NAMES[code] || code;
};

// ── ICAO → short airport label ───────────────────────────────────
const AIRPORT_LABELS = {
  EDDM: 'MUC', EDDF: 'FRA', EGLL: 'LHR', EHAM: 'AMS',
  LOWW: 'VIE', LSZH: 'ZRH', LEMD: 'MAD', LIRF: 'FCO',
  LFPG: 'CDG', EBBR: 'BRU', LPPT: 'LIS', EFHK: 'HEL',
  EKCH: 'CPH', ENGM: 'OSL', ESSA: 'ARN', EPWA: 'WAW',
};

export const getAirportLabel = (icao) => {
  if (!icao) return '—';
  return AIRPORT_LABELS[icao.trim().toUpperCase()] || icao;
};

// ── Format UTC timestamp → "HH:MM" local display ────────────────
export const formatTime = (utcStr) => {
  if (!utcStr || utcStr === 'None' || utcStr === 'null') return null;
  try {
    return new Date(utcStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return null;
  }
};

// ── deriveStatus ─────────────────────────────────────────────────────────
//
// THRESHOLD CONTRACT:
//
//  op_status        | Action
//  ─────────────────┼──────────────────────────────────────────────────
//  Landed           | → 'Landed'       (terminal, no delay shown)
//  Cancelled        | → 'Cancelled'
//  Diverted         | → 'Diverted'
//  EnRoute          | → apply confirmed thresholds (always have data)
//  Scheduled/Unknown| → fall through to delay logic
//
//  isConfirmed=true (Source A — Status API):
//    delayMin < 0   → 'Early'
//    0 – 4 min      → 'On Time'   (operational tolerance)
//    5 – 29 min     → 'Minor Delay'
//    ≥ 30 min       → 'Major Delay'
//
//  isConfirmed=false (Source B — FIDS label):
//    < 15 min       → 'On Time'   (model trained on ≥15 threshold)
//    15 – 29 min    → 'Minor Delay'
//    ≥ 30 min       → 'Major Delay'

const deriveStatus = (delayMin, isBin15, isBin30, opStatus = null, isConfirmed = false, delaySource = 'fids') => {

  if (opStatus) {
    switch (opStatus) {
      case 'Landed':    return 'Landed';
      case 'Cancelled': return 'Cancelled';
      case 'Diverted':  return 'Diverted';
      case 'EnRoute':
        // En-route always has confirmed data — use confirmed thresholds
        if (delayMin != null && delayMin >= 30) return 'Major Delay';
        if (delayMin != null && delayMin >= 5)  return 'Minor Delay';
        if (delayMin != null && delayMin < 0)   return 'Early';
        return 'En Route';
      case 'Scheduled':
      case 'Unknown':
      default:
        break;
    }
  }

  // Source A — confirmed from Flight Status API
  if (isConfirmed && delayMin != null) {
    if (delayMin >= 30) return 'Major Delay';
    if (delayMin >= 5)  return 'Minor Delay';
    if (delayMin < 0)   return 'Early';
    return 'On Time';
  }

  // Source: model tier — uses continuous predicted minutes (same 5-min threshold as confirmed)
  // because ml_minutes_ui is a precise regressor output, not a binary bin label
  if (delaySource === 'model') {
    if (delayMin >= 30) return 'Major Delay';
    if (delayMin >= 5)  return 'Minor Delay';
    if (delayMin < 0)   return 'Early';
    return 'On Time';
  }

  // Source: FIDS label fallback (≥15 min trained threshold — binary bins, not continuous)
  if (isBin30 || (delayMin != null && delayMin >= 30)) return 'Major Delay';
  if (isBin15 || (delayMin != null && delayMin >= 15)) return 'Minor Delay';
  return 'On Time';
};


// ── DASHBOARD STATUS BADGE HELPER (new export) ────────────────────
// Maps op_status to a badge color for the dashboard.
// Used in FlightsTable, FlightsPage, AlertsPanel.

export const getStatusBadge = (opStatus, mlStatus) => {
  const display = opStatus || mlStatus || 'Scheduled';
  switch (display) {
    case 'Landed':      return { label: 'Landed',      color: '#6b7280', bg: '#f3f4f6' };
    case 'Cancelled':   return { label: 'Cancelled',   color: '#991b1b', bg: '#fee2e2' };
    case 'Diverted':    return { label: 'Diverted',    color: '#92400e', bg: '#fef3c7' };
    case 'En Route':    return { label: 'En Route',    color: '#1e40af', bg: '#dbeafe' };
    case 'Major Delay': return { label: 'Major Delay', color: '#991b1b', bg: '#fee2e2' };
    case 'Minor Delay': return { label: 'Minor Delay', color: '#92400e', bg: '#fef3c7' };
    case 'On Time':     return { label: 'On Time',     color: '#166534', bg: '#dcfce7' };
    case 'Early':       return { label: 'Early',       color: '#166534', bg: '#dcfce7' };
    default:            return { label: 'Scheduled',   color: '#1e40af', bg: '#dbeafe' };
  }
};


// ── SIMULATION GUARD HELPER (new export) ─────────────────────────
// SimulationPage uses this to block the Run button before calling the API.
// Avoids a round-trip 409 for flights the UI already knows are done.

export const canSimulate = (flight) => {
  if (!flight) return false;
  const blocked = ['Landed', 'Cancelled', 'Diverted'];
  return !blocked.includes(flight.op_status);
};


// ── mapFlight — normalise one raw API row into a UI-ready object ─────────
//
// SOURCE CONSISTENCY RULE (fixes contradictory display):
//   actualTime and delayMin MUST always come from the same data source.
//   Mixing sources (e.g. Status API delay + FIDS actual time) causes:
//     - "sched == actual but delay shows" (Status says +10min, FIDS not updated yet)
//     - "sched != actual but On Time" (FIDS shows revised time, Status not called yet)
//
//   Source A — Flight Status API (confirmed_delay_min is not null):
//     delayMin  = confirmed_delay_min
//     actualUtc = ATD (dep) or ATA (arr) from Status API if present,
//                 else COMPUTED as sched_utc + confirmed_delay_min
//                 → always mathematically consistent with the delay shown
//
//   Source B — FIDS only (confirmed_delay_min is null):
//     delayMin  = y_delay_min  (computed from dep/arr_best_utc at ingest)
//     actualUtc = actual_utc   (dep/arr_best_utc from flights_raw)
//     → always consistent because both derive from the same best_utc column

const mapFlight = (f, idx) => {
  const flightNo = f.number_raw || `FL${idx}`;
  const schedUtc = f.sched_utc  || null;
  const movement = f.movement   || 'departure';

  // ── 3-tier delay source priority ─────────────────────────────────────────
  //
  //  Tier 1 — confirmed_delay_min (Flight Status API: ATD/ATA/ETD/ETA vs sched)
  //           Most authoritative. Real operational data from airline systems.
  //           actualTime: real ATD/ATA/ETD/ETA timestamp, or computed sched+delay.
  //
  //  Tier 2 — ml_minutes_ui (ML model: CatBoost bin15+bin30+reg2 prediction)
  //           Runs over all feature-engineered rows after each FIDS refresh.
  //           More meaningful than the raw FIDS label — the model has learned
  //           reactionary chains, congestion patterns, weather interactions.
  //           actualTime: computed as sched + ml_minutes_ui (consistent).
  //
  //  Tier 3 — delay_min / y_delay_min (FIDS label: dep/arr_best_utc vs sched)
  //           Raw difference. Only used when neither Status nor ML data available.
  //           actualTime: actual_utc from flights_raw (always consistent).
  //
  //  SOURCE CONSISTENCY RULE: actualTime and delayMin always come from the
  //  same tier. Never mix them across tiers.

  let delayMin, actualUtc, isConfirmed, delaySource;

  if (f.confirmed_delay_min != null) {
    // ── Tier 1: Flight Status API ──────────────────────────────────────────
    delayMin    = f.confirmed_delay_min;
    isConfirmed = true;
    delaySource = 'confirmed';

    const realActual = (movement === 'departure')
      ? (f.atd_utc || f.etd_utc)
      : (f.ata_utc || f.eta_utc);

    if (realActual) {
      actualUtc = realActual;
    } else if (schedUtc && delayMin != null) {
      const schedMs = new Date(schedUtc).getTime();
      actualUtc = new Date(schedMs + delayMin * 60 * 1000).toISOString();
    } else {
      actualUtc = null;
    }

  } else if (f.ml_minutes_ui != null) {
    // ── Tier 2: ML model prediction ───────────────────────────────────────
    delayMin    = f.ml_minutes_ui;
    isConfirmed = false;
    delaySource = 'model';

    // Compute actualTime from sched + ml_minutes_ui for consistency
    if (schedUtc && delayMin != null && delayMin > 0) {
      const schedMs = new Date(schedUtc).getTime();
      actualUtc = new Date(schedMs + delayMin * 60 * 1000).toISOString();
    } else {
      actualUtc = f.actual_utc || null;
    }

  } else {
    // ── Tier 3: FIDS label fallback ───────────────────────────────────────
    delayMin    = f.delay_min != null ? f.delay_min : null;
    actualUtc   = f.actual_utc || null;
    isConfirmed = false;
    delaySource = 'fids';
  }

  // Binary flags from the chosen delayMin — single source, no mixing
  const isDelayed15 = delayMin != null ? delayMin >= 15 : false;
  const isDelayed30 = delayMin != null ? delayMin >= 30 : false;

  const status = deriveStatus(delayMin, isDelayed15, isDelayed30, f.op_status, isConfirmed, delaySource);

  const airline = AIRLINE_NAMES[f.airline_iata] || f.airline_iata || 'Unknown';
  const dest    = AIRPORT_LABELS[f.destination]  || f.destination  || 'Unknown';
  const route   = movement === 'departure'
    ? `MUC → ${dest}`
    : `${dest} → MUC`;

  // ── Cause derivation ─────────────────────────────────────────────────────
  // Priority: ML model cause (server-side, has all features) → UI heuristic fallback
  const isActuallyDelayed = status === 'Minor Delay' || status === 'Major Delay';
  let likelyCause = null;
  if (isActuallyDelayed) {
    if (f.ml_cause) {
      // Tier 1: Use cause derived server-side from model outputs + pipeline features
      likelyCause = f.ml_cause;
    } else {
      // Tier 2: Heuristic fallback (when flight_predictions table not yet populated)
      const hasWeather = (f.wx_muc_weather_code > 50) || (f.wx_muc_precipitation > 0);
      if (hasWeather)       likelyCause = 'Weather';
      else if (isDelayed30) likelyCause = 'Reactionary';
      else                  likelyCause = 'Congestion';
    }
  }

  // predictedDelay: only show when there is a meaningful delay (>= 1 min)
  // Negative = early arrival, show as 0
  const predictedDelay = delayMin != null ? Math.max(0, Math.round(delayMin)) : 0;

  return {
    id:             idx + 1,
    flightNo,
    airline,
    airlineCode:    f.airline_iata || '',
    route,
    movement,
    scheduledTime:  formatTime(schedUtc),
    actualTime:     formatTime(actualUtc),
    sched_utc:      schedUtc,
    // Expose raw fields so KPICards/computeKPIs work correctly
    delay_min:      delayMin,
    is_delayed_15:  isDelayed15,
    is_delayed_30:  isDelayed30,
    predictedDelay,
    likelyCause,
    status,
    op_status:      f.op_status || 'Scheduled',
    isConfirmed,                           // true = delay from flight_status_live
    delaySource,                           // 'confirmed' | 'model' | 'fids'
    isLanded:         f.op_status === 'Landed',
    isCancelled:      f.op_status === 'Cancelled',
    isDiverted:       f.op_status === 'Diverted',
    confirmedDelay:   isConfirmed,
    etd_utc:          f.etd_utc || null,
    eta_utc:          f.eta_utc || null,
    // Raw ML model fields (for detail view / tooltip)
    ml_minutes_ui:    f.ml_minutes_ui    != null ? f.ml_minutes_ui    : null,
    ml_p_delay_15:    f.ml_p_delay_15    != null ? f.ml_p_delay_15    : null,
    ml_p_delay_30:    f.ml_p_delay_30    != null ? f.ml_p_delay_30    : null,
    ml_pred_delay_15: f.ml_pred_delay_15 != null ? f.ml_pred_delay_15 : null,
    ml_pred_delay_30: f.ml_pred_delay_30 != null ? f.ml_pred_delay_30 : null,
    ml_cause:         f.ml_cause         || null,
    // cause_scores: JSON string from flight_predictions → parse to {cause: pct} object
    // e.g. {"Weather (MUC)": 45, "Reactionary": 30, "ATC / Congestion": 15, ...}
    cause_scores: (() => {
      try { return f.cause_scores ? JSON.parse(f.cause_scores) : null; }
      catch { return null; }
    })(),
  };
};

// ── API calls ────────────────────────────────────────────────────

export const checkPipelineHealth = async () => {
  try {
    const { data } = await authAxios().get('/predictions/health');
    return data.pipeline === 'connected';
  } catch {
    return false;
  }
};

export const fetchFlights = async (date = null) => {
  const today = date || new Date().toISOString().split('T')[0];
  try {
    const { data } = await authAxios().get('/predictions/flights', {
      params: { date: today },
    });
    return data.map(mapFlight);
  } catch (err) {
    console.warn('[predictionService] fetchFlights failed:', err.message);
    return null;   // caller falls back to mock data
  }
};

export const fetchWeather = async () => {
  try {
    const { data } = await authAxios().get('/predictions/weather');
    return data;
  } catch (err) {
    console.warn('[predictionService] fetchWeather failed:', err.message);
    return null;
  }
};

export const predictFlight = async (number_raw, sched_utc) => {
  try {
    const { data } = await authAxios().post('/predictions/predict', {
      number_raw,
      sched_utc,
    });
    return data;   // { p_delay_15, p_delay_30, pred_delay_15, pred_delay_30, minutes_pred, minutes_ui }
  } catch (err) {
    if (err.response?.status === 404) return { _not_in_pipeline: true };
    console.warn('[predictionService] predictFlight failed:', err.message);
    return null;
  }
};

// ── KPI computation from flights array ──────────────────────────
export const computeKPIs = (flights) => {
  if (!flights || flights.length === 0) return null;
  const total      = flights.length;
  const delayed15  = flights.filter(f => f.is_delayed_15).length;
  const delayed30  = flights.filter(f => f.is_delayed_30).length;
  const onTime     = total - delayed15;
  const delayedArr = flights.filter(f => f.delay_min > 0);
  const avgDelay   = delayedArr.length
    ? delayedArr.reduce((s, f) => s + f.delay_min, 0) / delayedArr.length
    : 0;

  return {
    totalFlights:   total,
    onTimeCount:    onTime,
    onTimePct:      ((onTime / total) * 100).toFixed(1),
    delayed15Count: delayed15,
    delayed30Count: delayed30,
    avgDelayMin:    avgDelay.toFixed(1),
  };
};

/**
 * ADD to src/services/predictionService.js
 * ─────────────────────────────────────────
 * Paste this function at the bottom of the existing predictionService.js file.
 */

/**
 * Run a what-if simulation for a real flight.
 * Only pass the parameters you want to override — everything else
 * stays as the real pipeline data.
 *
 * @param {string} number_raw   - e.g. "LH 638"
 * @param {string} sched_utc   - ISO string from pipeline
 * @param {object} overrides   - any subset of:
 *   wind_speed_10m, wind_gusts_10m, precipitation, snowfall,
 *   visibility, weather_code,
 *   prev_delay_min_safe,
 *   muc_arr_1h, muc_dep_1h
 *
 * @returns {object|null}
 *   { flight, sched_utc, overrides, baseline, simulated, delta, reactionary_impact }
 *   or { _landed: true } if flight already landed
 *   or null on error
 */
export const simulateFlight = async (number_raw, sched_utc, overrides = {}) => {
  try {
    const { data } = await authAxios().post('/predictions/simulate', {
      number_raw,
      sched_utc,
      ...overrides,
    });
    return data;
  } catch (err) {
    if (err.response?.status === 409) return { _landed: true };
    if (err.response?.status === 404) return { _not_found: true };
    console.warn('[predictionService] simulateFlight failed:', err.message);
    return null;
  }
};