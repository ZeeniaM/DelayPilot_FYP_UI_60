import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import NavigationBar from './NavigationBar';
import { PageLayout } from './PageLayout';

const Container = styled.div`
  min-height: 100vh;
  background: #f5f7fa;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 18px 20px;
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 18px 20px;
  margin-bottom: 14px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: center;
  margin-bottom: 14px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #1A4B8F;
  margin: 0;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin: 0 0 12px 0;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 0;

  @media (max-width: 768px) {
    grid-template-columns: 120px 1fr;
  }
`;

const Label = styled.div`
  min-height: 36px;
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: #666666;
  border-bottom: 1px solid #eef1f4;
`;

const Value = styled.div`
  min-height: 36px;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #333333;
  border-bottom: 1px solid #eef1f4;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FormLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #333333;
`;

const FormInput = styled.input`
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #1A4B8F;
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  font-size: 12px;
  color: #d32f2f;
  margin-top: -4px;
`;

const SuccessMessage = styled.div`
  font-size: 14px;
  color: #2e7d32;
  padding: 12px 16px;
  background: #e8f5e9;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const Button = styled.button`
  padding: 12px 24px;
  background: #1A4B8F;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover:not(:disabled) {
    background: #153d6f;
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
`;

const DangerButton = styled(Button)`
  background: #d32f2f;

  &:hover:not(:disabled) {
    background: #b71c1c;
  }
`;

const DeletionNotice = styled.div`
  padding: 16px;
  background: #fff3e0;
  border-left: 4px solid #ff6f00;
  border-radius: 8px;
  color: #e65100;
  font-size: 14px;
  line-height: 1.6;
`;

const DeletionWarning = styled.div`
  padding: 16px;
  background: #ffebee;
  border-radius: 8px;
  color: #c62828;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
`;

const PermissionsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0;

  th, td {
    height: 28px;
    padding: 4px 8px;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
    font-size: 12px;
  }

  th {
    background: #f5f5f5;
    font-weight: 600;
    color: #333333;
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

const AccessBadge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    if (props.level === 'full') return '#c8e6c9';
    if (props.level === 'view') return '#b3e5fc';
    return '#ffcccc';
  }};
  color: ${props => {
    if (props.level === 'full') return '#2e7d32';
    if (props.level === 'view') return '#01579b';
    return '#c62828';
  }};
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  color: #666666;
  font-size: 14px;
`;

const PasswordHeader = styled.button`
  width: 100%;
  border: none;
  background: transparent;
  color: #333333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
`;

