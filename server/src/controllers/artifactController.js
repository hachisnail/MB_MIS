// server/src/controllers/artifactController.js (or wherever the old function is)

import { mainDb } from "../configs/databases.js";
import { CatalogArtifact } from "../models/CatalogArtifact.js"; 
import { ArtifactLocationHistory } from "../models/artifactDetail.js";

/**
 * PUT /api/auth/artifact/:contributionId/location
 * * @param {object} req.body - Expected: { status: string, detailedLocation: string, moveReason: string }
 */
export async function updateArtifactLocation(req, res) {
    const { contributionId } = req.params;
    
    // 💡 FIX: Destructure the new payload fields
    const { status, detailedLocation, moveReason } = req.body; 
    
    // --- 1. Basic Validation ---
    if (!status || !detailedLocation || !moveReason) {
        return res.status(400).json({ 
            message: "Location change requires a status, detailed location, and move reason." 
        });
    }
    
    const t = await mainDb.transaction(); 

    try {
        const userId = req.user ? req.user.id : null; 

        // --- 2. Log the Change History (INSERT) ---
        await ArtifactLocationHistory.create({
            contribution_id: contributionId,
            new_location: detailedLocation, // Use the detailed string
            move_reason: moveReason,
            moved_by_user_id: userId,
        }, { transaction: t });
        
        // --- 3. Update the Current Location (UPDATE) ---
        const [updatedCount] = await CatalogArtifact.update(
            { 
                current_location: status, // Use ONLY the high-level status
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
            detailedLocationLogged: detailedLocation,
            contributionId 
        });

    } catch (err) {
        await t.rollback();
        console.error(`[Location Update] Error for ID ${contributionId}:`, err);
        res.status(500).json({ message: "Failed to update location due to a server error.", error: err.message });
    }
}