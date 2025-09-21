// src/models/MaintenanceReports.js
import { DataTypes } from "sequelize";
import { mainDb } from "../configs/databases.js";
import { Contributions } from "./contributionModels.js"; // ← adjust path to where you export Contributions

// tiny helpers for JSON TEXT columns
const parseJSON = (raw, fallback) => {
  if (raw == null) return fallback;
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return fallback; }
};
const setJSON = (inst, key, val, fallback) => {
  if (val == null) return inst.setDataValue(key, JSON.stringify(fallback));
  try { inst.setDataValue(key, JSON.stringify(val)); }
  catch { inst.setDataValue(key, JSON.stringify(fallback)); }
};

export const MaintenanceReports = mainDb.define(
  "MaintenanceReports",
  {
    // ✅ match your table
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },

    contribution_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: "contributions", key: "contribution_id" },
    },

    person_responsible: { type: DataTypes.STRING(255), allowNull: false },
    action_taken:       { type: DataTypes.TEXT, allowNull: false },

    // ✅ match DATE columns
    date_start: { type: DataTypes.DATEONLY, allowNull: false },
    date_end:   { type: DataTypes.DATEONLY, allowNull: false },

    dimensions: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() { return parseJSON(this.getDataValue("dimensions"), []); },
      set(v) { setJSON(this, "dimensions", v, []); },
    },

    storage:               { type: DataTypes.STRING(255), allowNull: true },
    responsible_personnel: { type: DataTypes.STRING(255), allowNull: true },
    initial_condition:     { type: DataTypes.TEXT, allowNull: true },
    damages:               { type: DataTypes.TEXT, allowNull: true },
    environment:           { type: DataTypes.TEXT, allowNull: true },

    img_before: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() { return parseJSON(this.getDataValue("img_before"), []); },
      set(v) { setJSON(this, "img_before", v, []); },
    },
    img_after: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() { return parseJSON(this.getDataValue("img_after"), []); },
      set(v) { setJSON(this, "img_after", v, []); },
    },

    preventive: { type: DataTypes.TEXT, allowNull: true },
    remarks:    { type: DataTypes.TEXT, allowNull: true },

    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "maintenance_reports",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { name: "idx_maintenance_reports_contribution_id", fields: ["contribution_id"] },
      { name: "idx_maintenance_reports_date_range", fields: ["date_start", "date_end"] },
    ],
  }
);

// Associations
Contributions.hasMany(MaintenanceReports, {
  foreignKey: "contribution_id",
  onDelete: "CASCADE",
});
MaintenanceReports.belongsTo(Contributions, {
  foreignKey: "contribution_id",
});

export default { MaintenanceReports };
