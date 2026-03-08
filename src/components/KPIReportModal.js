import React, { useMemo, useState } from 'react';
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 12px;
  color: #666666;
`;

const Select = styled.select`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #e1e5e9;
  background: #fff;
  color: #333;
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

function toCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val) => `"${String(val).replace(/"/g, '""')}"`;
  const headerRow = headers.map(escape).join(',');
  const dataRows = rows.map(r => headers.map(h => escape(r[h] ?? '')).join(','));
  return [headerRow, ...dataRows].join('\n');
}

const KPIReportModal = ({ open, onClose, kpiSource }) => {
  const [filters, setFilters] = useState({
    dateRange: 'Today',
    status: 'All',
    severity: 'All',
    airline: 'All',
    exportType: 'CSV'
  });
  const [showToast, setShowToast] = useState(false);

  const filtered = useMemo(() => {
    const { kpis = {} } = kpiSource || {};
    // We only export the current KPI numbers as a single-row CSV
    const row = [{
      totalFlights: kpis.totalFlights,
      delayedFlights: kpis.delayedFlights,
      averageDelay: kpis.averageDelay,
      onTimePerformance: kpis.onTimePerformance
    }];
    return row;
  }, [kpiSource]);

  const handleDownload = () => {
    if (filters.exportType === 'CSV') {
      const csv = toCsv(filtered);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kpi_report.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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
            <Close onClick={onClose}>✕</Close>
          </Header>
          <Body>
            <Field>
              <Label>Date Range</Label>
              <Select value={filters.dateRange} onChange={e => setFilters({ ...filters, dateRange: e.target.value })}>
                <option>Today</option>
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
              </Select>
            </Field>
            <Field>
              <Label>Flight Status</Label>
              <Select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                <option>All</option>
                <option>On-Time</option>
                <option>Delayed</option>
              </Select>
            </Field>
            <Field>
              <Label>Delay Severity</Label>
              <Select value={filters.severity} onChange={e => setFilters({ ...filters, severity: e.target.value })}>
                <option>All</option>
                <option>Minor</option>
                <option>Moderate</option>
                <option>Severe</option>
              </Select>
            </Field>
            <Field>
              <Label>Airline</Label>
              <Select value={filters.airline} onChange={e => setFilters({ ...filters, airline: e.target.value })}>
                <option>All</option>
                <option>Lufthansa</option>
                <option>Air France</option>
                <option>British Airways</option>
                <option>KLM Royal Dutch</option>
                <option>Eurowings</option>
                <option>Austrian Airlines</option>
                <option>Swiss International</option>
                <option>Brussels Airlines</option>
              </Select>
            </Field>
            <Field>
              <Label>Export Type</Label>
              <Select value={filters.exportType} onChange={e => setFilters({ ...filters, exportType: e.target.value })}>
                <option value="CSV">CSV</option>
                {/* <option value="XLSX" disabled>XLSX (coming soon)</option> */}
              </Select>
            </Field>
          </Body>
          <Footer>
            <Button onClick={onClose}>Cancel</Button>
            <Button primary onClick={handleDownload}>Download</Button>
          </Footer>
        </Modal>
      </Backdrop>
      {showToast && <Toast>Report downloaded successfully</Toast>}
    </>
  );
};

export default KPIReportModal;


