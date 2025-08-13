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
    first_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    sex: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    organization: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    province: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    barangay: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    street: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
      references: {
        model: Contributors,
        key: 'contributor_id',
      },
    },
    contribution_type: {
      type: DataTypes.ENUM('lending', 'donation'),
      allowNull: false,
    },
    submission_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
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
      references: {
        model: Contributions,
        key: 'contribution_id',
      },
    },
    duration: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    display_handling_condition: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    liability_concerns: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    lending_reason: {
      type: DataTypes.TEXT,
      allowNull: false,
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
      references: {
        model: Contributions,
        key: 'contribution_id',
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    acquisition_details: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    other_info: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    narrative_story: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    images: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of image filenames',
    },
    documents: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of document filenames',
    },
    related_images: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of related image filenames',
    },
    image_urls: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of image URLs (optional)',
    },
    document_urls: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of document URLs (optional)',
    },
    related_image_urls: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of related image URLs (optional)',
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
    tableName: "ContributionArtifacts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Define associations
Contributors.hasMany(Contributions, {
  foreignKey: 'contributor_id',
  onDelete: 'CASCADE',
});

Contributions.belongsTo(Contributors, {
  foreignKey: 'contributor_id',
});

Contributions.hasOne(LendingDetails, {
  foreignKey: 'contribution_id',
  onDelete: 'CASCADE',
});

LendingDetails.belongsTo(Contributions, {
  foreignKey: 'contribution_id',
});

Contributions.hasOne(ContributionArtifacts, {
  foreignKey: 'contribution_id',
  onDelete: 'CASCADE',
});

ContributionArtifacts.belongsTo(Contributions, {
  foreignKey: 'contribution_id',
});

export default {
  Contributors,
  Contributions,
  LendingDetails,
  ContributionArtifacts,
};
