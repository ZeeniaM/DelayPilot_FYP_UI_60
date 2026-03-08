import React, { useState } from 'react';
import styled from 'styled-components';
import NavigationBar from './NavigationBar';
import { PageLayout } from './PageLayout';

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #F7F9FB;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  gap: 24px;
  padding: 20px;
  max-width: 1680px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #333333;
  margin: 0;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.05);
  margin-bottom: 16px;
`;

const SectionTitle = styled.div`
  font-weight: 800;
  color: #333;
  margin-bottom: 16px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  
  &:focus {
    border-color: #1A4B8F;
    box-shadow: 0 0 0 3px rgba(26,75,143,0.1);
    outline: none;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  color: #333333;
  
  &:focus {
    border-color: #1A4B8F;
    box-shadow: 0 0 0 3px rgba(26,75,143,0.1);
    outline: none;
  }
`;

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  ${p => p.primary ? 'background:#1A4B8F;color:#fff;' : 'background:#f1f3f4;color:#333;'}
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 24px;
  }
  
  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  
  input:checked + .slider {
    background-color: #1A4B8F;
  }
  
  input:checked + .slider:before {
    transform: translateX(26px);
  }
`;

const Settings = ({ userRole, userName, onLogout, activeTab, onTabChange,
  notifCount, hasNewNotif, notifOpen, liveAlerts,
  onNotifClick, onNotifClose
}) => {
  const [settings, setSettings] = useState({
    systemName: 'DelayPilot',
    timezone: 'UTC',
    emailNotifications: true,
    smsNotifications: false,
    autoRefresh: true,
    refreshInterval: 30,
    maxDelayThreshold: 60,
    alertThreshold: 15
  });

  const handleSave = () => {
    console.log('Settings saved:', settings);
    alert('Settings saved successfully!');
  };

  const handleReset = () => {
    setSettings({
      systemName: 'DelayPilot',
      timezone: 'UTC',
      emailNotifications: true,
      smsNotifications: false,
      autoRefresh: true,
      refreshInterval: 30,
      maxDelayThreshold: 60,
      alertThreshold: 15
    });
  };

  return (
    <PageLayout>
    <PageContainer>
      <NavigationBar
        userRole={userRole}
        userName={userName}
        onLogout={onLogout}
        activeTab={activeTab}
        onTabChange={onTabChange}
          notifCount={notifCount}
          hasNewNotif={hasNewNotif}
          notifOpen={notifOpen}
          liveAlerts={liveAlerts || []}
          onNotifClick={onNotifClick}
          onNotifClose={onNotifClose}
        />
      <MainContent>
        <ContentArea>
          <HeaderRow>
            <Title>System Settings</Title>
          </HeaderRow>
          
          <Card>
            <SectionTitle>General Settings</SectionTitle>
            <FormGroup>
              <Label>System Name</Label>
              <Input
                type="text"
                value={settings.systemName}
                onChange={(e) => setSettings(prev => ({ ...prev, systemName: e.target.value }))}
              />
            </FormGroup>
            <FormGroup>
              <Label>Timezone</Label>
              <Select
                value={settings.timezone}
                onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
              >
                <option value="UTC">UTC</option>
                <option value="EST">Eastern Time</option>
                <option value="PST">Pacific Time</option>
                <option value="CET">Central European Time</option>
              </Select>
            </FormGroup>
          </Card>

          <Card>
            <SectionTitle>Notification Settings</SectionTitle>
            <FormGroup>
              <Label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Email Notifications
                <ToggleSwitch>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                  />
                  <span className="slider"></span>
                </ToggleSwitch>
              </Label>
            </FormGroup>
            <FormGroup>
              <Label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                SMS Notifications
                <ToggleSwitch>
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => setSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                  />
                  <span className="slider"></span>
                </ToggleSwitch>
              </Label>
            </FormGroup>
          </Card>

          <Card>
            <SectionTitle>Performance Settings</SectionTitle>
            <FormGroup>
              <Label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Auto Refresh
                <ToggleSwitch>
                  <input
                    type="checkbox"
                    checked={settings.autoRefresh}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                  />
                  <span className="slider"></span>
                </ToggleSwitch>
              </Label>
            </FormGroup>
            <FormGroup>
              <Label>Refresh Interval (seconds)</Label>
              <Input
                type="number"
                value={settings.refreshInterval}
                onChange={(e) => setSettings(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                min="10"
                max="300"
              />
            </FormGroup>
          </Card>

          <Card>
            <SectionTitle>Alert Thresholds</SectionTitle>
            <FormGroup>
              <Label>Maximum Delay Threshold (minutes)</Label>
              <Input
                type="number"
                value={settings.maxDelayThreshold}
                onChange={(e) => setSettings(prev => ({ ...prev, maxDelayThreshold: parseInt(e.target.value) }))}
                min="1"
                max="300"
              />
            </FormGroup>
            <FormGroup>
              <Label>Alert Threshold (minutes)</Label>
              <Input
                type="number"
                value={settings.alertThreshold}
                onChange={(e) => setSettings(prev => ({ ...prev, alertThreshold: parseInt(e.target.value) }))}
                min="1"
                max="60"
              />
            </FormGroup>
          </Card>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button onClick={handleReset}>Reset to Default</Button>
            <Button primary onClick={handleSave}>Save Settings</Button>
          </div>
        </ContentArea>
      </MainContent>
    </PageContainer>
    </PageLayout>
  );
};

export default Settings;