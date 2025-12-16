import { DataTypes } from 'sequelize';
import { mainDb } from '../configs/databases.js';
import { addDbChangeHooks } from '../hooks/emitDbChangeHooks.js';

const AppointmentFeedback = mainDb.define('AppointmentFeedback', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  appointment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'appointment',
      key: 'appointment_id'
    },
    comment: 'NULL for walk-in feedback'
  },
  visitor_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  visitor_email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  visitor_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  // Dimension 1: Accessibility & Scheduling
  accessibility_booking: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'How easy was it to book your appointment? (1-5)'
  },
  accessibility_availability: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'Was your preferred date/time available? (1-5)'
  },
  // Dimension 2: Staff Performance
  staff_helpfulness: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'Were the staff members helpful and professional? (1-5)'
  },
  staff_communication: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'Was the staff communication clear? (1-5)'
  },
  // Dimension 3: Facility/Environment Quality
  facility_cleanliness: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'Were the facilities clean and well-maintained? (1-5)'
  },
  facility_comfort: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'Was the environment comfortable? (1-5)'
  },
  // Dimension 4: Process Efficiency
  process_clarity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'Was the appointment process clear? (1-5)'
  },
  process_timeliness: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'Did the appointment start on time? (1-5)'
  },
  // Dimension 5: Service Quality & Outcome
  service_expectations: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'Did the appointment meet your expectations? (1-5)'
  },
  service_quality: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'Was the quality of service satisfactory? (1-5)'
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  feedback_status: {
    type: DataTypes.ENUM('SUBMITTED', 'REVIEWED', 'RESPONDED', 'RESOLVED'),
    allowNull: false,
    defaultValue: 'SUBMITTED',
    comment: 'SUBMITTED → REVIEWED → RESPONDED → RESOLVED'
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Admin notes or responses to the feedback'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'appointment_feedback',
  timestamps: true,
  underscored: true
});

addDbChangeHooks(AppointmentFeedback, "AppointmentFeedback");

export default AppointmentFeedback;
