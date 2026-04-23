import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import API_BASE_URL from '../config/api';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 28px;
  width: 100%;
  max-width: 440px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  background: none;
  border: none;
  font-size: 24px;
  color: #666666;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #333333;
  }
`;

const ModalHeader = styled.h2`
  font-size: 22px;
  font-weight: 600;
  color: #333333;
  margin: 0 0 8px;
`;

const ModalText = styled.p`
  font-size: 14px;
  color: #666666;
  margin: 0 0 20px;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #333333;
`;

const Input = styled.input`
  padding: 11px 12px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  background: ${props => props.readOnly ? '#f8fafc' : '#ffffff'};
  color: #333333;

  &:focus {
    outline: none;
    border-color: #1A4B8F;
    box-shadow: 0 0 0 3px rgba(26, 75, 143, 0.1);
  }
`;

const SendButton = styled.button`
  padding: 12px 18px;
  background: #1A4B8F;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #0f3a73;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.45;
  background: ${props => props.error ? '#fee2e2' : '#dcfce7'};
  color: ${props => props.error ? '#991b1b' : '#166534'};
`;

const CodeBox = styled.div`
  padding: 12px;
  border-radius: 8px;
  background: #eef6ff;
  border: 1px solid #bfdbfe;
  color: #1A4B8F;
  font-size: 13px;
  line-height: 1.5;
`;

const Code = styled.span`
  display: inline-block;
  font-family: Consolas, monospace;
  font-weight: 800;
  letter-spacing: 1px;
  background: white;
  border-radius: 6px;
  padding: 3px 7px;
  margin: 0 3px;
`;

const Strength = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: ${props => props.level === 'Strong' ? '#166534' : props.level === 'Medium' ? '#b45309' : '#991b1b'};
`;

const getPasswordStrength = (password) => {
  if (!password) return '';
  const hasLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const score = [hasLength, hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
  if (score >= 4 && password.length >= 10) return 'Strong';
  if (score >= 3) return 'Medium';
  return 'Weak';
};

const ForgotPasswordModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to request reset code');
      }

      setMessage(data.message);
      if (data.reset_code) {
        setResetCode(data.reset_code);
        setUsername(data.username || '');
        setStep(2);
      }
    } catch (err) {
      setError(err.message || 'Failed to request reset code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, token: resetCode, newPassword })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setMessage(data.message);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer>
        <CloseButton onClick={onClose}>×</CloseButton>

        <ModalHeader>Reset Password</ModalHeader>
        <ModalText>
          {step === 1
            ? 'Enter your registered email to generate a reset code.'
            : 'Use the reset code below to set a new password.'}
        </ModalText>

        {error && <Message error>{error}</Message>}
        {message && !error && <Message>{message}</Message>}

        {step === 1 ? (
          <Form onSubmit={handleRequestReset} style={{ marginTop: 16 }}>
            <InputGroup>
              <Label htmlFor="email">Email Address</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </InputGroup>

            <SendButton type="submit" disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Get Reset Code'}
            </SendButton>
          </Form>
        ) : (
          <>
            <CodeBox style={{ marginTop: 16 }}>
              Your reset code is: <Code>{resetCode}</Code> (valid for 15 minutes)
              {username && <div>Account username: <strong>{username}</strong></div>}
            </CodeBox>

            <Form onSubmit={handleResetPassword} style={{ marginTop: 16 }}>
              <InputGroup>
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} readOnly />
              </InputGroup>
              <InputGroup>
                <Label htmlFor="resetCode">Reset Code</Label>
                <Input
                  id="resetCode"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                  required
                />
              </InputGroup>
              <InputGroup>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters, letters and numbers"
                  required
                />
                {strength && <Strength level={strength}>Strength: {strength}</Strength>}
              </InputGroup>
              <InputGroup>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </InputGroup>

              <SendButton type="submit" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </SendButton>
            </Form>
          </>
        )}
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ForgotPasswordModal;
