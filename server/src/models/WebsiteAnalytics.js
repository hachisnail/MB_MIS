import { DataTypes } from "sequelize";
import { logsDb } from "../configs/databases.js";

const WebsiteAnalytics = logsDb.define("WebsiteAnalytics", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  home_views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  catalogue_views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  articles_views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  about_views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  appointments_views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  login_views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  recovery_views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: "website_analytics",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    {
      unique: true,
      fields: ["date"]
    }
  ]
});

export default WebsiteAnalytics;