const Profile = ({ userRole, userName, onLogout, activeTab,
  onTabChange, notifCount = 0, hasNewNotif = false, notifOpen = false,
  liveAlerts = [], onNotifClick, onNotifClose, onAlertDismiss, onAlertAddToBoard,
  ...navExtras
}) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Account deletion state
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [deletionRejected, setDeletionRejected] = useState(false);
  const [rejectionBannerDismissed, setRejectionBannerDismissed] = useState(false);
  const [showDeletionConfirmDialog, setShowDeletionConfirmDialog] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    if (userRole !== 'Admin') {
      checkDeletionRequestStatus();
    }
  }, [userRole]);

  useEffect(() => {
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    const dismissed = localStorage.getItem(`rejection_banner_dismissed_${userId}`);
    if (dismissed === 'true') setRejectionBannerDismissed(true);
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setProfile(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkDeletionRequestStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/deletion-request/status', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setDeletionRequested(response.data.hasPending);
        setDeletionRejected(response.data.wasRejected ?? false);
      }
    } catch (error) {
      console.error('Error checking deletion request status:', error);
    }
  };

  const handleDeletionRequest = () => {
    setShowDeletionConfirmDialog(true);
  };

  const confirmDeletionRequest = async () => {
    setShowDeletionConfirmDialog(false);
    setDeletionLoading(true);
    setError('');
    setSuccess('');
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    localStorage.removeItem(`rejection_banner_dismissed_${userId}`);
    setRejectionBannerDismissed(false);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/auth/deletion-request',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setDeletionRequested(true);
        setDeletionRejected(false);
        setSuccess('Deletion request submitted. An administrator will review it shortly.');
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setDeletionRequested(true);
        setSuccess('You already have a pending deletion request.');
      } else {
        setError(error.response?.data?.message || 'Failed to submit deletion request. Please try again.');
      }
    } finally {
      setDeletionLoading(false);
    }
  };

  const handleDismissRejectionBanner = () => {
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    localStorage.setItem(`rejection_banner_dismissed_${userId}`, 'true');
    setRejectionBannerDismissed(true);
  };

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[a-zA-Z]/.test(password)) {
      return 'Password must contain at least one letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'newPassword') {
      setNewPassword(value);
      const error = validatePassword(value);
      setPasswordErrors(prev => ({
        ...prev,
        newPassword: error
      }));
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
      if (value !== newPassword) {
        setPasswordErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else {
        setPasswordErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    } else if (name === 'currentPassword') {
      setCurrentPassword(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    // Validate all fields
    const newPasswordError = validatePassword(newPassword);
    const confirmPasswordError = confirmPassword !== newPassword ? 'Passwords do not match' : '';

    setPasswordErrors({
      newPassword: newPasswordError,
      confirmPassword: confirmPasswordError
    });

    if (newPasswordError || confirmPasswordError || !currentPassword) {
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/auth/profile/password',
        {
          currentPassword,
          newPassword,
          confirmPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordErrors({});
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Failed to update password');
      } else {
        setError('Failed to update password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container>
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
          {...navExtras}
        />
        <Content>
          <LoadingText>Loading profile...</LoadingText>
        </Content>
      </Container>
    );
  }

  return (
    <PageLayout>
    <Container>
      <NavigationBar
        userRole={userRole}
        userName={userName}
        onLogout={onLogout}
        activeTab={activeTab}
        onTabChange={onTabChange}
        notifCount={notifCount} hasNewNotif={hasNewNotif}
        notifOpen={notifOpen} liveAlerts={liveAlerts || []}
        onNotifClick={onNotifClick} onNotifClose={onNotifClose}
        onAlertDismiss={onAlertDismiss} onAlertAddToBoard={onAlertAddToBoard}
        {...navExtras}
      />
      <Content>
        <HeaderRow>
          <div style={{ width: 120, visibility: 'hidden' }} />
          <Title style={{ textAlign: 'center' }}>Profile</Title>
          <div style={{ width: 120, visibility: 'hidden' }} />
        </HeaderRow>

        <Card>
          <SectionTitle>Profile Details</SectionTitle>
          <InfoGrid>
            <Label>Name</Label>
            <Value>{profile?.name || 'N/A'}</Value>
            
            <Label>Username</Label>
            <Value>{profile?.username || 'N/A'}</Value>
            
            <Label>Role</Label>
            <Value>{profile?.role || 'N/A'}</Value>

            <Label>Email</Label>
            <Value>{profile?.email || 'N/A'}</Value>
            
            <Label>Created</Label>
            <Value>{formatDate(profile?.created_at)}</Value>
          </InfoGrid>
        </Card>

        <Card>
          <SectionTitle>My Permissions</SectionTitle>
          <PermissionsTable>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Access Level</th>
              </tr>
            </thead>
            <tbody>
              {userRole === 'APOC' || userRole === 'AOC' ? (
                <>
                  <tr>
                    <td>Flights Overview</td>
                    <td><AccessBadge level="full">View + Add to Board</AccessBadge></td>
                  </tr>
                  <tr>
                    <td>Simulation Tool</td>
                    <td><AccessBadge level="full">Full access (run simulations)</AccessBadge></td>
                  </tr>
                  <tr>
                    <td>Mitigation Tracker Board</td>
                    <td><AccessBadge level="full">Full access (create, edit, close cases)</AccessBadge></td>
                  </tr>
                  <tr>
                    <td>Comments & Chat</td>
                    <td><AccessBadge level="full">Post and view comments</AccessBadge></td>
                  </tr>
                  <tr>
                    <td>User Management</td>
                    <td><AccessBadge level="none">No access</AccessBadge></td>
                  </tr>
                  <tr>
                    <td>System Settings</td>
                    <td><AccessBadge level="none">No access</AccessBadge></td>
                  </tr>
                </>
              ) : userRole === 'ATC' ? (
                <>
                  <tr>
                    <td>Flights Overview</td>
                    <td><AccessBadge level="view">View only</AccessBadge></td>
                  </tr>
                  <tr>
                    <td>Simulation Tool</td>
                    <td><AccessBadge level="view">View only (cannot run)</AccessBadge></td>
                  </tr>
                  <tr>
                    <td>Mitigation Tracker Board</td>
                    <td><AccessBadge level="view">View only (cannot edit cases)</AccessBadge></td>
                  </tr>
                  <tr>
                    <td>Comments & Chat</td>
                    <td><AccessBadge level="view">View only</AccessBadge></td>
                  </tr>
                  <tr>
                    <td>User Management</td>
                    <td><AccessBadge level="none">No access</AccessBadge></td>
                  </tr>
                  <tr>
                    <td>System Settings</td>
                    <td><AccessBadge level="none">No access</AccessBadge></td>
                  </tr>
                </>
              ) : userRole === 'Admin' ? (
                <>
                  <tr>
                    <td>User Management</td>
                    <td><AccessBadge level="full">Full access</AccessBadge></td>
                  </tr>
                  <tr>
                    <td>System Settings</td>
                    <td><AccessBadge level="full">Full access</AccessBadge></td>
                  </tr>
                  <tr>
                    <td>Flight Operations</td>
                    <td><AccessBadge level="none">No access (operational modules)</AccessBadge></td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan="2">No permissions configured for this role.</td>
                </tr>
              )}
            </tbody>
          </PermissionsTable>
        </Card>

        <Card>
          <PasswordHeader type="button" onClick={() => setShowPasswordForm(prev => !prev)}>
            <span>Change Password {showPasswordForm ? '▲' : '▼'}</span>
          </PasswordHeader>
          {showPasswordForm && (
            <>
              {error && <ErrorMessage style={{ marginBottom: '16px', padding: '12px 16px', background: '#ffebee', borderRadius: '8px', marginTop: 16 }}>{error}</ErrorMessage>}
              {success && <SuccessMessage style={{ marginTop: 16 }}>{success}</SuccessMessage>}

              <Form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
                <FormGroup>
                  <FormLabel>Current Password</FormLabel>
                  <FormInput
                    type="password"
                    name="currentPassword"
                    value={currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>New Password</FormLabel>
                  <FormInput
                    type="password"
                    name="newPassword"
                    value={newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password (min 8 characters, letters and numbers)"
                    required
                  />
                  {passwordErrors.newPassword && (
                    <ErrorMessage>{passwordErrors.newPassword}</ErrorMessage>
                  )}
                </FormGroup>

                <FormGroup>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormInput
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    required
                  />
                  {passwordErrors.confirmPassword && (
                    <ErrorMessage>{passwordErrors.confirmPassword}</ErrorMessage>
                  )}
                </FormGroup>

                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    passwordErrors.newPassword ||
                    passwordErrors.confirmPassword
                  }
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </Button>
              </Form>
            </>
          )}
        </Card>

        {userRole !== 'Admin' && (
          <Card>
            <SectionTitle>Account Deletion</SectionTitle>
            {deletionRejected && !rejectionBannerDismissed && (
              <div style={{
                color: '#991b1b',
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 14,
                fontSize: 13,
                lineHeight: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                ⚠️ Your account deletion request has been rejected by the Admin.
                You may submit a new request below if you still wish to delete your account.
                <button
                  onClick={handleDismissRejectionBanner}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#991b1b',
                    fontSize: 16,
                    marginLeft: 10,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                  title="Dismiss"
                >
                  x
                </button>
              </div>
            )}
            {deletionRequested && !deletionRejected ? (
              <DeletionNotice>
                Your deletion request is pending admin review.
                You will be logged out once it is processed.
              </DeletionNotice>
            ) : (
              <>
                <DeletionWarning>
                  Once approved by an administrator, your account will be permanently
                  removed. This cannot be undone.
                </DeletionWarning>
                <DangerButton
                  onClick={handleDeletionRequest}
                  disabled={deletionLoading}
                >
                  {deletionLoading ? 'Submitting...' : 'Request Account Deletion'}
                </DangerButton>
              </>
            )}
          </Card>
        )}
        {showDeletionConfirmDialog && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: '#fff', borderRadius: 12, padding: '28px 32px',
              maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}>
              <h3 style={{ margin: '0 0 10px', color: '#1f2937', fontSize: 17 }}>
                Request Account Deletion
              </h3>
              <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6, margin: '0 0 22px' }}>
                Are you sure you want to request account deletion?
                An administrator will review your request. Once approved,
                your account will be permanently removed and cannot be recovered.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDeletionConfirmDialog(false)}
                  style={{
                    padding: '8px 20px', borderRadius: 7, border: '1px solid #d1d5db',
                    background: '#f9fafb', color: '#374151', cursor: 'pointer', fontSize: 14,
                  }}>
                  Cancel
                </button>
                <button
                  onClick={confirmDeletionRequest}
                  style={{
                    padding: '8px 20px', borderRadius: 7, border: 'none',
                    background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 14,
                    fontWeight: 600,
                  }}>
                  Yes, Request Deletion
                </button>
              </div>
            </div>
          </div>
        )}
      </Content>
    </Container>
    </PageLayout>
  );
};

export default Profile;
