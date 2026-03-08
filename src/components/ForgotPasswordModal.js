import React, { useState } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContainer = styled.div`
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 32px;
  width: 100%;
  max-width: 400px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;

  @media (max-width: 480px) {
    padding: 28px 24px;
    max-width: 350px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
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
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #333333;
  }
`;

const ModalHeader = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 8px;
`;

const ModalText = styled.p`
  font-size: 16px;
  color: #666666;
  margin-bottom: 24px;
  line-height: 1.5;
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
    box-shadow: 0 0 0 3px rgba(63, 128, 219, 0.1);
  }

  &::placeholder {
    color: #999999;
  }
`;

const SendButton = styled.button`
  padding: 14px 24px;
  background: linear-gradient(135deg, #00A86B 0%, #00C896 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 168, 107, 0.3);

  &:hover {
    background: linear-gradient(135deg, rgb(219, 140, 56) 0%, rgb(232, 191, 76) 100%);
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

const SuccessMessage = styled.div`
  padding: 16px;
  background: rgba(0, 168, 107, 0.1);
  border: 1px solid rgba(0, 168, 107, 0.3);
  border-radius: 8px;
  color: var(--secondary-color);
  font-size: 14px;
  text-align: center;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &::before {
    content: '✓';
    font-weight: bold;
    font-size: 16px;
  }

  @media (prefers-color-scheme: dark) {
    background: rgba(0, 168, 107, 0.2);
    border-color: rgba(0, 168, 107, 0.4);
  }
`;

const ForgotPasswordModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Password reset request for:', email);
      setIsLoading(false);
      setShowSuccess(true);
      
      // Auto close modal after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    }, 1000);
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
          Enter your registered email to receive a password reset link.
        </ModalText>
        
        {!showSuccess ? (
          <Form onSubmit={handleSubmit}>
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
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </SendButton>
          </Form>
        ) : (
          <SuccessMessage>
            Password reset link has been sent to your email.
          </SuccessMessage>
        )}
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ForgotPasswordModal;
