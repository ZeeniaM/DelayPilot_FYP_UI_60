import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
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
  justify-content: space-between;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #333333;
  margin: 0;
`;

const TopBar = styled.div`
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.05);
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const Search = styled.input`
  padding: 10px 12px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  flex: 1;
  min-width: 220px;

  &:focus { border-color: #1A4B8F; box-shadow: 0 0 0 3px rgba(26,75,143,0.1); }
  &::placeholder { color: #9ca3af; }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  color: #333333;
`;

const NotificationBell = styled.div`
  position: relative;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(26, 75, 143, 0.1);
  }
`;

const NotificationDot = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e74c3c;
`;

const NotificationDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  min-width: 300px;
  z-index: 1000;
  display: ${props => props.show ? 'block' : 'none'};
`;

const NotificationItem = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #eef1f4;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(26, 75, 143, 0.1);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const NotificationTitle = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
`;

const NotificationSubtitle = styled.div`
  font-size: 12px;
  color: #666;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.05);
`;

const UserTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;

const TableHeader = styled.th`
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333333;
  border-bottom: 2px solid #eef1f4;
`;

const TableRow = styled.tr`
  &:hover {
    background: #f8f9fa;
  }
`;

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #eef1f4;
  color: #666666;
`;

const Badge = styled.span`
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 999px;
  color: ${p => p.status === 'active' ? '#166534' : '#991B1B'};
  background: ${p => p.status === 'active' ? '#DCFCE7' : '#FEE2E2'};
`;

const RoleBadge = styled.span`
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 999px;
  color: #1A4B8F;
  background: #eef2ff;
`;

const Button = styled.button`
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 12px;
  ${p => p.primary ? 'background:#1A4B8F;color:#fff;' : 'background:#f1f3f4;color:#333;'}
  ${p => p.danger && 'background:#dc2626;color:#fff;'}
  ${p => p.disabled && 'background:#e5e7eb;color:#9ca3af;cursor:not-allowed;'}
`;

const AddUserButton = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  background: #1A4B8F;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalCard = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 10px 30px rgba(0,0,0,0.12);
  padding: 20px;
  max-width: ${props => props.large ? '500px' : '420px'};
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 14px;
  justify-content: flex-end;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const FormLabel = styled.label`
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  font-size: 14px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #1A4B8F;
    box-shadow: 0 0 0 3px rgba(26,75,143,0.1);
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  color: #333333;
  
  &:focus {
    outline: none;
    border-color: #1A4B8F;
    box-shadow: 0 0 0 3px rgba(26,75,143,0.1);
  }
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 12px;
  margin-top: 4px;
`;

const SuccessMessage = styled.div`
  color: #16a34a;
  font-size: 12px;
  margin-top: 4px;
`;

const mockUsers = [
  { id: 1, name: 'System Administrator', username: 'admin', email: 'admin@delaypilot.com', role: 'Admin', status: 'active', lastLogin: '2024-01-15 10:30' },
  { id: 2, name: 'John Smith', username: 'apoc1', email: 'johnsmith@delaypilot.com', role: 'APOC', status: 'active', lastLogin: '2024-01-15 09:45' },
  { id: 3, name: 'Sarah Johnson', username: 'british_airlines', email: 'sarahjohnson34@gmail.com', role: 'AOC', status: 'active', lastLogin: '2024-01-15 08:20' },
  { id: 4, name: 'Mike Wilson', username: 'atc1', email: 'mike_atc1@delaypilot.com', role: 'ATC', status: 'inactive', lastLogin: '2024-01-14 16:30' },
  { id: 5, name: 'Emily Davis', username: 'apoc2', email: 'emily_ops_mail@munichmail.com', role: 'APOC', status: 'active', lastLogin: '2024-01-15 11:15' },
];

const mockDeletionRequests = [
  { id: 1, userId: 4, username: 'atc1', name: 'Mike Wilson', role: 'ATC', requestTime: '2024-01-15 14:30' },
  { id: 2, userId: 5, username: 'apoc2', name: 'Emily Davis', role: 'APOC', requestTime: '2024-01-15 15:45' },
];

