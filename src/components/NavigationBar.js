/**
 * NavigationBar.js
 * ─────────────────────────────────────────────────────────────────
 * The notification bell lives here so it persists across all pages.
 * Bell state (open/alerts/count) is owned by App.js and passed down.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  NavContainer, NavLogo, NavLogoIcon, NavTabs, NavTab,
  NavUserSection, NavUserInfo, NavAvatar, NavUserText,
  NavDropdown, NavDropdownItem,
  NotifDropdown, NotifDropdownHeader, NotifDropdownBody,
  NotifCard, NotifActions, NotifButton,
} from '../styles/components.styles';

const NavigationBar = ({
  userRole, userName, onLogout, activeTab, onTabChange,
  // Bell props from App.js
  notifCount = 0, hasNewNotif = false, notifOpen = false,
  liveAlerts = [], onNotifClick, onNotifClose,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const bellRef  = useRef(null);
  const dropRef  = useRef(null);

  const displayName  = (userName && userName.trim()) || '';
  const avatarLetter = displayName
    ? displayName.trim().charAt(0).toUpperCase()
    : (userRole || '').charAt(0);

  const userLabel = userRole === 'Admin'
    ? 'Logged in as Admin'
    : displayName
      ? `${displayName} (${userRole})`
      : userRole;

  const tabs = userRole === 'Admin'
    ? ['User Management', 'Settings']
    : ['Dashboard', 'Flights', 'Simulation', 'Mitigation Board'];

  // Close notif dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (
        bellRef.current && !bellRef.current.contains(e.target) &&
        dropRef.current  && !dropRef.current.contains(e.target)
      ) {
        onNotifClose && onNotifClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen, onNotifClose]);

  const handleLogout = () => {
    setShowUserDropdown(false);
    onLogout && onLogout();
  };

  const handleProfile = () => {
    setShowUserDropdown(false);
    onTabChange && onTabChange('Profile');
  };

  return (
    <NavContainer>
      <NavLogo onClick={() => onTabChange && onTabChange('Dashboard')}>
        <NavLogoIcon>✈</NavLogoIcon>
        DelayPilot
      </NavLogo>

      <NavTabs>
        {tabs.map(tab => (
          <NavTab
            key={tab}
            active={activeTab === tab}
            onClick={() => onTabChange && onTabChange(tab)}
          >
            {tab}
          </NavTab>
        ))}
      </NavTabs>

      <NavUserSection style={{ position: 'relative' }}>

        {/* ── Bell button — always visible, blue ── */}
        <button
          ref={bellRef}
          onClick={onNotifClick}
          title="Notifications"
          style={{
            background: notifOpen ? '#1A4B8F' : 'rgba(26,75,143,0.12)',
            border: '1.5px solid #1A4B8F',
            borderRadius: '50%',
            width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            marginRight: 8,
            flexShrink: 0,
            transition: 'background 0.18s, border-color 0.18s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={notifOpen ? '#fff' : '#1A4B8F'}
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {hasNewNotif && !notifOpen && (
            <span style={{
              position: 'absolute', top: 2, right: 2,
              width: 8, height: 8,
              background: '#ef4444', borderRadius: '50%',
              border: '1.5px solid white',
            }} />
          )}
        </button>

        {/* ── Notification dropdown — anchored below the bell ── */}
        {notifOpen && (
          <div
            ref={dropRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 42,           // aligns under the bell
              width: 320,
              background: '#fff',
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              border: '1px solid #e5e7eb',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            <div style={{
              padding: '12px 16px',
              fontWeight: 700, fontSize: 13, color: '#1A4B8F',
              borderBottom: '1px solid #f0f0f0',
              background: '#f8faff',
            }}>
              Active Alerts {liveAlerts.length > 0 ? `(${liveAlerts.length})` : ''}
            </div>
            <div style={{ maxHeight: 340, overflowY: 'auto', padding: '8px 12px' }}>
              {liveAlerts.length === 0 ? (
                <div style={{ color: '#888', padding: '12px 4px', fontSize: 13 }}>
                  No active alerts.
                </div>
              ) : (
                liveAlerts.map(alert => (
                  <div key={alert.id} style={{
                    background: '#f8faff',
                    border: '1px solid #e8eef8',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 8,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong style={{ color: '#1A4B8F', fontSize: 13 }}>{alert.flightNo}</strong>
                      <span style={{
                        background: alert.severity === 'high' ? '#fee2e2' : '#fef9c3',
                        color:      alert.severity === 'high' ? '#dc2626' : '#92400e',
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                      }}>
                        {alert.severity === 'high' ? 'MAJOR' : 'MINOR'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#555', lineHeight: 1.4 }}>
                      {alert.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── User info + dropdown ── */}
        <NavUserInfo onClick={() => setShowUserDropdown(!showUserDropdown)}>
          <NavAvatar>{avatarLetter}</NavAvatar>
          <NavUserText>{userLabel}</NavUserText>
        </NavUserInfo>

        <NavDropdown show={showUserDropdown}>
          <NavDropdownItem onClick={handleProfile}>Profile</NavDropdownItem>
          <NavDropdownItem onClick={handleLogout}>Logout</NavDropdownItem>
        </NavDropdown>

      </NavUserSection>
    </NavContainer>
  );
};

export default NavigationBar;