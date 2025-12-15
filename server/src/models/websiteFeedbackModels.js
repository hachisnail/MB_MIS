import { DataTypes } from 'sequelize';
import { mainDb } from '../configs/databases.js';
import { addDbChangeHooks } from '../hooks/emitDbChangeHooks.js';

const WebsiteFeedback = mainDb.define('WebsiteFeedback', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
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
  // Website Usability & Design
  website_usability: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'How easy is the website to use? (1-5)'
  },
  website_design: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'How visually appealing is the website design? (1-5)'
  },
  // Content & Performance
  content_quality: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'How would you rate the quality of content? (1-5)'
  },
  loading_speed: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'How would you rate the loading speed? (1-5)'
  },
  // Mobile & Accessibility
  mobile_responsiveness: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'How well does the website work on mobile devices? (1-5)'
  },
  navigation_ease: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'How easy is it to navigate the website? (1-5)'
  },
  accessibility_features: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'How accessible are the website features? (1-5)'
  },
  information_accuracy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'How accurate is the information provided? (1-5)'
  },
  // Overall Satisfaction
  overall_satisfaction: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'Overall, how satisfied are you with the website? (1-5)'
  },
  recommendation_likelihood: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { max: 5 },
    comment: 'How likely are you to recommend this website? (1-5)'
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  feedback_status: {
    type: DataTypes.ENUM('PENDING', 'SUBMITTED', 'COMPLETED', 'RESPONDED', 'RESOLVED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'website_feedback',
  timestamps: true,
  underscored: true
});

addDbChangeHooks(WebsiteFeedback, "WebsiteFeedback");

export default WebsiteFeedback;
