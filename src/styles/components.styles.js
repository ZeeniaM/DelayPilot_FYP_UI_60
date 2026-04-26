/**
 * components.styles.js
 * ─────────────────────────────────────────────────────────────────
 * Central styled-components library for DelayPilot.
 * All components import from here — no inline styled definitions.
 *
 * SECTIONS
 *  1. Design tokens (colors, shadows, radius, breakpoints)
 *  2. Layout primitives  (shared across all pages)
 *  3. Navigation
 *  4. KPI Cards
 *  5. Flights Table (Dashboard mini-table)
 *  6. Flights Page  (full page + drawer)
 *  7. Weather Panel
 *  8. Alerts Panel
 *  9. Visual Analytics
 * 10. Quick Actions
 * 11. Mitigation Board
 * 12. Simulation Page
 * 13. Shared / utility atoms
 * ─────────────────────────────────────────────────────────────────
 */

import styled, { css, keyframes, createGlobalStyle } from 'styled-components';

/* ── Google Fonts: Cinzel (display) + Outfit (body) ──────────────
   Matches the LandingPage font system. Injected once here so all
   dashboard pages inherit without any component changes.
──────────────────────────────────────────────────────────────── */
export const GlobalFonts = createGlobalStyle`
  /* Outfit + Cinzel loaded via @import in index.css (must be first in stylesheet) */
  body, button, input, select, textarea {
    font-family: 'Outfit', 'Segoe UI', sans-serif;
  }
`;

/* ══════════════════════════════════════════════════════════════════
   1. DESIGN TOKENS
══════════════════════════════════════════════════════════════════ */
export const tokens = {
  /* brand */
  primary:        '#1A4B8F',
  primaryDark:    '#0f3a73',
  primaryLight:   '#EAF1FB',
  primaryMid:     '#2E7D8F',

  /* status */
  green:          '#00A86B',
  greenBg:        '#DCFCE7',
  greenText:      '#166534',
  amber:          '#f39c12',
  amberBg:        '#FEF3C7',
  amberText:      '#92400E',
  red:            '#e74c3c',
  redBg:          '#FEE2E2',
  redText:        '#991B1B',
  grey:           '#6B7280',
  greyBg:         '#F3F4F6',

  /* cause colours */
  causeWeather:           '#0369a1',   /* deep sky blue */
  causeWeatherBg:         '#e0f2fe',   /* sky-100 */

  causeCongestion:    '#0e7490',    /* cyan-700 */
  causeCongestionBg:  '#cffafe',    /* cyan-100 */

  causeReactionary:       '#6d28d9',   /* indigo-violet */
  causeReactionaryBg:     '#ede9fe',   /* violet-100 */

  causeAirline:           '#be185d',   /* deep magenta-pink */
  causeAirlineBg:         '#fce7f3',   /* pink-100 */

  causeHistorical:        '#0f766e',   /* teal */
  causeHistoricalBg:      '#ccfbf1',   /* teal-100 */

  /* neutrals */
  text:           '#333333',
  textMuted:      '#666666',
  textLight:      '#999999',
  border:         '#e1e5e9',
  borderLight:    'rgba(0,0,0,0.05)',
  rowAlt:         '#FAFBFD',
  bg:             '#F7F9FB',
  white:          '#ffffff',
  surfaceHover:   '#f8f9fa',

  /* shadows */
  shadow:         '0 2px 8px rgba(0,0,0,0.05)',
  shadowMd:       '0 4px 16px rgba(0,0,0,0.08)',
  shadowLg:       '0 8px 24px rgba(0,0,0,0.12)',
  shadowPrimary:  '0 4px 16px rgba(26,75,143,0.25)',

  /* shape */
  radius:         '12px',
  radiusSm:       '8px',
  radiusXs:       '6px',
  radiusFull:     '9999px',

  /* breakpoints */
  bp1200:         '1200px',
  bp768:          '768px',
};

/* ══════════════════════════════════════════════════════════════════
   2. LAYOUT PRIMITIVES
══════════════════════════════════════════════════════════════════ */

/** Root page wrapper — used in Dashboard, FlightsPage, etc. */
export const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${tokens.bg};
  display: flex;
  flex-direction: column;
`;

/** The content area below the nav bar */
export const MainContent = styled.div`
  display: flex;
  flex: 1;
  gap: 24px;
  padding: 20px;
  max-width: 1680px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: ${tokens.bp1200}) {
    flex-direction: column;
    gap: 20px;
  }
  @media (max-width: ${tokens.bp768}) {
    padding: 16px;
    gap: 16px;
  }
`;

/** Left column — takes remaining width */
export const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (max-width: ${tokens.bp768}) {
    gap: 20px;
  }
`;

/** Generic white card / panel */
export const Card = styled.div`
  background: ${tokens.white};
  border-radius: ${tokens.radius};
  box-shadow: ${tokens.shadow};
  border: 1px solid ${tokens.borderLight};
  ${props => props.padding && `padding: ${props.padding};`}
`;

