/**
 * AlertsPanel.js  — COMPLETE REPLACEMENT
 * ─────────────────────────────────────────────────────────────────
 * Replace the entire existing AlertsPanel.js with this file.
 *
 * What changed vs the original:
 *   • Receives onDismiss and onAddToBoard callbacks from parent
 *     (Dashboard passes them down; they update App.js liveAlerts state)
 *   • Dismiss removes the alert from the visible list immediately
 *     (no backend call — pure local state, simple and reliable)
 *   • Add to Board navigates to Mitigation Board tab
 *   • Severity colour on card border: high = red left-border
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  AlertsContainer, AlertsHeader, AlertsTitle, AlertIconCircle, AlertsToggle,
  AlertsContent, AlertCard, AlertCardHeader, AlertFlight, AlertTime,
  AlertMessage, AlertActionsRow, AlertButton, AlertsEmptyState,
} from '../styles/components.styles';

const AlertsPanel = ({
  liveAlerts = [],
  onDismiss,       // (id) => void  — called when user dismisses an alert
  onAddToBoard,    // (flight) => void — called when user clicks Add to Board
}) => {
  const [collapsed, setCollapsed] = useState(false);
  // Local dismissed set — alerts disappear instantly on dismiss click
  const [dismissed, setDismissed] = useState(new Set());

  const visibleAlerts = liveAlerts.filter(a => !dismissed.has(a.id));

  const handleDismiss = (id) => {
    setDismissed(prev => new Set([...prev, id]));
    onDismiss && onDismiss(id);
  };

  const handleAddToBoard = (alert) => {
    // Dismiss the alert from panel, then navigate
    setDismissed(prev => new Set([...prev, alert.id]));
    onAddToBoard && onAddToBoard(alert.flight || alert);
  };

  return (
    <AlertsContainer>
      <AlertsHeader onClick={() => setCollapsed(!collapsed)}>
        <AlertsTitle>
          <AlertIconCircle>⚠</AlertIconCircle>
          Active Alerts
          {visibleAlerts.length > 0 && (
            <span style={{
              background: '#FEE2E2', color: '#991B1B',
              fontSize: 11, fontWeight: 700,
              padding: '2px 7px', borderRadius: 999,
            }}>
              {visibleAlerts.length}
            </span>
          )}
        </AlertsTitle>
        <AlertsToggle collapsed={collapsed}>▼</AlertsToggle>
      </AlertsHeader>

      <AlertsContent collapsed={collapsed}>
        {visibleAlerts.length === 0 ? (
          <AlertsEmptyState>No active major delay alerts.</AlertsEmptyState>
        ) : (
          visibleAlerts.map(alert => (
            <AlertCard key={alert.id} severity={alert.severity}>
              <AlertCardHeader>
                <AlertFlight>{alert.flightNo}</AlertFlight>
                <AlertTime>{alert.time}</AlertTime>
              </AlertCardHeader>
              <AlertMessage>{alert.message}</AlertMessage>
              <AlertActionsRow>
                <AlertButton onClick={() => handleDismiss(alert.id)}>
                  Dismiss
                </AlertButton>
                <AlertButton primary onClick={() => handleAddToBoard(alert)}>
                  Add to Board
                </AlertButton>
              </AlertActionsRow>
            </AlertCard>
          ))
        )}
      </AlertsContent>
    </AlertsContainer>
  );
};

export default AlertsPanel;