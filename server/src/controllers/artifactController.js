// server/src/controllers/artifactController.js (or wherever the function is)

import { mainDb } from "../configs/databases.js";
import { CatalogArtifact } from "../models/CatalogArtifact.js"; 
// NOTE: Assuming this is the correct import for your ArtifactLocationHistory model
import { ArtifactLocationHistory } from "../models/artifactDetail.js"; 


/**
 * PUT /api/auth/artifact/:contributionId/location
 * * @param {object} req.body - Expected: { 
 * status: string, 
 * area: string, 
 * shelf: string, 
 * storageBox: string, 
 * locationWithinBox: string, 
 * moveReason: string 
 * }
 */
export async function updateArtifactLocation(req, res) {
    const { contributionId } = req.params;
    
    // 💡 FIX: Destructure ALL incoming structured fields
    const { 
        status, 
        area, 
        shelf, 
        storageBox, 
        locationWithinBox, 
        moveReason 
    } = req.body; 
    
    // --- 1. Basic Validation ---
    if (!status || !moveReason) {
        return res.status(400).json({ 
            message: "Location change requires a Status and a Move Reason." 
        });
    }
    
    // Optional: Add specific validation if 'On Display' requires Area and Shelf
    if (status === 'On Display' && (!area || !shelf)) {
         return res.status(400).json({ 
            message: "'On Display' status requires a specified Area and Shelf." 
        });
    }

    const t = await mainDb.transaction(); 

    try {
        const userId = req.user ? req.user.id : null; 

        // --- 2. Log the Change History (INSERT: Denormalized Snapshot) ---
        // We log ALL location details for a complete, immutable history record.
        await ArtifactLocationHistory.create({
            contribution_id: contributionId,
            move_reason: moveReason,
            moved_by_user_id: userId,

            // New/Updated Denormalized History Fields:
            new_location_status: status, 
            new_location_area: area,     
            new_location_shelf: shelf,   
            new_location_box: storageBox,
            new_location_pos: locationWithinBox,
            
        }, { transaction: t });
        
        // --- 3. Update the Current Location (UPDATE: Normalized Current Status) ---
        // We update ALL location columns on the main artifact table for fast filtering.
        const [updatedCount] = await CatalogArtifact.update(
            { 
                current_location: status, 
                location_area: area,
                location_shelf: shelf,
                location_storage_box: storageBox,
                location_pos_in_box: locationWithinBox,
                metadata_updated_at: new Date()
            },
            { 
                where: { contribution_id: contributionId },
                transaction: t
            }
        );

        if (updatedCount === 0) {
            await t.rollback();
            return res.status(404).json({ message: `Artifact with ID ${contributionId} not found or was not updated.` });
        }

        // --- 4. Commit and Respond ---
        await t.commit();
        res.status(200).json({ 
            message: "Artifact location successfully updated and history logged.",
            status: status,
            contributionId 
        });

    } catch (err) {
        await t.rollback();
        console.error(`[Structured Location Update] Error for ID ${contributionId}:`, err);
        res.status(500).json({ message: "Failed to update location due to a server error.", error: err.message });
    }
}