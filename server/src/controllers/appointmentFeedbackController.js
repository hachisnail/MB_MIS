import AppointmentFeedback from '../models/appointmentFeedbackModels.js';
import Appointment from '../models/appointmentModels.js';
import Visitor from '../models/visitorModels.js';
import { mainDb } from '../configs/databases.js';
import { createLog } from '../services/logService.js';

/**
        population_count: feedback.Appointment.population_count
      }
    };
  } catch (err) {
    console.error('Error validating token:', err);
    throw err;
  }
};

/**
 * Submit appointment feedback
 */
export const submitAppointmentFeedback = async (feedbackData) => {
  const transaction = await mainDb.transaction();
  
  try {
    const {
      appointment_id,
      visitor_name,
      visitor_email,
      visitor_phone,
      accessibility_booking,
      accessibility_availability,
      staff_helpfulness,
      staff_communication,
      facility_cleanliness,
      facility_comfort,
      process_clarity,
      process_timeliness,
      service_expectations,
      service_quality,
      comments
    } = feedbackData;

    // Validate that at least email or phone is provided
    if (!visitor_email && !visitor_phone) {
      throw new Error('Either email or phone number is required');
    }

    // Create new feedback record for this submission
    const newFeedback = await AppointmentFeedback.create({
      appointment_id: appointment_id || null,
      visitor_name: visitor_name,
      visitor_email: visitor_email,
      visitor_phone: visitor_phone,
      accessibility_booking,
      accessibility_availability,
      staff_helpfulness,
      staff_communication,
      facility_cleanliness,
      facility_comfort,
      process_clarity,
      process_timeliness,
      service_expectations,
      service_quality,
      comments,
      feedback_status: 'SUBMITTED',
      submitted_at: new Date()
    }, { transaction });

    // Log the submission
    await createLog(
      'SUBMIT',
      'AppointmentFeedback',
      newFeedback.id,
      `Feedback submitted for appointment ${appointment_id || 'walk-in'}`,
      null,
      { visitor_email, visitor_phone },
      {
        feedback_id: newFeedback.id,
        appointment_id: appointment_id,
        visitor_email: visitor_email,
        visitor_phone: visitor_phone
      }
    );

    await transaction.commit();

    return {
      id: newFeedback.id,
      message: 'Feedback submitted successfully'
    };
  } catch (err) {
    await transaction.rollback();
    console.error('Error submitting feedback:', err);
    throw err;
  }
};

/**
 * Get all feedback for an appointment (admin)
 */
