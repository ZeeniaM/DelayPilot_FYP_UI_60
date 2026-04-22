const express = require('express');
const router = express.Router();
const axios = require('axios');

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
    res.json(data);
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

module.exports = router;