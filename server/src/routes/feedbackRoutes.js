import express from 'express';
import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddlewares.js';
import {
  submitAppointmentFeedback,
  getAppointmentFeedback,
  getFeedbackDetail,
  updateFeedbackStatus,
  getAllFeedbacks
} from '../controllers/appointmentFeedbackController.js';

const feedbackRouter = Router();

/**
 * PUBLIC ROUTES - No authentication required
 */

/**
 * Submit walk-in feedback (no appointment token)
 * POST /api/feedback/walk-in/submit
 * Body: {
 *   visitor_name, visitor_email, visitor_phone,
 *   overall_rating, comments
 * }
 */
feedbackRouter.post('/walk-in/submit', async (req, res) => {
  try {
    const feedbackData = req.body;

    // Validate required fields
    if (!feedbackData.visitor_name) {
      return res.status(400).json({
        error: true,
        message: 'Name is required'
      });
    }

    if (!feedbackData.visitor_email && !feedbackData.visitor_phone) {
      return res.status(400).json({
        error: true,
        message: 'Either email or phone number is required'
      });
    }

    const { submitWalkInFeedback } = await import('../controllers/appointmentFeedbackController.js');
    const result = await submitWalkInFeedback(feedbackData);

    res.json({
      success: true,
      message: 'Thank you for your feedback!',
      data: result
    });
  } catch (err) {
    console.error('Error submitting walk-in feedback:', err);
    res.status(400).json({
      error: true,
      message: err.message || 'Error submitting feedback'
    });
  }
});

/**
 * Submit appointment feedback
 * POST /api/feedback/appointment/submit
 * Body: {
 *   appointment_id, visitor_name, visitor_email, visitor_phone,
 *   accessibility_booking, accessibility_availability, staff_helpfulness, staff_communication,
 *   facility_cleanliness, facility_comfort, process_clarity, process_timeliness,
 *   service_expectations, service_quality, comments
 * }
 */
feedbackRouter.post('/appointment/submit', async (req, res) => {
  try {
    const feedbackData = req.body;

    // Validate appointment_id is provided
    if (!feedbackData.appointment_id) {
      return res.status(400).json({
        error: true,
        message: 'Appointment ID is required'
      });
    }

    // Validate all dimension ratings
    const dimensionFields = [
      'accessibility_booking',
      'accessibility_availability',
      'staff_helpfulness',
      'staff_communication',
      'facility_cleanliness',
      'facility_comfort',
      'process_clarity',
      'process_timeliness',
      'service_expectations',
      'service_quality'
    ];

    for (const field of dimensionFields) {
      if (!feedbackData[field] || feedbackData[field] < 1 || feedbackData[field] > 5) {
        return res.status(400).json({
          error: true,
          message: `All rating fields are required and must be between 1-5. Missing or invalid: ${field}`
        });
      }
    }

    const result = await submitAppointmentFeedback(feedbackData);
    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: result
    });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(400).json({
      error: true,
      message: err.message || 'Error submitting feedback'
    });
  }
});

/**
 * ADMIN ROUTES - Authentication required
 */

/**
 * Get all feedbacks (admin) - base route with filters
 * GET /api/feedback?status=&date_from=&date_to=&search=&limit=&offset=
 */
feedbackRouter.get('/', requireAuth, async (req, res) => {
  try {
    const { status, date_from, date_to, search, limit, offset } = req.query;
    const result = await getAllFeedbacks({ 
      status, 
      date_from, 
      date_to, 
      search, 
      limit: limit ? parseInt(limit) : 100, 
      offset: offset ? parseInt(offset) : 0 
    });
    res.json(result);
  } catch (err) {
    console.error('Error getting feedbacks:', err);
    res.status(400).json({ error: true, message: err.message || 'Error retrieving feedbacks' });
  }
});

/**
 * Get all feedback for an appointment (admin)
 * GET /api/feedback/appointment/:appointmentId/all
 */
feedbackRouter.get('/appointment/:appointmentId/all', requireAuth, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const feedbackData = await getAppointmentFeedback(appointmentId);
    res.json(feedbackData);
  } catch (err) {
    console.error('Error getting appointment feedback:', err);
    res.status(400).json({
      error: true,
      message: err.message || 'Error retrieving feedback'
    });
  }
});

/**
 * Get all feedbacks (admin) with filters - alternate path
 * GET /api/feedback/all?status=&date_from=&date_to=&search=
 */
feedbackRouter.get('/all', requireAuth, async (req, res) => {
  try {
    const { status, date_from, date_to, search, limit, offset } = req.query;
    const result = await getAllFeedbacks({ status, date_from, date_to, search, limit: limit ? parseInt(limit) : 100, offset: offset ? parseInt(offset) : 0 });
    res.json(result);
  } catch (err) {
    console.error('Error getting feedbacks:', err);
    res.status(400).json({ error: true, message: err.message || 'Error retrieving feedbacks' });
  }
});

/**
 * Get feedback detail (admin)
 * GET /api/feedback/:feedbackId
 */
feedbackRouter.get('/:feedbackId', requireAuth, async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const feedback = await getFeedbackDetail(feedbackId);
    res.json({
      success: true,
      data: feedback
    });
  } catch (err) {
    console.error('Error getting feedback detail:', err);
    res.status(400).json({
      error: true,
      message: err.message || 'Feedback not found'
    });
  }
});

/**
 * Update feedback status (admin)
 * PATCH /api/feedback/:feedbackId/status
 * Body: { status, admin_notes }
 */
feedbackRouter.patch('/:feedbackId/status', requireAuth, async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { status, admin_notes } = req.body;

    if (!status) {
      return res.status(400).json({
        error: true,
        message: 'Status is required'
      });
    }

    const validStatuses = ['SUBMITTED', 'COMPLETED', 'RESPONDED', 'RESOLVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: true,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updatedFeedback = await updateFeedbackStatus(feedbackId, status, admin_notes);
    res.json({
      success: true,
      message: 'Feedback status updated',
      data: updatedFeedback
    });
  } catch (err) {
    console.error('Error updating feedback status:', err);
    res.status(400).json({
      error: true,
      message: err.message || 'Error updating feedback'
    });
  }
});

export default feedbackRouter;
