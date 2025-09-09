import { DataTypes } from 'sequelize';
import { mainDb as sequelize } from './authModels.js';
import User from './Users.js';
import Credential from './Users.js';
import { addDbChangeHooks } from '../hooks/emitDbChangeHooks.js'; // <-- ADD THIS LINE

const Article = sequelize.define('Article', {
  article_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Credential,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  upload_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  images: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  article_category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    content_type: {
    type: DataTypes.ENUM('article', 'event'),
    allowNull: true,
  },
  volume: {
  type: DataTypes.INTEGER,
  allowNull: true,
  },
  sequence_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  editImages: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  caption: { 
      type: DataTypes.TEXT,
      allowNull: true,
    },
  author: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  barangay: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'posted', 'scheduled', 'rejected', 'archived'),
    defaultValue: 'pending',
    allowNull: false,
  },
  upload_period_start: {
    type: DataTypes.DATE,
    allowNull: true 
  },
  upload_period_end: {
    type: DataTypes.DATE,
    allowNull: true 
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  reviewer_notes: {
      type: DataTypes.TEXT,
      allowNull: true 
    },
}, {
  tableName: 'articles',
  timestamps: false,
});

Article.belongsTo(User, { foreignKey: 'user_id' });

// ADD THIS LINE to enable logging for Article updates/creates/deletes
addDbChangeHooks(Article, "Article");

// Log status changes
Article.afterUpdate(async (instance, options) => {
  // Only log if status actually changed
  if (instance.changed("status")) {
    const { Log } = await import("./logModel.js");
    await Log.create({
      action: "update",
      model: "Article",
      details: { article_id: instance.article_id },
      description: `Status changed from "${instance._previousDataValues.status}" to "${instance.status}" for article "${instance.title}"`,
      beforeState: JSON.stringify({ status: instance._previousDataValues.status }),
      afterState: JSON.stringify({ status: instance.status }),
      userId: options.userId || instance.user_id, // Prefer userId from options if provided
    });
  }
});

export default Article;