const UserManagement = ({ userRole, userName, onLogout, activeTab, onTabChange }) => {
  const [users, setUsers] = useState([]);
  const [deletionRequests, setDeletionRequests] = useState(mockDeletionRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    role: 'APOC',
    email: ''
  });

  const [editUser, setEditUser] = useState({
    name: '',
    username: '',
    password: '',
    role: '',
    email: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  const currentAdminId = 1; // Assuming admin has ID 1

  // Fetch users from backend
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Transform backend data to match frontend format
        const transformedUsers = response.data.users.map(user => ({
          id: user.id,
          name: user.name || user.username,
          username: user.username,
          email: user.email || '',
          role: user.role,
          status: user.status || 'active', // Use status from backend
          lastLogin: user.created_at ? new Date(user.created_at).toLocaleString() : 'Never'
        }));
        setUsers(transformedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to mock data if API fails
      setUsers(mockUsers);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    setValidationErrors({});

    // Validate fields
    const errors = {};
    const usernameError = validateUsername(newUser.username);
    if (usernameError) errors.username = usernameError;
    
    const passwordError = validatePassword(newUser.password);
    if (passwordError) errors.password = passwordError;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/auth/register`,
        {
          username: newUser.username,
          password: newUser.password,
          role: newUser.role,
          email: newUser.email || null,
          name: newUser.name || null
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess('User created successfully!');
        // Reset form
        setNewUser({
          name: '',
          username: '',
          password: '',
          role: 'APOC',
          email: ''
        });
        setValidationErrors({});
        // Refresh users list
        setTimeout(() => {
          fetchUsers();
          setShowAddUserModal(false);
          setSuccess('');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Validation functions
  const validateUsername = (username) => {
    if (!username) return 'Username is required';
    if (username.length < 4 || username.length > 20) {
      return 'Username must be between 4 and 20 characters';
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return 'Username must contain only alphanumeric characters';
    }
    return '';
  };

  const validatePassword = (password, isEdit = false) => {
    if (!isEdit && !password) return 'Password is required';
    if (password && password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (password && !/[a-zA-Z]/.test(password)) {
      return 'Password must contain at least one letter';
    }
    if (password && !/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const handleEditUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setEditUser({
        name: user.name || '',
        username: user.username,
        password: '', // Don't pre-fill password
        role: user.role,
        email: user.email || ''
      });
      setSelectedUser(user);
      setShowEditUserModal(true);
      setError('');
      setValidationErrors({});
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    setValidationErrors({});

    // Validate fields
    const errors = {};
    const usernameError = validateUsername(editUser.username);
    if (usernameError) errors.username = usernameError;
    
    if (editUser.password) {
      const passwordError = validatePassword(editUser.password, true);
      if (passwordError) errors.password = passwordError;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        username: editUser.username,
        role: editUser.role,
        email: editUser.email || null,
        name: editUser.name || null
      };

      // Only include password if it's provided
      if (editUser.password) {
        updateData.password = editUser.password;
      }

      const response = await axios.put(
        `${API_BASE_URL}/auth/users/${selectedUser.id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess('User updated successfully!');
        setTimeout(() => {
          fetchUsers();
          setShowEditUserModal(false);
          setSuccess('');
          setEditUser({ name: '', username: '', password: '', role: '', email: '' });
        }, 1500);
      }
    } catch (err) {
      console.error('Update user error:', err);
      console.error('Error response:', err.response);
      console.error('Request URL:', `${API_BASE_URL}/auth/users/${selectedUser.id}`);
      
      let errorMessage = 'Failed to update user. Please try again.';
      
      if (err.response) {
        // Backend responded with an error
        if (err.response.status === 404) {
          errorMessage = err.response.data?.message || 'User not found or route not found. Please check if the backend server is running.';
        } else if (err.response.status === 403) {
          errorMessage = err.response.data?.message || 'You do not have permission to update this user.';
        } else if (err.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data?.message || 'Invalid input. Please check your data.';
        } else {
          errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'Cannot connect to server. Please check if the backend is running on http://localhost:5000';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user && user.id === currentAdminId) {
      alert('You cannot delete your own account.');
      return;
    }
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_BASE_URL}/auth/users/${selectedUser.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Remove user from local state immediately for better UX
        setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
        setDeletionRequests(prev => prev.filter(req => req.userId !== selectedUser.id));
        setShowDeleteModal(false);
        setSelectedUser(null);
        // Also refresh from backend to ensure consistency
        fetchUsers();
      }
    } catch (err) {
      console.error('Delete user error:', err);
      console.error('Error response:', err.response);
      console.error('Request URL:', `${API_BASE_URL}/auth/users/${selectedUser.id}`);
      
      let errorMessage = 'Failed to delete user. Please try again.';
      
      if (err.response) {
        // Backend responded with an error
        if (err.response.status === 404) {
          errorMessage = err.response.data?.message || 'User not found or route not found. Please check if the backend server is running.';
        } else if (err.response.status === 403) {
          errorMessage = err.response.data?.message || 'You do not have permission to delete this user.';
        } else if (err.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else {
          errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'Cannot connect to server. Please check if the backend is running on http://localhost:5000';
      }
      
      alert(errorMessage);
      
      // If it's a route not found error, still try to refresh the list
      if (err.response?.status === 404) {
        fetchUsers();
      }
    }
  };

  const handleToggleStatus = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.id === currentAdminId) {
      alert('You cannot deactivate your own account.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/auth/users/${userId}/status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        fetchUsers(); // Refresh users list
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status. Please try again.');
    }
  };

  const handleNotificationClick = (request) => {
    const user = users.find(u => u.id === request.userId);
    if (user) {
      setSelectedUser(user);
      setShowDeleteModal(true);
    }
    setShowNotifications(false);
  };

  const roles = ['All', 'Admin', 'APOC', 'AOC', 'ATC'];
  const statuses = ['All', 'active', 'inactive'];

  return (
    <PageLayout>
    <PageContainer>
      <NavigationBar
        userRole={userRole}
        userName={userName}
        onLogout={onLogout}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      <MainContent>
        <ContentArea>
          <HeaderRow>
            <Title>User Management</Title>
            <AddUserButton onClick={() => setShowAddUserModal(true)}>+ Add User</AddUserButton>
          </HeaderRow>
          
          <TopBar>
            <Search 
              placeholder="Search users by name, username, or email..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              {roles.map(role => <option key={role} value={role}>{role}</option>)}
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statuses.map(status => <option key={status} value={status}>{status === 'All' ? 'All Statuses' : status}</option>)}
            </Select>
            <div style={{ position: 'relative' }}>
              <NotificationBell onClick={() => setShowNotifications(!showNotifications)}>
                🔔
                {deletionRequests.length > 0 && <NotificationDot />}
              </NotificationBell>
              <NotificationDropdown show={showNotifications}>
                {deletionRequests.length === 0 ? (
                  <div style={{ padding: '16px', color: '#666', textAlign: 'center' }}>
                    No pending deletion requests
                  </div>
                ) : (
                  deletionRequests.map(request => (
                    <NotificationItem key={request.id} onClick={() => handleNotificationClick(request)}>
                      <NotificationTitle>Delete User Request</NotificationTitle>
                      <NotificationSubtitle>
                        {request.name} ({request.username}) - {request.role}
                      </NotificationSubtitle>
                      <NotificationSubtitle>
                        Requested: {request.requestTime}
                      </NotificationSubtitle>
                    </NotificationItem>
                  ))
                )}
              </NotificationDropdown>
            </div>
          </TopBar>
          
          <Card>
            <div style={{ fontWeight: 800, color: '#333', marginBottom: 16 }}>System Users</div>
            <UserTable>
              <thead>
                <tr>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Username</TableHeader>
                  <TableHeader>Role</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Last Login</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell style={{ fontWeight: 600, color: '#333' }}>{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell><RoleBadge>{user.role}</RoleBadge></TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge status={user.status}>{user.status}</Badge></TableCell>
                    <TableCell>{user.lastLogin}</TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button onClick={() => handleEditUser(user.id)}>Edit</Button>
                        <Button 
                          onClick={() => handleToggleStatus(user.id)}
                          disabled={user.id === currentAdminId}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button 
                          danger
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentAdminId}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </UserTable>
          </Card>
        </ContentArea>
      </MainContent>

      {showDeleteModal && (
        <ModalBackdrop onClick={() => setShowDeleteModal(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 800, color: '#333', marginBottom: 8 }}>Confirm User Deletion</div>
            <div style={{ color: '#333', marginBottom: 16 }}>
              Are you sure you want to delete user <strong>{selectedUser?.name}</strong> ({selectedUser?.username})?
              <br />
              <span style={{ color: '#666', fontSize: '14px' }}>
                This action cannot be undone.
              </span>
            </div>
            <ModalActions>
              <Button onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button danger onClick={confirmDeleteUser}>Delete User</Button>
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      )}

      {showAddUserModal && (
        <ModalBackdrop onClick={() => !isLoading && setShowAddUserModal(false)}>
          <ModalCard large onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 800, color: '#333', marginBottom: 20, fontSize: '20px' }}>
              Create New User
            </div>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>{success}</SuccessMessage>}

            <form onSubmit={handleAddUser}>
              <FormGroup>
                <FormLabel>Name (Optional)</FormLabel>
                <FormInput
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Username *</FormLabel>
                <FormInput
                  type="text"
                  value={newUser.username}
                  onChange={(e) => {
                    setNewUser({ ...newUser, username: e.target.value });
                    if (validationErrors.username) {
                      setValidationErrors({ ...validationErrors, username: '' });
                    }
                  }}
                  placeholder="Enter username (4-20 alphanumeric characters)"
                  required
                />
                {validationErrors.username && <ErrorMessage>{validationErrors.username}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <FormLabel>Password *</FormLabel>
                <FormInput
                  type="password"
                  value={newUser.password}
                  onChange={(e) => {
                    setNewUser({ ...newUser, password: e.target.value });
                    if (validationErrors.password) {
                      setValidationErrors({ ...validationErrors, password: '' });
                    }
                  }}
                  placeholder="Enter password (min 8 chars, letters + numbers)"
                  required
                />
                {validationErrors.password && <ErrorMessage>{validationErrors.password}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <FormLabel>Role *</FormLabel>
                <FormSelect
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  required
                >
                  <option value="APOC">APOC</option>
                  <option value="ATC">ATC</option>
                  <option value="AOC">AOC</option>
                </FormSelect>
              </FormGroup>

              <FormGroup>
                <FormLabel>Email (Optional)</FormLabel>
                <FormInput
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </FormGroup>

              <ModalActions>
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowAddUserModal(false);
                    setError('');
                    setSuccess('');
                    setValidationErrors({});
                    setNewUser({
                      name: '',
                      username: '',
                      password: '',
                      role: 'APOC',
                      email: ''
                    });
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  primary 
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create User'}
                </Button>
              </ModalActions>
            </form>
          </ModalCard>
        </ModalBackdrop>
      )}

      {showEditUserModal && (
        <ModalBackdrop onClick={() => !isLoading && setShowEditUserModal(false)}>
          <ModalCard large onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 800, color: '#333', marginBottom: 20, fontSize: '20px' }}>
              Edit User
            </div>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>{success}</SuccessMessage>}

            <form onSubmit={handleUpdateUser}>
              <FormGroup>
                <FormLabel>Name (Optional)</FormLabel>
                <FormInput
                  type="text"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Username *</FormLabel>
                <FormInput
                  type="text"
                  value={editUser.username}
                  onChange={(e) => {
                    setEditUser({ ...editUser, username: e.target.value });
                    if (validationErrors.username) {
                      setValidationErrors({ ...validationErrors, username: '' });
                    }
                  }}
                  placeholder="Enter username (4-20 alphanumeric characters)"
                  required
                />
                {validationErrors.username && <ErrorMessage>{validationErrors.username}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <FormLabel>Password (Leave blank to keep current)</FormLabel>
                <FormInput
                  type="password"
                  value={editUser.password}
                  onChange={(e) => {
                    setEditUser({ ...editUser, password: e.target.value });
                    if (validationErrors.password) {
                      setValidationErrors({ ...validationErrors, password: '' });
                    }
                  }}
                  placeholder="Enter new password (min 8 chars, letters + numbers)"
                />
                {validationErrors.password && <ErrorMessage>{validationErrors.password}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <FormLabel>Role *</FormLabel>
                <FormSelect
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  required
                  disabled={selectedUser?.role === 'Admin'}
                >
                  <option value="APOC">APOC</option>
                  <option value="ATC">ATC</option>
                  <option value="AOC">AOC</option>
                  {selectedUser?.role === 'Admin' && <option value="Admin">Admin</option>}
                </FormSelect>
                {selectedUser?.role === 'Admin' && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Admin role cannot be changed
                  </div>
                )}
              </FormGroup>

              <FormGroup>
                <FormLabel>Email (Optional)</FormLabel>
                <FormInput
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </FormGroup>

              <ModalActions>
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowEditUserModal(false);
                    setError('');
                    setSuccess('');
                    setValidationErrors({});
                    setEditUser({ name: '', username: '', password: '', role: '', email: '' });
                    setSelectedUser(null);
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  primary 
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update User'}
                </Button>
              </ModalActions>
            </form>
          </ModalCard>
        </ModalBackdrop>
      )}
    </PageContainer>
    </PageLayout>
  );
};

export default UserManagement;