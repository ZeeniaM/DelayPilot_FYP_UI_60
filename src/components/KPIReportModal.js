import React, { useState } from 'react';
import styled from 'styled-components';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const Modal = styled.div`
  width: 520px;
  max-width: 92vw;
  background: white;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #eef1f4;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  margin: 0;
  color: #333333;
  font-size: 16px;
  font-weight: 600;
`;

const Close = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  color: #666666;
  cursor: pointer;
`;

const Body = styled.div`
  padding: 16px 20px;
  color: #475569;
  font-size: 14px;
  line-height: 1.5;
`;

const Footer = styled.div`
  padding: 14px 20px;
  border-top: 1px solid #eef1f4;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;

  ${props => props.primary ? `
    background: #1A4B8F;
    color: white;
    &:hover { background: #0f3a73; }
  ` : `
    background: #f1f3f4;
    color: #333;
    &:hover { background: #e1e5e9; }
  `}
`;

const Toast = styled.div`
  position: fixed;
  right: 20px;
  bottom: 20px;
  background: #1A4B8F;
  color: white;
  padding: 10px 14px;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(26, 75, 143, 0.25);
  z-index: 10000;
  font-size: 13px;
`;

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const weatherCodeLabel = (code) => {
  if (code == null) return 'Unknown';
  if (code === 0) return 'Clear Sky';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 49) return 'Fog / Haze';
  if (code <= 69) return 'Rainy';
  if (code <= 79) return 'Snowy';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
};

const countBy = (items, predicate) => items.filter(predicate).length;

const KPIReportModal = ({ open, onClose, kpiSource, userName = '' }) => {
  const [showToast, setShowToast] = useState(false);

  const handleGenerateReport = () => {
    const { kpis = {}, liveFlights = [], liveWeather = null } = kpiSource || {};
    const flights = Array.isArray(liveFlights) ? liveFlights : [];
    const delayedFlights = flights.filter(f => ['Minor Delay', 'Major Delay'].includes(f.status));
    const delayedTotal = delayedFlights.length || 1;

    const statusRows = [
      ['On Time', countBy(flights, f => f.status === 'On Time')],
      ['Minor Delay', countBy(flights, f => f.status === 'Minor Delay')],
      ['Major Delay', countBy(flights, f => f.status === 'Major Delay')],
      ['En Route', countBy(flights, f => f.status === 'En Route')],
      ['Cancelled / Diverted', countBy(flights, f => ['Cancelled', 'Diverted'].includes(f.status))],
      ['Early', countBy(flights, f => f.status === 'Early')],
      ['Departures', countBy(flights, f => f.movement === 'departure')],
      ['Arrivals', countBy(flights, f => f.movement === 'arrival')],
    ];

    const causeRows = [
      ['Weather', countBy(delayedFlights, f => f.likelyCause === 'Weather')],
      ['Congestion', countBy(delayedFlights, f => f.likelyCause === 'Congestion')],
      ['Reactionary', countBy(delayedFlights, f => f.likelyCause === 'Reactionary')],
      ['Other / Unknown', countBy(delayedFlights, f => !['Weather', 'Congestion', 'Reactionary'].includes(f.likelyCause))],
    ];

    const generatedAt = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const weatherRows = [
      ['Temperature', liveWeather?.temperature != null ? `${liveWeather.temperature} °C` : 'N/A'],
      ['Wind', liveWeather?.wind_speed != null ? `${liveWeather.wind_speed} km/h` : 'N/A'],
      ['Precipitation', liveWeather?.precipitation != null ? `${liveWeather.precipitation} mm` : 'N/A'],
      ['Visibility', liveWeather?.visibility != null ? `${Math.round(liveWeather.visibility / 1000)} km` : 'N/A'],
      ['Condition', weatherCodeLabel(liveWeather?.weather_code)],
    ];

    const fullHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>DelayPilot Operational KPI Report</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; background: #fff; color: #1f2937; font-family: Arial, sans-serif; line-height: 1.45; }
            .page { padding: 32px; }
            .header { border-bottom: 3px solid #1A4B8F; padding-bottom: 18px; margin-bottom: 24px; }
            .logo { color: #1A4B8F; font-size: 24px; font-weight: 800; margin-bottom: 4px; }
            h1 { color: #1A4B8F; margin: 0 0 8px; font-size: 22px; }
            h2 { color: #1A4B8F; margin: 28px 0 12px; font-size: 16px; }
            .meta { color: #64748b; font-size: 12px; }
            .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .kpi-card { border: 1px solid #dbe3ec; border-radius: 8px; padding: 14px; }
            .kpi-label { color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; }
            .kpi-value { color: #1A4B8F; font-size: 24px; font-weight: 800; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th, td { border: 1px solid #dbe3ec; padding: 8px 10px; text-align: left; }
            th { background: #eef6ff; color: #1A4B8F; }
            .footer { border-top: 1px solid #dbe3ec; color: #64748b; font-size: 12px; margin-top: 32px; padding-top: 14px; text-align: center; }
            @media print {
              @page { margin: 16mm; }
              .page { padding: 0; }
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <main class="page">
            <section class="header">
              <div class="logo">DelayPilot</div>
              <h1>Operational KPI Report</h1>
              <div class="meta">Generated ${escapeHtml(generatedAt)} · Generated by ${escapeHtml(userName || 'Unknown user')}</div>
            </section>

            <h2>1. KPI Summary</h2>
            <section class="kpi-grid">
              ${[
                ['Total Flights', kpis.totalFlights ?? 'N/A'],
                ['Delayed Flights', kpis.delayedFlights ?? 'N/A'],
                ['Avg Delay', kpis.averageDelay != null ? `${Math.round(kpis.averageDelay)} min` : 'N/A'],
                ['On-Time Performance', kpis.onTimePerformance != null ? `${kpis.onTimePerformance}%` : 'N/A'],
              ].map(([label, value]) => `
                <div class="kpi-card">
                  <div class="kpi-label">${escapeHtml(label)}</div>
                  <div class="kpi-value">${escapeHtml(value)}</div>
                </div>
              `).join('')}
            </section>

            <h2>2. Flight Status Breakdown</h2>
            <table>
              <tbody>
                ${statusRows.map(([label, count]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(count)}</td></tr>`).join('')}
              </tbody>
            </table>

            <h2>3. Delay Cause Breakdown</h2>
            <table>
              <thead><tr><th>Cause</th><th>Count</th><th>% of delayed flights</th></tr></thead>
              <tbody>
                ${causeRows.map(([label, count]) => `
                  <tr>
                    <td>${escapeHtml(label)}</td>
                    <td>${escapeHtml(count)}</td>
                    <td>${escapeHtml(`${Math.round((count / delayedTotal) * 100)}%`)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <h2>4. Current Weather (MUC)</h2>
            <table>
              <tbody>
                ${weatherRows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}
              </tbody>
            </table>

            <div class="footer">Generated by DelayPilot • Munich Airport Operations</div>
          </main>
        </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(fullHtml);
    win.document.close();
    win.print();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
    onClose && onClose();
  };

  if (!open) return null;

  return (
    <>
      <Backdrop onClick={onClose}>
        <Modal onClick={(e) => e.stopPropagation()}>
          <Header>
            <Title>Generate KPI Report</Title>
            <Close onClick={onClose}>×</Close>
          </Header>
          <Body>
            Generate a printable operational KPI report using the latest flight, KPI, and weather data shown on the dashboard.
          </Body>
          <Footer>
            <Button onClick={onClose}>Cancel</Button>
            <Button primary onClick={handleGenerateReport}>Generate Report (PDF)</Button>
          </Footer>
        </Modal>
      </Backdrop>
      {showToast && <Toast>Report opened for printing</Toast>}
    </>
  );
};

export default KPIReportModal;
