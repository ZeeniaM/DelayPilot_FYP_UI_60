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
  padding: 32px 24px;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 32px;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #1A4B8F;
  margin: 0 0 24px 0;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  margin: 0 0 16px 0;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const Label = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #666666;
`;

const Value = styled.div`
  font-size: 14px;
  color: #333333;
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

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  color: #666666;
  font-size: 14px;
`;

const Profile = ({ userRole, userName, onLogout, activeTab, onTabChange,
  notifCount, hasNewNotif, notifOpen, liveAlerts,
  onNotifClick, onNotifClose
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

  useEffect(() => {
    fetchProfile();
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
      />
      <Content>
        <Card>
          <Title>Profile Details</Title>
          <InfoGrid>
            <Label>Name:</Label>
            <Value>{profile?.name || 'N/A'}</Value>
            
            <Label>Username:</Label>
            <Value>{profile?.username || 'N/A'}</Value>
            
            <Label>Role:</Label>
            <Value>{profile?.role || 'N/A'}</Value>
            
            <Label>Email:</Label>
            <Value>{profile?.email || 'N/A'}</Value>
            
            <Label>Joined Date:</Label>
            <Value>{formatDate(profile?.created_at)}</Value>
          </InfoGrid>
        </Card>

        <Card>
          <SectionTitle>Change Password</SectionTitle>
          {error && <ErrorMessage style={{ marginBottom: '16px', padding: '12px 16px', background: '#ffebee', borderRadius: '8px' }}>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
          
          <Form onSubmit={handleSubmit}>
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
        </Card>
      </Content>
    </Container>
    </PageLayout>
  );
};

export default Profile;