/**
 * AlertsPanel.js
 * ─────────────────────────────────────────────────────────────────
 * Styled-components from components.styles.js.
 * Props:
 *   liveAlerts — array of alert objects derived from pipeline flights
 *                where is_delayed_15 === true.
 *                Falls back to empty array (no mock alerts).
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  AlertsContainer, AlertsHeader, AlertsTitle, AlertIconCircle, AlertsToggle,
  AlertsContent, AlertCard, AlertCardHeader, AlertFlight, AlertTime,
  AlertMessage, AlertActionsRow, AlertButton, AlertsEmptyState,
} from '../styles/components.styles';

const AlertsPanel = ({ liveAlerts = [] }) => {
  const [collapsed, setCollapsed] = useState(false);

  // Build display alerts:
  // If liveAlerts provided, use those; otherwise show empty state.
  const alerts = liveAlerts;

  const handleDismiss    = (id)      => console.log(`Dismissing alert ${id}`);
  const handleAddToBoard = (flightNo) => console.log(`Adding ${flightNo} to mitigation board`);

  return (
    <AlertsContainer>
      <AlertsHeader onClick={() => setCollapsed(!collapsed)}>
        <AlertsTitle>
          <AlertIconCircle>⚠</AlertIconCircle>
          Active Alerts
          {alerts.length > 0 && (
            <span style={{
              background: '#FEE2E2', color: '#991B1B',
              fontSize: 11, fontWeight: 700,
              padding: '2px 7px', borderRadius: 999,
            }}>
              {alerts.length}
            </span>
          )}
        </AlertsTitle>
        <AlertsToggle collapsed={collapsed}>▼</AlertsToggle>
      </AlertsHeader>

      <AlertsContent collapsed={collapsed}>
        {alerts.length === 0 ? (
          <AlertsEmptyState>No active delay alerts at this time.</AlertsEmptyState>
        ) : (
          alerts.map(alert => (
            <AlertCard key={alert.id} severity={alert.severity}>
              <AlertCardHeader>
                <AlertFlight>{alert.flightNo}</AlertFlight>
                <AlertTime>{alert.time}</AlertTime>
              </AlertCardHeader>
              <AlertMessage>{alert.message}</AlertMessage>
              <AlertActionsRow>
                <AlertButton onClick={() => handleDismiss(alert.id)}>Dismiss</AlertButton>
                <AlertButton primary onClick={() => handleAddToBoard(alert.flightNo)}>
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