/** Page header row (title + action button) */
export const PageHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

export const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: ${tokens.text};
  margin: 0;
`;

/* ══════════════════════════════════════════════════════════════════
   3. NAVIGATION BAR
══════════════════════════════════════════════════════════════════ */

export const NavContainer = styled.nav`
  background: ${tokens.white};
  box-shadow: ${tokens.shadow};
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 100;

  @media (max-width: ${tokens.bp768}) {
    padding: 0 16px;
    height: 56px;
  }
`;

export const NavLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Cinzel', Georgia, serif;
  font-size: 20px;
  font-weight: 700;
  color: ${tokens.primary};
  cursor: pointer;
  letter-spacing: 0.5px;

  @media (max-width: ${tokens.bp768}) { font-size: 17px; }
`;

export const NavLogoIcon = styled.div`
  width: 28px;
  height: 28px;
  background: transparent;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${tokens.primary};
  font-size: 22px;
  line-height: 1;
`;

export const NavTabs = styled.div`
  display: flex;
  gap: 8px;
  flex: 1;
  justify-content: center;

  @media (max-width: ${tokens.bp768}) { display: none; }
`;

export const NavTab = styled.button`
  padding: 8px 16px;
  background: none;
  border: none;
  color: ${props => props.active ? tokens.primary : tokens.textMuted};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: ${tokens.radiusXs};
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: ${tokens.primaryLight};
    color: ${tokens.primary};
  }

  ${props => props.active && css`
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 16px;
      right: 16px;
      height: 2px;
      background: ${tokens.primary};
      border-radius: 1px;
    }
  `}
`;

export const NavUserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
`;

export const NavUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: ${tokens.radiusXs};
  transition: background 0.2s ease;
  &:hover { background: ${tokens.primaryLight}; }
`;

export const NavAvatar = styled.div`
  width: 32px;
  height: 32px;
  background: ${tokens.primary};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
`;

export const NavUserText = styled.div`
  font-size: 14px;
  color: ${tokens.text};
  font-weight: 500;
  @media (max-width: ${tokens.bp768}) { display: none; }
`;

export const NavDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: ${tokens.white};
  border-radius: ${tokens.radiusSm};
  box-shadow: ${tokens.shadowMd};
  border: 1px solid ${tokens.borderLight};
  min-width: 180px;
  z-index: 1000;
  display: ${props => props.show ? 'block' : 'none'};
`;

export const NavDropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  color: ${tokens.text};
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
  &:hover { background: ${tokens.primaryLight}; }
  &:first-child { border-radius: ${tokens.radiusSm} ${tokens.radiusSm} 0 0; }
  &:last-child  { border-radius: 0 0 ${tokens.radiusSm} ${tokens.radiusSm}; }
`;

/* ══════════════════════════════════════════════════════════════════
   4. KPI CARDS
══════════════════════════════════════════════════════════════════ */

export const KPIContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;

  @media (max-width: ${tokens.bp768}) {
    flex-direction: column;
    gap: 12px;
  }
`;

export const KPIRow = styled.div`
  display: flex;
  gap: 16px;
  flex: 1;

  @media (max-width: ${tokens.bp1200}) { flex-wrap: wrap; }
  @media (max-width: ${tokens.bp768})  { flex-direction: column; gap: 12px; }
`;

export const KPIRowHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const KPIActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-left: 12px;
`;

export const KPIIconStack = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

export const KPICard = styled.div`
  background: ${tokens.white};
  border-radius: ${tokens.radius};
  padding: 20px;
  box-shadow: ${tokens.shadow};
  border: 1px solid ${tokens.borderLight};
  flex: 1;
  min-width: 180px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${tokens.shadowMd};
  }

  @media (max-width: ${tokens.bp1200}) { min-width: 160px; }
  @media (max-width: ${tokens.bp768})  { min-width: auto; padding: 16px; }
`;

export const KPITitle = styled.h3`
  font-size: 13px;
  font-weight: 500;
  color: ${tokens.textMuted};
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const KPIMetric = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  padding-top: 10px;
  flex: 1;
  text-align: left;
`;

export const KPINumber = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${tokens.text};
  margin-bottom: 2px;
  line-height: 1;

  @media (max-width: ${tokens.bp768}) { font-size: 26px; }
`;

export const KPISubLabel = styled.div`
  font-size: 12px;
  color: ${tokens.textMuted};
  margin-top: 4px;
`;

export const KPILiveTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.live ? tokens.greenText : tokens.textMuted};
  background: ${props => props.live ? tokens.greenBg : tokens.greyBg};
  padding: 3px 8px;
  border-radius: ${tokens.radiusFull};
  margin-top: 6px;
`;

export const KPILiveDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => props.live ? tokens.green : tokens.grey};
  display: inline-block;
`;

/* KPI action buttons */
export const ReportButton = styled.button`
  background: linear-gradient(180deg, ${tokens.primary}, ${tokens.primaryDark});
  color: white;
  border: none;
  border-radius: ${tokens.radiusSm};
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: ${tokens.shadowPrimary};
  white-space: nowrap;
  transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
