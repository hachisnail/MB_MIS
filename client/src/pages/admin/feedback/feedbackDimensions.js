/**
 * Feedback Dimensions Configuration
 * Handles rating field definitions for both appointment and website feedback types
 */

export const FEEDBACK_TYPES = {
  APPOINTMENT: "appointment",
  WEBSITE: "website",
};

export const APPOINTMENT_DIMENSIONS = [
  {
    name: "Accessibility & Scheduling",
    fields: [
      { key: "accessibility_booking", label: "Ease of booking" },
      { key: "accessibility_availability", label: "Availability" },
    ],
  },
  {
    name: "Staff Performance",
    fields: [
      { key: "staff_helpfulness", label: "Helpfulness & professionalism" },
      { key: "staff_communication", label: "Communication clarity" },
    ],
  },
  {
    name: "Facility & Environment",
    fields: [
      { key: "facility_cleanliness", label: "Cleanliness" },
      { key: "facility_comfort", label: "Comfort" },
    ],
  },
  {
    name: "Process Efficiency",
    fields: [
      { key: "process_clarity", label: "Process clarity" },
      { key: "process_timeliness", label: "On-time start" },
    ],
  },
  {
    name: "Service Quality",
    fields: [
      { key: "service_expectations", label: "Met expectations" },
      { key: "service_quality", label: "Service quality" },
    ],
  },
];

export const WEBSITE_DIMENSIONS = [
  {
    name: "Usability & Design",
    fields: [
      { key: "website_usability", label: "Website usability" },
      { key: "website_design", label: "Design & visual appeal" },
    ],
  },
  {
    name: "Content & Accuracy",
    fields: [
      { key: "content_quality", label: "Content quality" },
      { key: "information_accuracy", label: "Information accuracy" },
    ],
  },
  {
    name: "Performance",
    fields: [
      { key: "loading_speed", label: "Loading speed" },
    ],
  },
  {
    name: "Mobile Experience",
    fields: [
      { key: "mobile_responsiveness", label: "Mobile responsiveness" },
      { key: "navigation_ease", label: "Navigation ease" },
    ],
  },
  {
    name: "Accessibility",
    fields: [
      { key: "accessibility_features", label: "Accessibility features" },
    ],
  },
  {
    name: "Overall Experience",
    fields: [
      { key: "overall_satisfaction", label: "Overall satisfaction" },
    ],
  },
];

/**
 * Get dimensions configuration based on feedback type
 * @param {string} feedbackType - Type of feedback (appointment or website)
 * @returns {Array} Dimensions configuration
 */
export const getDimensions = (feedbackType) => {
  return feedbackType === FEEDBACK_TYPES.WEBSITE
    ? WEBSITE_DIMENSIONS
    : APPOINTMENT_DIMENSIONS;
};

/**
 * Get all rating field keys for a feedback type
 * @param {string} feedbackType - Type of feedback
 * @returns {Array} Array of field keys
 */
export const getRatingFields = (feedbackType) => {
  const dimensions = getDimensions(feedbackType);
  return dimensions.flatMap((group) => group.fields.map((f) => f.key));
};

/**
 * Calculate average rating for a feedback item
 * @param {object} feedback - Feedback object
 * @param {string} feedbackType - Type of feedback
 * @returns {number|string} Average rating or "N/A"
 */
export const calculateOverallRating = (feedback, feedbackType) => {
  if (!feedback) return "N/A";
  const fields = getRatingFields(feedbackType);
  const values = fields
    .map((f) => feedback[f])
    .filter((v) => typeof v === "number" && !isNaN(v) && v > 0);
  return values.length > 0
    ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
    : "N/A";
};

/**
 * Calculate dimension average
 * @param {object} feedback - Feedback object
 * @param {Array} fields - Array of field definitions
 * @returns {number|string} Dimension average or "N/A"
 */
export const calculateDimensionAvg = (feedback, fields) => {
  if (!feedback || !fields) return "N/A";
  const values = fields
    .map((f) => feedback[f.key])
    .filter((v) => typeof v === "number" && !isNaN(v) && v > 0);
  return values.length > 0
    ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
    : "N/A";
};

/**
 * Detect feedback type from feedback object
 * Heuristic: if it has appointment-specific fields, it's appointment; otherwise website
 * @param {object} feedback - Feedback object
 * @returns {string} Feedback type
 */
export const detectFeedbackType = (feedback) => {
  if (!feedback) return FEEDBACK_TYPES.APPOINTMENT;
  
  // Check if feedback_type property is already set
  if (feedback.feedback_type) {
    return feedback.feedback_type === "website" ? FEEDBACK_TYPES.WEBSITE : FEEDBACK_TYPES.APPOINTMENT;
  }
  
  // Check if it has appointment-specific fields
  if (feedback.accessibility_booking !== undefined || feedback.staff_helpfulness !== undefined) {
    return FEEDBACK_TYPES.APPOINTMENT;
  }
  
  // Otherwise assume it's website feedback
  return FEEDBACK_TYPES.WEBSITE;
};
