import express from 'express';
import {
  submitAppointmentFeedback,
  getAppointmentFeedback,
  getFeedbackDetail,
  updateFeedbackStatus,
  getAllFeedbacks
} from '../controllers/appointmentFeedbackController.js';
import {
  submitWebsiteFeedback,
  getAllWebsiteFeedbacks,
  getWebsiteFeedbackDetail,
  updateWebsiteFeedbackStatus
} from '../controllers/websiteFeedbackController.js';

const router = express.Router();

// ============ APPOINTMENT FEEDBACK ROUTES ============

// Public: Submit appointment feedback
router.post('/appointment/submit', async (req, res) => {
  try {
    const result = await submitAppointmentFeedback(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin: Get all appointment feedbacks
router.get('/appointment/all', async (req, res) => {
  try {
    const result = await getAllFeedbacks();
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin: Get specific appointment feedback
router.get('/appointment/:appointmentId', async (req, res) => {
  try {
    const result = await getAppointmentFeedback(req.params.appointmentId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin: Get feedback detail
router.get('/appointment/detail/:feedbackId', async (req, res) => {
  try {
    const result = await getFeedbackDetail(req.params.feedbackId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin: Update feedback status
router.put('/appointment/status/:feedbackId', async (req, res) => {
  try {
    const result = await updateFeedbackStatus(req.params.feedbackId, req.body.status);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ============ WEBSITE FEEDBACK ROUTES ============

// Public: Submit website feedback
router.post('/website/submit', async (req, res) => {
  try {
    const result = await submitWebsiteFeedback(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin: Get all website feedbacks
router.get('/website/all', async (req, res) => {
  try {
    const result = await getAllWebsiteFeedbacks(req.query);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin: Get website feedback detail
router.get('/website/detail/:feedbackId', async (req, res) => {
  try {
    const result = await getWebsiteFeedbackDetail(req.params.feedbackId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin: Update website feedback status
router.put('/website/status/:feedbackId', async (req, res) => {
  try {
    const result = await updateWebsiteFeedbackStatus(req.params.feedbackId, req.body.status);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
