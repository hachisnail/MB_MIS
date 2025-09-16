// models/CatalogArtifact.js
import { DataTypes } from "sequelize";
import { mainDb } from "../configs/databases.js";

export const CatalogArtifact = mainDb.define(
  "CatalogArtifact",
  {
    catalog_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // joins
    contribution_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    artifact_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },

    // titles & descriptions
    title: { type: DataTypes.STRING(255), allowNull: false },
    donor_description: { type: DataTypes.TEXT, allowNull: true },
    curatorial_description: { type: DataTypes.TEXT, allowNull: true },
    display_description: { type: DataTypes.TEXT, allowNull: true },

    // donor-side fields copied from ContributionArtifacts
    acquisition_details: { type: DataTypes.TEXT, allowNull: true },
    additional_info: { type: DataTypes.TEXT, allowNull: true },
    narrative: { type: DataTypes.TEXT, allowNull: true },

    // media (stored as JSON strings)
    images: { type: DataTypes.TEXT, allowNull: true },
    documents: { type: DataTypes.TEXT, allowNull: true },
    related_images: { type: DataTypes.TEXT, allowNull: true },
    image_urls: { type: DataTypes.TEXT, allowNull: true },
    document_urls: { type: DataTypes.TEXT, allowNull: true },
    related_image_urls: { type: DataTypes.TEXT, allowNull: true },

    // metadata
    collection_number: { type: DataTypes.STRING(64), allowNull: true, unique: true },
    date_of_creation: { type: DataTypes.STRING(255), allowNull: true },
    culture: { type: DataTypes.STRING(512), allowNull: true },
    provenance: { type: DataTypes.STRING(512), allowNull: true },
    current_location: { type: DataTypes.STRING(255), allowNull: true },
    discovery_details: { type: DataTypes.STRING(512), allowNull: true },
    excavation_site: { type: DataTypes.STRING(255), allowNull: true },
    acquisition_history: { type: DataTypes.STRING(1024), allowNull: true },
    metadata_updated_at: { type: DataTypes.DATE, allowNull: true },

    // housekeeping
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "catalog_artifacts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default CatalogArtifact;
