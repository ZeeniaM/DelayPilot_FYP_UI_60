import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import API_BASE from "../config/api";

/* ── Design tokens matching the app's existing style system ── */
const T = {
  primary:    "#1A4B8F",
  primaryLt:  "#EEF3FB",
  text:       "#1e2a3a",
  muted:      "#64748b",
  border:     "#e5e7eb",
  borderLt:   "#f1f3f4",
  white:      "#ffffff",
  green:      "#16a34a",
  greenBg:    "#dcfce7",
  red:        "#dc2626",
  redBg:      "#fee2e2",
  amber:      "#d97706",
  amberBg:    "#fef3c7",
  radius:     "10px",
  shadow:     "0 1px 3px rgba(0,0,0,0.08)",
};

/* ── Helpers ── */
const fmt = (v, d = 4) =>
  v !== null && v !== undefined ? Number(v).toFixed(d) : "—";

const fmtDate = (s) => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return "—"; }
};

const outcomeColor = (o) =>
  o === "promoted"          ? { bg: "#dcfce7", color: "#15803d" } :
  o === "partial_promotion" ? { bg: "#dbeafe", color: "#1d4ed8" } :
  o === "rejected"          ? { bg: "rgb(254, 226, 247)", color: "rgb(154, 21, 130)" } :
  o === "failed"            ? { bg: "#fee2e2", color: "#b91c1c" } :
  o === "running"           ? { bg: "#fef3c7", color: "#b45309" } :
  o === "queued"            ? { bg: "rgb(225, 254, 199)", color: "rgb(110, 130, 27)" } :
  o === "cancelled"         ? { bg: "#ede9fe", color: "rgb(84, 29, 173)" } :
                              { bg: T.borderLt, color: T.muted };

const Badge = ({ text }) => {
  const c = outcomeColor(text);
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px",
      borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color,
      textTransform: "capitalize",
    }}>
      {text || "—"}
    </span>
  );
};

/* ── Step progress bar ── */
const STEPS = [
  "determining_date_range",
  "quota_check",
  "preparing_ansperf",
  "fetching_weather",
  "pre_flight_verification",
  "fids_backfill",
  "fids_backfill_retry",
  "fids_backfill_complete",
  "weather_gap_fill",
  "building_union_dataset",
  "feature_engineering_stage1",
  "feature_engineering_stage2",
  "preparing_feature_matrix",
  "splitting_data",
  "preparing_catboost_matrices",
  "training_clf15",
  "training_clf30",
  "training_reg2",
  "threshold_tuning",
  "evaluating",
  "comparing_metrics",
  "promoting",
];

