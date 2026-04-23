import React, { useCallback, useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import NavigationBar from './NavigationBar';
import { PageLayout } from './PageLayout';
import API_BASE_URL from '../config/api';

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
  justify-content: center;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #333333;
  margin: 0;
`;

const SettingsLayout = styled.div`
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 8px;
  overflow: hidden;
  align-self: start;
`;

const TabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: none;
  border-left: 3px solid ${props => props.active ? '#1A4B8F' : 'transparent'};
  color: ${props => props.active ? '#1A4B8F' : '#64748b'};
  font-weight: ${props => props.active ? 600 : 500};
  padding: 12px 20px;
  cursor: pointer;
  text-align: left;
  font-size: 14px;

  &:hover {
    color: #1A4B8F;
    background: #f8fafc;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.05);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
`;

const SectionTitle = styled.div`
  font-weight: 800;
  color: #333;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(160px, 240px) minmax(0, 1fr);
  gap: 12px 20px;
  font-size: 14px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Key = styled.div`
  color: #64748b;
  font-weight: 600;
`;

const Value = styled.div`
  color: #1f2937;
`;

const StatusText = styled.span`
  color: ${props => props.online ? '#16a34a' : '#dc2626'};
  font-weight: 700;
`;

const FormRow = styled.div`
  display: flex;
  align-items: end;
  gap: 12px;
  flex-wrap: wrap;
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #333;
  font-weight: 600;
  font-size: 14px;
`;

const Input = styled.input`
  width: 180px;
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

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  background: ${props => props.primary ? '#1A4B8F' : '#f1f3f4'};
  color: ${props => props.primary ? '#fff' : '#333'};

  &:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const Note = styled.div`
  color: #64748b;
  font-size: 13px;
  margin-top: 12px;
  line-height: 1.5;
`;

const Message = styled.div`
  color: ${props => props.error ? '#dc2626' : '#16a34a'};
  font-size: 13px;
  font-weight: 600;
`;

const PermissionsMatrix = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  font-size: 14px;

  th, td {
    padding: 10px 12px;
    text-align: center;
    border: 1px solid #e0e0e0;
  }

  th {
    background: #f5f5f5;
    font-weight: 600;
    color: #333;
  }

  td:first-child {
    text-align: left;
    font-weight: 600;
  }

  input[type="checkbox"] {
    cursor: pointer;
    width: 16px;
    height: 16px;
  }
`;

const LogsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }

  th {
    background: #f5f5f5;
    font-weight: 600;
    color: #333;
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

const RefreshButton = styled.button`
  border: none;
  background: transparent;
  color: #1A4B8F;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.7;
  }
`;

const EmptyMessage = styled.div`
  padding: 24px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 24px;
  color: #64748b;
  font-size: 14px;

  &:before {
    content: "";
    width: 16px;
    height: 16px;
    border: 2px solid #dbe3ec;
    border-top-color: #1A4B8F;
    border-radius: 50%;
    animation: ${spin} 0.8s linear infinite;
  }
`;

const LogsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.35); opacity: 0.55; }
`;

const TimelineItem = styled.div`
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
`;

const Dot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 5px;
  background: ${props => props.kind === 'error' ? '#dc2626' : props.kind === 'skipped' ? '#94a3b8' : (props.kind === 'running' || props.kind === 'info') ? '#f59e0b' : '#16a34a'};
  animation: ${props => props.kind === 'running' ? pulse : 'none'} 1.2s ease-in-out infinite;
`;

const TimelineLabel = styled.div`
  color: #1f2937;
  font-weight: 700;
`;

const TimelineTime = styled.div`
  color: #64748b;
  font-size: 13px;
  margin-top: 2px;
`;

const ErrorDetail = styled.div`
  color: #dc2626;
  font-size: 12px;
  margin-top: 4px;
`;

const DurationBadge = styled.span`
  display: inline-block;
  margin-left: 6px;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 12px;
  font-weight: 600;
`;

const WarningBox = styled.div`
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 14px;
`;

const InfoRows = styled.div`
  border-top: 1px solid #eef1f4;
  margin-top: 16px;
  padding-top: 16px;
  display: grid;
  gap: 8px;
  color: #334155;
  font-size: 14px;
`;

const defaultPermissions = {
  APOC: { trackerEdit: true, simulationRun: true, alertsReceive: true },
  AOC: { trackerEdit: true, simulationRun: true, alertsReceive: true },
  ATC: { trackerEdit: false, simulationRun: false, alertsReceive: false }
};

const tabConfig = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'permissions', label: 'Permissions', icon: 'shield' },
  { id: 'logs', label: 'System Logs', icon: 'logs' }
];

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

const getHealthPayload = (data) => data?.fastapi || data || {};

const formatLoginDate = (value) => {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  }).format(date);
};

const formatHealthDate = (value) => {
  if (!value || value === 'pending' || value === 'None') return 'Not yet run this session';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not yet run this session';
  return `${date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  })} UTC`;
};

const isPendingHealthValue = (value) => !value || value === 'pending' || value === 'None';

const truncate = (value, max = 120) => {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max)}...` : value;
};

