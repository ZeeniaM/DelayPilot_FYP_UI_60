const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');
require('dotenv').config();

const router = express.Router();

// JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Validation functions
const validateUsername = (username) => {
  if (!username) {
    return { valid: false, message: 'Username is required' };
  }
  if (username.length < 4 || username.length > 20) {
    return { valid: false, message: 'Username must be between 4 and 20 characters' };
  }
  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    return { valid: false, message: 'Username must contain only alphanumeric characters' };
  }
  return { valid: true };
};

const validatePassword = (password) => {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
};

// Forgot password endpoint (public)
router.post('/forgot-password', async (req, res) => {
  const genericMessage = 'If that email is registered, a reset code has been sent.';

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const result = await query(
      'SELECT id, username, name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: genericMessage
      });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(8).toString('hex').slice(0, 8).toUpperCase();

    await query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1 AND used = false',
      [user.id]
    );

    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
      [user.id, token]
    );

    res.json({
      success: true,
      message: genericMessage,
      reset_code: token,
      username: user.username
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset password endpoint (public)
router.post('/reset-password', async (req, res) => {
  try {
    const { username, token, newPassword } = req.body;

    if (!username || !token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Username, reset code, and new password are required'
      });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    const tokenResult = await query(
      `SELECT ptr.id, ptr.user_id
       FROM password_reset_tokens ptr
       JOIN users u ON u.id = ptr.user_id
       WHERE u.username = $1
         AND ptr.token = $2
         AND ptr.used = false
         AND ptr.expires_at > NOW()`,
      [username, token.toUpperCase()]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code.'
      });
    }

    const resetToken = tokenResult.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, resetToken.user_id]
    );

    await query(
      'UPDATE password_reset_tokens SET used = true WHERE id = $1',
      [resetToken.id]
    );

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validate input
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and role are required'
      });
    }

    // Find user in database
    const result = await query(
      'SELECT * FROM users WHERE username = $1 AND role = $2',
      [username, role]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'No account found with these credentials. The account may not exist or may have been removed.'
      });
    }

    const user = result.rows[0];

    // Check account status (inactive users cannot log in)
    if (user.status && user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'This account has been deactivated. Please contact the administrator.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Track login in database (wrap in try/catch so it doesn't block login)
    try {
      const rawIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket?.remoteAddress
        || req.ip
        || 'unknown';
      const ip = rawIp === '::1' ? '127.0.0.1 (local)' : rawIp;

      // Update last_login timestamp
      await query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      // Insert login log entry
      await query(
        'INSERT INTO login_logs (user_id, username, role, logged_in_at, ip_address) VALUES ($1, $2, $3, NOW(), $4)',
        [user.id, user.username, user.role, ip]
      );
    } catch (logError) {
      console.warn('⚠️ Failed to log login details:', logError.message);
      // Don't throw - let login proceed even if logging fails
    }

    // Return success response with user data (without password)
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        name: user.name,
        airline: user.airline
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// Middleware to verify admin role
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer token

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Admin authentication required.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database to verify role
    const result = await query(
      'SELECT role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0 || result.rows[0].role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Register endpoint (admin only - for creating new users)
router.post('/register', verifyAdmin, async (req, res) => {
  try {
    const { username, password, role, email, name, airline } = req.body;

    // Validate input
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and role are required'
      });
    }

    // Email required for ALL roles
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Airline required only for AOC
    if (role === 'AOC' && (!airline || !airline.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Airline is required for AOC role'
      });
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({
        success: false,
        message: usernameValidation.message
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Validate role - only allow APOC, ATC, AOC (not Admin)
    const allowedRoles = ['APOC', 'ATC', 'AOC'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Only APOC, ATC, and AOC users can be created.'
      });
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user with active status by default
    const result = await query(
      'INSERT INTO users (username, password, role, email, name, airline, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, role, email, name, airline, status, created_at',
      [username, hashedPassword, role, email || null, name || null, airline || null, 'active']
    );

    const newUser = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

// Get all users endpoint (admin only)
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, role, email, name, airline, status, created_at, last_login FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user endpoint (admin only)
router.put('/users/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, email, name, airline } = req.body;
    console.log(`[PUT] /api/auth/users/${id} - Attempting to update user`);
    console.log(`Update data:`, { username, role, email, name, airline, password: password ? '***' : 'not provided' });

    // Email required for ALL roles
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Airline required only for AOC
    const effectiveRole = role || (await query('SELECT role FROM users WHERE id = $1', [id])).rows[0]?.role;
    if (effectiveRole === 'AOC' && (!airline || !airline.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Airline is required for AOC role'
      });
    }

    // Check if user exists
    const userCheck = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const existingUser = userCheck.rows[0];

    // Prevent editing admin user's role
    if (existingUser.role === 'Admin' && role && role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change admin user role'
      });
    }

    // Validate username if provided
    if (username && username !== existingUser.username) {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        return res.status(400).json({
          success: false,
          message: usernameValidation.message
        });
      }

      // Check if new username already exists
      const usernameCheck = await query('SELECT * FROM users WHERE username = $1 AND id != $2', [username, id]);
      if (usernameCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    // Validate password if provided
    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          message: passwordValidation.message
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramCount++}`);
      values.push(hashedPassword);
    }
    if (role) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email || null);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name || null);
    }
    if (airline !== undefined) {
      updates.push(`airline = $${paramCount++}`);
      values.push(airline || null);
    }
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, username, role, email, name, airline, status, created_at
    `;

    const result = await query(updateQuery, values);

    res.json({
      success: true,
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete user endpoint (admin only)
router.delete('/users/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DELETE] /api/auth/users/${id} - Attempting to delete user`);
    console.log(`User ID from params: ${id}`);

    // Check if user exists
    const userCheck = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userCheck.rows[0];

    // Prevent deleting admin user
    if (user.role === 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin user'
      });
    }

    // Prevent deleting own account
    if (user.id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Toggle user status endpoint (admin only)
router.patch('/users/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const userCheck = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userCheck.rows[0];

    // Prevent deactivating admin user
    if (user.role === 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot deactivate admin user'
      });
    }

    // Prevent deactivating own account
    if (user.id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    const result = await query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, role, email, name, status, created_at',
      [newStatus, id]
    );

    res.json({
      success: true,
      message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify token endpoint (for checking if user is authenticated)
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer token

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get fresh user data from database
    const result = await query(
      'SELECT id, username, role, email, name, status FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// Middleware to verify any authenticated user (not just admin)
const verifyUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer token

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authentication required.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database to verify user exists
    const result = await query(
      'SELECT id, username, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Get current user profile endpoint
router.get('/profile', verifyUser, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, role, email, name, airline, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update password endpoint (for current user)
router.put('/profile/password', verifyUser, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password, new password, and confirm password are required'
      });
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Get current user from database
    const userResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get login logs endpoint (admin only)
router.get('/login-logs', verifyAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT ll.id, ll.username, ll.role, ll.logged_in_at, ll.ip_address, u.name
      FROM login_logs ll
      LEFT JOIN users u ON u.id = ll.user_id
      WHERE ll.logged_in_at >= NOW() - INTERVAL '7 days'
      ORDER BY ll.logged_in_at DESC
      LIMIT 200
    `);

    res.json({
      success: true,
      logs: result.rows
    });
  } catch (error) {
    console.error('Get login logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Submit account deletion request (any authenticated user)
router.post('/deletion-request', verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user already has a pending deletion request
    const pendingCheck = await query(
      'SELECT id FROM deletion_requests WHERE user_id = $1 AND status = $2',
      [userId, 'pending']
    );

    if (pendingCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A deletion request is already pending.'
      });
    }

    // Get user details for the deletion request
    const userResult = await query(
      'SELECT id, username, name, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Insert deletion request
    await query(
      'INSERT INTO deletion_requests (user_id, username, name, role) VALUES ($1, $2, $3, $4)',
      [user.id, user.username, user.name, user.role]
    );

    res.status(201).json({
      success: true,
      message: 'Deletion request submitted.'
    });
  } catch (error) {
    console.error('Create deletion request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pending deletion requests (admin only)
router.get('/deletion-requests', verifyAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM deletion_requests WHERE status = $1 ORDER BY requested_at ASC',
      ['pending']
    );

    res.json({
      success: true,
      requests: result.rows
    });
  } catch (error) {
    console.error('Get deletion requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Check deletion request status (any authenticated user)
router.get('/deletion-request/status', verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const pending = await query(
      'SELECT id FROM deletion_requests WHERE user_id = $1 AND status = $2',
      [userId, 'pending']
    );

    const rejected = await query(
      `SELECT id FROM deletion_requests WHERE user_id = $1 AND status = $2
       ORDER BY handled_at DESC LIMIT 1`,
      [userId, 'rejected']
    );

    res.json({
      success: true,
      hasPending: pending.rows.length > 0,
      wasRejected: rejected.rows.length > 0
    });
  } catch (error) {
    console.error('Get deletion request status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Handle deletion request (approve or reject) - admin only
router.delete('/deletion-requests/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "reject"'
      });
    }

    // Get deletion request
    const requestResult = await query(
      'SELECT * FROM deletion_requests WHERE id = $1',
      [id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deletion request not found'
      });
    }

    const deletionRequest = requestResult.rows[0];

    if (action === 'approve') {
      // Update deletion request status
      await query(
        'UPDATE deletion_requests SET status = $1, handled_at = NOW(), handled_by = $2 WHERE id = $3',
        ['approved', req.user.id, id]
      );

      // Delete the user
      await query(
        'DELETE FROM users WHERE id = $1',
        [deletionRequest.user_id]
      );

      res.json({
        success: true,
        message: `Account deletion approved. User ${deletionRequest.username} has been deleted.`
      });
    } else if (action === 'reject') {
      // Update deletion request status only
      await query(
        'UPDATE deletion_requests SET status = $1, handled_at = NOW(), handled_by = $2 WHERE id = $3',
        ['rejected', req.user.id, id]
      );

      res.json({
        success: true,
        message: `Deletion request for ${deletionRequest.username} has been rejected.`
      });
    }
  } catch (error) {
    console.error('Handle deletion request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /settings — Get system settings (admin only)
router.get('/settings', verifyAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT key, value FROM system_settings'
    );
    res.json({
      success: true,
      settings: result.rows
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /settings — Update system settings (admin only)
router.put('/settings', verifyAdmin, async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'key and value are required'
      });
    }

    await query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, value]
    );

    res.json({
      success: true,
      message: 'Settings updated'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
