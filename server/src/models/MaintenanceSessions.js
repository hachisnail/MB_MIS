// server/src/models/MaintenanceSessions.js
import { DataTypes } from "sequelize";
import { mainDb } from "../configs/databases.js";
import { Contributions } from "./contributionModels.js";

export const MaintenanceSessions = mainDb.define(
  "MaintenanceSessions",
  {
    session_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    contribution_id: {
      type: DataTypes.INTEGER, // must match contributions.contribution_id type
      allowNull: false,
      references: { model: "contributions", key: "contribution_id" },
    },
    started_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
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
  },
  {
    tableName: "maintenance_sessions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { name: "idx_ms_contribution", fields: ["contribution_id"] },
      // helps "is open" lookups (completed_at IS NULL)
      { name: "idx_ms_open_lookup", fields: ["contribution_id", "completed_at"] },
    ],
  }
);

// Associations
Contributions.hasMany(MaintenanceSessions, {
  foreignKey: "contribution_id",
  onDelete: "CASCADE",
});
MaintenanceSessions.belongsTo(Contributions, {
  foreignKey: "contribution_id",
});

export default { MaintenanceSessions };
