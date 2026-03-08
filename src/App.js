import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import FlightsPage from './components/FlightsPage';
import SimulationPage from './components/SimulationPage';
import MitigationBoard from './components/MitigationBoard';
import UserManagement from './components/UserManagement';
import Settings from './components/Settings';
import Profile from './components/Profile';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('APOC');
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('Dashboard');

  const handleLogin = (userData) => {
    console.log('Login successful:', userData);
    // userData now comes from backend with token and user info
    setUserRole(userData.role);
    setUserName(userData.name || userData.username || '');
    setIsLoggedIn(true);
    // Set default tab based on user role
    if (userData.role === 'Admin') {
      setActiveTab('User Management');
    } else {
      setActiveTab('Dashboard');
    }
  };

  const handleLogout = () => {
    // Clear authentication data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserName('');
    setActiveTab('Dashboard');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <Dashboard
            userRole={userRole}
            userName={userName}
            onLogout={handleLogout}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        );
      case 'Flights':
        return (
          <FlightsPage
            userRole={userRole}
            userName={userName}
            onLogout={handleLogout}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        );
      case 'Simulation':
        return (
          <SimulationPage
            userRole={userRole}
            userName={userName}
            onLogout={handleLogout}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        );
      case 'Mitigation Board':
        return (
          <MitigationBoard
            userRole={userRole}
            userName={userName}
            onLogout={handleLogout}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        );
      case 'User Management':
        return (
          <UserManagement
            userRole={userRole}
            userName={userName}
            onLogout={handleLogout}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        );
      case 'Settings':
        return (
          <Settings
            userRole={userRole}
            userName={userName}
            onLogout={handleLogout}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        );
      case 'Profile':
        return (
          <Profile
            userRole={userRole}
            userName={userName}
            onLogout={handleLogout}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        );
      default:
        // Default based on user role
        if (userRole === 'Admin') {
          return (
            <UserManagement
              userRole={userRole}
              userName={userName}
              onLogout={handleLogout}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          );
        } else {
          return (
            <Dashboard
              userRole={userRole}
              userName={userName}
              onLogout={handleLogout}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          );
        }
    }
  };

  return (
    <div className="App">
      {isLoggedIn ? (
        renderActivePage()
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
