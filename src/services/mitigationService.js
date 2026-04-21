/**
 * src/services/mitigationService.js
 * ─────────────────────────────────────────────────────────────────
 * Service layer for mitigation cases and comments
 * All calls to Express :5000/api/mitigation/*
 * Uses authenticated axios from predictionService
 * ─────────────────────────────────────────────────────────────────
 */

import axios from 'axios';
import API_BASE_URL from '../config/api';

/**
 * Get authenticated axios instance with JWT from localStorage
 */
const authAxios = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

// ─────────────────────────────────────────────────────────────────
// CASES ENDPOINTS
// ─────────────────────────────────────────────────────────────────

/**
 * Get all active (non-closed) mitigation cases
 * @returns {Promise<{success: boolean, cases: Array}>}
 */
export const getCases = async () => {
  try {
    const response = await authAxios().get('/mitigation/cases');
    return response.data;
  } catch (error) {
    console.error('Error fetching cases:', error);
    throw error;
  }
};

/**
 * Get all closed cases for archive/history
 * @returns {Promise<{success: boolean, cases: Array}>}
 */
export const getClosedCases = async () => {
  try {
    const response = await authAxios().get('/mitigation/cases/closed');
    return response.data;
  } catch (error) {
    console.error('Error fetching closed cases:', error);
    throw error;
  }
};

/**
 * Create a new mitigation case
 * @param {Object} payload - Case data
 * @returns {Promise<{success: boolean, case: Object}>}
 */
export const createCase = async (payload) => {
  try {
    const response = await authAxios().post('/mitigation/cases', payload);
    return response.data.case;
  } catch (error) {
    console.error('Error creating case:', error);
    throw error;
  }
};

/**
 * Update case status (move to different column)
 * @param {number} id - Case ID
 * @param {string} status - New status (delayNoted, inProgress, verified, resolved, closed)
 * @returns {Promise<{success: boolean, case: Object}>}
 */
export const updateCaseStatus = async (id, status) => {
  try {
    const response = await authAxios().patch(`/mitigation/cases/${id}/status`, { status });
    return response.data.case;
  } catch (error) {
    console.error('Error updating case status:', error);
    throw error;
  }
};

/**
 * Update case details (tags, deadline, risk_level, etc.)
 * @param {number} id - Case ID
 * @param {Object} payload - Fields to update
 * @returns {Promise<{success: boolean, case: Object}>}
 */
export const updateCase = async (id, payload) => {
  try {
    const response = await authAxios().patch(`/mitigation/cases/${id}`, payload);
    return response.data.case;
  } catch (error) {
    console.error('Error updating case:', error);
    throw error;
  }
};

/**
 * Close a case (soft delete, preserves audit trail)
 * @param {number} id - Case ID
 * @returns {Promise<{success: boolean, case: Object}>}
 */
export const closeCase = async (id) => {
  try {
    const response = await authAxios().delete(`/mitigation/cases/${id}`);
    return response.data.case;
  } catch (error) {
    console.error('Error closing case:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────
// COMMENTS ENDPOINTS
// ─────────────────────────────────────────────────────────────────

/**
 * Get all comments for a case
 * @param {number} caseId - Case ID
 * @returns {Promise<{success: boolean, comments: Array}>}
 */
export const getComments = async (caseId) => {
  try {
    const response = await authAxios().get(`/mitigation/cases/${caseId}/comments`);
    return response.data.comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

/**
 * Add a comment to a case
 * @param {number} caseId - Case ID
 * @param {string} text - Comment text
 * @param {string} authorUsername - Author username (optional; defaults to logged-in user)
 * @returns {Promise<Object>} Comment object
 */
export const addComment = async (caseId, text, authorUsername) => {
  try {
    const payload = { comment_text: text };
    if (authorUsername) {
      payload.author_username = authorUsername;
    }
    const response = await authAxios().post(`/mitigation/cases/${caseId}/comments`, payload);
    return response.data.comment;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};
