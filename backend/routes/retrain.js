/**
 * backend/routes/retrain.js
 * ─────────────────────────────────────────────────────────────
 * Admin-only routes for model retraining.
 * All routes require a valid JWT with role = 'Admin'.
 *
 * Routes:
 *   GET  /api/admin/retrain/model-info        current model metrics
 *   POST /api/admin/retrain/start             trigger a retrain job
 *   GET  /api/admin/retrain/status/:jobId     poll job progress
 *   POST /api/admin/retrain/ansperf-upload    upload ANSPerf CSV
 */

const express = require("express");
const axios   = require("axios");
const router  = express.Router();
const { query } = require("../config/database");

const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

/* ── Auth helpers (reuse existing middleware pattern) ────────────────────── */

/**
 * Inline admin guard — reuses the same verifyToken + role check
 * pattern already used throughout the Express backend.
 * Replace verifyToken with the actual import path used in this project.
 */
const { verifyToken } = require("../middleware/auth");

function requireAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({ error: "Admin access required." });
    }
    next();
  });
}

/* ── GET /api/admin/retrain/model-info ───────────────────────────────────── */

router.get("/model-info", requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT version_tag, trained_at, data_date_from, data_date_to,
              auc15_test, prauc15_test, auc30_test, prauc30_test,
              mae_reg_test, threshold_bin15, threshold_bin30,
              artifact_dir, notes
         FROM model_versions
        WHERE is_current = TRUE
        LIMIT 1`
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No current model found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("[retrain/model-info]", err.message);
    res.status(500).json({ error: "Failed to fetch model info." });
  }
});

/* ── POST /api/admin/retrain/start ───────────────────────────────────────── */

router.post("/start", requireAdmin, async (req, res) => {
  try {
    const triggeredBy = req.user?.username || req.user?.email || "admin";
    const response = await axios.post(
      `${FASTAPI_URL}/retrain/start`,
      { triggered_by: triggeredBy },
      { timeout: 10000 }
    );
    res.json(response.data);
  } catch (err) {
    const detail =
      err.response?.data?.detail || err.message || "Failed to start retrain.";
    console.error("[retrain/start]", detail);
    res.status(err.response?.status || 500).json({ error: detail });
  }
});

/* ── GET /api/admin/retrain/status/:jobId ────────────────────────────────── */

router.get("/status/:jobId", requireAdmin, async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!/^\d+$/.test(jobId)) {
      return res.status(400).json({ error: "Invalid jobId." });
    }
    const response = await axios.get(
      `${FASTAPI_URL}/retrain/status/${jobId}`,
      { timeout: 8000 }
    );
    res.json(response.data);
  } catch (err) {
    const detail =
      err.response?.data?.detail || err.message || "Failed to fetch status.";
    console.error("[retrain/status]", detail);
    res.status(err.response?.status || 500).json({ error: detail });
  }
});

/* ── GET /api/admin/retrain/history ──────────────────────────────────────── */

router.get("/history", requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, triggered_by, triggered_at, finished_at,
              status, outcome, error_message,
              backfill_start, backfill_end, api_calls_made,
              new_auc15, new_prauc15, new_auc30, new_prauc30, new_mae_reg
         FROM retrain_jobs
        ORDER BY triggered_at DESC
        LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[retrain/history]", err.message);
    res.status(500).json({ error: "Failed to fetch retrain history." });
  }
});

/* ── POST /api/admin/retrain/cancel/:jobId ──────────────────────────────── */

router.post("/cancel/:jobId", requireAdmin, async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!/^\d+$/.test(jobId)) {
      return res.status(400).json({ error: "Invalid jobId." });
    }

    /* Mark the job as cancelled in the DB directly.
       The background thread will detect this on its next
       DB update and stop naturally, or the server restart
       will clean it up. */
    const result = await query(
      `UPDATE retrain_jobs
          SET status      = 'failed',
              outcome     = 'cancelled',
              error_message = 'Cancelled by admin.',
              finished_at = NOW()
        WHERE id = $1
          AND status IN ('running', 'queued')
        RETURNING id`,
      [jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Job not found or already completed.",
      });
    }

    res.json({ cancelled: true, job_id: parseInt(jobId) });
  } catch (err) {
    console.error("[retrain/cancel]", err.message);
    res.status(500).json({ error: "Failed to cancel job." });
  }
});

module.exports = router;
