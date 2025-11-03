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
        
        contribution_id: { 
            type: DataTypes.INTEGER, 
            allowNull: false, 
        },

        new_location_status: { 
            type: DataTypes.STRING(50), 
            allowNull: false // Status is mandatory
        },
        new_location_area: { 
            type: DataTypes.STRING(100), 
            allowNull: true // Can be null if status is 'In Storage' or 'Restoration'
        },
        new_location_shelf: { 
            type: DataTypes.STRING(100), 
            allowNull: true 
        },
        new_location_box: { 
            type: DataTypes.STRING(100), 
            allowNull: true 
        },
        new_location_pos: { 
            type: DataTypes.STRING(100), 
            allowNull: true 
        },
        // --- END NEW FIELDS ---

        move_reason: { 
            type: DataTypes.TEXT, 
            allowNull: false 
        },

        moved_by_user_id: { 
            type: DataTypes.INTEGER, 
            allowNull: true 
        },

        moved_at: { 
            type: DataTypes.DATE, 
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
    },
    {
        tableName: "artifact_location_history",
        timestamps: false, 
        id: false,
    }
);

export default ArtifactLocationHistory;