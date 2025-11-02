// models/ArtifactLocationHistory.js
import { DataTypes } from "sequelize";
import { mainDb } from "../configs/databases.js";

export const ArtifactLocationHistory = mainDb.define(
    "ArtifactLocationHistory",
    {
        history_id: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        
        // Link to the artifact being moved
        contribution_id: { 
            type: DataTypes.INTEGER, 
            allowNull: false, 
            // Foreign Key to contributions table (or catalog_artifacts)
        },

        // The full, new location string (e.g., "On Display | Exhibition 1 | Upper Part")
        new_location: { 
            type: DataTypes.STRING(512), 
            allowNull: false 
        },

        // The reason provided by the user in the modal
        move_reason: { 
            type: DataTypes.TEXT, 
            allowNull: false 
        },

        // Who performed the move (assuming you have a User model and user ID)
        moved_by_user_id: { 
            type: DataTypes.INTEGER, 
            allowNull: true 
        },

        // The ESSENTIAL timestamp of when the move happened
        moved_at: { 
            type: DataTypes.DATE, 
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
    },
    {
        tableName: "artifact_location_history",
        timestamps: false, // We use 'moved_at' instead of default Sequelize timestamps
    }
);

export default ArtifactLocationHistory;