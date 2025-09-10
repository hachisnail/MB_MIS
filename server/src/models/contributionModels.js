import { DataTypes } from "sequelize";
import { mainDb } from "../configs/databases.js";


// Contributors Model
export const Contributors = mainDb.define(
  "Contributors",
  {
    contributor_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: { type: DataTypes.STRING(255), allowNull: false },
    last_name: { type: DataTypes.STRING(255), allowNull: false },
    birth_date: { type: DataTypes.DATE, allowNull: true }, // Updated
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
    tableName: "Contributors",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Contributions Model
export const Contributions = mainDb.define(
  "Contributions",
  {
    contribution_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    contributor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Contributors, key: "contributor_id" },
    },
    contribution_type: {
      type: DataTypes.ENUM("lending", "donation"),
      allowNull: false,
    },
    submission_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "completed"),
      defaultValue: "pending",
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "Contributions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// LendingDetails Model
export const LendingDetails = mainDb.define(
  "LendingDetails",
  {
    lending_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
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
    tableName: "LendingDetails",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// ContributionArtifacts Model
export const ContributionArtifacts = mainDb.define(
  "ContributionArtifacts",
  {
    artifact_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    contribution_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: Contributions, key: "contribution_id" },
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    acquisition_details: { type: DataTypes.TEXT, allowNull: false },
    additional_info: { type: DataTypes.TEXT, allowNull: true }, // updated
    narrative: { type: DataTypes.TEXT, allowNull: true }, // updated
    images: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "JSON array of image filenames",
    },
    documents: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "JSON array of document filenames",
    },
    related_images: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "JSON array of related image filenames",
    },
    image_urls: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "JSON array of image URLs",
    },
    document_urls: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "JSON array of document URLs",
    },
    related_image_urls: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "JSON array of related image URLs",
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "ContributionArtifacts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export const ContributionTimelines = mainDb.define(
  "ContributionTimelines",
  {
    timeline_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    contribution_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // <-- ensure 1:1 with Contributions
      references: { model: Contributions, key: "contribution_id" },
    },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    under_review_at: { type: DataTypes.DATE, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    moa_settled_at: { type: DataTypes.DATE, allowNull: true },
    on_delivery_at: { type: DataTypes.DATE, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "ContributionTimelines",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);


export const ContributionSessions = mainDb.define(
  "ContributionSessions",
  {
    session_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    contribution_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Contributions,
        key: "contribution_id",
      },
    },
    uuid: {
      type: DataTypes.UUID, // Sequelize will handle CHAR(36)
      defaultValue: DataTypes.UUIDV4, // auto-generate if not set
      unique: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "ContributionSessions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // no need for updated_at unless you want it
  }
);

// Associations
Contributions.hasOne(ContributionSessions, {
  foreignKey: "contribution_id",
  onDelete: "CASCADE",
});
ContributionSessions.belongsTo(Contributions, {
  foreignKey: "contribution_id",
});

Contributions.hasOne(ContributionTimelines, {
  foreignKey: "contribution_id",
  onDelete: "CASCADE",
});
ContributionTimelines.belongsTo(Contributions, {
  foreignKey: "contribution_id",
});

Contributors.hasMany(Contributions, {
  foreignKey: "contributor_id",
  onDelete: "CASCADE",
});
Contributions.belongsTo(Contributors, { foreignKey: "contributor_id" });

Contributions.hasOne(LendingDetails, {
  foreignKey: "contribution_id",
  onDelete: "CASCADE",
});
LendingDetails.belongsTo(Contributions, { foreignKey: "contribution_id" });

Contributions.hasOne(ContributionArtifacts, {
  foreignKey: "contribution_id",
  onDelete: "CASCADE",
});
ContributionArtifacts.belongsTo(Contributions, {
  foreignKey: "contribution_id",
});

Contributions.afterCreate(async (contrib, options) => {
  const submittedAt =
    contrib.submission_date || contrib.created_at || new Date();

  await ContributionTimelines.create(
    {
      contribution_id: contrib.contribution_id,
      submitted_at: submittedAt,
    },
    { transaction: options?.transaction }
  );
});

export default {
  Contributors,
  Contributions,
  LendingDetails,
  ContributionArtifacts,
  ContributionTimelines,
  ContributionSessions
};
