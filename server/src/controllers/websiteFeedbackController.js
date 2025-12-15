import WebsiteFeedback from '../models/websiteFeedbackModels.js';
import { mainDb } from '../configs/databases.js';
import { createLog } from '../services/logService.js';

/**
 * Submit website feedback
 */
export const submitWebsiteFeedback = async (feedbackData) => {
  const transaction = await mainDb.transaction();
  
  try {
    const {
      visitor_name,
      visitor_email,
      visitor_phone,
      website_usability,
      website_design,
      content_quality,
      loading_speed,
      mobile_responsiveness,
      navigation_ease,
      accessibility_features,
      information_accuracy,
      overall_satisfaction,
      recommendation_likelihood,
      comments
    } = feedbackData;

    // Validate that at least email or phone is provided
    if (!visitor_email?.trim() && !visitor_phone?.trim()) {
      throw new Error('Either email or phone number is required');
    }

    // Create new feedback record for this submission
    const newFeedback = await WebsiteFeedback.create({
      visitor_name: visitor_name || null,
      visitor_email: visitor_email || null,
      visitor_phone: visitor_phone || null,
      website_usability: website_usability || null,
      website_design: website_design || null,
      content_quality: content_quality || null,
      loading_speed: loading_speed || null,
      mobile_responsiveness: mobile_responsiveness || null,
      navigation_ease: navigation_ease || null,
      accessibility_features: accessibility_features || null,
      information_accuracy: information_accuracy || null,
      overall_satisfaction: overall_satisfaction || null,
      recommendation_likelihood: recommendation_likelihood || null,
      comments: comments || null,
      feedback_status: 'SUBMITTED',
      submitted_at: new Date()
    }, { transaction });

    // Log the submission
    await createLog(
      'SUBMIT',
      'WebsiteFeedback',
      newFeedback.id,
      `Website feedback submitted`,
      null,
      { visitor_email, visitor_phone },
      {
        feedback_id: newFeedback.id,
        visitor_email: visitor_email,
        visitor_phone: visitor_phone,
        overall_satisfaction: overall_satisfaction
      }
    );

    await transaction.commit();

    return {
      id: newFeedback.id,
      message: 'Feedback submitted successfully'
    };
  } catch (err) {
    await transaction.rollback();
    console.error('Error submitting website feedback:', err);
    throw err;
  }
};

/**
 * Get all website feedback (admin)
 */
export const getAllWebsiteFeedbacks = async (filters = {}) => {
  try {
    const where = {};
    
    if (filters.feedback_status) {
      where.feedback_status = filters.feedback_status;
    }
    
    if (filters.date_from || filters.date_to) {
      where.submitted_at = {};
      if (filters.date_from) {
        where.submitted_at.gte = new Date(filters.date_from);
      }
      if (filters.date_to) {
        where.submitted_at.lte = new Date(filters.date_to);
      }
    }

    const feedbackList = await WebsiteFeedback.findAll({
      where,
      order: [['submitted_at', 'DESC']]
    });

    // Calculate statistics
    const ratingFields = [
      'website_usability',
      'website_design',
      'content_quality',
      'loading_speed',
      'mobile_responsiveness',
      'navigation_ease',
      'accessibility_features',
      'information_accuracy',
      'overall_satisfaction',
      'recommendation_likelihood'
    ];

    const stats = {};
    ratingFields.forEach(field => {
      const values = feedbackList
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
        reviewed_at: f.reviewed_at,
        overall_satisfaction: f.overall_satisfaction,
        comments: f.comments
      })),
      summary: {
        total_submissions: feedbackList.length,
        statistics: stats
      }
    };
  } catch (err) {
    console.error('Error fetching website feedbacks:', err);
    throw err;
  }
};

/**
 * Get website feedback detail (admin)
 */
export const getWebsiteFeedbackDetail = async (feedbackId) => {
  try {
    const feedback = await WebsiteFeedback.findByPk(feedbackId);

    if (!feedback) {
      throw new Error('Feedback not found');
    }

    return {
      id: feedback.id,
      visitor_name: feedback.visitor_name,
      visitor_email: feedback.visitor_email,
      visitor_phone: feedback.visitor_phone,
      website_usability: feedback.website_usability,
      website_design: feedback.website_design,
      content_quality: feedback.content_quality,
      loading_speed: feedback.loading_speed,
      mobile_responsiveness: feedback.mobile_responsiveness,
      navigation_ease: feedback.navigation_ease,
      accessibility_features: feedback.accessibility_features,
      information_accuracy: feedback.information_accuracy,
      overall_satisfaction: feedback.overall_satisfaction,
      recommendation_likelihood: feedback.recommendation_likelihood,
      comments: feedback.comments,
      feedback_status: feedback.feedback_status,
      submitted_at: feedback.submitted_at,
      reviewed_at: feedback.reviewed_at
    };
  } catch (err) {
    console.error('Error fetching feedback detail:', err);
    throw err;
  }
};

/**
 * Update website feedback status (admin)
 */
export const updateWebsiteFeedbackStatus = async (feedbackId, status) => {
  try {
    const feedback = await WebsiteFeedback.findByPk(feedbackId);

    if (!feedback) {
      throw new Error('Feedback not found');
    }

    feedback.feedback_status = status;
    feedback.reviewed_at = new Date();
    await feedback.save();

    // Log the status update
    await createLog(
      'UPDATE',
      'WebsiteFeedback',
      feedbackId,
      `Website feedback status updated to ${status}`,
      null,
      {},
      {
        feedback_id: feedbackId,
        new_status: status
      }
    );

    return {
      id: feedback.id,
      feedback_status: feedback.feedback_status,
      message: 'Feedback status updated successfully'
    };
  } catch (err) {
    console.error('Error updating feedback status:', err);
    throw err;
  }
};
