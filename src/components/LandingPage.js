/**
 * LandingPage.js
 * ─────────────────────────────────────────────────────────────────
 * Public-facing landing page for DelayPilot.
 * Two entry points:
 *   1. Passenger flight lookup — uses /predictions/flights (dropdown)
 *      and /predictions/predict (model output) via authless axios.
 *   2. "Operator Login" button → calls onGoToLogin()
 *
 * Prediction call chain (no auth required, public endpoint):
 *   fetchFlights()  → GET /predictions/flights  → populates dropdown
 *   lookupFlight()  → POST /predictions/predict → p_delay_15, op_status,
 *                     sched_utc, etd_utc/atd_utc, ml_cause
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

// ── helpers ───────────────────────────────────────────────────────
const api = () => axios.create({ baseURL: API_BASE_URL });

const AIRLINE_NAMES = {
  LH:'Lufthansa', AF:'Air France', BA:'British Airways', KL:'KLM',
  EW:'Eurowings', OS:'Austrian Airlines', LX:'Swiss', SN:'Brussels Airlines',
  FR:'Ryanair', U2:'easyJet', VY:'Vueling', IB:'Iberia', AZ:'ITA Airways',
  TK:'Turkish Airlines', EK:'Emirates', QR:'Qatar Airways', AA:'American Airlines',
  DL:'Delta', UA:'United Airlines', EN:'Air Dolomiti', CX:'Cathay Pacific',
  SK:'SAS', AY:'Finnair', TP:'TAP Portugal', ET:'Ethiopian Airlines',
};

const airlineName = (iata) => {
  if (!iata) return '';
  return AIRLINE_NAMES[iata.trim().toUpperCase()] || iata.trim().toUpperCase();
};

const fmt = (utcStr) => {
  if (!utcStr || utcStr === 'None' || utcStr === 'null') return null;
  try {
    return new Date(utcStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return null; }
};

const causeLabel = (cause) => {
  if (!cause) return null;
  const map = {
    Weather: 'Adverse weather conditions',
    Congestion: 'Airport / airspace congestion',
    Reactionary: 'Previous flight delay (reactionary)',
    Technical: 'Technical / maintenance issue',
    Other: 'Operational factors',
  };
  return map[cause] || cause;
};

// ── Design tokens — matches DelayPilot app palette ───────────────
// primary: #1A4B8F  (nav, headings, accents)
// green:   #00A86B / #00C896 (CTA buttons — same as login button)
// bg:      #ffffff / #f5f8ff (page, cards)
// text:    #333333 / #666666

const S = {
  page: {
    minHeight: '100vh',
    background: '#f5f8ff',
    color: '#333333',
    fontFamily: "'Outfit', 'Segoe UI', sans-serif",
    overflowX: 'hidden',
  },
  // ── nav ───────────────────────────────────────────────────────
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 48px', height: 64,
    background: '#ffffff',
    boxShadow: '0 1px 0 #e1e8f5',
  },
  navLogo: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 20, fontWeight: 700, color: '#1A4B8F',
    letterSpacing: 1,
  },
  navBtn: {
    background: 'transparent',
    border: '1.5px solid #1A4B8F',
    color: '#1A4B8F', padding: '8px 22px',
    borderRadius: 6, cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14, fontWeight: 500,
    transition: 'all 0.2s',
    letterSpacing: 0.3,
  },
  // ── hero ──────────────────────────────────────────────────────
  hero: {
    minHeight: '100vh',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    textAlign: 'center',
    padding: '120px 24px 80px',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(160deg, #1A4B8F 0%, #0f3a73 55%, #1A4B8F 100%)',
  },
  heroGrid: {
    position: 'absolute', inset: 0, zIndex: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
  },
  heroGlow: {
    position: 'absolute', top: '30%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600, height: 600,
    background: 'radial-gradient(circle, rgba(0,200,150,0.12) 0%, transparent 70%)',
    pointerEvents: 'none', zIndex: 0,
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 20, padding: '5px 14px',
    fontSize: 12, fontWeight: 500, color: '#ffffff',
    letterSpacing: 1, textTransform: 'uppercase',
    marginBottom: 24, zIndex: 1, position: 'relative',
  },
  heroTitle: {
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 'clamp(36px, 6vw, 72px)',
    fontWeight: 700, lineHeight: 1.1,
    color: '#ffffff',
    marginBottom: 12, zIndex: 1, position: 'relative',
    letterSpacing: '-0.5px',
  },
  heroAccent: { color: '#00C896' },
  heroSub: {
    fontSize: 'clamp(15px, 2vw, 18px)',
    color: 'rgba(255,255,255,0.7)', maxWidth: 560, lineHeight: 1.7,
    marginBottom: 40, zIndex: 1, position: 'relative',
  },
  heroActions: {
    display: 'flex', gap: 14, flexWrap: 'wrap',
    justifyContent: 'center', zIndex: 1, position: 'relative',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #00A86B 0%, #00C896 100%)',
    color: '#ffffff',
    border: 'none', padding: '13px 30px',
    borderRadius: 8, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', letterSpacing: 0.3,
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 4px 20px rgba(0,168,107,0.35)',
  },
  btnSecondary: {
    background: 'transparent',
    border: '1.5px solid rgba(255,255,255,0.4)',
    color: '#ffffff', padding: '13px 30px',
    borderRadius: 8, fontSize: 15, fontWeight: 500,
    cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
  },
  // ── stats bar ─────────────────────────────────────────────────
  statsBar: {
    display: 'flex', justifyContent: 'center', gap: 0,
    flexWrap: 'wrap',
    borderBottom: '1px solid #e1e8f5',
    background: '#ffffff',
  },
  stat: {
    flex: '1 1 180px', textAlign: 'center',
    padding: '28px 20px',
    borderRight: '1px solid #e1e8f5',
  },
  statNum: {
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 28, fontWeight: 700, color: '#1A4B8F',
    letterSpacing: 1,
  },
  statLabel: { fontSize: 12, color: '#666666', marginTop: 4, letterSpacing: 0.3 },
  // ── section ───────────────────────────────────────────────────
  section: { padding: '80px 24px', maxWidth: 1100, margin: '0 auto' },
  sectionLabel: {
    fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
    color: '#00A86B', fontWeight: 600, marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 700,
    color: '#1A4B8F', marginBottom: 16, lineHeight: 1.2,
  },
  sectionSub: { fontSize: 15, color: '#666666', maxWidth: 480, lineHeight: 1.7 },
  // ── steps ─────────────────────────────────────────────────────
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 24, marginTop: 48,
  },
  stepCard: {
    background: '#ffffff',
    border: '1px solid #e1e8f5',
    borderRadius: 12, padding: '28px 24px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: '0 2px 8px rgba(26,75,143,0.06)',
  },
  stepNum: {
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 36, fontWeight: 700, color: 'rgba(0,168,107,0.35)',
    lineHeight: 1, marginBottom: 12,
  },
  stepTitle: { fontSize: 15, fontWeight: 600, color: '#1A4B8F', marginBottom: 8 },
  stepDesc: { fontSize: 13, color: '#666666', lineHeight: 1.65 },
  // ── lookup tool ───────────────────────────────────────────────
  lookupSection: {
    background: '#EAF1FB',
    borderTop: '1px solid #d0dff0',
    borderBottom: '1px solid #d0dff0',
    padding: '80px 24px',
  },
  lookupInner: { maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 32, alignItems: 'flex-start' },
  lookupCard: {
    background: '#ffffff',
    border: '1px solid #d0dff0',
    borderRadius: 16, padding: '36px 32px',
    boxShadow: '0 4px 24px rgba(26,75,143,0.08)',
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, color: '#666666', fontWeight: 500, letterSpacing: 0.5, marginBottom: 7, display: 'block', textTransform: 'uppercase' },
  input: {
    width: '100%', background: '#f5f8ff',
    border: '1px solid #c8d8ee',
    borderRadius: 8, padding: '12px 14px',
    color: '#333333', fontSize: 14, outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Outfit', sans-serif",
    transition: 'border-color 0.2s',
  },
  select: {
    width: '100%', background: '#f5f8ff',
    border: '1px solid #c8d8ee',
    borderRadius: 8, padding: '12px 14px',
    color: '#333333', fontSize: 14, outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Outfit', sans-serif",
    cursor: 'pointer',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12,
    margin: '4px 0 16px', color: '#999999', fontSize: 12,
  },
  dividerLine: { flex: 1, height: 1, background: '#e1e8f5' },
  searchBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #00A86B 0%, #00C896 100%)',
    color: '#ffffff',
    border: 'none', borderRadius: 8, padding: '14px',
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
    letterSpacing: 0.3, transition: 'opacity 0.2s, transform 0.15s',
    fontFamily: "'Outfit', sans-serif",
    boxShadow: '0 4px 14px rgba(0,168,107,0.3)',
  },
  // ── result card ───────────────────────────────────────────────
  resultCard: {
    marginTop: 24,
    background: '#f5f8ff',
    border: '1px solid #d0dff0',
    borderRadius: 12, padding: '24px',
    animation: 'fadeIn 0.3s ease',
  },
  resultHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20, paddingBottom: 16,
    borderBottom: '1px solid #e1e8f5',
  },
  flightNum: {
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 22, fontWeight: 700, color: '#1A4B8F',
  },
  flightAirline: { fontSize: 13, color: '#666666', marginTop: 2 },
  statusPill: (status) => ({
    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    letterSpacing: 0.4,
    background: status === 'On Time' ? '#DCFCE7'
      : status === 'Landed'    ? '#EAF1FB'
      : status === 'Cancelled' ? '#FEE2E2'
      : status === 'Diverted'  ? '#FEF3C7'
      : status === 'EnRoute'   ? '#EAF1FB'
      : '#FEF3C7',
    color: status === 'On Time' ? '#166534'
      : status === 'Landed'    ? '#1A4B8F'
      : status === 'Cancelled' ? '#991B1B'
      : status === 'Diverted'  ? '#92400E'
      : status === 'EnRoute'   ? '#1A4B8F'
      : '#92400E',
    border: 'none',
  }),
  timeGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 14, marginBottom: 20,
  },
  timeBox: {
    background: '#ffffff',
    border: '1px solid #e1e8f5',
    borderRadius: 8, padding: '14px 16px',
  },
  timeBoxLabel: { fontSize: 11, color: '#999999', marginBottom: 5, letterSpacing: 0.5, textTransform: 'uppercase' },
  timeBoxValue: { fontSize: 18, fontWeight: 600, color: '#333333' },
  timeBoxSub: { fontSize: 11, color: '#999999', marginTop: 3 },
  probRow: {
    background: '#EAF1FB',
    border: '1px solid #c8d8ee',
    borderRadius: 10, padding: '16px 18px',
    marginBottom: 14,
  },
  probLabel: { fontSize: 11, color: '#666666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  probBar: {
    height: 6, borderRadius: 3,
    background: '#d0dff0',
    marginBottom: 6, overflow: 'hidden',
  },
  probFill: (pct) => ({
    height: '100%', borderRadius: 3,
    width: `${Math.round(pct)}%`,
    background: pct < 30 ? 'linear-gradient(90deg, #00A86B, #00C896)'
               : pct < 60 ? '#f39c12'
               : '#e74c3c',
    transition: 'width 0.8s ease',
  }),
  probValue: {
    fontSize: 26, fontWeight: 700,
    color: '#1A4B8F', fontFamily: "'Cinzel', Georgia, serif",
  },
  causeBox: {
    background: '#ffffff',
    border: '1px solid #e1e8f5',
    borderRadius: 8, padding: '12px 16px',
    fontSize: 13, color: '#666666',
  },
  causeVal: { color: '#1A4B8F', fontWeight: 600 },
  // ── footer ────────────────────────────────────────────────────
  footer: {
    borderTop: '1px solid #e1e8f5',
    padding: '32px 48px',
    background: '#ffffff',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 12,
  },
  footerLogo: {
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 15, fontWeight: 700, color: '#1A4B8F',
  },
  footerText: { fontSize: 12, color: '#999999' },
};

// ── inject Google Fonts once ──────────────────────────────────────
const injectFonts = () => {
  if (document.getElementById('dp-landing-fonts')) return;
  const link = document.createElement('link');
  link.id = 'dp-landing-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap';
  document.head.appendChild(link);
};

const injectKeyframes = () => {
  if (document.getElementById('dp-landing-kf')) return;
  const style = document.createElement('style');
  style.id = 'dp-landing-kf';
  style.textContent = `
    @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
    @keyframes pulse  { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
    .dp-nav-btn:hover { background: #111111 !important; color: #ffffff !important; border-color: #111111 !important; }
    .dp-primary-btn:hover { background: linear-gradient(135deg, rgb(219,140,56) 0%, rgb(232,191,76) 100%) !important; transform: translateY(-1px); box-shadow: 0 6px 28px rgba(219,140,56,0.4) !important; }
    .dp-secondary-btn:hover { background: #111111 !important; border-color: #111111 !important; color: #ffffff !important; }
    .dp-step-card:hover { border-color: #1A4B8F !important; box-shadow: 0 4px 20px rgba(26,75,143,0.12) !important; }
    .dp-input:focus { border-color: #1A4B8F !important; box-shadow: 0 0 0 3px rgba(26,75,143,0.1) !important; }
    @media (max-width: 860px) {
      .dp-lookup-inner { flex-direction: column !important; }
      .dp-operator-col { position: static !important; width: 100% !important; flex: 1 1 auto !important; }
    }
  `;
  document.head.appendChild(style);
};

// ── component ─────────────────────────────────────────────────────
const LandingPage = ({ onGoToLogin }) => {
  const [flights,     setFlights]     = useState([]);
  const [query,       setQuery]       = useState('');
  const [selectedF,   setSelectedF]   = useState('');
  const [result,      setResult]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const lookupRef = useRef(null);

  useEffect(() => {
    injectFonts();
    injectKeyframes();
    // Load flight list for dropdown (no auth needed — public endpoint)
    api().get('/predictions/flights').then(res => {
      if (res.data && Array.isArray(res.data)) {
        setFlights(res.data);
      }
    }).catch(() => {}); // silent — dropdown is optional
  }, []);

  // Filtered dropdown options based on typed query
  const filtered = query.length >= 2
    ? flights.filter(f =>
        f.number_raw?.toLowerCase().includes(query.toLowerCase()) ||
        (f.airline_iata && airlineName(f.airline_iata).toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 12)
    : [];

  const handleSelect = (f) => {
    setSelectedF(JSON.stringify({ number_raw: f.number_raw, sched_utc: f.sched_utc }));
    setQuery(`${f.number_raw}  ·  ${fmt(f.sched_utc) || ''}`);
    setFiltered_open(false);
  };

  const [filteredOpen, setFiltered_open] = useState(false);

  const handleSearch = async () => {
    const target = selectedF
      ? JSON.parse(selectedF)
      : (() => {
          // Try to match typed query against flight list
          const match = flights.find(f =>
            f.number_raw?.toLowerCase() === query.trim().toLowerCase()
          );
          return match ? { number_raw: match.number_raw, sched_utc: match.sched_utc } : null;
        })();

    if (!target) {
      setError('Please select a flight from the list or type an exact flight number.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data } = await api().post('/predictions/predict', {
        number_raw: target.number_raw,
        sched_utc:  target.sched_utc,
      });
      const matchedFlight = flights.find(f => f.number_raw === target.number_raw && f.sched_utc === target.sched_utc)
        || flights.find(f => f.number_raw === target.number_raw);
      setResult({
        ...data,
        number_raw: target.number_raw,
        sched_utc:  target.sched_utc,
        ml_cause:   data.ml_cause || matchedFlight?.ml_cause || null,
        _flight:    matchedFlight,
      });
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (err.response?.status === 404) {
        setError('Flight not found in the current window. Try a flight scheduled for today.');
      } else if (detail === 'FLIGHT_LANDED') {
        setResult({ _terminal: 'landed', number_raw: target.number_raw });
      } else {
        setError('Could not retrieve prediction. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const scrollToLookup = () => lookupRef.current?.scrollIntoView({ behavior: 'smooth' });

  // ── render ─────────────────────────────────────────────────────
  return (
    <div style={S.page}>

      {/* ── nav ── */}
      <nav style={S.nav}>
        <div style={S.navLogo}>
          <span style={{ fontSize: 22 }}>✈</span> DelayPilot
        </div>
        <button
          className="dp-nav-btn"
          style={S.navBtn}
          onClick={onGoToLogin}
        >
          Operator Login →
        </button>
      </nav>

      {/* ── hero ── */}
      <section style={S.hero}>
        <div style={S.heroGrid} />
        <div style={S.heroGlow} />
        <div style={S.badge}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#ffffff', animation: 'pulse 2s infinite' }} />
          Live Flight Intelligence · Munich Airport
        </div>
        <h1 style={S.heroTitle}>
          Know Before<br />
          <span style={S.heroAccent}>You Fly</span>
        </h1>
        <p style={S.heroSub}>
          DelayPilot uses machine learning trained on real MUC flight data to
          predict delays before they're announced — giving passengers
          and airport operators a critical edge.
        </p>
        <div style={S.heroActions}>
          <button className="dp-primary-btn" style={S.btnPrimary} onClick={scrollToLookup}>
            Check My Flight
          </button>
          <button className="dp-secondary-btn" style={S.btnSecondary} onClick={onGoToLogin}>
            Operator Portal
          </button>
        </div>
      </section>

      {/* ── stats bar ── */}
      <div style={S.statsBar}>
        {[
          { num: '492+', label: 'Flights Monitored Daily' },
          { num: '3',    label: 'Predictive ML Models' },
          { num: '30 min', label: 'Refresh Cycle' },
          { num: 'MUC',  label: 'Munich Airport (EDDM)' },
        ].map((s, i) => (
          <div key={i} style={{ ...S.stat, borderRight: i < 3 ? S.stat.borderRight : 'none' }}>
            <div style={S.statNum}>{s.num}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── how it works ── */}
      <div style={{ ...S.section, paddingBottom: 60 }}>
        <div style={S.sectionLabel}>How It Works</div>
        <h2 style={S.sectionTitle}>Powered by Real Flight Data</h2>
        <p style={S.sectionSub}>
          Our pipeline ingests live weather, FIDS schedules, and carrier
          status data every 30 minutes — feeding three trained CatBoost models.
        </p>
        <div style={S.stepsGrid}>
          {[
            { n: '01', title: 'Live Data Ingestion', desc: 'Weather from Open-Meteo, flight schedules from Aerodatabox FIDS, and carrier updates — all refreshed every 30 minutes.' },
            { n: '02', title: 'Feature Engineering', desc: 'Raw data is transformed into 40+ engineered features: weather codes, reactionary signals, congestion indices, and more.' },
            { n: '03', title: 'ML Prediction', desc: 'Three CatBoost models output delay probability (≥15 min, ≥30 min) and estimated delay magnitude for every flight.' },
            { n: '04', title: 'Operator Dashboard', desc: 'Airport staff see real-time delay risk, cause attribution, mitigation tools, and KPI reporting — all in one platform.' },
          ].map(s => (
            <div key={s.n} className="dp-step-card" style={S.stepCard}>
              <div style={S.stepNum}>{s.n}</div>
              <div style={S.stepTitle}>{s.title}</div>
              <div style={S.stepDesc}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── passenger lookup ── */}
      <div style={S.lookupSection} ref={lookupRef}>
        <div className="dp-lookup-inner" style={S.lookupInner}>

          {/* ── Left col: passenger lookup ── */}
          <div className="dp-left-col" style={{ flex: '1 1 0', minWidth: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={S.sectionLabel}>Passenger Tool</div>
            <h2 style={{ ...S.sectionTitle, textAlign: 'center' }}>Check Your Flight</h2>
            <p style={{ ...S.sectionSub, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
              Enter your flight number to get real-time status and delay probability
              from our prediction system.
            </p>
          </div>

          <div style={S.lookupCard}>
            {/* Type-ahead input */}
            <div style={S.inputGroup}>
              <label style={S.label}>FLIGHT NUMBER</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="dp-input"
                  style={S.input}
                  placeholder="e.g. LH100, LH 1234 …"
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setSelectedF('');
                    setFiltered_open(true);
                    setResult(null);
                    setError('');
                  }}
                  onFocus={() => setFiltered_open(true)}
                  onBlur={() => setTimeout(() => setFiltered_open(false), 150)}
                />
                {filteredOpen && filtered.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: '#ffffff', border: '1px solid #d0dff0',
                    borderRadius: 8, marginTop: 4, maxHeight: 240, overflowY: 'auto',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}>
                    {filtered.map((f, i) => (
                      <div
                        key={i}
                        onMouseDown={() => handleSelect(f)}
                        style={{
                          padding: '10px 14px', cursor: 'pointer',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#EAF1FB'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontWeight: 600, color: '#e8eaf0', fontSize: 14 }}>
                          {f.number_raw}
                        </span>
                        <span style={{ fontSize: 12, color: '#666666' }}>
                          {airlineName(f.airline_iata)} · {f.movement === 'departure' ? '↑ DEP' : '↓ ARR'} · {fmt(f.sched_utc)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* OR divider + select dropdown */}
            <div style={S.divider}>
              <div style={S.dividerLine} />
              <span>or pick from today's flights</span>
              <div style={S.dividerLine} />
            </div>

            <div style={{ ...S.inputGroup, marginBottom: 24 }}>
              <select
                style={S.select}
                value={selectedF}
                onChange={e => {
                  setSelectedF(e.target.value);
                  if (e.target.value) {
                    const f = JSON.parse(e.target.value);
                    const fl = flights.find(x => x.number_raw === f.number_raw && x.sched_utc === f.sched_utc);
                    setQuery(`${f.number_raw}  ·  ${fmt(f.sched_utc) || ''}`);
                  }
                  setResult(null); setError('');
                }}
              >
                <option value="">— Select a flight —</option>
                {flights.slice(0, 80).map((f, i) => (
                  <option key={i} value={JSON.stringify({ number_raw: f.number_raw, sched_utc: f.sched_utc })}>
                    {f.number_raw}  ·  {airlineName(f.airline_iata)}  ·  {f.movement === 'departure' ? '↑ DEP' : '↓ ARR'}  ·  {fmt(f.sched_utc)}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="dp-primary-btn" style={{ ...S.searchBtn, opacity: loading ? 0.7 : 1 }}
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? 'Checking…' : 'Check Delay Risk →'}
            </button>

            {error && (
              <div style={{ marginTop: 14, fontSize: 13, color: '#e74c3c', textAlign: 'center' }}>
                {error}
              </div>
            )}

            {/* ── result ── */}
            {result && (
              <div style={S.resultCard}>
                {/* Terminal states */}
                {result._terminal === 'landed' && (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🛬</div>
                    <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 18, color: '#6495ed', fontWeight: 700, marginBottom: 6 }}>
                      Flight Has Landed
                    </div>
                    <div style={{ fontSize: 13, color: '#666666' }}>
                      {result.number_raw} has already completed its journey.
                    </div>
                  </div>
                )}

                {result.op_status === 'Cancelled' && (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>❌</div>
                    <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 18, color: '#e74c3c', fontWeight: 700, marginBottom: 6 }}>
                      Flight Cancelled
                    </div>
                    <div style={{ fontSize: 13, color: '#666666' }}>
                      {result.number_raw} has been cancelled. Please contact your airline.
                    </div>
                  </div>
                )}

                {result.op_status === 'Diverted' && (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
                    <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 18, color: '#e67e22', fontWeight: 700, marginBottom: 6 }}>
                      Flight Diverted
                    </div>
                    <div style={{ fontSize: 13, color: '#666666' }}>
                      {result.number_raw} has been diverted. Please check with your airline.
                    </div>
                  </div>
                )}

                {/* Active flight result */}
                {!result._terminal && result.op_status !== 'Cancelled' && result.op_status !== 'Diverted' && (() => {
                  // ── Derive display tier from available real-time signals ──────────────
                  // Tier 1: confirmed_delay_min != null  → carrier has filed a real delay
                  // Tier 2: etd/eta available            → airline filed a revised time
                  // Tier 3: EnRoute with no revision     → airborne, no update yet
                  // Tier 4: Scheduled, no signals        → pre-departure, model only

                  const hasConfirmed  = result.confirmed_delay_min != null;
                  const confirmedMin  = hasConfirmed ? Math.round(result.confirmed_delay_min) : null;
                  const isEarly       = hasConfirmed && confirmedMin < 0;
                  const isOnTime      = hasConfirmed && confirmedMin >= 0 && confirmedMin < 5;
                  const isDelayedConf = hasConfirmed && confirmedMin >= 5;

                  // Best actual/revised time available (movement-aware priority)
                  const isDep    = result._flight?.movement === 'departure';
                  const actualTime   = isDep
                    ? (result.atd_utc || result.etd_utc)   // departure: ATD first, then ETD
                    : (result.ata_utc || result.eta_utc);  // arrival:   ATA first, then ETA
                  const hasActual    = !!actualTime;
                  const isActualTime = isDep ? !!result.atd_utc : !!result.ata_utc;

                  // Diff between actual/revised and scheduled (minutes)
                  const timeDiffMin = hasActual
                    ? Math.round((new Date(actualTime) - new Date(result.sched_utc)) / 60000)
                    : null;

                  // Whether a real-time signal (confirmed OR revised time) exists
                  const hasLiveSignal = hasConfirmed || hasActual;

                  // Probability interpretation context
                  const isEnRoute    = result.op_status === 'EnRoute';
                  const isScheduled  = !isEnRoute;

                  // ── Model output — always computed, always shown ───────────────────────
                  // The ML model runs on every click regardless of carrier status.
                  // We always display its output but frame it differently depending
                  // on whether confirmed carrier data also exists.
                  //
                  //  hasConfirmed = true  → model shown BELOW confirmed banner,
                  //                         labelled "ML Model Prediction" so it's
                  //                         clear it's a separate signal that agrees
                  //                         or disagrees with the carrier.
                  //  hasConfirmed = false → model is the primary signal, labelled
                  //                         as pre-departure / in-flight estimate.

                  const probPct      = Math.round(result.p_delay_15 * 100);
                  const riskLabel    = probPct < 25 ? 'Low risk' : probPct < 50 ? 'Moderate risk' : 'High risk';
                  const modelPredicts = result.pred_delay_15 === 1;  // binary classifier output
                  const minutesUi    = result.minutes_ui ? Math.round(result.minutes_ui) : null;

                  // Colour of prob bar
                  const barColor = probPct < 25
                    ? 'linear-gradient(90deg, #00A86B, #00C896)'
                    : probPct < 50 ? '#f39c12' : '#e74c3c';

                  // Context line under bar — changes meaning based on available data
                  const riskContext = hasConfirmed
                    ? isDelayedConf
                      ? `Model independently predicted a delay for this flight — consistent with the carrier's confirmed status.`
                      : isOnTime
                        ? `Model assessed ${probPct}% delay probability — carrier currently reports on time.`
                        : `Model assessed ${probPct}% delay probability — no delay confirmed by carrier yet.`
                    : isEnRoute
                      ? 'In-flight estimate based on weather, route congestion and reactionary signals.'
                      : 'Pre-departure estimate — based on weather, congestion and historical patterns. Not a confirmed delay.';

                  // Section header label
                  const probSectionLabel = hasConfirmed
                    ? 'ML MODEL PREDICTION'
                    : isEnRoute
                      ? 'IN-FLIGHT DELAY RISK'
                      : 'PRE-DEPARTURE DELAY ESTIMATE';

                  return (
                    <>
                      {/* Header */}
                      <div style={S.resultHeader}>
                        <div>
                          <div style={S.flightNum}>{result.number_raw}</div>
                          <div style={S.flightAirline}>
                            {airlineName(result._flight?.airline_iata)} ·{' '}
                            {result._flight?.movement === 'departure' ? 'Departure' : 'Arrival'}
                          </div>
                        </div>
                        <div style={S.statusPill(result.op_status)}>
                          {result.op_status === 'EnRoute' ? 'En Route' : (result.op_status || 'Scheduled')}
                        </div>
                      </div>

                      {/* ── Times grid ── */}
                      <div style={S.timeGrid}>
                        {/* Scheduled time — always shown */}
                        <div style={S.timeBox}>
                          <div style={S.timeBoxLabel}>SCHEDULED</div>
                          <div style={S.timeBoxValue}>{fmt(result.sched_utc) || '—'}</div>
                          <div style={S.timeBoxSub}>Local time</div>
                        </div>

                        {/* Actual / Revised time — only shown when API has data */}
                        {hasActual ? (
                          <div style={S.timeBox}>
                            <div style={S.timeBoxLabel}>
                              {isActualTime ? 'ACTUAL' : 'REVISED'}
                            </div>
                            <div style={{
                              ...S.timeBoxValue,
                              color: timeDiffMin >= 5 ? '#f39c12' : timeDiffMin < 0 ? '#00A86B' : '#333333',
                            }}>
                              {fmt(actualTime)}
                              {timeDiffMin >= 5 && (
                                <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 6, color: '#f39c12' }}>
                                  +{timeDiffMin}m
                                </span>
                              )}
                              {timeDiffMin < 0 && (
                                <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 6, color: '#00A86B' }}>
                                  {timeDiffMin}m
                                </span>
                              )}
                            </div>
                            <div style={S.timeBoxSub}>
                              {isActualTime ? 'Confirmed by carrier' : 'Revised estimate'}
                            </div>
                          </div>
                        ) : (
                          /* No revised time filed — show status context instead */
                          <div style={{ ...S.timeBox, background: '#f5f8ff', border: '1px solid #e1e8f5' }}>
                            <div style={S.timeBoxLabel}>STATUS</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A4B8F', marginTop: 4 }}>
                              {isEnRoute ? '✈ Airborne' : '🕐 On Schedule'}
                            </div>
                            <div style={S.timeBoxSub}>
                              {isEnRoute
                                ? 'No revised arrival filed yet'
                                : 'No delay filed by carrier'}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── Confirmed delay / early / on-time banner ── */}
                      {hasConfirmed && (
                        <div style={{
                          marginBottom: 14,
                          background: isEarly ? '#DCFCE7' : isOnTime ? '#f0faf5' : '#FEF3C7',
                          border: `1px solid ${isEarly ? '#00A86B' : isOnTime ? '#00C896' : '#f39c12'}`,
                          borderRadius: 8, padding: '11px 14px',
                          display: 'flex', alignItems: 'center', gap: 8,
                          fontSize: 13,
                          color: isEarly ? '#166534' : isOnTime ? '#166534' : '#92400E',
                        }}>
                          <span style={{ fontSize: 16 }}>
                            {isEarly ? '🟢' : isOnTime ? '✅' : '⚠️'}
                          </span>
                          <div>
                            <strong>
                              {isEarly
                                ? `Arriving ${Math.abs(confirmedMin)} min early`
                                : isOnTime
                                  ? 'Running on time'
                                  : `Carrier confirmed +${confirmedMin} min delay`}
                            </strong>
                            <div style={{ fontSize: 11, marginTop: 2, opacity: 0.75 }}>
                              {isEarly || isOnTime
                                ? 'Based on carrier status data'
                                : 'Filed by airline — check your carrier app for updates'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── ML Model prediction — always shown ── */}
                      <div style={{
                        ...S.probRow,
                        // Tint border green when model agrees with confirmed on-time,
                        // amber when model flags risk, blue-grey when confirmed overrides
                        border: hasConfirmed && isOnTime && !modelPredicts
                          ? '1px solid #c8eedd'
                          : hasConfirmed && isDelayedConf && modelPredicts
                            ? '1px solid #f0c070'
                            : '1px solid #c8d8ee',
                      }}>
                        {/* Header row: label + binary verdict chip */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={S.probLabel}>{probSectionLabel}</div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                            padding: '2px 8px', borderRadius: 10,
                            background: modelPredicts ? '#FEF3C7' : '#DCFCE7',
                            color:      modelPredicts ? '#92400E'  : '#166534',
                          }}>
                            {modelPredicts ? '⚠ DELAY LIKELY' : '✓ ON TIME'}
                          </span>
                        </div>

                        {/* Probability + risk label */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={S.probValue}>{probPct}%</span>
                          <span style={{ fontSize: 12, color: '#666666' }}>{riskLabel}</span>
                        </div>

                        {/* Probability bar */}
                        <div style={S.probBar}>
                          <div style={{ ...S.probFill(probPct), background: barColor }} />
                        </div>

                        {/* Estimated delay magnitude — always shown, wording varies */}
                        {minutesUi != null && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            marginTop: 8, marginBottom: 4,
                            fontSize: 12,
                            color: minutesUi >= 30 ? '#991B1B' : minutesUi >= 5 ? '#92400E' : '#166534',
                            background: minutesUi >= 30 ? '#FEE2E2' : minutesUi >= 5 ? '#FEF9EE' : '#DCFCE7',
                            borderRadius: 6, padding: '5px 10px',
                            border: `1px solid ${minutesUi >= 30 ? '#fca5a5' : minutesUi >= 5 ? '#f5dfa0' : '#86efac'}`,
                          }}>
                            <span>⏱</span>
                            <span>
                              {minutesUi === 0
                                ? <><strong>No delay expected</strong> — model estimates on-time departure/arrival</>
                                : <>Model estimates approx. <strong>+{minutesUi} min</strong> delay</>
                              }
                            </span>
                          </div>
                        )}

                        {/* Context footnote */}
                        <div style={{ fontSize: 11, color: '#888888', marginTop: 6, lineHeight: 1.5 }}>
                          {riskContext}
                        </div>
                      </div>

                      {/* ── Likely cause (only when delay is likely or confirmed) ── */}
                      {causeLabel(result.ml_cause) && (isDelayedConf || modelPredicts || probPct >= 25) && (
                        <div style={S.causeBox}>
                          <span style={{ marginRight: 8, color: '#999' }}>Likely cause:</span>
                          <span style={S.causeVal}>{causeLabel(result.ml_cause)}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
          </div>{/* end left col */}

          {/* ── Right col: operator access panel ── */}
          <div className="dp-operator-col" style={{
            flex: '0 0 300px', width: 300,
            position: 'sticky', top: 88, flexShrink: 0,
            background: 'linear-gradient(160deg, #1A4B8F 0%, #0f3a73 100%)',
            borderRadius: 16, padding: '36px 28px',
            boxShadow: '0 8px 32px rgba(26,75,143,0.18)',
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            {/* Decorative grid overlay */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 16, overflow: 'hidden',
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '28px 28px', pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#00C896', fontWeight: 700, marginBottom: 10 }}>
                For Airport Operators
              </div>
              <h3 style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#ffffff', lineHeight: 1.25, margin: '0 0 14px' }}>
                Full Operational Intelligence
              </h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0 }}>
                Access live KPIs, delay cause attribution, simulation tools,
                and mitigation boards — designed for MUC operational staff.
              </p>
            </div>

            {/* Feature bullets */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '📊', label: 'Live KPI Dashboard' },
                { icon: '✈',  label: 'Full Flight Monitor' },
                { icon: '🔬', label: 'Delay Simulation' },
                { icon: '🛡',  label: 'Mitigation Board' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  <span style={{ fontSize: 15, width: 22, textAlign: 'center' }}>{f.icon}</span>
                  {f.label}
                </div>
              ))}
            </div>

            <button
              className="dp-primary-btn"
              style={{ ...{ background: 'linear-gradient(135deg, #00A86B 0%, #00C896 100%)', color: '#ffffff', border: 'none', borderRadius: 8, padding: '13px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.3, boxShadow: '0 4px 16px rgba(0,168,107,0.35)', position: 'relative', width: '100%', fontFamily: "'Outfit', sans-serif" } }}
              onClick={onGoToLogin}
            >
              Access Operator Dashboard →
            </button>
          </div>{/* end right col */}

        </div>
      </div>

      {/* ── footer ── */}
      <footer style={S.footer}>
        <div style={S.footerLogo}>✈ DelayPilot</div>
        <div style={S.footerText}>Munich Airport · Flight Delay Prediction System</div>
        <div style={S.footerText}>FYP 2025 · All data is live and model-generated</div>
      </footer>

    </div>
  );
};

export default LandingPage;