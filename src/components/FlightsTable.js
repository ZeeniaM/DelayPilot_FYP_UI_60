/**
 * FlightsTable.js  — Dashboard widget (compact table)
 * ─────────────────────────────────────────────────────────────────
 * Styled-components from components.styles.js.
 * Props:
 *   liveFlights  — array from predictionService.fetchFlights() (or null)
 *   refreshKey   — triggers refresh in parent
 *   onRefresh    — callback
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useMemo } from 'react';
import {
  TableContainer, TableHeaderBar, TableTitle,
  Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell,
  FlightNumber, AirlineInfo, AirlineLogo,
  TimeCell, ScheduledTime, ActualTime,
  StatusPill, DelayValue,
} from '../styles/components.styles';

// Fallback mock data shown when pipeline is offline
const MOCK_FLIGHTS = [
  { id: 1, flightNo: 'LH 2222', airline: 'Lufthansa',        airlineCode: 'LH', scheduledTime: '06:45', actualTime: '06:45', predictedDelay: 0,  is_delayed_15: false, is_delayed_30: false, status: 'On Time'     },
  { id: 2, flightNo: 'AF 1825', airline: 'Air France',       airlineCode: 'AF', scheduledTime: '08:20', actualTime: '08:35', predictedDelay: 15, is_delayed_15: true,  is_delayed_30: false, status: 'Minor Delay'  },
  { id: 3, flightNo: 'BA 952',  airline: 'British Airways',  airlineCode: 'BA', scheduledTime: '09:10', actualTime: '09:52', predictedDelay: 42, is_delayed_15: true,  is_delayed_30: true,  status: 'Major Delay'  },
  { id: 4, flightNo: 'KL 1856', airline: 'KLM',              airlineCode: 'KL', scheduledTime: '11:30', actualTime: '11:30', predictedDelay: 0,  is_delayed_15: false, is_delayed_30: false, status: 'On Time'     },
  { id: 5, flightNo: 'EW 7823', airline: 'Eurowings',        airlineCode: 'EW', scheduledTime: '13:15', actualTime: '13:27', predictedDelay: 12, is_delayed_15: false, is_delayed_30: false, status: 'On Time'     },
];

const getStatus = (f) => {
  // f.status is already derived by mapFlight() (authoritative: op_status first, then ML labels)
  // Only fall back to raw flags if for some reason status is missing (e.g. mock data)
  if (f.status) return f.status;
  if (f.is_delayed_30) return 'Major Delay';
  if (f.is_delayed_15) return 'Minor Delay';
  return 'On Time';
};

const getRandomFlights = (flightsArray, count = 6) => {
  if (!flightsArray || flightsArray.length === 0) return [];
  const shuffled = [...flightsArray].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const FlightsTable = ({ liveFlights = null }) => {
  const sourceFlights = liveFlights || MOCK_FLIGHTS;
  const flights = useMemo(() => getRandomFlights(sourceFlights, 6), [sourceFlights]);
  const isLive  = !!liveFlights;

  return (
    <TableContainer>
      <TableHeaderBar>
        <TableTitle>Recent Flights</TableTitle>
        <span style={{ fontSize: 11, color: isLive ? '#166534' : '#6B7280',
                        background: isLive ? '#DCFCE7' : '#F3F4F6',
                        padding: '3px 9px', borderRadius: 999, fontWeight: 600 }}>
          {isLive ? '● Live' : '● Demo'}
        </span>
      </TableHeaderBar>

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Flight</TableHeaderCell>
            <TableHeaderCell>Airline</TableHeaderCell>
            <TableHeaderCell>Scheduled</TableHeaderCell>
            <TableHeaderCell>Actual / Est.</TableHeaderCell>
            <TableHeaderCell>Delay</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {flights.map(f => {
            const status = getStatus(f);
            return (
              <TableRow key={f.id}>
                <TableCell>
                  <FlightNumber>{f.flightNo}</FlightNumber>
                </TableCell>
                <TableCell>
                  <AirlineInfo>
                    <AirlineLogo>
                      {(f.airlineCode || f.airline || '??').substring(0, 2).toUpperCase()}
                    </AirlineLogo>
                    {f.airline}
                  </AirlineInfo>
                </TableCell>
                <TableCell>
                  <ScheduledTime>{f.scheduledTime || '—'}</ScheduledTime>
                </TableCell>
                <TableCell>
                  <TimeCell>
                    <ActualTime delayed={f.predictedDelay > 0}>
                      {f.actualTime || (f.scheduledTime ? `~${f.scheduledTime}` : '—')}
                    </ActualTime>
                  </TimeCell>
                </TableCell>
                <TableCell>
                  <DelayValue value={f.predictedDelay}>
                    {f.predictedDelay === 0 ? 'On Time' : `+${f.predictedDelay} min`}
                  </DelayValue>
                </TableCell>
                <TableCell>
                  <StatusPill status={status}>{status}</StatusPill>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FlightsTable;
