/**
 * QuickActions.js
 * Styled-components from components.styles.js.
 * Props:
 *   onTabChange — navigate to a named tab (passed from Dashboard)
 */

import React from 'react';
import { QuickActionsContainer, ActionButton } from '../styles/components.styles';

const QuickActions = ({ onTabChange }) => (
  <QuickActionsContainer>
    <ActionButton variant="primary"  onClick={() => onTabChange && onTabChange('Simulation')}>
      Run Simulation
    </ActionButton>
    <ActionButton variant="secondary" onClick={() => onTabChange && onTabChange('Mitigation Board')}>
      Mitigation Board
    </ActionButton>
    <ActionButton variant="outlined"  onClick={() => onTabChange && onTabChange('Flights')}>
      ✈ View All Flights
    </ActionButton>
  </QuickActionsContainer>
);

export default QuickActions;