const StepBar = ({ currentStep, outcome }) => {
  const idx = STEPS.indexOf(currentStep);
  const done = outcome === "promoted" || outcome === "partial_promotion";
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        {STEPS.map((s, i) => {
          const isDone   = done || i < idx;
          const isActive = i === idx;
          const isFail   = (outcome === "failed" || outcome === "rejected") && i === idx;
          return (
            <div key={s} title={s.replace(/_/g, " ")} style={{
              flex: "1 0 12px", height: 6, borderRadius: 3,
              background: isFail   ? T.red :
                          isDone   ? T.green :
                          isActive ? T.primary : T.border,
              transition: "background 0.3s",
            }} />
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>
        {currentStep
          ? currentStep.replace(/_/g, " ")
          : done ? "Complete" : "Waiting to start"}
      </div>
    </div>
  );
};

/* ── Metric comparison row ── */
const MetricRow = ({ label, newVal, prodVal, higherIsBetter = true }) => {
  const hasNew  = newVal  !== null && newVal  !== undefined;
  const hasProd = prodVal !== null && prodVal !== undefined;
  const better  = hasNew && hasProd &&
    (higherIsBetter ? newVal >= prodVal : newVal <= prodVal);
  const color = (hasNew && hasProd) ? (better ? T.green : T.red) : T.text;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "center", padding: "7px 0",
      borderBottom: `1px solid ${T.borderLt}`,
    }}>
      <span style={{ fontSize: 13, color: T.muted }}>{label}</span>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {hasProd && (
          <span style={{ fontSize: 12, color: T.muted }}>
            prod: {fmt(prodVal)}
          </span>
        )}
        <span style={{ fontSize: 13, fontWeight: 700, color }}>
          {hasNew ? fmt(newVal) : "—"}
          {hasNew && hasProd && (
            <span style={{ marginLeft: 4, fontSize: 11 }}>
              {better ? "↑" : "↓"}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

/* ── Card wrapper ── */
const Card = ({ children, style }) => (
  <div style={{
    background: T.white,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius,
    padding: "20px 24px",
    marginBottom: 16,
    boxShadow: T.shadow,
    ...style,
  }}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{
    fontSize: 13, fontWeight: 700, color: T.text,
    marginBottom: 14, textTransform: "uppercase",
    letterSpacing: "0.5px",
  }}>
    {children}
  </div>
);

/* ════════════════════════════════════════════════════════════════
   Main component
════════════════════════════════════════════════════════════════ */
export default function RetrainPanel() {
  const [modelInfo, setModelInfo]   = useState(null);
  const [history,   setHistory]     = useState([]);
  const [activeJob, setActiveJob]   = useState(null);
  const [loading,   setLoading]     = useState(true);
  const [starting,  setStarting]    = useState(false);
  const [confirm,   setConfirm]     = useState(false);
  const [error,     setError]       = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const pollRef = useRef(null);

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const refresh = useCallback(async () => {
    try {
      const [infoRes, histRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/retrain/model-info`, { headers: headers() }),
        axios.get(`${API_BASE}/admin/retrain/history`,    { headers: headers() }),
      ]);
      setModelInfo(infoRes.data);
      setHistory(histRes.data);
      if (histRes.data.length > 0) {
        const latest = histRes.data[0];
        if (latest.status === "running" || latest.status === "queued") {
          startPolling(latest.id);
        }
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    refresh();
    return () => clearInterval(pollRef.current);
  }, [refresh]);

  const startPolling = (jobId) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/admin/retrain/status/${jobId}`,
          { headers: headers() }
        );
        setActiveJob(res.data);
        if (res.data.status === "completed" || res.data.status === "failed") {
          clearInterval(pollRef.current);
          refresh();
        }
      } catch (e) {
        console.error("Poll error:", e.message);
      }
    }, 5000);
  };

  const handleStart = async () => {
    setConfirm(false);
    setStarting(true);
    setError(null);
    try {
      const res = await axios.post(
        `${API_BASE}/admin/retrain/start`, {},
        { headers: headers() }
      );
      setActiveJob({ job_id: res.data.job_id, status: "queued", current_step: null });
      startPolling(res.data.job_id);
      refresh();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setStarting(false);
    }
  };

  const handleCancel = async () => {
    if (!activeJob) return;
    setCancelling(true);
    try {
      await axios.post(
        `${API_BASE}/admin/retrain/cancel/${activeJob.job_id}`,
        {},
        { headers: headers() }
      );
      setActiveJob(prev => prev
        ? { ...prev, status: "failed", outcome: "cancelled" }
        : prev
      );
      clearInterval(pollRef.current);
      refresh();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setCancelling(false);
    }
  };

  const jobRunning = activeJob &&
    (activeJob.status === "running" || activeJob.status === "queued");

  if (loading) {
    return (
      <div style={{ padding: 24, color: T.muted, fontSize: 14 }}>
        Loading model info…
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>

      {/* Error banner */}
      {error && (
        <div style={{
          background: "#fee2e2", border: "1px solid #fca5a5",
          borderRadius: T.radius, padding: "12px 16px",
          marginBottom: 16, fontSize: 13, color: T.red,
          display: "flex", justifyContent: "space-between",
        }}>
          {error}
          <button onClick={() => setError(null)} style={{
            background: "none", border: "none",
            cursor: "pointer", color: T.red, fontSize: 16,
          }}>✕</button>
        </div>
      )}

      {/* ── Current model ── */}
      <Card>
        <SectionTitle>Current Production Model</SectionTitle>
        {modelInfo ? (
          <>
            {/* Version badge + trained date */}
            <div style={{
              display: "flex", alignItems: "center",
              gap: 12, marginBottom: 16,
            }}>
              <span style={{
                background: T.primaryLt, color: T.primary,
                fontWeight: 700, fontSize: 15,
                padding: "4px 14px", borderRadius: 20,
                letterSpacing: "0.3px",
              }}>
                {modelInfo.version_tag}
              </span>
              <span style={{ fontSize: 12, color: T.muted }}>
                Trained {fmtDate(modelInfo.trained_at)}
              </span>
            </div>

            {/* Data range */}
            <div style={{
              background: T.primaryLt,
              borderRadius: 8, padding: "10px 14px",
              marginBottom: 16, fontSize: 12, color: T.primary,
              display: "flex", gap: 8, alignItems: "center",
            }}>
              <span>📅</span>
              <span>
                Training data: &nbsp;
                <strong>{fmtDate(modelInfo.data_date_from)}</strong>
                &nbsp;→&nbsp;
                <strong>{fmtDate(modelInfo.data_date_to)}</strong>
              </span>
            </div>

            {/* Metrics grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 32px",
            }}>
              {[
                { label: "AUC  ≥15 min",    val: modelInfo.auc15_test },
                { label: "PR-AUC  ≥15 min", val: modelInfo.prauc15_test },
                { label: "AUC  ≥30 min",    val: modelInfo.auc30_test },
                { label: "PR-AUC  ≥30 min", val: modelInfo.prauc30_test },
                { label: "MAE delay",        val: modelInfo.mae_reg_test,
                  suffix: " min" },
                { label: "Thresholds",
                  custom: `clf15: ${fmt(modelInfo.threshold_bin15, 2)}  |  clf30: ${fmt(modelInfo.threshold_bin30, 2)}` },
              ].map(({ label, val, suffix, custom }) => (
                <div key={label} style={{
                  padding: "8px 0",
                  borderBottom: `1px solid ${T.borderLt}`,
                }}>
                  <div style={{ fontSize: 11, color: T.muted,
                                textTransform: "uppercase",
                                letterSpacing: "0.4px",
                                marginBottom: 2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600,
                                color: T.text }}>
                    {custom || (val !== null && val !== undefined
                      ? `${fmt(val)}${suffix || ""}`
                      : "—")}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ color: T.muted, fontSize: 13 }}>
            No model info available.
          </div>
        )}
      </Card>

      {/* ── Trigger retraining ── */}
      <Card>
        <SectionTitle>Trigger Retraining</SectionTitle>
        {!confirm ? (
          <button
            disabled={jobRunning || starting}
            onClick={() => setConfirm(true)}
            style={{
              padding: "10px 24px", borderRadius: 8, border: "none",
              cursor: (jobRunning || starting) ? "not-allowed" : "pointer",
              fontWeight: 600, fontSize: 14,
              background: (jobRunning || starting) ? "#cbd5e1" : T.primary,
              color: "#fff",
            }}
          >
            {jobRunning ? "Retraining in progress…"
             : starting  ? "Starting…"
             : "Start Retraining"}
          </button>
        ) : (
          <div style={{
            background: T.amberBg, border: `1px solid #fcd34d`,
            borderRadius: 8, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 13, color: "#78350f",
                          marginBottom: 12, fontWeight: 500 }}>
              Automatically prepares ANSPerformance data from any
              CSV files in the data/ folder, fills any weather gaps,
              verifies all data, then retrains the models. Place new
              Eurocontrol CSV files in the pipeline data/ folder
              before starting. The current model stays active
              throughout.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleStart} style={{
                padding: "8px 20px", borderRadius: 7, border: "none",
                cursor: "pointer", fontWeight: 600, fontSize: 13,
                background: T.primary, color: "#fff",
              }}>
                Confirm
              </button>
              <button onClick={() => setConfirm(false)} style={{
                padding: "8px 20px", borderRadius: 7,
                border: `1px solid ${T.border}`,
                cursor: "pointer", fontWeight: 600, fontSize: 13,
                background: T.white, color: T.text,
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Active job ── */}
      {activeJob && (
        <Card style={{ borderColor: T.primaryLt }}>
          <div style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: 8 }}>
            <SectionTitle style={{ marginBottom: 0 }}>
              Job #{activeJob.job_id} — Live Status
            </SectionTitle>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Badge text={activeJob.outcome || activeJob.status} />
              {jobRunning && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  style={{
                    padding: "5px 14px", borderRadius: 7,
                    border: "1px solid #fca5a5",
                    cursor: cancelling ? "not-allowed" : "pointer",
                    fontWeight: 600, fontSize: 12,
                    background: cancelling ? "#fee2e2" : "#fff",
                    color: "#dc2626",
                  }}
                >
                  {cancelling ? "Cancelling…" : "Cancel"}
                </button>
              )}
            </div>
          </div>

          <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>
            API calls made: {activeJob.api_calls_made ?? 0}
          </div>

          <StepBar
            currentStep={activeJob.current_step}
            outcome={activeJob.outcome}
          />

          {activeJob.step_detail && (
            <div style={{
              marginTop: 10, fontSize: 12, color: T.muted,
              background: "#f8fafc", padding: "8px 12px",
              borderRadius: 6, wordBreak: "break-word",
            }}>
              {activeJob.step_detail}
            </div>
          )}

          {activeJob.error_message && (
            <div style={{
              marginTop: 10, fontSize: 12, color: T.red,
              background: "#fee2e2", padding: "8px 12px",
              borderRadius: 6, wordBreak: "break-word",
            }}>
              {activeJob.error_message}
            </div>
          )}

          {activeJob.candidate_metrics && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700,
                            color: T.text, marginBottom: 6 }}>
                Candidate vs production
              </div>
              <MetricRow label="AUC ≥15 min"
                newVal={activeJob.candidate_metrics.auc15}
                prodVal={modelInfo?.auc15_test} />
              <MetricRow label="PR-AUC ≥15 min"
                newVal={activeJob.candidate_metrics.prauc15}
                prodVal={modelInfo?.prauc15_test} />
              <MetricRow label="AUC ≥30 min"
                newVal={activeJob.candidate_metrics.auc30}
                prodVal={modelInfo?.auc30_test} />
              <MetricRow label="PR-AUC ≥30 min"
                newVal={activeJob.candidate_metrics.prauc30}
                prodVal={modelInfo?.prauc30_test} />
              <MetricRow label="MAE delay (min)"
                newVal={activeJob.candidate_metrics.mae_reg}
                prodVal={modelInfo?.mae_reg_test}
                higherIsBetter={false} />
            </div>
          )}
        </Card>
      )}

      {/* ── History table ── */}
      {history.length > 0 && (
        <Card>
          <SectionTitle>Retraining History</SectionTitle>
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table style={{
              width: "100%", borderCollapse: "collapse",
              fontSize: 12, minWidth: 700,
            }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Job","Date","By","Outcome","AUC15",
                    "PR-AUC15","AUC30","PR-AUC30","API calls",
                    "Data range"].map(h => (
                    <th key={h} style={{
                      padding: "9px 12px", textAlign: "left",
                      fontWeight: 600, fontSize: 11,
                      color: T.muted, textTransform: "uppercase",
                      letterSpacing: "0.4px",
                      borderBottom: `2px solid ${T.border}`,
                      whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((job, i) => (
                  <tr key={job.id} style={{
                    borderBottom: `1px solid ${T.borderLt}`,
                    background: i % 2 === 0 ? T.white : "#fafafa",
                  }}>
                    <td style={{ padding: "9px 12px", fontWeight: 700,
                                 color: T.primary }}>
                      #{job.id}
                    </td>
                    <td style={{ padding: "9px 12px", whiteSpace: "nowrap",
                                 color: T.muted }}>
                      {fmtDate(job.triggered_at)}
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      {job.triggered_by}
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      <Badge text={job.outcome || job.status} />
                    </td>
                    <td style={{ padding: "9px 12px",
                                 fontWeight: 600, color: T.text }}>
                      {fmt(job.new_auc15)}
                    </td>
                    <td style={{ padding: "9px 12px",
                                 fontWeight: 600, color: T.text }}>
                      {fmt(job.new_prauc15)}
                    </td>
                    <td style={{ padding: "9px 12px",
                                 fontWeight: 600, color: T.text }}>
                      {fmt(job.new_auc30)}
                    </td>
                    <td style={{ padding: "9px 12px",
                                 fontWeight: 600, color: T.text }}>
                      {fmt(job.new_prauc30)}
                    </td>
                    <td style={{ padding: "9px 12px", color: T.muted }}>
                      {job.api_calls_made ?? "—"}
                    </td>
                    <td style={{ padding: "9px 12px",
                                 whiteSpace: "nowrap", color: T.muted }}>
                      {job.backfill_start && job.backfill_end
                        ? `${fmtDate(job.backfill_start)} → ${fmtDate(job.backfill_end)}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

    </div>
  );
}