`;

export const IconCircleButton = styled.button`
  background: ${tokens.primary};
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  box-shadow: ${tokens.shadowPrimary};
  font-size: 16px;
  transition: all 0.2s ease;

  &:hover {
    background: ${tokens.primaryDark};
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(26,75,143,0.35);
  }
  &:active { transform: translateY(0); }

  @media (max-width: ${tokens.bp768}) { width: 36px; height: 36px; }
`;

export const NotifDot = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: ${tokens.red};
  border-radius: 50%;
  border: 1px solid white;
`;

/* Notification dropdown */
export const NotifDropdownWrapper = styled.div`
  position: relative;
`;

export const NotifDropdown = styled.div`
  position: absolute;
  right: 0;
  top: 8px;
  background: ${tokens.white};
  border: 1px solid ${tokens.border};
  border-radius: ${tokens.radius};
  box-shadow: ${tokens.shadowMd};
  width: 310px;
  z-index: 50;
`;

export const NotifDropdownHeader = styled.div`
  padding: 10px 14px;
  border-bottom: 1px solid ${tokens.border};
  font-weight: 600;
  font-size: 13px;
  color: ${tokens.text};
`;

export const NotifDropdownBody = styled.div`
  padding: 10px 14px;
  font-size: 12px;
  color: ${tokens.text};
  max-height: 360px;
  overflow-y: auto;
`;

export const NotifCard = styled.div`
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${tokens.border};
  &:last-child { border-bottom: none; margin-bottom: 0; }
`;

export const NotifActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

export const NotifButton = styled.button`
  padding: 5px 10px;
  background: ${props => props.primary ? tokens.primary : '#f1f3f4'};
  color: ${props => props.primary ? '#fff' : tokens.text};
  border: none;
  border-radius: ${tokens.radiusXs};
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity: 0.85; }
`;

/* ══════════════════════════════════════════════════════════════════
   5. FLIGHTS TABLE (Dashboard widget — compact)
══════════════════════════════════════════════════════════════════ */

export const TableContainer = styled.div`
  background: ${tokens.white};
  border-radius: ${tokens.radius};
  box-shadow: ${tokens.shadow};
  border: 1px solid ${tokens.borderLight};
  overflow: hidden;
`;

export const TableHeaderBar = styled.div`
  padding: 18px 20px;
  border-bottom: 1px solid ${tokens.border};
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: ${tokens.bp768}) { padding: 14px 16px; }
`;

export const TableTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${tokens.text};
  margin: 0;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const TableHead = styled.thead`
  background: ${tokens.surfaceHover};
`;

export const TableHeaderCell = styled.th`
  padding: 14px 20px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: ${tokens.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  border-bottom: 1px solid ${tokens.border};

  @media (max-width: ${tokens.bp768}) { padding: 10px 14px; font-size: 10px; }
`;

export const TableBody = styled.tbody``;

export const TableRow = styled.tr`
  border-bottom: 1px solid #f1f3f4;
  transition: background 0.15s ease;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};

  &:hover { background: ${props => props.clickable ? tokens.primaryLight : tokens.surfaceHover}; }
  &:nth-child(even) { background: ${tokens.rowAlt}; }
  &:nth-child(even):hover { background: ${props => props.clickable ? tokens.primaryLight : tokens.surfaceHover}; }
  &:last-child { border-bottom: none; }
`;

export const TableCell = styled.td`
  padding: 14px 20px;
  font-size: 13px;
  color: ${tokens.text};
  vertical-align: middle;

  @media (max-width: ${tokens.bp768}) { padding: 10px 14px; font-size: 12px; }
`;

export const FlightNumber = styled.span`
  font-weight: 700;
  color: ${tokens.primary};
  cursor: pointer;
  &:hover { text-decoration: underline; }
`;