export const getAppointmentFeedback = async (appointmentId) => {
  try {
    const feedbackList = await AppointmentFeedback.findAll({
      where: { appointment_id: appointmentId },
      order: [['submitted_at', 'DESC']]
    });

    // Calculate statistics
    const submitted = feedbackList.filter(f => f.feedback_status === 'SUBMITTED' || f.feedback_status === 'REVIEWED' || f.feedback_status === 'RESPONDED' || f.feedback_status === 'RESOLVED');
    const pending = feedbackList.filter(f => f.feedback_status === 'PENDING');

    const ratingFields = [
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

    const stats = {};
    ratingFields.forEach(field => {
      const values = submitted
        .map(f => f[field])
        .filter(v => v !== null && v !== undefined);
      
      if (values.length > 0) {
        stats[field] = {
          average: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
          count: values.length
        };
      }
    });

    return {
      feedbackList: feedbackList.map(f => ({
        id: f.id,
        visitor_name: f.visitor_name,
        visitor_email: f.visitor_email,
        visitor_phone: f.visitor_phone,
        feedback_status: f.feedback_status,
        submitted_at: f.submitted_at,
        reviewed_at: f.reviewed_at
      })),
      summary: {
        total_slots: feedbackList.length,
        submitted_count: submitted.length,
        pending_count: pending.length,
        response_rate: `${((submitted.length / feedbackList.length) * 100).toFixed(1)}%`
      },
      statistics: stats
    };
  } catch (err) {
    console.error('Error getting appointment feedback:', err);
    throw err;
  }
};

/**
 * Get single feedback detail (admin)
 */
export const getFeedbackDetail = async (feedbackId) => {
  try {
    const feedback = await AppointmentFeedback.findByPk(feedbackId, {
      attributes: [
        'id',
        'appointment_id',
        'visitor_name',
        'visitor_email',
        'visitor_phone',
        'accessibility_booking',
        'accessibility_availability',
        'staff_helpfulness',
        'staff_communication',
        'facility_cleanliness',
        'facility_comfort',
        'process_clarity',
        'process_timeliness',
        'service_expectations',
        'service_quality',
        'comments',
        'feedback_status',
        'submitted_at',
        'reviewed_at',
        'created_at',
        'updated_at'
      ],
      include: [
        {
          model: Appointment,
          attributes: ['appointment_id', 'purpose_of_visit', 'preferred_date', 'start_time', 'end_time']
        }
      ]
    });

    if (!feedback) {
      throw new Error('Feedback not found');
    }

    return feedback;
  } catch (err) {
    console.error('Error getting feedback detail:', err);
    throw err;
  }
};

/**
 * Submit walk-in feedback (no appointment needed)
 */
export const submitWalkInFeedback = async (feedbackData) => {
  const transaction = await mainDb.transaction();
  
  try {
    const {
      visitor_name,
      visitor_email,
      visitor_phone,
      accessibility_booking,
      accessibility_availability,
      staff_helpfulness,
      staff_communication,
      facility_cleanliness,
      facility_comfort,
      process_clarity,
      process_timeliness,
      service_expectations,
      service_quality,
      comments
    } = feedbackData;

    // Validate required fields
    if (!visitor_name || (!visitor_email && !visitor_phone)) {
      throw new Error('Name and either email or phone is required');
    }

    // Create feedback record without appointment_id
    const feedback = await AppointmentFeedback.create({
      visitor_name,
      visitor_email,
      visitor_phone,
      accessibility_booking,
      accessibility_availability,
      staff_helpfulness,
      staff_communication,
      facility_cleanliness,
      facility_comfort,
      process_clarity,
      process_timeliness,
      service_expectations,
      service_quality,
      comments,
      feedback_status: 'SUBMITTED',
      submitted_at: new Date(),
      appointment_id: null
    }, { transaction });

    // Log the submission
    await createLog(
      'SUBMIT',
      'AppointmentFeedback',
      feedback.id,
      'Walk-in feedback submitted',
      null,
      { visitor_email, visitor_phone },
      {
        feedback_id: feedback.id,
        walk_in: true,
        visitor_email: visitor_email,
        visitor_phone: visitor_phone
      }
    );

    await transaction.commit();

    return {
      id: feedback.id,
      message: 'Thank you for your feedback!'
    };
  } catch (err) {
    await transaction.rollback();
    console.error('Error submitting walk-in feedback:', err);
    throw err;
  }
};

/**
 * Get all feedbacks (admin) with optional filters
 */
export const getAllFeedbacks = async (options = {}) => {
  try {
    const { status, date_from, date_to, search, limit = 100, offset = 0 } = options;

    // Build where clause with filters
    const where = {};

    if (status && status !== 'all') {
      where.feedback_status = status;
    }

    if (date_from || date_to) {
      where.submitted_at = {};
      if (date_from) {
        const fromDate = new Date(date_from);
        if (!isNaN(fromDate.getTime())) {
          where.submitted_at[mainDb.Sequelize.Op.gte] = fromDate;
        }
      }
      if (date_to) {
        const toDate = new Date(date_to);
        if (!isNaN(toDate.getTime())) {
          where.submitted_at[mainDb.Sequelize.Op.lte] = toDate;
        }
      }
    }

    // Build search condition
    let searchCondition = null;
    if (search) {
      searchCondition = {
        [mainDb.Sequelize.Op.or]: [
          { visitor_name: { [mainDb.Sequelize.Op.like]: `%${search}%` } },
          { visitor_email: { [mainDb.Sequelize.Op.like]: `%${search}%` } },
          { visitor_phone: { [mainDb.Sequelize.Op.like]: `%${search}%` } }
        ]
      };
    }

    // Combine where clause with search if needed
    const finalWhere = searchCondition ? { [mainDb.Sequelize.Op.and]: [where, searchCondition] } : where;

    const { count, rows } = await AppointmentFeedback.findAndCountAll({
      attributes: [
        'id',
        'appointment_id',
        'visitor_name',
        'visitor_email',
        'visitor_phone',
        'accessibility_booking',
        'accessibility_availability',
        'staff_helpfulness',
        'staff_communication',
        'facility_cleanliness',
        'facility_comfort',
        'process_clarity',
        'process_timeliness',
        'service_expectations',
        'service_quality',
        'comments',
        'feedback_status',
        'submitted_at',
        'reviewed_at',
        'created_at',
        'updated_at'
      ],
      where: finalWhere,
      include: [
        {
          model: Appointment,
          attributes: ['appointment_id', 'purpose_of_visit', 'preferred_date', 'start_time', 'end_time'],
          required: false
        }
      ],
      order: [['submitted_at', 'DESC']],
      limit,
      offset
    });

    // Calculate statistics for all feedbacks matching the filter
    const ratingFields = [
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

    const stats = {
      total: count,
      by_status: {
        SUBMITTED: rows.filter(f => f.feedback_status === 'SUBMITTED').length,
        REVIEWED: rows.filter(f => f.feedback_status === 'REVIEWED').length,
        RESPONDED: rows.filter(f => f.feedback_status === 'RESPONDED').length,
        RESOLVED: rows.filter(f => f.feedback_status === 'RESOLVED').length
      }
    };

    // Calculate average ratings
    const ratingAverages = {};
    ratingFields.forEach(field => {
      const values = rows
        .map(f => f[field])
        .filter(v => v !== null && v !== undefined);

      if (values.length > 0) {
        ratingAverages[field] = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
      }
    });

    // Format response with feedback list
    const feedbackList = rows.map(f => {
      // Calculate overall rating
      const ratingValues = ratingFields.map(field => f[field]).filter(v => v !== null);
      const overallRating = ratingValues.length > 0 
        ? (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(2)
        : 0;

      return {
        id: f.id,
        visitor_name: f.visitor_name,
        visitor_email: f.visitor_email,
        visitor_phone: f.visitor_phone,
        feedback_status: f.feedback_status,
        submitted_at: f.submitted_at,
        reviewed_at: f.reviewed_at,
        comments: f.comments,
        appointment_id: f.appointment_id,
        // Include all rating fields
        accessibility_booking: f.accessibility_booking,
        accessibility_availability: f.accessibility_availability,
        staff_helpfulness: f.staff_helpfulness,
        staff_communication: f.staff_communication,
        facility_cleanliness: f.facility_cleanliness,
        facility_comfort: f.facility_comfort,
        process_clarity: f.process_clarity,
        process_timeliness: f.process_timeliness,
        service_expectations: f.service_expectations,
        service_quality: f.service_quality,
        // Appointment data
        Appointment: f.Appointment ? {
          appointment_id: f.Appointment.appointment_id,
          purpose_of_visit: f.Appointment.purpose_of_visit,
          preferred_date: f.Appointment.preferred_date,
          start_time: f.Appointment.start_time,
          end_time: f.Appointment.end_time
        } : null,
        overall_rating: parseFloat(overallRating)
      };
    });

    return feedbackList;
  } catch (err) {
    console.error('Error getting all feedbacks:', err);
    throw err;
  }
};

/**
 * Update feedback status (admin)
 */
export const updateFeedbackStatus = async (feedbackId, newStatus, adminNotes = null) => {
  try {
    const feedback = await AppointmentFeedback.findByPk(feedbackId);

    if (!feedback) {
      throw new Error('Feedback not found');
    }

    const updateData = {
      feedback_status: newStatus
    };

    if (newStatus === 'COMPLETED' && !feedback.reviewed_at) {
      updateData.reviewed_at = new Date();
    }

    await feedback.update(updateData);

    // Log the status update
    await createLog(
      'UPDATE',
      'AppointmentFeedback',
      feedbackId,
      `Status updated from ${feedback.feedback_status} to ${newStatus}`,
      { status: feedback.feedback_status },
      { status: newStatus },
      {
        feedback_id: feedbackId,
        previous_status: feedback.feedback_status,
        new_status: newStatus,
        admin_notes: adminNotes
      }
    );

    return feedback;
  } catch (err) {
    console.error('Error updating feedback status:', err);
    throw err;
  }
};
