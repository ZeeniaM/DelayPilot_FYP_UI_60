/**
 * WeatherPanel.js
 * ─────────────────────────────────────────────────────────────────
 * Shows:
 *   - Munich (EDDM/MUC): full detail with all available metrics
 *   - Frankfurt (EDDF/FRA) and London Heathrow (EGLL/LHR): summary rows
 *
 * Props:
 *   liveWeather — object from predictionService.fetchWeather()
 *     MUC keys: temperature, wind_speed, wind_gusts, precipitation,
 *               snowfall, visibility, weather_code, cloud_cover,
 *               relative_humidity, timestamp
 *     fra / lhr keys: temperature, wind_speed, precipitation,
 *                     weather_code, visibility
 * ─────────────────────────────────────────────────────────────────
 */

import React from 'react';
import {
  WeatherPanel as Panel, WeatherHeader, WeatherTitle, WeatherLiveTag, WeatherLiveDot,
  WeatherContent, WeatherRow, WeatherRowLeft, WeatherIcon, WeatherLabel,
  WeatherRight, WeatherValue, WeatherUnit,
} from '../styles/components.styles';

// WMO weather code helpers
const weatherCodeIcon = (code) => {
  if (code == null)   return '🌡';
  if (code === 0)     return '☀️';
  if (code <= 3)      return '🌤';
  if (code <= 49)     return '🌫';
  if (code <= 69)     return '🌧';
  if (code <= 79)     return '❄️';
  if (code <= 99)     return '⛈';
  return '🌡';
};

const weatherCodeLabel = (code) => {
  if (code == null)   return 'Unknown';
  if (code === 0)     return 'Clear Sky';
  if (code <= 3)      return 'Partly Cloudy';
  if (code <= 49)     return 'Fog / Haze';
  if (code <= 69)     return 'Rainy';
  if (code <= 79)     return 'Snowy';
  if (code <= 99)     return 'Thunderstorm';
  return 'Unknown';
};

const FALLBACK = {
  temperature: 14, wind_speed: 16, wind_gusts: 22, precipitation: 0,
  snowfall: 0, visibility: 9000, weather_code: 2, cloud_cover: 40,
  relative_humidity: 65,
  fra: { temperature: 13, wind_speed: 14, precipitation: 0, weather_code: 1, visibility: 10000 },
  lhr: { temperature: 11, wind_speed: 19, precipitation: 0.5, weather_code: 3, visibility: 7000 },
};

// Divider row for section separation
const SectionDivider = ({ label }) => (
  <div style={{
    fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)', padding: '10px 0 4px', borderTop: '1px solid rgba(255,255,255,0.15)',
    marginTop: 4,
  }}>
    {label}
  </div>
);

// Compact summary row for FRA/LHR
const SummaryRow = ({ airport, data }) => {
  const icon  = weatherCodeIcon(data?.weather_code);
  const label = weatherCodeLabel(data?.weather_code);
  const temp  = data?.temperature != null ? `${data.temperature}°C` : '—';
  const wind  = data?.wind_speed   != null ? `${data.wind_speed} km/h` : '—';
  const precip = data?.precipitation != null && data.precipitation > 0
    ? ` · ${data.precipitation}mm` : '';
  const vis = data?.visibility != null
    ? ` · ${Math.round(data.visibility / 1000)}km vis` : '';

  return (
    <WeatherRow key={airport}>
      <WeatherRowLeft>
        <WeatherIcon>{icon}</WeatherIcon>
        <div>
          <WeatherLabel style={{ fontWeight: 700, fontSize: 13 }}>{airport}</WeatherLabel>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
            {label}{precip}{vis}
          </div>
        </div>
      </WeatherRowLeft>
      <WeatherRight>
        <WeatherValue style={{ fontSize: 13 }}>{temp}</WeatherValue>
        <WeatherUnit style={{ fontSize: 11 }}>{wind}</WeatherUnit>
      </WeatherRight>
    </WeatherRow>
  );
};

