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
//  isConfirmed=false, source='fids':
//    < 0            → 'Early'       (actual_utc earlier than sched_utc)
//    0 – 14 min     → 'On Time'     (FIDS trained threshold is 15 min)
//    15 – 29 min    → 'Minor Delay'
//    ≥ 30 min       → 'Major Delay'
//
//  isConfirmed=false, source='model' (ML prediction, delayMin=ml_minutes_ui):
//    < 5 min        → 'On Time'     (model uncertainty tolerance)
//    5 – 29 min     → 'Minor Delay'
//    ≥ 30 min       → 'Major Delay'
//    (Early is not returned for model — model predicts delay, not early arrival)

const deriveStatus = (delayMin, isBin15, isBin30, opStatus = null, isConfirmed = false, source = 'fids') => {

  // Op-status overrides always win regardless of delay data
  if (opStatus) {
    switch (opStatus) {
      case 'Landed':    return 'Landed';
      case 'Cancelled': return 'Cancelled';
      case 'Diverted':  return 'Diverted';
      case 'EnRoute':
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

  // ── Tier 1: Status API confirmed ─────────────────────────────────
  // Tightest thresholds — 5 min tolerance (IATA operational standard)
  if (isConfirmed && delayMin != null) {
    if (delayMin >= 30) return 'Major Delay';
    if (delayMin >= 5)  return 'Minor Delay';
    if (delayMin < 0)   return 'Early';
    return 'On Time';
  }

  // ── Tier 2: FIDS observed time diff ──────────────────────────────
  // FIDS y_delay_min is computed from dep/arr_best_utc — same source as actual_utc.
  // 'Early' IS valid here: best_utc < sched_utc means actual/est is ahead of schedule.
  // Threshold: 15 min (matches the binary y_bin15 label the model was trained on).
  if (source === 'fids' && delayMin != null) {
    if (delayMin >= 30) return 'Major Delay';
    if (delayMin >= 5)  return 'Minor Delay';
    if (delayMin < 0)   return 'Early';
    return 'On Time';
  }

  // ── Tier 3: ML model prediction ──────────────────────────────────
  // ml_minutes_ui is a continuous regressor output — not an observed time.
  // No 'Early' here: the model predicts delay magnitude, not early arrival.
  // Threshold: 5 min (accounts for model uncertainty; small predictions unreliable).
  if (source === 'model' && delayMin != null) {
    if (delayMin >= 30) return 'Major Delay';
    if (delayMin >= 5)  return 'Minor Delay';
    return 'On Time';
  }

  // ── Tier 4: FIDS binary labels (y_bin15 / y_bin30) ───────────────
  // Last resort when we have classification labels but no numeric value.
  if (isBin30) return 'Major Delay';
  if (isBin15) return 'Minor Delay';
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

  const hasStatusData = f.confirmed_delay_min != null;

  let delayMin, actualUtc, isConfirmed, delayTier = 'fids';

  if (hasStatusData) {
    // ── Source A: Flight Status API ──────────────────────────────────────
    delayMin    = f.confirmed_delay_min;
    isConfirmed = true;

    // Use real ATD/ATA timestamps when available (most precise)
    const realActual = (movement === 'departure')
      ? (f.atd_utc || f.etd_utc)
      : (f.ata_utc || f.eta_utc);

    if (realActual) {
      actualUtc = realActual;
    } else if (schedUtc && delayMin != null) {
      // Derive: sched + confirmed_delay_min → always matches the delay shown
      const schedMs  = new Date(schedUtc).getTime();
      actualUtc = new Date(schedMs + delayMin * 60 * 1000).toISOString();
    } else {
      actualUtc = null;
    }

  } else {
    // ══ Tiers 2 → 4: No confirmed Status API data ════════════════════════
    //
    // PRIORITY (user-defined):
    //   2. FIDS observed time diff (y_delay_min / actual_utc from dep/arr_best_utc)
    //      Observed aircraft position data. Covers Early (negative delayMin),
    //      On Time (0–14 min), Minor/Major Delay (≥15 min).
    //      Used when |fidsDelay| is significant (< 0  OR  ≥ 15 min).
    //
    //   3. ML model prediction (ml_minutes_ui from flight_predictions batch run)
    //      Used when FIDS shows on-time (0–14 min or null) — model may detect
    //      a building delay (reactionary, congestion) before FIDS reflects it.
    //      Threshold: 5 min (model uncertainty tolerance).
    //
    //   4. FIDS binary labels (y_bin15 / y_bin30) — last resort, no numeric.
    //
    // actualUtc always from FIDS — never computed from ml_minutes_ui.

    const rawFidsDelay  = f.delay_min     != null ? parseFloat(f.delay_min)     : null;
    const rawMlMinutes  = f.ml_minutes_ui != null ? parseFloat(f.ml_minutes_ui) : null;

    actualUtc   = f.actual_utc || null;
    isConfirmed = false;

    if (rawFidsDelay != null && (rawFidsDelay < 0 || rawFidsDelay >= 5)) {
      // Tier 2: FIDS shows meaningful diff (delay ≥5 min OR early arrival)
      // Threshold now matches confirmed API (5 min) so observed delays show in table
      delayMin  = rawFidsDelay;
      delayTier = 'fids';
    } else if (rawMlMinutes != null && rawMlMinutes >= 5) {
      // Tier 3: FIDS on-time (0–4 min) but ML predicts real delay
      delayMin  = rawMlMinutes;
      delayTier = 'model';
    } else if (rawFidsDelay != null) {
      // Tier 2 fallback: tiny FIDS value (0–4 min) → On Time
      delayMin  = rawFidsDelay;
      delayTier = 'fids';
    } else if (rawMlMinutes != null) {
      // Tier 3 fallback: small ML value (< 5 min) → On Time via model
      delayMin  = rawMlMinutes;
      delayTier = 'model';
    } else {
      // Tier 4: no numeric value — use binary labels
      delayMin  = null;
      delayTier = 'fids';
    }
  }

  // Tier 4: binary FIDS labels — only when no numeric value available
  const onFidsBinTier = !hasStatusData && delayTier === 'fids' && delayMin == null;
  const fidsBin15 = onFidsBinTier ? (f.is_delayed_15 === true || f.is_delayed_15 === 1) : false;
  const fidsBin30 = onFidsBinTier ? (f.is_delayed_30 === true || f.is_delayed_30 === 1) : false;

  const status = deriveStatus(
    delayMin,
    fidsBin15,
    fidsBin30,
    f.op_status,
    isConfirmed,
    isConfirmed ? 'confirmed' : delayTier,
  );

  const airline = AIRLINE_NAMES[f.airline_iata] || f.airline_iata || 'Unknown';
  const dest    = AIRPORT_LABELS[f.destination]  || f.destination  || 'Unknown';
  const route   = movement === 'departure'
    ? `MUC → ${dest}`
    : `${dest} → MUC`;

  // Heuristic cause fallback — only used when ml_cause is absent
  // Signals: weather code > 50 (WMO: rain/snow/fog), precipitation > 0
  // Reactionary: delay ≥ 30 min without weather → likely cascade from prev. flight
  const isActuallyDelayed = status === 'Minor Delay' || status === 'Major Delay';
  let likelyCause = null;
  if (isActuallyDelayed) {
    const hasWeather = (f.wx_muc_weather_code > 50) || (f.wx_muc_precipitation > 0);
    const isBigDelay = delayMin != null && delayMin >= 30;
    if (hasWeather)    likelyCause = 'Weather';
    else if (isBigDelay) likelyCause = 'Reactionary';
    else               likelyCause = 'Congestion';
  }

  // Convenience booleans derived from the tier-selected delayMin
  const isDelayed15 = delayMin != null && delayMin >= 15;
  const isDelayed30 = delayMin != null && delayMin >= 30;

  // predictedDelay: only show when there is a meaningful delay (>= 1 min)
  // Negative = early arrival, show as 0
  const predictedDelay = delayMin != null ? Math.max(0, Math.round(delayMin)) : 0;

  // ── ML batch prediction fields (from flight_predictions JOIN in /flights) ──
  // NULL when this flight hasn't been through a prediction pipeline cycle yet.
  const ml_minutes_ui    = f.ml_minutes_ui    != null ? f.ml_minutes_ui    : null;
  const ml_p_delay_15    = f.ml_p_delay_15    != null ? f.ml_p_delay_15    : null;
  const ml_p_delay_30    = f.ml_p_delay_30    != null ? f.ml_p_delay_30    : null;
  const ml_pred_delay_15 = f.ml_pred_delay_15 != null ? f.ml_pred_delay_15 : null;
  const ml_pred_delay_30 = f.ml_pred_delay_30 != null ? f.ml_pred_delay_30 : null;
  const ml_cause         = f.ml_cause         || null;

  // Parse cause_scores JSON — stored as TEXT in the DB
  let cause_scores = null;
  if (f.cause_scores) {
    try { cause_scores = JSON.parse(f.cause_scores); } catch (_) {}
  }

  // delaySource — the exact tier that produced delayMin and status.
  // Determined during source selection above, not re-derived here.
  //   'confirmed' → Status API (confirmed_delay_min from flight_status_live)
  //   'fids'      → FIDS observed (y_delay_min / dep·arr_best_utc)
  //   'model'     → ML batch prediction (ml_minutes_ui from flight_predictions)
  const delaySource = isConfirmed ? 'confirmed' : delayTier;

  // Cause: prefer ML cause from batch predictions; fall back to heuristic
  const displayCause = ml_cause || (isActuallyDelayed ? likelyCause : null);

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
    // Tier-priority delay fields (used by KPIs, table, status)
    delay_min:      delayMin,
    is_delayed_15:  isDelayed15,
    is_delayed_30:  isDelayed30,
    predictedDelay,
    likelyCause:    displayCause,
    cause_scores,
    delaySource,
    status,
    op_status:      f.op_status || 'Scheduled',
    isConfirmed,
    isLanded:       f.op_status === 'Landed',
    isCancelled:    f.op_status === 'Cancelled',
    isDiverted:     f.op_status === 'Diverted',
    confirmedDelay: isConfirmed,
    etd_utc:        f.etd_utc || null,
    eta_utc:        f.eta_utc || null,
    // ML prediction fields — read directly by FlightsPage drawer
    ml_minutes_ui,
    ml_p_delay_15,
    ml_p_delay_30,
    ml_pred_delay_15,
    ml_pred_delay_30,
    ml_cause,
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
  // Values use the same `status` (deriveStatus output) and `delay_min`
  // (tier-priority: confirmed API → ML model → FIDS) as the flights table.
  if (!flights || flights.length === 0) return null;

  const total = flights.length;

  // Status classification — identical to table row logic
  const minorDelayed = flights.filter(f => f.status === 'Minor Delay');
  const majorDelayed = flights.filter(f => f.status === 'Major Delay');
  const allDelayed   = [...minorDelayed, ...majorDelayed];

  // Avg delay: mean delay_min over ALL delayed flights with a positive value.
  // delay_min is the tier-priority value (confirmed_delay_min when available,
  // else ML minutes_ui, else FIDS y_delay_min) — so confirmed API delays are included.
  const withDelay = allDelayed.filter(f => f.delay_min != null && f.delay_min > 0);
  const avgDelay  = withDelay.length
    ? withDelay.reduce((s, f) => s + f.delay_min, 0) / withDelay.length
    : 0;

  // On-Time Performance — IATA/CODA aviation standard:
  // OTP = flights departing/arriving within 15 min of schedule ÷ operable flights.
  // Cancelled and Diverted are excluded from both numerator and denominator
  // (they are not "operable" for OTP purposes).
  const cancelled    = flights.filter(f => f.isCancelled).length;
  const diverted     = flights.filter(f => f.isDiverted).length;
  const otpBase      = total - cancelled - diverted;
  const otpDelayed   = allDelayed.filter(f => !f.isCancelled && !f.isDiverted).length;
  const otpOnTime    = otpBase - otpDelayed;
  const otp          = otpBase > 0 ? (otpOnTime / otpBase) * 100 : 100;

  return {
    totalFlights:   total,
    onTimeCount:    otpOnTime,
    onTimePct:      otp.toFixed(1),       // IATA OTP: excludes cancelled/diverted
    delayed15Count: allDelayed.length,
    delayed30Count: majorDelayed.length,
    avgDelayMin:    avgDelay.toFixed(1),
    cancelledCount: cancelled,
    divertedCount:  diverted,
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

/**
 * Fetch propagation impact (connected flights) for a given flight.
 *
 * @param {string} number_raw - Flight number (e.g. "LH 638")
 * @param {string} sched_utc  - Scheduled UTC time from pipeline
 *
 * @returns {array} connected_flights array, or empty array on error
 */
export const fetchPropagation = async (number_raw, sched_utc) => {
  try {
    const response = await authAxios().get('/predictions/propagation', {
      params: { number_raw, sched_utc },
    });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.propagation)) return data.propagation;
    if (Array.isArray(data?.connected_flights)) return data.connected_flights;
    return [];
  } catch (err) {
    if (err.response?.status === 404) return [];
    console.warn('[predictionService] fetchPropagation failed (non-fatal):', err.message);
    return [];
  }
};