export const AirlineInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const AirlineLogo = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${tokens.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
`;

export const TimeCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const ScheduledTime = styled.span`
  font-weight: 500;
  color: ${tokens.text};
  font-size: 13px;
`;

export const ActualTime = styled.span`
  font-size: 12px;
  color: ${props => props.delayed ? tokens.red : tokens.green};
  font-weight: 500;
`;

export const DelayValue = styled.span`
  font-weight: 600;
  font-size: 13px;
  color: ${props => {
    if (!props.value || props.value === 0) return tokens.green;
    if (props.value <= 15) return tokens.amber;
    return tokens.red;
  }};
`;

export const StatusPill = styled.span`
  padding: 4px 10px;
  border-radius: ${tokens.radiusFull};
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  background: ${props => {
    switch (props.status) {
      case 'on-time':    case 'On-Time':    case 'On Time': return tokens.greenBg;
      case 'moderate':   case 'Minor Delay': return tokens.amberBg;
      case 'high':       case 'Major Delay': return tokens.redBg;
      case 'Cancelled':                      return tokens.greyBg;
      default:                               return tokens.greyBg;
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'on-time':    case 'On-Time':    case 'On Time': return tokens.greenText;
      case 'moderate':   case 'Minor Delay': return tokens.amberText;
      case 'high':       case 'Major Delay': return tokens.redText;
      default:                               return tokens.grey;
    }
  }};
`;

export const CauseTag = styled.span`
  padding: 3px 9px;
  border-radius: ${tokens.radiusFull};
  font-size: 11px;
  font-weight: 500;
  background: ${props => {
    switch (props.cause) {
      case 'Weather':    return tokens.causeWeatherBg;
      case 'Congestion': return tokens.causeCongestionBg;
      case 'Reactionary':return tokens.causeReactionaryBg;
      case 'Historical': return tokens.causeHistoricalBg;
      case 'Airline':    return tokens.causeAirlineBg;
      default:           return tokens.greyBg;
    }
  }};
  color: ${props => {
    switch (props.cause) {
      case 'Weather':    return tokens.causeWeather;
      case 'Congestion': return tokens.causeCongestion;
      case 'Reactionary':return tokens.causeReactionary;
      case 'Historical': return tokens.causeHistorical;
      case 'Airline':    return tokens.causeAirline;
      default:           return tokens.grey;
    }
  }};
`;

export const RouteInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  white-space: nowrap;
  font-size: 13px;
`;

export const ChevronIcon = styled.span`
  color: ${tokens.textLight};
  font-size: 18px;
`;

/* ══════════════════════════════════════════════════════════════════
   6. FLIGHTS PAGE (full page)
══════════════════════════════════════════════════════════════════ */

export const FilterBar = styled.div`
  background: ${tokens.white};
  border-radius: ${tokens.radius};
  box-shadow: ${tokens.shadow};
  border: 1px solid ${tokens.borderLight};
  padding: 16px 20px;
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: ${tokens.bp768}) { padding: 14px 16px; gap: 10px; }
`;

export const SearchBox = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 10px 14px;
  border: 1px solid ${tokens.border};
  border-radius: ${tokens.radiusSm};
  font-size: 14px;
  background: ${tokens.white};
  color: ${tokens.text};
  transition: all 0.2s ease;
  outline: none;

  &:focus {
    border-color: ${tokens.primary};
    box-shadow: 0 0 0 3px ${tokens.primaryLight};
  }
  &::placeholder { color: ${tokens.textLight}; }
`;

export const FilterSelect = styled.select`
  padding: 10px 14px;
  border: 1px solid ${tokens.border};
  border-radius: ${tokens.radiusSm};
  font-size: 14px;
  background: ${tokens.white};
  color: ${tokens.text};
  cursor: pointer;
  min-width: 130px;
  outline: none;
  transition: all 0.2s ease;
  &:focus {
    border-color: ${tokens.primary};
    box-shadow: 0 0 0 3px ${tokens.primaryLight};
  }
`;

export const TimeToggleContainer = styled.div`
  display: flex;
  background: #f1f3f4;
  border-radius: ${tokens.radiusSm};
  padding: 2px;
`;

export const TimeToggleButton = styled.button`
  padding: 8px 16px;
  border: none;
  background: ${props => props.active ? tokens.primary : 'transparent'};
  color: ${props => props.active ? 'white' : tokens.textMuted};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  &:hover { color: ${props => props.active ? 'white' : tokens.primary}; }
`;

/* Full-page table container */
export const FullTableContainer = styled.div`
  background: ${tokens.white};
  border-radius: ${tokens.radius};
  box-shadow: ${tokens.shadow};
  border: 1px solid ${tokens.borderLight};
  overflow: hidden;
  flex: 1;
`;

export const FullTableHeaderCell = styled.th`
  padding: 14px 20px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: ${tokens.text};
  border-bottom: 1px solid ${tokens.border};
  text-transform: uppercase;
  letter-spacing: 0.4px;

  @media (max-width: ${tokens.bp768}) { padding: 10px 14px; font-size: 11px; }
`;

/* Side panel: alerts on FlightsPage */
export const SideAlertsPanel = styled.div`
  width: 250px;
  background: linear-gradient(180deg, #FDECEC, ${tokens.white});
  border-radius: ${tokens.radius};
  box-shadow: ${tokens.shadow};
  border: 1px solid ${tokens.borderLight};
  display: flex;
  flex-direction: column;
  max-height: 600px;

  @media (max-width: ${tokens.bp1200}) { width: 100%; max-height: 400px; }
  @media (max-width: ${tokens.bp768})  { max-height: 300px; }
`;

export const SideAlertsHeader = styled.div`
  padding: 14px 16px;
  border-bottom: 1px solid ${tokens.border};
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SideAlertsTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  color: ${tokens.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const SideAlertIcon = styled.div`
  width: 20px;
  height: 20px;
  background: ${tokens.red};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
`;

export const SideAlertsContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
`;

export const SideAlertCard = styled.div`
  padding: 10px 12px;
  border-bottom: 1px solid #f1f3f4;
  border-left: 3px solid ${props => props.severity === 'high' ? tokens.red : tokens.amber};
  margin-bottom: 8px;
  border-radius: 0 4px 4px 0;
  &:last-child { border-bottom: none; margin-bottom: 0; }
`;

export const SideAlertFlight = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${tokens.primary};
  margin-bottom: 4px;
`;

export const SideAlertMessage = styled.div`
  font-size: 11px;
  color: ${tokens.text};
  line-height: 1.35;
`;

/* Detail drawer */
export const DetailDrawer = styled.div`
  position: fixed;
  top: 64px;
  right: ${props => props.isOpen ? '0' : '-420px'};
  width: 420px;
  height: calc(100vh - 64px);
  background: ${tokens.white};
  box-shadow: -4px 0 24px rgba(0,0,0,0.12);
  border-left: 1px solid ${tokens.borderLight};
  transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  display: flex;
  flex-direction: column;

  @media (max-width: ${tokens.bp768}) {
    width: 100%;
    right: ${props => props.isOpen ? '0' : '-100%'};
  }
`;

export const DrawerHeader = styled.div`
  padding: 22px 24px;
  border-bottom: 1px solid ${tokens.border};
  background: linear-gradient(135deg, ${tokens.primaryLight}, ${tokens.white});
`;

export const DrawerTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${tokens.text};
  margin: 0 0 6px 0;
`;

export const DrawerSubtitle = styled.p`
  font-size: 13px;
  color: ${tokens.textMuted};
  margin: 0;
`;

export const DrawerContent = styled.div`
  flex: 1;
  padding: 22px 24px;
  overflow-y: auto;
`;

export const DrawerSection = styled.div`
  margin-bottom: 22px;
  &:last-child { margin-bottom: 0; }
`;

export const DrawerSectionTitle = styled.h3`
  font-size: 13px;
  font-weight: 700;
  color: ${tokens.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin: 0 0 10px 0;
`;

export const DrawerFooter = styled.div`
  padding: 18px 24px;
  border-top: 1px solid ${tokens.border};
  display: flex;
  gap: 10px;
`;

export const DrawerButton = styled.button`
  flex: 1;
  padding: 11px 20px;
  border: none;
  border-radius: ${tokens.radiusSm};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.primary ? css`
    background: ${tokens.primary};
    color: white;
    &:hover { background: ${tokens.primaryDark}; }
  ` : css`
    background: #f1f3f4;
    color: ${tokens.textMuted};
    &:hover { background: ${tokens.border}; color: ${tokens.text}; }
  `}

  &:disabled {
    background: #cbd5e1 !important;
    color: #94a3b8 !important;
    cursor: not-allowed;
  }
`;

/* Cause breakdown inside drawer */
export const CauseBreakdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const CauseItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const CauseLabel = styled.div`
  font-size: 13px;
  color: ${tokens.text};
  min-width: 100px;
`;

export const CauseBar = styled.div`
  flex: 1;
  height: 8px;
  background: #f1f3f4;
  border-radius: 4px;
  overflow: hidden;
`;

export const CauseFill = styled.div`
  height: 100%;
  background: ${props => {
    switch (props.cause) {
      case 'Weather':     return tokens.causeWeather;
      case 'Congestion':  return tokens.causeCongestion;
      case 'Reactionary': return tokens.causeReactionary;
      case 'Historical':  return tokens.causeHistorical;
      case 'Airline':     return tokens.causeAirline;
      default:            return tokens.grey;
    }
  }};
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

export const CausePercentage = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${tokens.text};
  min-width: 36px;
  text-align: right;
`;

export const PropagationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const PropagationItem = styled.div`
  padding: 10px 12px;
  background: ${tokens.surfaceHover};
  border-radius: ${tokens.radiusSm};
  border-left: 3px solid ${tokens.primary};
`;

export const PropagationFlight = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${tokens.primary};
  margin-bottom: 2px;
`;

export const PropagationDelay = styled.div`
  font-size: 12px;
  color: ${tokens.textMuted};
`;

export const DrawerBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  z-index: 999;
`;

/* Prediction block inside drawer */
export const PredictionBlock = styled.div`
  background: ${tokens.primaryLight};
  border-radius: ${tokens.radiusSm};
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const PredictionRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const PredictionLabel = styled.span`
  font-size: 13px;
  color: ${tokens.textMuted};
`;

export const PredictionValue = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: ${tokens.text};
`;

export const ProbBar = styled.div`
  height: 6px;
  background: #e1e5e9;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 2px;
`;

export const ProbFill = styled.div`
  height: 100%;
  width: ${props => props.pct}%;
  background: ${props =>
    props.pct > 50 ? tokens.red :
    props.pct > 25 ? tokens.amber :
    tokens.green};
  border-radius: 3px;
  transition: width 0.4s ease;
`;

/* ══════════════════════════════════════════════════════════════════
   7. WEATHER PANEL
══════════════════════════════════════════════════════════════════ */

export const WeatherPanel = styled.div`
  width: 300px;
  background: linear-gradient(180deg, ${tokens.primaryLight}, ${tokens.white});
  border-radius: ${tokens.radius};
  box-shadow: ${tokens.shadow};
  border: 1px solid ${tokens.borderLight};
  display: flex;
  flex-direction: column;
  margin-right: -8px;

  @media (max-width: ${tokens.bp1200}) { width: 100%; margin-right: 0; }
`;

export const WeatherHeader = styled.div`
  padding: 14px 16px 10px;
  border-bottom: 1px solid ${tokens.border};
`;

export const WeatherTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: ${tokens.primary};
  margin: 0 0 5px 0;
`;

export const WeatherLiveTag = styled.div`
  font-size: 11px;
  color: ${tokens.greenText};
  display: flex;
  align-items: center;
  gap: 5px;
`;

export const WeatherLiveDot = styled.span`
  width: 7px;
  height: 7px;
  background: ${tokens.green};
  border-radius: 50%;
  display: inline-block;
`;

export const WeatherContent = styled.div`
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 0;
`;

export const WeatherRow = styled.div`
  background: ${tokens.white};
  border-radius: ${tokens.radiusSm};
  border: 1px solid ${tokens.borderLight};
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  & + & { margin-top: 8px; }
`;

export const WeatherRowLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
`;

export const WeatherIcon = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: ${tokens.primaryLight};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${tokens.primary};
  font-size: 14px;
  flex-shrink: 0;
`;

export const WeatherLabel = styled.div`
  font-size: 12px;
  color: ${tokens.textMuted};
`;

export const WeatherRight = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const WeatherValue = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${tokens.text};
`;

export const WeatherUnit = styled.span`
  font-size: 12px;
  color: ${tokens.textMuted};
`;

/* ══════════════════════════════════════════════════════════════════
   8. ALERTS PANEL
══════════════════════════════════════════════════════════════════ */

export const AlertsContainer = styled.div`
  width: 320px;
  background: ${tokens.white};
  border-radius: ${tokens.radius};
  box-shadow: ${tokens.shadow};
  border: 1px solid ${tokens.borderLight};
  display: flex;
  flex-direction: column;
  max-height: 600px;

  @media (max-width: ${tokens.bp1200}) { width: 100%; max-height: 400px; }
  @media (max-width: ${tokens.bp768})  { max-height: 300px; }
`;

export const AlertsHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${tokens.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background 0.2s ease;
  &:hover { background: ${tokens.surfaceHover}; }
`;

export const AlertsTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: ${tokens.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const AlertIconCircle = styled.div`
  width: 24px;
  height: 24px;
  background: ${tokens.red};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
`;

export const AlertsToggle = styled.button`
  background: none;
  border: none;
  color: ${tokens.textMuted};
  cursor: pointer;
  font-size: 18px;
  transition: transform 0.2s ease;
  transform: ${props => props.collapsed ? 'rotate(180deg)' : 'rotate(0deg)'};
  &:hover { color: ${tokens.text}; }
`;

export const AlertsContent = styled.div`
  flex: 1;
  overflow-y: auto;
  display: ${props => props.collapsed ? 'none' : 'flex'};
  flex-direction: column;
`;

export const AlertCard = styled.div`
  padding: 14px 18px;
  border-bottom: 1px solid #f1f3f4;
  border-left: 4px solid ${props => props.severity === 'high' ? tokens.red : tokens.amber};
  transition: background 0.15s ease;
  &:hover { background: ${tokens.surfaceHover}; }
  &:last-child { border-bottom: none; }

  @media (max-width: ${tokens.bp768}) { padding: 12px 14px; }
`;

export const AlertCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 6px;
`;

export const AlertFlight = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${tokens.primary};
`;

export const AlertTime = styled.div`
  font-size: 11px;
  color: ${tokens.textMuted};
`;

export const AlertMessage = styled.div`
  font-size: 12px;
  color: ${tokens.text};
  line-height: 1.45;
  margin-bottom: 10px;
`;

export const AlertActionsRow = styled.div`
  display: flex;
  gap: 8px;
`;

export const AlertButton = styled.button`
  padding: 5px 11px;
  border: none;
  border-radius: ${tokens.radiusXs};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  ${props => props.primary ? css`
    background: ${tokens.primary};
    color: white;
    &:hover { background: ${tokens.primaryDark}; }
  ` : css`
    background: #f1f3f4;
    color: ${tokens.textMuted};
    &:hover { background: ${tokens.border}; color: ${tokens.text}; }
  `}
`;

export const AlertsEmptyState = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: ${tokens.textMuted};
  font-size: 14px;
`;

/* ══════════════════════════════════════════════════════════════════
   9. VISUAL ANALYTICS
══════════════════════════════════════════════════════════════════ */

export const AnalyticsSection = styled.div`
  background: ${tokens.white};
  border-radius: ${tokens.radius};
  padding: 20px;
  box-shadow: ${tokens.shadow};
  border: 1px solid ${tokens.borderLight};
`;

export const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: ${tokens.bp1200}) { grid-template-columns: 1fr; }
`;

export const AnalyticsCard = styled.div`
  background: linear-gradient(180deg, ${tokens.white}, #f9fbff);
  border-radius: ${tokens.radius};
  padding: 16px;
  box-shadow: ${tokens.shadow};
  border: 1px solid ${tokens.borderLight};
`;

export const AnalyticsTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${tokens.text};
  margin: 0 0 14px 0;
`;

/* ══════════════════════════════════════════════════════════════════
   10. QUICK ACTIONS
══════════════════════════════════════════════════════════════════ */

export const QuickActionsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 14px;
  padding: 20px 0;

  @media (max-width: ${tokens.bp768}) {
    flex-direction: column;
    gap: 10px;
    padding: 16px 0;
  }
`;

export const ActionButton = styled.button`
  padding: 13px 22px;
  border-radius: ${tokens.radiusSm};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 180px;
  justify-content: center;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return css`
          background: linear-gradient(135deg, ${tokens.primary} 0%, ${tokens.primaryMid} 100%);
          color: white;
          border: none;
          box-shadow: ${tokens.shadowPrimary};
          &:hover {
            background: linear-gradient(135deg, ${tokens.primaryDark} 0%, ${tokens.primary} 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(26,75,143,0.4);
          }
        `;
      case 'secondary':
        return css`
          background: #f1f3f4;
          color: ${tokens.textMuted};
          border: none;
          &:hover { background: ${tokens.border}; color: ${tokens.text}; transform: translateY(-1px); }
        `;
      case 'outlined':
        return css`
          background: transparent;
          color: ${tokens.primary};
          border: 2px solid ${tokens.primary};
          &:hover { background: ${tokens.primary}; color: white; transform: translateY(-1px); }
        `;
      default:
        return '';
    }
  }}

  &:active { transform: translateY(0); }

  @media (max-width: ${tokens.bp768}) { min-width: auto; width: 100%; padding: 14px 22px; }
`;

/* ══════════════════════════════════════════════════════════════════
   11. MITIGATION BOARD
══════════════════════════════════════════════════════════════════ */

export const BoardTopBar = styled.div`
  background: ${tokens.white};
  border-radius: ${tokens.radius};
  padding: 12px 16px;
  box-shadow: ${tokens.shadow};
  border: 1px solid ${tokens.borderLight};
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

export const BoardSearch = styled.input`
  padding: 10px 12px;
  border: 1px solid ${tokens.border};
  border-radius: ${tokens.radiusSm};
  font-size: 14px;
  flex: 1;
  min-width: 220px;
  outline: none;
  &:focus {
    border-color: ${tokens.primary};
    box-shadow: 0 0 0 3px ${tokens.primaryLight};
  }
  &::placeholder { color: #9ca3af; }
`;

export const BoardSelect = styled.select`
  padding: 10px 12px;
  border: 1px solid ${tokens.border};
  border-radius: ${tokens.radiusSm};
  font-size: 14px;
  background: ${tokens.white};
  color: ${tokens.text};
  outline: none;
`;

export const BoardButton = styled.button`
  padding: 9px 14px;
  border-radius: ${tokens.radiusSm};
  border: none;
  background: ${props => props.secondary ? '#f1f3f4' : tokens.primary};
  color: ${props => props.secondary ? tokens.text : '#fff'};
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity: 0.88; }
`;

export const BoardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1024px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 640px)  { grid-template-columns: 1fr; }
`;

export const BoardColumn = styled.div`
  background: ${tokens.white};
  border-radius: ${tokens.radius};
  border: 1px solid ${tokens.borderLight};
  box-shadow: ${tokens.shadow};
  display: flex;
  flex-direction: column;
  max-height: 70vh;
`;

export const BoardColumnHeader = styled.div`
  padding: 12px 14px;
  border-bottom: 1px solid #eef1f4;
  font-weight: 700;
  font-size: 13px;
  color: ${tokens.primary};
`;

export const BoardColumnBody = styled.div`
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const BoardCard = styled.div`
  position: relative;
  background: ${tokens.white};
  border: 1px solid ${tokens.borderLight};
  border-radius: ${tokens.radiusSm};
  padding: 12px;
  box-shadow: ${tokens.shadow};
  cursor: pointer;
  transition: box-shadow 0.15s;
  &:hover { box-shadow: ${tokens.shadowMd}; }
`;

export const BoardCardTitle = styled.div`
  font-weight: 800;
  color: ${tokens.text};
  font-size: 14px;
`;

export const BoardCardSub = styled.div`
  font-size: 12px;
  color: ${tokens.textMuted};
  margin-top: 2px;
`;

export const SeverityBadge = styled.span`
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: ${tokens.radiusFull};
  color: ${p => p.severity === 'major' ? tokens.redText : p.severity === 'moderate' ? tokens.amberText : tokens.greenText};
  background: ${p => p.severity === 'major' ? tokens.redBg : p.severity === 'moderate' ? tokens.amberBg : tokens.greenBg};
`;

export const BoardTag = styled.span`
  font-size: 11px;
  padding: 3px 8px;
  border-radius: ${tokens.radiusFull};
  background: #eef2ff;
  color: ${tokens.primary};
`;

export const BoardPill = styled.span`
  font-size: 11px;
  padding: 3px 8px;
  border-radius: ${tokens.radiusFull};
  background: #f3f4f6;
  color: ${tokens.text};
  font-weight: 600;
`;

export const BoardModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export const BoardModal = styled.div`
  background: ${tokens.white};
  border-radius: ${tokens.radius};
  box-shadow: ${tokens.shadowLg};
  padding: 24px;
  width: 420px;
  max-width: 95vw;
`;

export const BoardModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
`;

export const BoardDrawer = styled.div`
  position: fixed;
  top: 64px;
  right: ${props => props.open ? '0' : '-480px'};
  width: 460px;
  height: calc(100vh - 64px);
  background: ${tokens.white};
  box-shadow: -4px 0 24px rgba(0,0,0,0.1);
  border-left: 1px solid ${tokens.borderLight};
  transition: right 0.3s cubic-bezier(0.4,0,0.2,1);
  z-index: 999;
  overflow-y: auto;

  @media (max-width: ${tokens.bp768}) { width: 100%; right: ${p => p.open ? '0' : '-100%'}; }
`;

export const BoardDrawerBody = styled.div`
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const BoardDrawerSection = styled.div`
  background: ${tokens.surfaceHover};
  border-radius: ${tokens.radiusSm};
  padding: 14px;
`;

/* ══════════════════════════════════════════════════════════════════
   12. SIMULATION PAGE
══════════════════════════════════════════════════════════════════ */

export const SimPanels = styled.div`
  display: flex;
  gap: 24px;
  @media (max-width: ${tokens.bp1200}) { flex-direction: column; }
`;

export const SimControlPanel = styled.div`
  background: ${tokens.white};
  border-radius: ${tokens.radius};
  box-shadow: ${tokens.shadow};
  border: 1px solid ${tokens.borderLight};
  flex: 0 0 420px;
  min-width: 340px;
  padding: 22px;
`;

export const SimResultPanel = styled.div`
  background: ${tokens.white};
  border-radius: ${tokens.radius};
  box-shadow: ${tokens.shadow};
  border: 1px solid ${tokens.borderLight};
  flex: 1;
  padding: 22px;
  display: flex;
  flex-direction: column;
`;

export const SimLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: ${tokens.text};
  margin-bottom: 6px;
`;

export const SimInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${tokens.border};
  border-radius: ${tokens.radiusSm};
  font-size: 14px;
  color: ${tokens.text};
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s;
  &:focus {
    border-color: ${tokens.primary};
    box-shadow: 0 0 0 3px ${tokens.primaryLight};
  }
`;

export const SimSelect = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${tokens.border};
  border-radius: ${tokens.radiusSm};
  font-size: 14px;
  background: ${tokens.white};
  color: ${tokens.text};
  outline: none;
  &:focus {
    border-color: ${tokens.primary};
    box-shadow: 0 0 0 3px ${tokens.primaryLight};
  }
`;

export const SimRunButton = styled.button`
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, ${tokens.primary}, ${tokens.primaryMid});
  color: white;
  border: none;
  border-radius: ${tokens.radiusSm};
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${tokens.shadowPrimary};
  &:hover {
    background: linear-gradient(135deg, ${tokens.primaryDark}, ${tokens.primary});
    box-shadow: 0 6px 20px rgba(26,75,143,0.4);
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

/* ══════════════════════════════════════════════════════════════════
   13. SHARED UTILITY ATOMS
══════════════════════════════════════════════════════════════════ */

/** Generic primary/secondary button */
export const Button = styled.button`
  padding: 10px 18px;
  border-radius: ${tokens.radiusSm};
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.primary ? css`
    background: ${tokens.primary};
    color: white;
    &:hover { background: ${tokens.primaryDark}; }
  ` : css`
    background: #f1f3f4;
    color: ${tokens.textMuted};
    &:hover { background: ${tokens.border}; color: ${tokens.text}; }
  `}

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export const LoadingText = styled.div`
  padding: 20px;
  color: ${tokens.textMuted};
  font-size: 14px;
  text-align: center;
`;

export const ErrorText = styled.div`
  padding: 12px 20px;
  color: ${tokens.redText};
  background: ${tokens.redBg};
  border-radius: ${tokens.radiusSm};
  font-size: 13px;
  margin: 8px 0;
`;

export const EmptyState = styled.div`
  padding: 48px 20px;
  text-align: center;
  color: ${tokens.textMuted};
  font-size: 14px;
`;

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${tokens.border};
  margin: 16px 0;
`;

/** Inline spin animation for loading indicators */
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
export const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${tokens.primaryLight};
  border-top-color: ${tokens.primary};
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
  margin: 0 auto;
`;