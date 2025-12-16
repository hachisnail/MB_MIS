import express from 'express';
import ExcelJS from 'exceljs';
import {
  submitAppointmentFeedback,
  getAppointmentFeedback,
  getFeedbackDetail,
  updateFeedbackStatus,
  getAllFeedbacks,
  sendFeedbackEmail
} from '../controllers/appointmentFeedbackController.js';
import {
  submitWebsiteFeedback,
  getAllWebsiteFeedbacks,
  getWebsiteFeedbackDetail,
  updateWebsiteFeedbackStatus,
  sendWebsiteFeedbackEmail
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
    const userId = req.session?.user?.id || 1; // Use logged-in user ID from session or default to system
    const result = await updateFeedbackStatus(req.params.feedbackId, req.body.status, req.body.adminNotes, userId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin: Send email response to feedback visitor
router.post('/appointment/:feedbackId/send-email', async (req, res) => {
  try {
    const userId = req.session?.user?.id || 1;
    const result = await sendFeedbackEmail(req.params.feedbackId, req.body, userId);
    res.status(200).json(result);
  } catch (err) {
    console.error('Error in send-email route:', err);
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
    const userId = req.session?.user?.id || 1; // Use logged-in user ID from session or default to system
    const result = await updateWebsiteFeedbackStatus(req.params.feedbackId, req.body.status, req.body.admin_notes, userId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin: Send email response to website feedback visitor
router.post('/website/:feedbackId/send-email', async (req, res) => {
  try {
    const userId = req.session?.user?.id || 1;
    const result = await sendWebsiteFeedbackEmail(req.params.feedbackId, req.body, userId);
    res.status(200).json(result);
  } catch (err) {
    console.error('Error in website send-email route:', err);
    res.status(400).json({ message: err.message });
  }
});

// ============ EXPORT ROUTES ============

// Admin: Export all feedbacks to Excel
router.get('/export', async (req, res) => {
  try {
    const { feedbackType, status, q, date, exportStartDate, exportEndDate, exportStatusFilter } = req.query;

    // Fetch all appointment feedbacks
    let appointmentFeedbacks = [];
    try {
      const apptRes = await getAllFeedbacks();
      appointmentFeedbacks = Array.isArray(apptRes) ? apptRes : [];
    } catch (err) {
      console.error('Error fetching appointment feedbacks:', err);
    }

    // Fetch all website feedbacks
    let websiteFeedbacks = [];
    try {
      const webRes = await getAllWebsiteFeedbacks({});
      websiteFeedbacks = Array.isArray(webRes?.feedbackList || webRes) ? (webRes?.feedbackList || webRes) : [];
    } catch (err) {
      console.error('Error fetching website feedbacks:', err);
    }

    // Combine with type
    let allFeedbacks = [
      ...appointmentFeedbacks.map(f => ({ ...f, feedback_type: 'appointment' })),
      ...websiteFeedbacks.map(f => ({ ...f, feedback_type: 'website' }))
    ];

    // Determine if we are keeping the current UI filters
    const isDefaultExport = !exportStatusFilter || exportStatusFilter === "all";
    const hasDateRange = exportStartDate || exportEndDate;

    // Apply UI filters if default export and no date range
    if (isDefaultExport && !hasDateRange) {
      // Apply feedback type filter
      if (feedbackType && feedbackType !== 'all') {
        allFeedbacks = allFeedbacks.filter(f => f.feedback_type === feedbackType);
      }

      // Apply status filter
      if (status && status !== 'all') {
        allFeedbacks = allFeedbacks.filter(f => f.feedback_status === status);
      }
    }

    // Apply export-specific status filter (overrides UI filters)
    if (!isDefaultExport && exportStatusFilter) {
      // For feedback, exportStatusFilter might be "appointment" or "website"
      allFeedbacks = allFeedbacks.filter(f => f.feedback_type === exportStatusFilter);
    }

    // Apply search query
    if (q) {
      const qLower = q.toLowerCase();
      allFeedbacks = allFeedbacks.filter(f =>
        (f.visitor_name && f.visitor_name.toLowerCase().includes(qLower)) ||
        (f.visitor_email && f.visitor_email.toLowerCase().includes(qLower)) ||
        (f.visitor_phone && f.visitor_phone.includes(q))
      );
    }

    // Apply single date filter
    if (date) {
      const targetDate = new Date(date);
      allFeedbacks = allFeedbacks.filter(f => {
        const submitted = new Date(f.submitted_at);
        return submitted.toDateString() === targetDate.toDateString();
      });
    }

    // Apply date range filter (always applied if set)
    if (exportStartDate || exportEndDate) {
      const start = exportStartDate ? new Date(exportStartDate).setHours(0, 0, 0, 0) : null;
      const end = exportEndDate ? new Date(exportEndDate).setHours(23, 59, 59, 999) : null;

      allFeedbacks = allFeedbacks.filter(f => {
        const submitted = new Date(f.submitted_at).getTime();
        const isAfterStart = !start || submitted >= start;
        const isBeforeEnd = !end || submitted <= end;
        return isAfterStart && isBeforeEnd;
      });
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Feedbacks');

    // Add headers
    worksheet.columns = [
      { header: 'Feedback ID', key: 'id', width: 12 },
      { header: 'Feedback Type', key: 'feedback_type', width: 15 },
      { header: 'Visitor Name', key: 'visitor_name', width: 20 },
      { header: 'Email', key: 'visitor_email', width: 25 },
      { header: 'Phone', key: 'visitor_phone', width: 15 },
      { header: 'Status', key: 'feedback_status', width: 12 },
      { header: 'Overall Rating', key: 'overall_rating', width: 12 },
      { header: 'Submitted Date', key: 'submitted_at', width: 18 }
    ];

    // Add rows
    allFeedbacks.forEach(feedback => {
      worksheet.addRow({
        id: feedback.id,
        feedback_type: feedback.feedback_type,
        visitor_name: feedback.visitor_name || '',
        visitor_email: feedback.visitor_email || '',
        visitor_phone: feedback.visitor_phone || '',
        feedback_status: feedback.feedback_status || '',
        overall_rating: feedback.overall_satisfaction || feedback.service_quality || '',
        submitted_at: feedback.submitted_at ? new Date(feedback.submitted_at).toLocaleString() : ''
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="feedback_${new Date().toISOString().slice(0, 10)}.xlsx"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error exporting feedbacks:', err);
    res.status(500).json({ message: 'Failed to export feedbacks' });
  }
});

export default router;