const WeatherPanel = ({ liveWeather = null }) => {
  const isLive = !!liveWeather;
  const w = isLive ? {
    temperature:       liveWeather.temperature       ?? FALLBACK.temperature,
    wind_speed:        liveWeather.wind_speed         ?? FALLBACK.wind_speed,
    wind_gusts:        liveWeather.wind_gusts         ?? FALLBACK.wind_gusts,
    precipitation:     liveWeather.precipitation      ?? 0,
    snowfall:          liveWeather.snowfall            ?? 0,
    visibility:        liveWeather.visibility          ?? FALLBACK.visibility,
    weather_code:      liveWeather.weather_code        ?? 0,
    cloud_cover:       liveWeather.cloud_cover         ?? FALLBACK.cloud_cover,
    relative_humidity: liveWeather.relative_humidity   ?? FALLBACK.relative_humidity,
    timestamp:         liveWeather.timestamp,
    fra:               liveWeather.fra                 ?? FALLBACK.fra,
    lhr:               liveWeather.lhr                 ?? FALLBACK.lhr,
  } : FALLBACK;

  const updatedLabel = isLive && w.timestamp
    ? new Date(w.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  // Full Munich detail rows
  const mucRows = [
    { icon: weatherCodeIcon(w.weather_code), label: 'Condition',    value: weatherCodeLabel(w.weather_code), unit: '' },
    { icon: '🌡',  label: 'Temperature',    value: w.temperature,                                    unit: '°C'  },
    { icon: '💨',  label: 'Wind',           value: w.wind_speed,                                     unit: 'km/h' },
    { icon: '🌬',  label: 'Wind Gusts',     value: w.wind_gusts != null ? Math.round(w.wind_gusts) : '—', unit: w.wind_gusts != null ? 'km/h' : '' },
    { icon: '🌧',  label: 'Precipitation',  value: w.precipitation,                                  unit: 'mm'  },
    { icon: '❄️',  label: 'Snowfall',       value: w.snowfall != null ? w.snowfall : 0,               unit: 'cm'  },
    { icon: '☁',  label: 'Cloud Cover',    value: w.cloud_cover != null ? Math.round(w.cloud_cover) : '—', unit: w.cloud_cover != null ? '%' : '' },
    { icon: '💧',  label: 'Humidity',       value: w.relative_humidity != null ? Math.round(w.relative_humidity) : '—', unit: w.relative_humidity != null ? '%' : '' },
    { icon: '👁',  label: 'Visibility',     value: Math.round((w.visibility || 0) / 1000),            unit: 'km'  },
  ];

  return (
    <Panel>
      <WeatherHeader>
        <WeatherTitle>Airport Weather</WeatherTitle>
        <WeatherLiveTag>
          <WeatherLiveDot />
          {isLive ? `Updated ${updatedLabel || 'just now'}` : 'Demo data'}
        </WeatherLiveTag>
      </WeatherHeader>

      <WeatherContent>
        {/* ── Munich (full detail) ── */}
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
          color: 'rgba(62, 60, 60, 0.88)', paddingBottom: 4,
        }}>
          MUC — Munich
        </div>

        {mucRows.map(row => (
          <WeatherRow key={row.label}>
            <WeatherRowLeft>
              <WeatherIcon>{row.icon}</WeatherIcon>
              <WeatherLabel>{row.label}</WeatherLabel>
            </WeatherRowLeft>
            <WeatherRight>
              <WeatherValue>{row.value}</WeatherValue>
              {row.unit && <WeatherUnit>{row.unit}</WeatherUnit>}
            </WeatherRight>
          </WeatherRow>
        ))}

        {/* ── Connected airports (summary) ── */}
        <SectionDivider label="Connected Airports" />
        <SummaryRow airport="FRA — Frankfurt" data={w.fra} />
        <SummaryRow airport="LHR — Heathrow"  data={w.lhr} />
      </WeatherContent>
    </Panel>
  );
};

export default WeatherPanel;