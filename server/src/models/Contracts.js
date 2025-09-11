import { DataTypes } from "sequelize";
import { mainDb } from "../configs/databases.js";
import { Contributions } from "./contributionModels.js";

export const Contracts = mainDb.define(
  "Contracts",
  {
    contract_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    contribution_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Contributions, key: "contribution_id" },
    },
    // reference: {
    //   type: DataTypes.CHAR(36),
    //   allowNull: false,
    // },
    payload: {
      type: DataTypes.JSON,
      allowNull: true, // can start empty
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "Contracts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Associations
Contributions.hasOne(Contracts, {
  foreignKey: "contribution_id",
  onDelete: "CASCADE",
});
Contracts.belongsTo(Contributions, {
  foreignKey: "contribution_id",
});
