// server/src/models/ArtifactMetadata.js
import { DataTypes } from "sequelize";
import { mainDb } from "../configs/databases.js";

// Export both named and default so either import style works:
//   import ArtifactMetadata from "../models/ArtifactMetadata.js"
//   import { ArtifactMetadata } from "../models/ArtifactMetadata.js"
export const ArtifactMetadata = mainDb.define(
  "ArtifactMetadata",
  {
    metadata_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    // 1:1 with ContributionArtifacts via artifact_id
    artifact_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true,
    },

    // set when metadata is finalized (and, if needed, generated)
    collection_number: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
    },

    // metadata fields
    date_of_creation: { type: DataTypes.STRING(191), allowNull: true },
    culture: { type: DataTypes.TEXT, allowNull: true },
    provenance: { type: DataTypes.TEXT, allowNull: true },
    current_location: { type: DataTypes.STRING(255), allowNull: true },
    discovery_details: { type: DataTypes.TEXT, allowNull: true },
    excavation_site: { type: DataTypes.STRING(255), allowNull: true },
    acquisition_history: { type: DataTypes.TEXT, allowNull: true },
    curatorial_description: { type: DataTypes.TEXT("medium"), allowNull: true },

    // NEW tracking flags
    metadata_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    inventory_synced_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // timestamps (handled by model options below)
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "artifact_metadata",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { unique: true, fields: ["artifact_id"] },
      { unique: true, fields: ["collection_number"] },
      { fields: ["inventory_synced_at"] },
    ],
  }
);

export default ArtifactMetadata;
