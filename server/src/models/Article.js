// server/models/Article.js
import { DataTypes } from 'sequelize';
import { mainDb as sequelize } from './authModels.js';
import User from './Users.js';
import { addDbChangeHooks } from '../hooks/emitDbChangeHooks.js';

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
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
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
    allowNull: true,
  },
  upload_period_end: {
    type: DataTypes.DATE,
    allowNull: true,
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
    allowNull: true,
  },
}, {
  tableName: 'articles',
  timestamps: false,
  indexes: [
    { name: 'uniq_type_volume_seq', unique: true, fields: ['content_type', 'volume', 'sequence_number'] },
    { name: 'idx_type_volume_status', fields: ['content_type', 'volume', 'status'] },
  ],
});

Article.belongsTo(User, { foreignKey: 'user_id' });

// Change-feed hooks you already use
addDbChangeHooks(Article, 'Article');

// Log status changes (your existing pattern)
Article.afterUpdate(async (instance, options) => {
  if (instance.changed('status')) {
    const { Log } = await import('./logModel.js');
    await Log.create({
      action: 'update',
      model: 'Article',
      details: { article_id: instance.article_id },
      description: `Status changed from "${instance._previousDataValues.status}" to "${instance.status}" for article "${instance.title}"`,
      beforeState: JSON.stringify({ status: instance._previousDataValues.status }),
      afterState: JSON.stringify({ status: instance.status }),
      userId: options.userId || instance.user_id,
    });
  }
});

// Normalize and lock fields after numbering; keep updated_at fresh
Article.addHook('beforeValidate', (article) => {
  if (article.content_type) {
    article.content_type = String(article.content_type).toLowerCase();
  }
});

Article.addHook('beforeUpdate', (article) => {
  article.updated_at = new Date();

  const prev = article._previousDataValues;
  const hadNumbers = prev.volume != null && prev.sequence_number != null;

  if (hadNumbers && (article.changed('volume') || article.changed('sequence_number'))) {
    throw new Error('Archive numbers are immutable once assigned.');
  }
  if (hadNumbers && article.changed('content_type')) {
    throw new Error('Cannot change content_type after numbering.');
  }
  if (hadNumbers && article.changed('upload_period_start')) {
    throw new Error('Cannot change upload_period_start after numbering.');
  }
});


Article.addHook('beforeBulkUpdate', (options) => {
  const disallowed = new Set(['volume','sequence_number','content_type','upload_period_start']);
  const fields = options.fields
    || Object.keys(options.attributes || {})
    || Object.keys(options.update || {})
    || [];

  const bad = fields.filter(f => disallowed.has(String(f)));
  if (bad.length) {
    throw new Error(`Bulk update of "${bad.join(', ')}" is not allowed.`);
  }
});


export default Article;
