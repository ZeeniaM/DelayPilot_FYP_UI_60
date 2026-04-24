import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import ForgotPasswordModal from './ForgotPasswordModal';
import API_BASE_URL from '../config/api';

const LoginContainer = styled.div`
  width: 100%;
  max-width: 350px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 32px;
  border: 1px solid rgba(0, 0, 0, 0.05);

  @media (max-width: 480px) {
    margin: 20px;
    padding: 28px 24px;
    max-width: 320px;
  }
`;

const Header = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #333333;
  text-align: center;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #666666;
  text-align: center;
  margin-bottom: 32px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #333333;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  background: #ffffff;
  color: #333333;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #1A4B8F;
    box-shadow: 0 0 0 3px rgba(26, 75, 143, 0.1);
  }

  &::placeholder {
    color: #999999;
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  background: #ffffff;
  color:rgb(51, 51, 51);
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #1A4B8F;
    box-shadow: 0 0 0 3px rgba(63, 128, 219, 0.1);
  }

  option {
    background: #ffffff;
    color: #333333;
    
    &:hover {
      background: rgba(26, 75, 143, 0.1);
      color: #333333;
    }
  }
`;

const LoginButton = styled.button`
  padding: 14px 24px;
  background: linear-gradient(135deg, #00A86B 0%, #00C896 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
  box-shadow: 0 4px 16px rgba(0, 168, 107, 0.3);

  &:hover {
    background: linear-gradient(135deg,rgb(219, 140, 56) 0%,rgb(232, 191, 76) 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 165, 116, 0.4);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(212, 165, 116, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 4px 16px rgba(0, 168, 107, 0.2);
  }
`;

const ForgotPasswordLink = styled.button`
  background: none;
  border: none;
  color: #1A4B8F;
  font-size: 14px;
  cursor: pointer;
  text-align: right;
  margin-top: 8px;
  text-decoration: underline;
  transition: color 0.2s ease;

  &:hover {
    color: #0f3a73;
  }
`;

const ErrorMessage = styled.div`
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
`;

const SuccessMessage = styled.div`
  background-color: #efe;
  border: 1px solid #cfc;
  color: #3c3;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
`;

const FieldError = styled.div`
  color: #dc2626;
  font-size: 12px;
  margin-top: 4px;
`;

const InputWithError = styled(Input)`
  border-color: ${props => props.hasError ? '#dc2626' : '#e1e5e9'};
  
  &:focus {
    border-color: ${props => props.hasError ? '#dc2626' : '#1A4B8F'};
    box-shadow: ${props => props.hasError ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 0 0 3px rgba(26, 75, 143, 0.1)'};
  }
`;

const MUNICH_AIRLINES = [
  'Lufthansa', 'Air France', 'British Airways', 'Ryanair', 'easyJet',
  'Turkish Airlines', 'Swiss International Air Lines', 'Austrian Airlines',
  'Eurowings', 'KLM', 'Iberia', 'ITA Airways', 'Finnair',
  'SAS Scandinavian Airlines', 'TAP Air Portugal', 'LOT Polish Airlines',
  'Wizz Air', 'Vueling', 'Condor', 'Brussels Airlines',
  'Croatia Airlines', 'Air Serbia'
];

const LoginPage = ({ onLogin, onGoBack }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'APOC',
    airline: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [passwordAttempts, setPasswordAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);
  const [passwordLocked, setPasswordLocked] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    username: '',
    password: '',
    airline: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem('login_lockout_until');
    const storedAttempts = localStorage.getItem('login_password_attempts');
    if (stored) {
      const until = new Date(stored);
      if (until > new Date()) {
        setLockoutUntil(until);
        setPasswordLocked(true);
      } else {
        localStorage.removeItem('login_lockout_until');
        localStorage.removeItem('login_password_attempts');
      }
    }
    if (storedAttempts) {
      setPasswordAttempts(parseInt(storedAttempts, 10));
    }
  }, []);

  useEffect(() => {
    if (!lockoutUntil) return undefined;

    const tick = () => {
      const now = new Date();
      const diff = Math.ceil((lockoutUntil - now) / 1000);
      if (diff <= 0) {
        setPasswordLocked(false);
        setLockoutUntil(null);
        setLockoutSecondsLeft(0);
        setPasswordAttempts(0);
        localStorage.removeItem('login_lockout_until');
        localStorage.removeItem('login_password_attempts');
      } else {
        setLockoutSecondsLeft(diff);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const validateUsername = (username) => {
    if (username.length > 0 && username.length < 4) {
      return 'Username must be at least 4 characters';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (password.length > 0 && password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation
    if (name === 'username') {
      setValidationErrors(prev => ({
        ...prev,
        username: validateUsername(value)
      }));
      // Clear general error when user starts typing
      if (error) setError('');
    } else if (name === 'password') {
      setValidationErrors(prev => ({
        ...prev,
        password: validatePassword(value)
      }));
      // Clear general error when user starts typing
      if (error) setError('');
    } else if (name === 'airline') {
      setValidationErrors(prev => ({
        ...prev,
        airline: formData.role === 'AOC' && !value ? 'Airline is required' : ''
      }));
      if (error) setError('');
    } else if (name === 'role') {
      setValidationErrors(prev => ({
        ...prev,
        airline: value === 'AOC' && !formData.airline ? 'Airline is required' : ''
      }));
      if (error) setError('');
    }
  };

  const isFormValid = () => {
    const baseValid = formData.username.length >= 4 &&
      formData.password.length >= 8 &&
      !validationErrors.username &&
      !validationErrors.password;
    if (formData.role === 'AOC') {
      return baseValid && formData.airline !== '';
    }
    return baseValid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (passwordLocked) {
      return;
    }
    
    // Validate before submitting
    const usernameError = validateUsername(formData.username);
    const passwordError = validatePassword(formData.password);
    
    const airlineError = formData.role === 'AOC' && !formData.airline ? 'Airline is required' : '';
    
    if (usernameError || passwordError || airlineError) {
      setValidationErrors({
        username: usernameError,
        password: passwordError,
        airline: airlineError
      });
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Call backend API for authentication
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: formData.username,
        password: formData.password,
        role: formData.role,
        airline: formData.airline || undefined
      });

      if (response.data.success) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.removeItem('login_lockout_until');
        localStorage.removeItem('login_password_attempts');
        setPasswordAttempts(0);
        setPasswordLocked(false);
        setLockoutUntil(null);
        setLockoutSecondsLeft(0);
        setIsLoading(false);
        
        setSuccess('Login successful!');
        
        // Call the login callback with user data from backend
        if (onLogin) {
          onLogin({
            ...response.data.user,
            token: response.data.token
          });
        }
      } else {
        setError(response.data.message || 'Login failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response) {
        if (err.response?.data?.errorType === 'WRONG_PASSWORD') {
          const newAttempts = passwordAttempts + 1;
          setPasswordAttempts(newAttempts);
          localStorage.setItem('login_password_attempts', String(newAttempts));

          if (newAttempts >= 3) {
            const until = new Date(Date.now() + 15 * 1000);
            setLockoutUntil(until);
            setPasswordLocked(true);
            localStorage.setItem('login_lockout_until', until.toISOString());
            setError('Too many incorrect password attempts. Password input locked for 15 seconds.');
          } else {
            setError(`Incorrect password. Please try again. (${newAttempts}/3 attempts)`);
          }
        } else if (err.response?.data?.errorType === 'USER_NOT_FOUND') {
          setError(err.response.data.message);
          setPasswordAttempts(0);
          localStorage.removeItem('login_password_attempts');
        } else if (err.response?.data?.errorType === 'ROLE_MISMATCH') {
          setError(err.response.data.message);
        } else if (err.response?.data?.errorType === 'ACCOUNT_INACTIVE') {
          setError(err.response.data.message);
        } else {
          setError(err.response?.data?.message || 'Login failed. Please try again.');
        }
      } else {
        let errorMessage;

        // Normalize generic axios network errors into a clearer message
        if (err?.message && err.message.toLowerCase().includes('network error')) {
          errorMessage =
            'Cannot reach the DelayPilot server. Make sure the backend is running and your Supabase project is active, then try again.';
        } else {
          errorMessage =
            err?.message ||
            'Failed to connect to server. Please check if the backend is running.';
        }

        setError(errorMessage);
      }
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true);
  };

  return (
    <>
      <LoginContainer>
        {onGoBack && (
          <button
            onClick={onGoBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#1A4B8F', fontSize: 13, fontWeight: 500,
              marginBottom: 16, padding: '4px 0',
              opacity: 0.8, transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
          >
            ← Back to Home
          </button>
        )}
        <Header>DelayPilot – Login</Header>
        <Subtitle>Access your aviation dashboard</Subtitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        
        <Form onSubmit={handleLogin}>
          <InputGroup>
            <Label htmlFor="username">Username</Label>
            <InputWithError
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              required
              hasError={!!validationErrors.username}
            />
            {validationErrors.username && <FieldError>{validationErrors.username}</FieldError>}
          </InputGroup>

          <InputGroup>
            <Label htmlFor="password">Password</Label>
            <InputWithError
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              hasError={!!validationErrors.password}
              disabled={passwordLocked}
              style={{
                background: passwordLocked ? '#f3f4f6' : undefined,
                cursor: passwordLocked ? 'not-allowed' : undefined,
              }}
            />
            {validationErrors.password && <FieldError>{validationErrors.password}</FieldError>}
            {passwordLocked && lockoutSecondsLeft > 0 && (
              <div style={{
                color: '#dc2626',
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 13,
                marginTop: 6,
              }}>
                🔒 Password input locked. Try again in {lockoutSecondsLeft} second{lockoutSecondsLeft !== 1 ? 's' : ''}.
              </div>
            )}
          </InputGroup>

          <InputGroup>
            <Label htmlFor="role">Role</Label>
            <Select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
            >
              <option value="APOC">APOC</option>
              <option value="AOC">AOC</option>
              <option value="ATC">ATC</option>
              <option value="Admin">Admin</option>
            </Select>
          </InputGroup>

          {formData.role === 'AOC' && (
            <InputGroup>
              <Label htmlFor="airline">Airline *</Label>
              <Select
                id="airline"
                name="airline"
                value={formData.airline}
                onChange={handleInputChange}
                required
              >
                <option value="">Select your airline</option>
                {MUNICH_AIRLINES.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
              {validationErrors.airline && <FieldError>{validationErrors.airline}</FieldError>}
            </InputGroup>
          )}

          <LoginButton type="submit" disabled={isLoading || !isFormValid() || passwordLocked}>
            {isLoading ? 'Logging in...' : 'Login'}
          </LoginButton>

          <ForgotPasswordLink type="button" onClick={handleForgotPassword}>
            Forgot Password?
          </ForgotPasswordLink>
        </Form>
      </LoginContainer>

      {showForgotPasswordModal && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPasswordModal(false)}
        />
      )}
    </>
  );
};

export default LoginPage;
