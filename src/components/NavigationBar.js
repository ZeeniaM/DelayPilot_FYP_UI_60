/**
 * NavigationBar.js
 * Styled-components from components.styles.js — no inline styled defs.
 */

import React, { useState } from 'react';
import {
  NavContainer, NavLogo, NavLogoIcon, NavTabs, NavTab,
  NavUserSection, NavUserInfo, NavAvatar, NavUserText,
  NavDropdown, NavDropdownItem,
} from '../styles/components.styles';

const NavigationBar = ({ userRole, userName, onLogout, activeTab, onTabChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);

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

  const handleLogout = () => {
    setShowDropdown(false);
    onLogout && onLogout();
  };

  const handleProfile = () => {
    setShowDropdown(false);
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

      <NavUserSection>
        <NavUserInfo onClick={() => setShowDropdown(!showDropdown)}>
          <NavAvatar>{avatarLetter}</NavAvatar>
          <NavUserText>{userLabel}</NavUserText>
        </NavUserInfo>

        <NavDropdown show={showDropdown}>
          <NavDropdownItem onClick={handleProfile}>Profile</NavDropdownItem>
          <NavDropdownItem onClick={handleLogout}>Logout</NavDropdownItem>
        </NavDropdown>
      </NavUserSection>
    </NavContainer>
  );
};

export default NavigationBar;