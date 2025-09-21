import { DataTypes } from "sequelize";
import { mainDb } from "../configs/databases.js";
import { ArtifactMetadata } from "./ArtifactMetadata.js";
// ---------------- Models ----------------

export const Contributors = mainDb.define(
  "Contributors",
  {
    contributor_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    first_name: { type: DataTypes.STRING(255), allowNull: false },
    last_name: { type: DataTypes.STRING(255), allowNull: false },
    birth_date: { type: DataTypes.DATE, allowNull: true },
    phone_number: { type: DataTypes.STRING(20), allowNull: false },
    sex: { type: DataTypes.ENUM("male", "female", "other"), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    organization: { type: DataTypes.STRING(255), allowNull: true },
    province: { type: DataTypes.STRING(255), allowNull: false },
    barangay: { type: DataTypes.STRING(255), allowNull: false },
    city: { type: DataTypes.STRING(255), allowNull: false },
    street: { type: DataTypes.STRING(255), allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "contributors",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export const Contributions = mainDb.define(
  "Contributions",
  {
    contribution_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    contributor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Contributors, key: "contributor_id" },
    },
    contribution_type: { type: DataTypes.ENUM("lending", "donation"), allowNull: false },
    submission_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "completed"),
      defaultValue: "pending",
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "contributions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export const LendingDetails = mainDb.define(
  "LendingDetails",
  {
    lending_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    contribution_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: Contributions, key: "contribution_id" },
    },
    duration_from: { type: DataTypes.DATE, allowNull: true },
    duration_to: { type: DataTypes.DATE, allowNull: true },
    lend_conditions: { type: DataTypes.TEXT, allowNull: false },
    lend_liabilities: { type: DataTypes.TEXT, allowNull: false },
    lending_reason: { type: DataTypes.TEXT, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "lendingdetails",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export const ContributionArtifacts = mainDb.define(
  "ContributionArtifacts",
  {
    artifact_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    contribution_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: Contributions, key: "contribution_id" },
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    acquisition_details: { type: DataTypes.TEXT, allowNull: false },
    additional_info: { type: DataTypes.TEXT, allowNull: true },
    narrative: { type: DataTypes.TEXT, allowNull: true },
    images: { type: DataTypes.TEXT, allowNull: true, comment: "JSON array of image filenames" },
    documents: { type: DataTypes.TEXT, allowNull: true, comment: "JSON array of document filenames" },
    related_images: { type: DataTypes.TEXT, allowNull: true, comment: "JSON array of related image filenames" },
    image_urls: { type: DataTypes.TEXT, allowNull: true, comment: "JSON array of image URLs" },
    document_urls: { type: DataTypes.TEXT, allowNull: true, comment: "JSON array of document URLs" },
    related_image_urls: { type: DataTypes.TEXT, allowNull: true, comment: "JSON array of related image URLs" },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "contributionartifacts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export const ContributionTimelines = mainDb.define(
  "ContributionTimelines",
  {
    timeline_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    contribution_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: Contributions, key: "contribution_id" },
    },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    under_review_at: { type: DataTypes.DATE, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    pending_at: { type: DataTypes.DATE, allowNull: true }, // New column added
    moa_settled_at: { type: DataTypes.DATE, allowNull: true },
    on_delivery_at: { type: DataTypes.DATE, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "contributiontimelines",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export const ContributionSessions = mainDb.define(
  "ContributionSessions",
  {
    session_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    contribution_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Contributions, key: "contribution_id" },
    },
    uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    guest_identity: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue("guest_identity");
        if (!raw) return null;
        if (typeof raw === "object") return raw;
        try { return JSON.parse(raw); } catch { return null; }
      },
      set(val) {
        if (val == null) return this.setDataValue("guest_identity", null);
        try { this.setDataValue("guest_identity", JSON.stringify(val)); }
        catch { this.setDataValue("guest_identity", null); }
      },
    },
    scopes: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
    magic_token_hash: { type: DataTypes.STRING(64), allowNull: true, unique: true },
    link_expires_at: { type: DataTypes.DATE, allowNull: true },
    last_seen_at: { type: DataTypes.DATE, allowNull: true },
    magic_link_used_at: { type: DataTypes.DATE, allowNull: true },
    otp_salt: { type: DataTypes.STRING(32), allowNull: true },
    otp_code_hash: { type: DataTypes.STRING(64), allowNull: true },
    otp_expires_at: { type: DataTypes.DATE, allowNull: true },
    otp_verified_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    closed_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "contributionsessions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

// -------- NEW: CatalogArtifacts (materialized join for public display) --------
export const CatalogArtifacts = mainDb.define(
  "CatalogArtifacts",
  {
    catalog_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // keys
    artifact_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    contribution_id: { type: DataTypes.INTEGER, allowNull: false },

    // titles / descriptions
    title: { type: DataTypes.STRING(255), allowNull: false },
    donor_description: { type: DataTypes.TEXT, allowNull: true },
    curatorial_description: { type: DataTypes.TEXT, allowNull: true },
    display_description: { type: DataTypes.TEXT, allowNull: true },

    // acquisition / narrative
    acquisition_details: { type: DataTypes.TEXT, allowNull: true },
    additional_info: { type: DataTypes.TEXT, allowNull: true },
    narrative: { type: DataTypes.TEXT, allowNull: true },

    // files / media (JSON-encoded as TEXT)
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

    // catalog flags
    published: { type: DataTypes.BOOLEAN, defaultValue: true },

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

// ---------------- Associations ----------------

// Users → Contributions
Contributors.hasMany(Contributions, { foreignKey: "contributor_id", onDelete: "CASCADE" });
Contributions.belongsTo(Contributors, { foreignKey: "contributor_id" });

// Contributions → Timeline
Contributions.hasOne(ContributionTimelines, { foreignKey: "contribution_id", onDelete: "CASCADE" });
ContributionTimelines.belongsTo(Contributions, { foreignKey: "contribution_id" });

// Contributions → Lending details
Contributions.hasOne(LendingDetails, { foreignKey: "contribution_id", onDelete: "CASCADE" });
LendingDetails.belongsTo(Contributions, { foreignKey: "contribution_id" });

// Contributions → Artifact
Contributions.hasOne(ContributionArtifacts, { foreignKey: "contribution_id", onDelete: "CASCADE" });
ContributionArtifacts.belongsTo(Contributions, { foreignKey: "contribution_id" });

// Contributions → Sessions
Contributions.hasOne(ContributionSessions, { foreignKey: "contribution_id", onDelete: "CASCADE" });
ContributionSessions.belongsTo(Contributions, { foreignKey: "contribution_id" });

// Artifact ↔ Metadata (1:1 via artifact_id)
ContributionArtifacts.hasOne(ArtifactMetadata, {
  foreignKey: "artifact_id",
  as: "Metadata",
  onDelete: "CASCADE",
});
ArtifactMetadata.belongsTo(ContributionArtifacts, {
  foreignKey: "artifact_id",
  as: "Artifact",
});

// Artifact ↔ Catalog (1:1 via artifact_id) — materialized view
ContributionArtifacts.hasOne(CatalogArtifacts, {
  foreignKey: "artifact_id",
  as: "Catalog",
  onDelete: "CASCADE",
});
CatalogArtifacts.belongsTo(ContributionArtifacts, {
  foreignKey: "artifact_id",
  as: "Artifact",
});

// ---------------- Hooks ----------------

// Seed timeline on contribution create
Contributions.afterCreate(async (contrib, options) => {
  const submittedAt = contrib.submission_date || contrib.created_at || new Date();
  await ContributionTimelines.create(
    { contribution_id: contrib.contribution_id, submitted_at: submittedAt },
    { transaction: options?.transaction }
  );
});

// Helper to build MB-YYYY-00001(+suffix)
async function generateCollectionNumber(artifactId, t) {
  const year = new Date().getFullYear();
  const base = `MB-${year}-${String(artifactId).padStart(5, "0")}`;
  let candidate = base;
  let suffix = 0;

  // ensure uniqueness under tx
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await ArtifactMetadata.findOne({
      where: { collection_number: candidate },
      transaction: t,
      lock: t?.LOCK?.UPDATE,
    });
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}-${String(suffix).padStart(2, "0")}`;
  }
}

// Note: catalog upsert happens in controllers (to avoid heavy logic in hooks)

// When a contribution is marked completed → ensure metadata exists & set collection_number
Contributions.afterUpdate(async (contrib, options) => {
  try {
    if (contrib.changed("status") && contrib.status === "completed") {
      const t = options?.transaction || await mainDb.transaction();
      const ownedTx = !options?.transaction;

      try {
        const artifact = await ContributionArtifacts.findOne({
          where: { contribution_id: contrib.contribution_id },
          transaction: t,
          lock: t?.LOCK?.UPDATE,
        });
        if (!artifact) {
          if (ownedTx) await t.rollback();
          return;
        }

        const [meta] = await ArtifactMetadata.findOrCreate({
          where: { artifact_id: artifact.artifact_id },
          defaults: { artifact_id: artifact.artifact_id },
          transaction: t,
          lock: t?.LOCK?.UPDATE,
        });

        if (!meta.collection_number) {
          const cn = await generateCollectionNumber(artifact.artifact_id, t);
          await meta.update({ collection_number: cn }, { transaction: t });
        }

        if (ownedTx) await t.commit();
      } catch (err) {
        try { if (ownedTx) await mainDb.query("ROLLBACK"); } catch {}
        console.error("Contributions.afterUpdate error:", err);
      }
    }
  } catch (e) {
    console.error("Contributions.afterUpdate outer error:", e);
  }
});

export { ArtifactMetadata };



export default {
  Contributors,
  Contributions,
  LendingDetails,
  ContributionArtifacts,
  ContributionTimelines,
  ContributionSessions,
  ArtifactMetadata,
  CatalogArtifacts,
  
};
