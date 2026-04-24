/**
 * backend/routes/mitigation.js
 * Full CRUD Express router for mitigation cases and comments
 * Reads/writes to Supabase PostgreSQL via query helper from database.js
 */
const express = require('express');
const { query } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// HELPER: Parse tagged_causes array from PostgreSQL
// PostgreSQL stores arrays as "{elem1,elem2}" so we parse them
// ─────────────────────────────────────────────────────────────
const parseCaseRow = (row) => {
  if (!row) return null;
  let tagged = row.tagged_causes;
  if (!Array.isArray(tagged)) {
    const str = (tagged || '').trim();
    tagged = str.startsWith('{')
      ? str.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean)
      : str.split(',').map(s => s.trim()).filter(Boolean);
  }
  return { ...row, tagged_causes: tagged };
};

// ─────────────────────────────────────────────────────────────
// GET /api/mitigation/cases
// List all ACTIVE (non-closed) mitigation cases, sorted by created_at DESC
// ─────────────────────────────────────────────────────────────
router.get('/cases', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, flight_number, sched_utc, airline_code, route,
              predicted_delay_min, risk_level, likely_cause, tagged_causes,
              movement, status, deadline, created_by_user_id, created_at, updated_at,
              resolved_at, closed_at
       FROM mitigation_cases
       WHERE status != 'closed'
       ORDER BY created_at DESC`
    );

    const cases = result.rows.map(parseCaseRow);

    res.json({
      success: true,
      cases
    });
  } catch (error) {
    console.error('Error fetching active cases:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cases',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/mitigation/cases/closed
// List all CLOSED cases for archive/history view
// ─────────────────────────────────────────────────────────────
router.get('/cases/closed', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, flight_number, sched_utc, airline_code, route,
              predicted_delay_min, risk_level, likely_cause, tagged_causes,
              movement, status, deadline, created_by_user_id, created_at, updated_at,
              resolved_at, closed_at
       FROM mitigation_cases
       WHERE status = 'closed'
       ORDER BY closed_at DESC, created_at DESC`
    );

    const cases = result.rows.map(parseCaseRow);

    res.json({
      success: true,
      cases
    });
  } catch (error) {
    console.error('Error fetching closed cases:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch closed cases',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/mitigation/cases
// Create a new mitigation case from an alert/flight
// Body:
//   {
//     "flight_number": "LH204",
//     "sched_utc": "2026-04-21T14:30:00Z",
//     "airline_code": "LH",
//     "route": "MUC → FRA",
//     "predicted_delay_min": 45,
//     "risk_level": "high",
//     "likely_cause": "Weather",
//     "tagged_causes": ["Weather"],
//     "deadline": null
//   }
// ─────────────────────────────────────────────────────────────
router.post('/cases', verifyToken, async (req, res) => {
  try {
    const {
      flight_number,
      sched_utc,
      airline_code,
      route,
      predicted_delay_min,
      risk_level,
      likely_cause,
      tagged_causes = [],
      movement = null,
      deadline = null
    } = req.body;

    // Validate required fields
    if (!flight_number || !sched_utc) {
      return res.status(400).json({
        success: false,
        message: 'flight_number and sched_utc are required'
      });
    }

    // Convert tagged_causes array to PostgreSQL array format
    const tagsArray = Array.isArray(tagged_causes) ? tagged_causes : [];

    const result = await query(
      `INSERT INTO mitigation_cases (
        flight_number, sched_utc, airline_code, route,
        predicted_delay_min, risk_level, likely_cause, tagged_causes,
        movement, status, deadline, created_by_user_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING id, flight_number, sched_utc, airline_code, route,
                 predicted_delay_min, risk_level, likely_cause, tagged_causes,
                 movement, status, deadline, created_by_user_id, created_at, updated_at`,
      [
        flight_number,
        sched_utc,
        airline_code || null,
        route || null,
        predicted_delay_min || null,
        risk_level || null,
        likely_cause || null,
        tagsArray,
        movement || null,
        'delayNoted', // default status
        deadline || null,
        req.user.id
      ]
    );

    const newCase = parseCaseRow(result.rows[0]);

    res.status(201).json({
      success: true,
      message: 'Mitigation case created',
      case: newCase
    });
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create case',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/mitigation/cases/:id/status
// Move case to a different column (status change)
// Body: { "status": "inProgress" }
// Valid statuses: delayNoted, inProgress, verified, resolved, closed
// ─────────────────────────────────────────────────────────────
router.patch('/cases/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, version } = req.body;

    const validStatuses = ['delayNoted', 'inProgress', 'verified', 'resolved', 'closed'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Determine what timestamp fields to update based on new status
    let updateFields = 'status = $1, version = version + 1, updated_at = NOW()';
    let updateParams = [status];

    if (status === 'resolved') {
      updateFields += ', resolved_at = NOW()';
    } else if (status === 'closed') {
      updateFields += ', closed_at = NOW()';
    }

    // Build WHERE clause — include version check only when client provides a version
    const hasVersion = version !== undefined && version !== null;
    const whereClause = hasVersion
      ? `id = $${updateParams.length + 1} AND version = $${updateParams.length + 2}`
      : `id = $${updateParams.length + 1}`;
    const queryParams = hasVersion ? [...updateParams, id, version] : [...updateParams, id];

    const result = await query(
      `UPDATE mitigation_cases
       SET ${updateFields}
       WHERE ${whereClause}
       RETURNING id, flight_number, sched_utc, airline_code, route,
                 predicted_delay_min, risk_level, likely_cause, tagged_causes,
                 status, version, deadline, created_by_user_id, created_at, updated_at,
                 resolved_at, closed_at`,
      queryParams
    );

    if (result.rows.length === 0) {
      if (hasVersion) {
        // Distinguish 404 from version conflict
        const check = await query('SELECT id FROM mitigation_cases WHERE id = $1', [id]);
        if (check.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Case not found' });
        }
        return res.status(409).json({
          success: false,
          message: 'Case was modified by another user. Please refresh and try again.'
        });
      }
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const updatedCase = parseCaseRow(result.rows[0]);

    res.json({
      success: true,
      message: `Case moved to ${status}`,
      case: updatedCase
    });
  } catch (error) {
    console.error('Error updating case status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update case status',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/mitigation/cases/:id
// Update case details: tags, deadline, risk_level, etc.
// Body: { "tagged_causes": [...], "deadline": "...", "risk_level": "..." }
// ─────────────────────────────────────────────────────────────
router.patch('/cases/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tagged_causes,
      deadline,
      risk_level,
      likely_cause,
      route,
      airline_code,
      version
    } = req.body;

    // Build dynamic update fields
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (tagged_causes !== undefined) {
      updates.push(`tagged_causes = $${paramIndex}`);
      params.push(Array.isArray(tagged_causes) ? tagged_causes : []);
      paramIndex++;
    }

    if (deadline !== undefined) {
      updates.push(`deadline = $${paramIndex}`);
      params.push(deadline || null);
      paramIndex++;
    }

    if (risk_level !== undefined) {
      updates.push(`risk_level = $${paramIndex}`);
      params.push(risk_level || null);
      paramIndex++;
    }

    if (likely_cause !== undefined) {
      updates.push(`likely_cause = $${paramIndex}`);
      params.push(likely_cause || null);
      paramIndex++;
    }

    if (route !== undefined) {
      updates.push(`route = $${paramIndex}`);
      params.push(route || null);
      paramIndex++;
    }

    if (airline_code !== undefined) {
      updates.push(`airline_code = $${paramIndex}`);
      params.push(airline_code || null);
      paramIndex++;
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) { // only updated_at
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Always increment version for optimistic locking
    updates.push(`version = version + 1`);

    const hasVersion = version !== undefined && version !== null;
    const whereClause = hasVersion
      ? `id = $${paramIndex} AND version = $${paramIndex + 1}`
      : `id = $${paramIndex}`;
    const allParams = hasVersion ? [...params, id, version] : [...params, id];

    const result = await query(
      `UPDATE mitigation_cases
       SET ${updates.join(', ')}
       WHERE ${whereClause}
       RETURNING id, flight_number, sched_utc, airline_code, route,
                 predicted_delay_min, risk_level, likely_cause, tagged_causes,
                 status, version, deadline, created_by_user_id, created_at, updated_at,
                 resolved_at, closed_at`,
      allParams
    );

    if (result.rows.length === 0) {
      if (hasVersion) {
        const check = await query('SELECT id FROM mitigation_cases WHERE id = $1', [id]);
        if (check.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Case not found' });
        }
        return res.status(409).json({
          success: false,
          message: 'Case was modified by another user. Please refresh and try again.'
        });
      }
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    const updatedCase = parseCaseRow(result.rows[0]);

    res.json({
      success: true,
      message: 'Case updated',
      case: updatedCase
    });
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update case',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/mitigation/cases/:id
// Soft-close a case (set status = 'closed' and closed_at)
// Hard delete is not exposed via API to preserve audit trail
// ─────────────────────────────────────────────────────────────
router.delete('/cases/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { version } = req.body;

    const hasVersion = version !== undefined && version !== null;
    const whereClause = hasVersion ? `id = $1 AND version = $2` : `id = $1`;
    const queryParams = hasVersion ? [id, version] : [id];

    const result = await query(
      `UPDATE mitigation_cases
       SET status = 'closed', closed_at = NOW(), updated_at = NOW(),
           version = version + 1
       WHERE ${whereClause}
       RETURNING id, flight_number, sched_utc, airline_code, route,
                 predicted_delay_min, risk_level, likely_cause, tagged_causes,
                 status, version, deadline, created_by_user_id, created_at, updated_at,
                 resolved_at, closed_at`,
      queryParams
    );

    if (result.rows.length === 0) {
      if (hasVersion) {
        const check = await query('SELECT id FROM mitigation_cases WHERE id = $1', [id]);
        if (check.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Case not found' });
        }
        return res.status(409).json({
          success: false,
          message: 'Case was modified by another user. Please refresh and try again.'
        });
      }
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const closedCase = parseCaseRow(result.rows[0]);

    res.json({
      success: true,
      message: 'Case closed',
      case: closedCase
    });
  } catch (error) {
    console.error('Error closing case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close case',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/mitigation/cases/:id/permanent
// Hard-delete a CLOSED case from the audit log (Admin only)
// Only allowed when status = 'closed' to prevent accidental loss
// ─────────────────────────────────────────────────────────────
router.delete('/cases/:id/permanent', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow deleting already-closed cases
    const check = await query(
      `SELECT id, status FROM mitigation_cases WHERE id = $1`,
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    if (check.rows[0].status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Only closed cases can be permanently deleted'
      });
    }

    await query(`DELETE FROM mitigation_cases WHERE id = $1`, [id]);

    res.json({ success: true, message: 'Case permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete case',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/mitigation/cases/:id/comments
// Fetch all comments for a case
// ─────────────────────────────────────────────────────────────
router.get('/cases/:id/comments', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify case exists
    const caseCheck = await query(
      'SELECT id FROM mitigation_cases WHERE id = $1',
      [id]
    );

    if (caseCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    const result = await query(
      `SELECT
        c.id, c.case_id, c.author_user_id, c.author_username,
        c.comment_text, c.created_at, c.parent_comment_id,
        COALESCE(
          json_agg(
            json_build_object(
              'emoji', r.emoji,
              'count', r.cnt,
              'userIds', r.user_ids
            )
          ) FILTER (WHERE r.emoji IS NOT NULL),
          '[]'::json
        ) AS reactions
       FROM case_comments c
       LEFT JOIN (
         SELECT comment_id, emoji, COUNT(*) AS cnt,
                json_agg(user_id) AS user_ids
         FROM comment_reactions
         GROUP BY comment_id, emoji
       ) r ON r.comment_id = c.id
       WHERE c.case_id = $1
       GROUP BY c.id
       ORDER BY c.created_at ASC`,
      [id]
    );

    res.json({
      success: true,
      comments: result.rows
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/mitigation/cases/:id/comments
// Add a comment to a case
// Body: { "comment_text": "Crew is being reassigned", "author_username": "apoc" }
// If author_username is not provided, use the logged-in user's username from token
// ─────────────────────────────────────────────────────────────
router.post('/cases/:id/comments', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment_text, author_username, parent_comment_id } = req.body;

    if (!comment_text || !comment_text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'comment_text is required'
      });
    }

    // Verify case exists
    const caseCheck = await query(
      'SELECT id FROM mitigation_cases WHERE id = $1',
      [id]
    );

    if (caseCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Use provided author_username or fallback to logged-in user
    const finalAuthorUsername = author_username || req.user.username;

    const result = await query(
      `INSERT INTO case_comments (case_id, author_user_id, author_username, comment_text, parent_comment_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, case_id, author_user_id, author_username, comment_text, created_at, parent_comment_id`,
      [id, req.user.id, finalAuthorUsername, comment_text.trim(), parent_comment_id || null]
    );

    const newComment = result.rows[0];

    // Broadcast to all WebSocket clients viewing this case
    const broadcast = req.app.locals.broadcastComment;
    if (broadcast) broadcast(parseInt(id), newComment);

    res.status(201).json({
      success: true,
      message: 'Comment added',
      comment: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/mitigation/cases/:caseId/comments/:commentId
// Delete a comment (author or Admin only)
// ─────────────────────────────────────────────────────────────
router.delete('/cases/:caseId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const { caseId, commentId } = req.params;

    const commentResult = await query(
      'SELECT author_user_id FROM case_comments WHERE id = $1',
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const comment = commentResult.rows[0];

    if (req.user.id !== comment.author_user_id && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    await query('DELETE FROM case_comments WHERE id = $1', [commentId]);

    const broadcast = req.app.locals.broadcastToCase;
    if (broadcast) broadcast(parseInt(caseId), { type: 'comment_deleted', commentId: parseInt(commentId) });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/mitigation/cases/:caseId/comments/:commentId/reactions
// Toggle an emoji reaction (add if absent, remove if present)
// ─────────────────────────────────────────────────────────────
const ALLOWED_EMOJIS = ['👍', '👎', '✅', '❌', '⚠️', '🔥', '👀'];

router.post('/cases/:caseId/comments/:commentId/reactions', verifyToken, async (req, res) => {
  try {
    const { caseId, commentId } = req.params;
    const { emoji } = req.body;

    if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
      return res.status(400).json({ success: false, message: 'Invalid emoji' });
    }

    const existing = await query(
      'SELECT id FROM comment_reactions WHERE comment_id=$1 AND user_id=$2 AND emoji=$3',
      [commentId, req.user.id, emoji]
    );

    if (existing.rows.length > 0) {
      await query('DELETE FROM comment_reactions WHERE id=$1', [existing.rows[0].id]);
    } else {
      await query(
        'INSERT INTO comment_reactions (comment_id, user_id, emoji) VALUES ($1, $2, $3)',
        [commentId, req.user.id, emoji]
      );
    }

    const result = await query(
      'SELECT emoji, COUNT(*) as cnt, json_agg(user_id) as user_ids FROM comment_reactions WHERE comment_id=$1 GROUP BY emoji',
      [commentId]
    );

    const broadcast = req.app.locals.broadcastToCase;
    if (broadcast) broadcast(parseInt(caseId), { type: 'reaction_update', commentId: parseInt(commentId), reactions: result.rows });

    res.json({ success: true, reactions: result.rows });
  } catch (error) {
    console.error('Error toggling reaction:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle reaction', error: error.message });
  }
});

module.exports = router;
