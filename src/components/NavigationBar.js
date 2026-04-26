/**
 * NavigationBar.js — COMPLETE REPLACEMENT
 *
 * Bell opens a full-screen dialog modal (not a small dropdown).
 * Buttons are fully wired:
 *   Dismiss      → calls onAlertDismiss(flightNo) → removes from display
 *   Add to Board → calls onAlertAddToBoard(flightNo) → button turns green,
 *                  stays green on every subsequent open (reads alert.isOnBoard)
 *                  No navigation, no dialog close — user sees the green button.
 */
import React, { useState, useEffect } from 'react';
import {
  NavContainer, NavLogo, NavLogoIcon, NavTabs, NavTab,
  NavUserSection, NavUserInfo, NavAvatar, NavUserText,
  NavDropdown, NavDropdownItem,
} from '../styles/components.styles';


const NavigationBar = ({
  userRole, userName, onLogout, activeTab, onTabChange,
  notifCount = 0, hasNewNotif = false, notifOpen = false,
  liveAlerts = [],
  adminDeletionRequests = [],
  adminHasNewRequests = false,
  onNotifClick, onNotifClose,
  onAdminRequestsDismiss,
  onAdminRequestsRead,
  onAlertDismiss,      // (flightNo) => void
  onAlertAddToBoard,   // (flightNo) => void
  onDeleteUser,        // (request) => void
  onRejectRequest,     // (request) => void
  onDismissRequest,    // (requestId) => void
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const tabs = userRole === 'Admin'
    ? ['User Management', 'Settings']
    : ['Dashboard', 'Flights', 'Simulation', 'Mitigation Board'];

  const displayName  = (userName || '').trim();
  const avatarLetter = displayName
    ? displayName.charAt(0).toUpperCase()
    : (userRole || '').charAt(0);
  const userLabel = userRole === 'Admin'
    ? 'Logged in as Admin'
    : displayName ? `${displayName} (${userRole})` : userRole;

  // Close on Escape key
  useEffect(() => {
    if (!notifOpen) return;
    const h = (e) => { if (e.key === 'Escape') onNotifClose && onNotifClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [notifOpen, onNotifClose]);

  useEffect(() => {
    if (userRole === 'Admin' && notifOpen) {
      onAdminRequestsRead && onAdminRequestsRead();
    }
  }, [notifOpen, onAdminRequestsRead, userRole]);

  // Only show non-dismissed alerts
  const visibleAlerts = liveAlerts.filter(a => !a.isDismissed);
  const activeCount = userRole === 'Admin'
    ? adminDeletionRequests.length
    : visibleAlerts.length;
  const showBellDot = userRole === 'Admin'
    ? adminHasNewRequests && !notifOpen
    : hasNewNotif && !notifOpen;

  const formatRequestTime = (value) => {
    if (!value) return 'Unknown';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  const handleDismiss = (e, flightNo) => {
    e.stopPropagation();
    onAlertDismiss && onAlertDismiss(flightNo);
  };

  const handleAddToBoard = (e, alert) => {
    e.stopPropagation();
    if (alert.isOnBoard) return;   // already on board — button is display-only
    onAlertAddToBoard && onAlertAddToBoard(alert.flightNo);
    // No navigation, no close — button turns green in place via alert.isOnBoard
  };

  return (
    <>
      {/* ── Navigation bar ─────────────────────────────────────── */}
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

          {/* Bell */}
          <button
            onClick={onNotifClick}
            title="Alerts"
            style={{
              background:   notifOpen ? '#1A4B8F' : 'rgba(26,75,143,0.12)',
              border:       '1.5px solid #1A4B8F',
              borderRadius: '50%',
              width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              marginRight: 8,
              flexShrink: 0,
              transition: 'background 0.18s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={notifOpen ? '#fff' : '#1A4B8F'}
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {/* Red dot for new unseen alerts */}
            {showBellDot && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                width: 8, height: 8,
                background: '#ef4444', borderRadius: '50%',
                border: '1.5px solid white',
              }} />
            )}
            {/* Count badge */}
            {activeCount > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -5,
                background: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 700,
                borderRadius: '50%', minWidth: 16, height: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid white',
                padding: '0 2px',
              }}>
                {activeCount > 99 ? '99+' : activeCount}
              </span>
            )}
          </button>

          {/* User */}
          <NavUserInfo onClick={() => setShowUserDropdown(v => !v)}>
            <NavAvatar>{avatarLetter}</NavAvatar>
            <NavUserText>{userLabel}</NavUserText>
          </NavUserInfo>

          <NavDropdown show={showUserDropdown}>
            <NavDropdownItem onClick={() => { setShowUserDropdown(false); onTabChange && onTabChange('Profile'); }}>
              Profile
            </NavDropdownItem>
            <NavDropdownItem onClick={() => { setShowUserDropdown(false); onLogout && onLogout(); }}>
              Logout
            </NavDropdownItem>
          </NavDropdown>

        </NavUserSection>
      </NavContainer>

      {/* ── Alerts Dialog ──────────────────────────────────────── */}
      {notifOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={onNotifClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 1100,
            }}
          />

          {/* Dialog */}
          <div
            role="dialog"
            aria-label="Active Alerts"
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 480,
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: '80vh',
              background: '#fff',
              borderRadius: 14,
              boxShadow: '0 20px 60px rgba(0,0,0,0.28)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1200,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f0f0f0',
              background: '#f8faff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  background: userRole === 'Admin' ? '#fef3c7' : '#fee2e2',
                  color: userRole === 'Admin' ? '#92400e' : '#991B1B',
                  borderRadius: '50%', width: 30, height: 30,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0,
                }}>⚠</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1A4B8F' }}>
                  {userRole === 'Admin' ? 'Account Deletion Requests' : 'Active Alerts'}
                </span>
                {activeCount > 0 && (
                  <span style={{
                    background: userRole === 'Admin' ? '#fef3c7' : '#fee2e2',
                    color: userRole === 'Admin' ? '#92400e' : '#991B1B',
                    fontSize: 11, fontWeight: 700,
                    padding: '2px 9px', borderRadius: 999,
                  }}>
                    {activeCount}
                  </span>
                )}
              </div>
              <button
                onClick={onNotifClose}
                style={{
                  border: 'none', background: 'transparent',
                  fontSize: 22, color: '#888', cursor: 'pointer',
                  lineHeight: 1,
                }}
              >×</button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px' }}>
              {userRole === 'Admin' ? (
                adminDeletionRequests.length === 0 ? (
                  <div style={{
                    color: '#888', fontSize: 14,
                    textAlign: 'center', padding: '40px 0',
                  }}>
                    No pending account deletion requests.
                  </div>
                ) : (
                  adminDeletionRequests.map(request => (
                    <div
                      key={request.id}
                      style={{
                        background: '#fff',
                        border: '1px solid #e8eef8',
                        borderLeft: '4px solid #f59e0b',
                        borderRadius: 8,
                        padding: '12px 14px',
                        marginBottom: 10,
                      }}
                    >
                      <strong style={{ color: '#1A4B8F', fontSize: 14 }}>
                        {request.name || request.username || 'Unknown User'}
                      </strong>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                        {request.username} · {request.role}
                      </div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 8, marginBottom: 10 }}>
                        Requested: {formatRequestTime(request.requestTime)}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => onDeleteUser && onDeleteUser(request)}
                          style={{ padding: '5px 12px', fontSize: 12, border: 'none',
                                   background: '#dc2626', color: '#fff', borderRadius: 6, cursor: 'pointer' }}>
                          Delete User
                        </button>
                        <button
                          onClick={() => onRejectRequest && onRejectRequest(request)}
                          style={{ padding: '5px 12px', fontSize: 12, border: 'none',
                                   background: '#f59e0b', color: '#fff', borderRadius: 6, cursor: 'pointer' }}>
                          Reject Request
                        </button>
                        <button
                          onClick={() => onDismissRequest && onDismissRequest(request.id)}
                          style={{ padding: '5px 12px', fontSize: 12, border: '1px solid #d1d5db',
                                   background: '#f9fafb', color: '#374151', borderRadius: 6, cursor: 'pointer' }}>
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : visibleAlerts.length === 0 ? (
                <div style={{
                  color: '#888', fontSize: 14,
                  textAlign: 'center', padding: '40px 0',
                }}>
                  No active major delay alerts.
                </div>
              ) : (
                visibleAlerts.map(alert => (
                  <div
                    key={alert.flightNo}
                    style={{
                      background: '#fff',
                      border: '1px solid #e8eef8',
                      borderLeft: '4px solid #dc2626',
                      borderRadius: 8,
                      padding: '12px 14px',
                      marginBottom: 10,
                    }}
                  >
                    {/* Flight + badge */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 6,
                    }}>
                      <strong style={{ color: '#1A4B8F', fontSize: 14 }}>
                        {alert.flightNo}
                      </strong>
                      <span style={{
                        background: '#fee2e2', color: '#dc2626',
                        fontSize: 10, fontWeight: 700,
                        padding: '2px 8px', borderRadius: 99,
                      }}>
                        MAJOR DELAY
                      </span>
                    </div>

                    {/* Message */}
                    <div style={{
                      fontSize: 12, color: '#444', lineHeight: 1.5, marginBottom: 6,
                    }}>
                      {alert.message}
                    </div>

                    {/* Time */}
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 10 }}>
                      Scheduled: {alert.time}
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={(e) => handleDismiss(e, alert.flightNo)}
                        style={{
                          padding: '6px 16px', fontSize: 12,
                          border: '1px solid #d1d5db',
                          background: '#f9fafb', color: '#374151',
                          borderRadius: 6, cursor: 'pointer', fontWeight: 500,
                        }}
                      >
                        Dismiss
                      </button>

                      <button
                        onClick={(e) => handleAddToBoard(e, alert)}
                        style={{
                          padding: '6px 16px', fontSize: 12,
                          border: 'none',
                          background: alert.isOnBoard ? '#166534' : '#1A4B8F',
                          color: '#fff',
                          borderRadius: 6,
                          cursor: alert.isOnBoard ? 'default' : 'pointer',
                          fontWeight: 500,
                          transition: 'background 0.15s',
                        }}
                      >
                        {alert.isOnBoard ? '✓ On Board' : 'Add to Board'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #f0f0f0',
              background: '#f8faff',
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={onNotifClose}
                style={{
                  padding: '7px 20px', fontSize: 13,
                  border: '1px solid #d1d5db',
                  background: '#fff', color: '#374151',
                  borderRadius: 7, cursor: 'pointer', fontWeight: 500,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default NavigationBar;
