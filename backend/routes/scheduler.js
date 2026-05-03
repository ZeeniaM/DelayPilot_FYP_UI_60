const express = require("express");
const axios   = require("axios");
const router  = express.Router();

const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

const { verifyToken } = require("../middleware/auth");

function requireAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({ error: "Admin access required." });
    }
    next();
  });
}

/* GET /api/scheduler/status — no admin required, any logged-in user */
router.get("/status", verifyToken, async (req, res) => {
  try {
    const response = await axios.get(
      `${FASTAPI_URL}/scheduler/status`,
      { timeout: 5000 }
    );
    res.json(response.data);
  } catch (err) {
    res.status(503).json({
      enabled: true,
      seconds_remaining: null,
      interval_minutes: 30,
      last_ran: null,
      running: false,
      error: "Pipeline server not reachable.",
    });
  }
});

/* POST /api/scheduler/enable */
router.post("/enable", requireAdmin, async (req, res) => {
  try {
    const response = await axios.post(
      `${FASTAPI_URL}/scheduler/enable`,
      {},
      { timeout: 5000 }
    );
    res.json(response.data);
  } catch (err) {
    const detail = err.response?.data?.detail || err.message;
    res.status(err.response?.status || 500).json({ error: detail });
  }
});

/* POST /api/scheduler/disable */
router.post("/disable", requireAdmin, async (req, res) => {
  try {
    const response = await axios.post(
      `${FASTAPI_URL}/scheduler/disable`,
      {},
      { timeout: 5000 }
    );
    res.json(response.data);
  } catch (err) {
    const detail = err.response?.data?.detail || err.message;
    res.status(err.response?.status || 500).json({ error: detail });
  }
});

module.exports = router;
