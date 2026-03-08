/**
 * KPICards.js
 * ─────────────────────────────────────────────────────────────────
 * All styled-components imported from components.styles.js.
 * Accepts optional `liveKPIs` prop from Dashboard (pipeline data).
 * Falls back to static Munich airport averages when pipeline is offline.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef, useState } from 'react';
import KPIReportModal from './KPIReportModal';
import {
  KPIContainer, KPIRow, KPIRowHeader, KPIActions, KPIIconStack,
  KPICard, KPITitle, KPIMetric, KPINumber, KPISubLabel,
  KPILiveTag, KPILiveDot,
  ReportButton, IconCircleButton, NotifDot,
  NotifDropdownWrapper, NotifDropdown, NotifDropdownHeader,
  NotifDropdownBody, NotifCard, NotifActions, NotifButton,
} from '../styles/components.styles';

// Fallback static data (Munich Airport daily averages)
const FALLBACK_KPI = {
  totalFlights:      381,
  delayedFlights:    57,
  averageDelay:      22,
  onTimePerformance: 85.1,
};

const KPICards = ({ refreshKey, onRefresh, liveKPIs = null, liveAlerts = [] }) => {
  const [reportOpen,         setReportOpen]         = useState(false);
  const [showNotifications,  setShowNotifications]  = useState(false);
  const [hasNew,             setHasNew]             = useState(liveAlerts.length > 0);
  const dropdownRef = useRef(null);

  // Compute display values
  const isLive = !!liveKPIs;
  const kpi = isLive ? {
    totalFlights:      liveKPIs.totalFlights,
    delayedFlights:    liveKPIs.delayed15Count,
    averageDelay:      parseFloat(liveKPIs.avgDelayMin),
    onTimePerformance: parseFloat(liveKPIs.onTimePct),
  } : FALLBACK_KPI;

  // Alert badge count
  useEffect(() => {
    if (liveAlerts.length > 0) setHasNew(true);
  }, [liveAlerts]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);

  const handleDismiss    = (id)      => console.log(`Dismissing alert ${id}`);
  const handleAddToBoard = (flightNo) => console.log(`Adding ${flightNo} to mitigation board`);

  const kpiCards = [
    { title: 'Total Flights Today', value: kpi.totalFlights.toLocaleString(), sub: 'scheduled at MUC' },
    { title: 'Delayed Flights',     value: kpi.delayedFlights,               sub: '≥15 min predicted' },
    { title: 'Avg. Delay Duration', value: `${Math.round(kpi.averageDelay)} min`, sub: 'among delayed flights' },
    { title: 'On-Time Performance', value: `${kpi.onTimePerformance}%`,      sub: 'flights on schedule' },
  ];

  return (
    <KPIContainer>
      <KPIRowHeader>
        <KPIRow>
          {kpiCards.map(card => (
            <KPICard key={card.title}>
              <KPITitle>{card.title}</KPITitle>
              <KPIMetric>
                <KPINumber>{card.value}</KPINumber>
                <KPISubLabel>{card.sub}</KPISubLabel>
              </KPIMetric>
              <KPILiveTag live={isLive}>
                <KPILiveDot live={isLive} />
                {isLive ? 'Live' : 'Demo'}
              </KPILiveTag>
            </KPICard>
          ))}
        </KPIRow>

        <KPIActions>
          <ReportButton onClick={() => setReportOpen(true)}>Generate KPI Report</ReportButton>
          <KPIIconStack>
            <IconCircleButton onClick={onRefresh} title="Refresh all metrics">↻</IconCircleButton>

            <NotifDropdownWrapper ref={dropdownRef}>
              <IconCircleButton
                onClick={() => { setShowNotifications(!showNotifications); setHasNew(false); }}
                title="Notifications"
              >
                🔔
                {hasNew && <NotifDot />}
              </IconCircleButton>

              {showNotifications && (
                <NotifDropdown>
                  <NotifDropdownHeader>
                    Active Alerts {liveAlerts.length > 0 ? `(${liveAlerts.length})` : ''}
                  </NotifDropdownHeader>
                  <NotifDropdownBody>
                    {liveAlerts.length === 0 ? (
                      <div style={{ color: '#666', padding: '8px 0' }}>No active alerts.</div>
                    ) : (
                      liveAlerts.map(alert => (
                        <NotifCard key={alert.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <strong style={{ color: '#1A4B8F' }}>{alert.flightNo}</strong>
                            <span style={{ color: '#666', fontSize: 11 }}>{alert.time}</span>
                          </div>
                          <div style={{ lineHeight: 1.4, fontSize: 12 }}>{alert.message}</div>
                          <NotifActions>
                            <NotifButton onClick={() => handleDismiss(alert.id)}>Dismiss</NotifButton>
                            <NotifButton primary onClick={() => handleAddToBoard(alert.flightNo)}>Add to Board</NotifButton>
                          </NotifActions>
                        </NotifCard>
                      ))
                    )}
                  </NotifDropdownBody>
                </NotifDropdown>
              )}
            </NotifDropdownWrapper>
          </KPIIconStack>
        </KPIActions>
      </KPIRowHeader>

      <KPIReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        kpiSource={{ kpis: {
          totalFlights:      kpi.totalFlights,
          delayedFlights:    kpi.delayedFlights,
          averageDelay:      kpi.averageDelay,
          onTimePerformance: kpi.onTimePerformance,
        }}}
      />
    </KPIContainer>
  );
};

export default KPICards;