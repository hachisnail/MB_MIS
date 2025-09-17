import { DataTypes } from "sequelize";
import { mainDb } from "../configs/databases.js";

export const ArtifactMetadata = mainDb.define(
  "ArtifactMetadata",
  {
    metadata_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // 1:1 with ContributionArtifacts via artifact_id
    artifact_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },

    // will be set when metadata is finalized + contribution completed
    collection_number: { type: DataTypes.STRING(64), allowNull: true, unique: true },

    date_of_creation: { type: DataTypes.STRING(255), allowNull: true },
    culture: { type: DataTypes.STRING(512), allowNull: true },
    provenance: { type: DataTypes.STRING(512), allowNull: true },
    current_location: { type: DataTypes.STRING(255), allowNull: true },
    discovery_details: { type: DataTypes.STRING(512), allowNull: true },
    excavation_site: { type: DataTypes.STRING(255), allowNull: true },
    acquisition_history: { type: DataTypes.STRING(1024), allowNull: true },

    // staff-facing description
    curatorial_description: { type: DataTypes.TEXT, allowNull: true },

    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "artifact_metadata",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default ArtifactMetadata;
