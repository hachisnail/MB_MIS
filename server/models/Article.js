import { DataTypes } from 'sequelize';
import { mainDb as sequelize } from './authModels.js';
import User from './Users.js';
import Credential from './Users.js';

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
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  editImages: {
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
    type: DataTypes.ENUM('pending', 'posted'),
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
}, {
  tableName: 'articles',
  timestamps: false,
});

Article.belongsTo(User, { foreignKey: 'user_id' });

export default Article;
