const express = require('express');
const router = express.Router();
const axios = require('axios');
const { query } = require('../config/database');

const FASTAPI = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// ── Reusable helper ──────────────────────────────────────────────
const authHeader = () => ({
  headers: { 'Content-Type': 'application/json' }
});

// GET /api/predictions/health
router.get('/health', async (req, res) => {
  try {
    const { data } = await axios.get(`${FASTAPI}/health`, { timeout: 5000 });
    res.json({ pipeline: 'connected', fastapi: data });
  } catch (err) {
    console.error('Pipeline health check failed:', err.message);  // ← ADD THIS
    res.status(503).json({ pipeline: 'disconnected' });
  }
});

// GET /api/predictions/pipeline-logs
router.get('/pipeline-logs', async (req, res) => {
  try {
    const { data } = await axios.get(`${FASTAPI}/pipeline-logs`, { timeout: 8000 });
    res.json(data);
  } catch (err) {
    res.json({
      logs: [],
      health: {
        last_ran: null,
        running: false,
        last_error: 'Pipeline server not reachable'
      }
    });
  }
});

// GET /api/predictions/flights?date=2026-03-07
router.get('/flights', async (req, res) => {
  try {
    const { data } = await axios.get(`${FASTAPI}/flights`, {
      params: req.query,
      timeout: 10000,
    });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 502;
    res.status(status).json({ error: err.response?.data?.detail || 'Pipeline unavailable' });
  }
});

// GET /api/predictions/weather
router.get('/weather', async (req, res) => {
  try {
    const { data } = await axios.get(`${FASTAPI}/weather/current`, { timeout: 8000 });
    const enriched = {
      ...data,
      timestamp: new Date().toISOString(),
      data_hour: data.timestamp,
    };
    res.json(enriched);
  } catch (err) {
    const status = err.response?.status || 502;
    res.status(status).json({ error: err.response?.data?.detail || 'Weather unavailable' });
  }
});

// POST /api/predictions/predict
// Body: { number_raw: "LH 638", sched_utc: "2026-03-07T10:00:00+00:00" }
router.post('/predict', async (req, res) => {
  const { number_raw, sched_utc } = req.body;
  if (!number_raw || !sched_utc) {
    return res.status(400).json({ error: 'number_raw and sched_utc are required' });
  }
  try {
    const { data } = await axios.post(
      `${FASTAPI}/predict/from-db`,
      { number_raw, sched_utc },
      { timeout: 15000 }
    );
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 502;
    res.status(status).json({ error: err.response?.data?.detail || 'Prediction failed' });
  }
});

/**
 * ADD to backend/routes/predictions.js
 * ─────────────────────────────────────
 * Paste this block after the existing router.post('/predict', ...) route.
 * No other changes to predictions.js needed.
 */

// GET /api/predictions/propagation?number_raw=...&sched_utc=...
router.get('/propagation', async (req, res) => {
  try {
    const { data } = await axios.get(`${FASTAPI}/flights/propagation`, {
      params: req.query,
      timeout: 10000,
    });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 502;
    res.status(status).json({ error: err.response?.data?.detail || 'Propagation lookup failed' });
  }
});

router.post('/simulate', async (req, res) => {
  try {
    const { data } = await axios.post(
      `${FASTAPI}/simulate`,
      req.body,
      { timeout: 20000 }
    );
    res.json(data);
  } catch (err) {
    const status  = err.response?.status  || 502;
    const detail  = err.response?.data?.detail || 'Simulation failed';

    // Pass the FLIGHT_LANDED sentinel through cleanly
    if (detail === 'FLIGHT_LANDED') {
      return res.status(409).json({ error: 'FLIGHT_LANDED' });
    }
    if (status === 404) {
      return res.status(404).json({ error: 'Flight not found in pipeline' });
    }
    res.status(status).json({ error: detail });
  }
});

// POST /api/predictions/trend-snapshot
router.post('/trend-snapshot', async (req, res) => {
  try {
    const { total_flights, delayed_flights, avg_delay_min } = req.body;

    if (total_flights == null || delayed_flights == null) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const now = new Date();
    const snapshotHour = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours())
    );
    const dateOnly = snapshotHour.toISOString().split('T')[0];

    await query(
      `INSERT INTO delay_trend_history
         (snapshot_hour, total_flights, delayed_flights, avg_delay_min, date, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (snapshot_hour) DO UPDATE
         SET total_flights = EXCLUDED.total_flights,
             delayed_flights = EXCLUDED.delayed_flights,
             avg_delay_min = EXCLUDED.avg_delay_min,
             updated_at = NOW()`,
      [snapshotHour, total_flights, delayed_flights, avg_delay_min || 0, dateOnly]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Trend snapshot error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/predictions/trend-history?days=7
router.get('/trend-history', async (req, res) => {
  try {
    const parsedDays = parseInt(req.query.days || '7', 10);
    const days = Number.isNaN(parsedDays) ? 7 : Math.min(parsedDays, 30);

    const result = await query(
      `SELECT
         snapshot_hour,
         total_flights,
         delayed_flights,
         avg_delay_min,
         date,
         ROUND(
           CASE WHEN total_flights > 0
             THEN (delayed_flights::float / total_flights) * 100
             ELSE 0
           END
         , 1) AS delay_rate
       FROM delay_trend_history
       WHERE snapshot_hour >= NOW() - ($1::int * INTERVAL '1 day')
       ORDER BY snapshot_hour ASC`,
      [days]
    );

    res.json({ success: true, history: result.rows });
  } catch (err) {
    console.error('Trend history error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
