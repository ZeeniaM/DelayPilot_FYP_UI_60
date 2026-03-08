/**
 * WeatherPanel.js
 * ─────────────────────────────────────────────────────────────────
 * Styled-components from components.styles.js.
 * Props:
 *   liveWeather — object from predictionService.fetchWeather() (or null)
 * Pipeline fields: temperature_2m, wind_speed_10m, precipitation,
 *                  visibility, weather_code, timestamp
 * ─────────────────────────────────────────────────────────────────
 */

import React from 'react';
import {
  WeatherPanel as Panel, WeatherHeader, WeatherTitle, WeatherLiveTag, WeatherLiveDot,
  WeatherContent, WeatherRow, WeatherRowLeft, WeatherIcon, WeatherLabel,
  WeatherRight, WeatherValue, WeatherUnit,
} from '../styles/components.styles';

// WMO weather code → emoji
const weatherCodeIcon = (code) => {
  if (code === null || code === undefined) return '🌡';
  if (code === 0)                          return '☀️';
  if (code <= 3)                           return '🌤';
  if (code <= 49)                          return '🌫';
  if (code <= 69)                          return '🌧';
  if (code <= 79)                          return '❄️';
  if (code <= 99)                          return '⛈';
  return '🌡';
};

const weatherCodeLabel = (code) => {
  if (code === null || code === undefined) return 'Unknown';
  if (code === 0)   return 'Clear Sky';
  if (code <= 3)    return 'Partly Cloudy';
  if (code <= 49)   return 'Fog / Haze';
  if (code <= 69)   return 'Rainy';
  if (code <= 79)   return 'Snowy';
  if (code <= 99)   return 'Thunderstorm';
  return 'Unknown';
};

// Fallback values
const FALLBACK = {
  temperature:  14,
  wind_speed:   16,
  precipitation: 0,
  visibility:   9000,
  weather_code: 2,
};

const WeatherPanel = ({ liveWeather = null }) => {
  const isLive = !!liveWeather;
  const w = isLive ? {
    temperature:   liveWeather.temperature ?? FALLBACK.temperature,
    wind_speed:    liveWeather.wind_speed   ?? FALLBACK.wind_speed,
    precipitation: liveWeather.precipitation ?? 0,
    visibility:    liveWeather.visibility   ?? FALLBACK.visibility,
    weather_code:  liveWeather.weather_code ?? 0,
    timestamp:     liveWeather.timestamp,
  } : FALLBACK;

  const updatedLabel = isLive && w.timestamp
    ? new Date(w.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const rows = [
    { icon: weatherCodeIcon(w.weather_code), label: 'Condition',    value: weatherCodeLabel(w.weather_code), unit: '' },
    { icon: '🌡',  label: 'Temperature',   value: w.temperature,                             unit: '°C'  },
    { icon: '💨',  label: 'Wind Speed',    value: w.wind_speed,                              unit: 'km/h' },
    { icon: '🌧',  label: 'Precipitation', value: w.precipitation,                           unit: 'mm'  },
    { icon: '👁',  label: 'Visibility',    value: Math.round((w.visibility || 0) / 1000),    unit: 'km'  },
  ];

  return (
    <Panel>
      <WeatherHeader>
        <WeatherTitle>Current Weather – Munich Airport</WeatherTitle>
        <WeatherLiveTag>
          <WeatherLiveDot />
          {isLive ? `Updated ${updatedLabel || 'just now'}` : 'Demo data'}
        </WeatherLiveTag>
      </WeatherHeader>

      <WeatherContent>
        {rows.map(row => (
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
      </WeatherContent>
    </Panel>
  );
};

export default WeatherPanel;