const Icon = ({ type }) => {
  if (type === 'shield') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }
  if (type === 'logs') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
};

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
    strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

const Settings = ({
  userRole,
  userName,
  onLogout,
  activeTab: navActiveTab,
  onTabChange,
  notifCount,
  hasNewNotif,
  notifOpen,
  liveAlerts,
  onNotifClick,
  onNotifClose,
  onAlertDismiss,
  onAlertAddToBoard,
  ...navExtras
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [pipelineHealth, setPipelineHealth] = useState(null);
  const [healthReachable, setHealthReachable] = useState(false);
  const [intervalValue, setIntervalValue] = useState(30);
  const [intervalMessage, setIntervalMessage] = useState('');
  const [intervalSaving, setIntervalSaving] = useState(false);

  const [permissions, setPermissions] = useState(defaultPermissions);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [permissionsMessage, setPermissionsMessage] = useState('');
  const [permissionsSaving, setPermissionsSaving] = useState(false);

  const [loginLogs, setLoginLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [visibleLogsCount, setVisibleLogsCount] = useState(20);
  const [pipelineLogs, setPipelineLogs] = useState([]);
  const [pipelineWarning, setPipelineWarning] = useState(false);

  const fetchSettings = useCallback(async () => {
    const response = await axios.get(`${API_BASE_URL}/auth/settings`, {
      headers: authHeaders()
    });
    return response.data.settings || [];
  }, []);

  const fetchPipelineHealth = useCallback(async () => {
    const response = await axios.get(`${API_BASE_URL}/predictions/health`);
    const health = getHealthPayload(response.data);
    setPipelineHealth(health);
    setHealthReachable(true);
    return health;
  }, []);

  const fetchOverview = useCallback(async () => {
    const [settingsResult, healthResult] = await Promise.allSettled([
      fetchSettings(),
      fetchPipelineHealth()
    ]);

    if (settingsResult.status === 'fulfilled') {
      const settingsRows = settingsResult.value;
      const refreshInterval = settingsRows.find(row => row.key === 'refresh_interval_minutes');
      setIntervalValue(Number(refreshInterval?.value || 30));
    } else {
      console.error('Error loading overview settings:', settingsResult.reason);
    }

    if (healthResult.status === 'rejected') {
      console.error('Error loading pipeline health:', healthResult.reason);
      setHealthReachable(false);
    }
  }, [fetchPipelineHealth, fetchSettings]);

  const fetchPermissions = useCallback(async () => {
    setPermissionsLoading(true);
    setPermissionsMessage('');
    try {
      const settingsRows = await fetchSettings();
      const rolePerms = settingsRows.find(row => row.key === 'role_permissions');
      if (rolePerms?.value) {
        setPermissions(JSON.parse(rolePerms.value));
      }
      setPermissionsLoaded(true);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissionsMessage('Error loading permissions');
    } finally {
      setPermissionsLoading(false);
    }
  }, [fetchSettings]);

  const fetchLoginLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/login-logs`, {
        headers: authHeaders()
      });
      if (response.data.success) {
        setLoginLogs(response.data.logs || []);
        setVisibleLogsCount(20);
      }
    } catch (error) {
      console.error('Error fetching login logs:', error);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const fetchPipelineLogs = useCallback(async () => {
    setPipelineWarning(false);
    try {
      const response = await axios.get(`${API_BASE_URL}/predictions/pipeline-logs`, {
        headers: authHeaders()
      });
      const logs = Array.isArray(response.data?.logs)
        ? response.data.logs
        : Array.isArray(response.data)
          ? response.data
          : [];
      const health = response.data?.health || {};

      setPipelineLogs(logs);
      setPipelineHealth(health);
      setHealthReachable(true);

      if (health.last_error === 'Pipeline server not reachable') {
        setHealthReachable(false);
        setPipelineWarning(true);
      }
    } catch (error) {
      console.error('Error fetching pipeline logs:', error);
      setHealthReachable(false);
      setPipelineWarning(true);
      setPipelineLogs([]);
      setPipelineHealth({
        last_ran: null,
        running: false,
        last_error: 'Pipeline server not reachable'
      });
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (activeTab === 'permissions' && !permissionsLoaded) {
      fetchPermissions();
    }
    if (activeTab === 'logs') {
      fetchLoginLogs();
      fetchPipelineLogs();
    }
  }, [activeTab, fetchLoginLogs, fetchPermissions, fetchPipelineLogs, permissionsLoaded]);

  const handleIntervalSave = async () => {
    setIntervalSaving(true);
    setIntervalMessage('');
    try {
      await axios.put(
        `${API_BASE_URL}/auth/settings`,
        { key: 'refresh_interval_minutes', value: String(intervalValue) },
        { headers: authHeaders() }
      );
      setIntervalMessage('Refresh interval saved');
    } catch (error) {
      console.error('Error saving refresh interval:', error);
      setIntervalMessage('Error saving refresh interval');
    } finally {
      setIntervalSaving(false);
    }
  };

  const handlePermissionChange = (role, permission) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: !prev[role]?.[permission]
      }
    }));
  };

  const handleSavePermissions = async () => {
    setPermissionsSaving(true);
    setPermissionsMessage('');
    try {
      await axios.put(
        `${API_BASE_URL}/auth/settings`,
        { key: 'role_permissions', value: JSON.stringify(permissions) },
        { headers: authHeaders() }
      );
      setPermissionsMessage('Permissions saved successfully');
    } catch (error) {
      console.error('Error saving permissions:', error);
      setPermissionsMessage('Error saving permissions');
    } finally {
      setPermissionsSaving(false);
    }
  };

  const renderOverview = () => (
    <LogsStack>
      <Card>
        <InfoGrid>
          <Key>System Name</Key>
          <Value>DelayPilot</Value>
          <Key>Timezone</Key>
          <Value>UTC</Value>
          <Key>Server</Key>
          <Value>localhost:8000 (FastAPI) · localhost:5000 (Express)</Value>
          <Key>Database</Key>
          <Value>PostgreSQL via Supabase</Value>
          <Key>Pipeline Status</Key>
          <Value>
            <StatusText online={healthReachable}>{healthReachable ? '✓ Online' : '✗ Offline'}</StatusText>
          </Value>
          <Key>Last Refresh</Key>
          <Value>{formatHealthDate(pipelineHealth?.last_ran)}</Value>
          <Key>Version</Key>
          <Value>1.0.0</Value>
        </InfoGrid>
      </Card>

      <Card>
        <SectionTitle style={{ marginBottom: 16 }}>Pipeline Refresh Interval</SectionTitle>
        <FormRow>
          <Field>
            Refresh Interval (minutes)
            <Input
              type="number"
              min="5"
              max="120"
              step="5"
              value={intervalValue}
              onChange={(event) => setIntervalValue(Number(event.target.value))}
            />
          </Field>
          <Button primary onClick={handleIntervalSave} disabled={intervalSaving}>
            {intervalSaving ? 'Saving...' : 'Save'}
          </Button>
          {intervalMessage && <Message error={intervalMessage.startsWith('Error')}>{intervalMessage}</Message>}
        </FormRow>
        <Note>
          Controls how often the data pipeline fetches live flight and weather data.
          Minimum 5 minutes. Takes effect on next server restart.
        </Note>
      </Card>
    </LogsStack>
  );

  const renderPermissions = () => (
    <Card>
      <SectionHeader>
        <SectionTitle>Role Permissions</SectionTitle>
      </SectionHeader>
      {permissionsLoading ? (
        <Spinner>Loading permissions...</Spinner>
      ) : (
        <>
          {permissionsMessage && <Message error={permissionsMessage.startsWith('Error')} style={{ marginBottom: 16 }}>{permissionsMessage}</Message>}
          <PermissionsMatrix>
            <thead>
              <tr>
                <th>Role</th>
                <th>Tracker Board Edit</th>
                <th>Run Simulation</th>
                <th>Receive Alerts</th>
              </tr>
            </thead>
            <tbody>
              {['APOC', 'AOC', 'ATC'].map(role => (
                <tr key={role}>
                  <td>{role}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={permissions[role]?.trackerEdit || false}
                      onChange={() => handlePermissionChange(role, 'trackerEdit')}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={permissions[role]?.simulationRun || false}
                      onChange={() => handlePermissionChange(role, 'simulationRun')}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={permissions[role]?.alertsReceive || false}
                      onChange={() => handlePermissionChange(role, 'alertsReceive')}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </PermissionsMatrix>
          <Button primary onClick={handleSavePermissions} disabled={permissionsSaving}>
            {permissionsSaving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </>
      )}
    </Card>
  );

  const renderSystemLogs = () => (
    <LogsStack>
      <Card>
        <SectionHeader>
          <SectionTitle>Login History</SectionTitle>
          <RefreshButton onClick={fetchLoginLogs} title="Refresh login history" aria-label="Refresh login history">
            <RefreshIcon />
          </RefreshButton>
        </SectionHeader>
        {logsLoading ? (
          <Spinner>Loading logs...</Spinner>
        ) : loginLogs.length === 0 ? (
          <EmptyMessage>No login activity in the past 7 days.</EmptyMessage>
        ) : (
          <>
            <LogsTable>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {loginLogs.slice(0, visibleLogsCount).map(log => (
                  <tr key={log.id}>
                    <td>{log.name || log.username}</td>
                    <td>{log.role}</td>
                    <td>{formatLoginDate(log.logged_in_at)}</td>
                  </tr>
                ))}
              </tbody>
            </LogsTable>
            {loginLogs.length > visibleLogsCount ? (
              <Button style={{ marginTop: 16 }} onClick={() => setVisibleLogsCount(count => count + 20)}>
                Show {Math.min(20, loginLogs.length - visibleLogsCount)} more
              </Button>
            ) : (
              <Note>All {loginLogs.length} entries shown</Note>
            )}
          </>
        )}
      </Card>

      <Card>
        <SectionHeader>
          <SectionTitle>Pipeline Activity</SectionTitle>
          <RefreshButton onClick={fetchPipelineLogs} title="Refresh pipeline activity" aria-label="Refresh pipeline activity">
            <RefreshIcon />
          </RefreshButton>
        </SectionHeader>
        {pipelineWarning ? (
          <WarningBox>
            Pipeline server not reachable. Check that the FastAPI server is running on port 8000.
          </WarningBox>
        ) : pipelineLogs.length === 0 ? (
          <Timeline>
            <TimelineItem>
              <Dot kind="info" />
              <div>
                <TimelineLabel>No pipeline cycle has run yet this session.</TimelineLabel>
                <TimelineTime>The first refresh runs approximately 30 minutes after startup.</TimelineTime>
              </div>
            </TimelineItem>
          </Timeline>
        ) : (
          <Timeline>
            {pipelineLogs.map((entry, index) => (
              <TimelineItem key={entry.id || index}>
                <Dot kind={entry.status || 'success'} />
                <div>
                  <TimelineLabel>
                    {entry.event || 'Pipeline event'}
                    {entry.duration_seconds != null && (
                      <DurationBadge>({entry.duration_seconds}s)</DurationBadge>
                    )}
                  </TimelineLabel>
                  <TimelineTime>{formatLoginDate(entry.timestamp || entry.time || entry.created_at)}</TimelineTime>
                  {entry.error && (
                    <ErrorDetail>{truncate(entry.error)}</ErrorDetail>
                  )}
                </div>
              </TimelineItem>
            ))}
          </Timeline>
        )}
        <InfoRows>
          <div>
            <strong>Last successful refresh:</strong>{' '}
            <span style={{ color: isPendingHealthValue(pipelineHealth?.last_ran) ? '#64748b' : '#334155' }}>
              {formatHealthDate(pipelineHealth?.last_ran)}
            </span>
          </div>
          <div>
            <strong>Current status:</strong>{' '}
            {pipelineWarning || !healthReachable ? (
              <span style={{ color: '#dc2626', fontWeight: 700 }}>Offline</span>
            ) : pipelineHealth?.running ? (
              <span style={{ color: '#b45309', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Dot kind="running" style={{ marginTop: 0 }} /> Running
              </span>
            ) : (
              <span style={{ color: '#64748b', fontWeight: 700 }}>Idle</span>
            )}
          </div>
        </InfoRows>
      </Card>
    </LogsStack>
  );

  const renderActiveTab = () => {
    if (activeTab === 'permissions') return renderPermissions();
    if (activeTab === 'logs') return renderSystemLogs();
    return renderOverview();
  };

  return (
    <PageLayout>
      <PageContainer>
        <NavigationBar
          userRole={userRole}
          userName={userName}
          onLogout={onLogout}
          activeTab={navActiveTab}
          onTabChange={onTabChange}
          notifCount={notifCount}
          hasNewNotif={hasNewNotif}
          notifOpen={notifOpen}
          liveAlerts={liveAlerts || []}
          onNotifClick={onNotifClick}
          onNotifClose={onNotifClose}
          onAlertDismiss={onAlertDismiss}
          onAlertAddToBoard={onAlertAddToBoard}
          {...navExtras}
        />
        <MainContent>
          <ContentArea>
            <HeaderRow>
              <Title>System Settings</Title>
            </HeaderRow>

            <SettingsLayout>
              <Sidebar>
                {tabConfig.map(tab => (
                  <TabButton
                    key={tab.id}
                    active={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon type={tab.icon} />
                    {tab.label}
                  </TabButton>
                ))}
              </Sidebar>
              <div>{renderActiveTab()}</div>
            </SettingsLayout>
          </ContentArea>
        </MainContent>
      </PageContainer>
    </PageLayout>
  );
};

export default Settings;
