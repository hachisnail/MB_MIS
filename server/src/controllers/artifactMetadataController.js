// server/src/controllers/artifactMetadataController.js
import { Op } from "sequelize";
import { ContributionArtifacts } from "../models/contributionModels.js";
import ArtifactMetadata from "../models/ArtifactMetadata.js";
import {
  upsertCatalogArtifact,
  buildJoinedRecordByContributionId,
  listCatalogArtifacts,
} from "../services/catalogSyncService.js";

// ---------- helpers ----------
function pickNonBlank(body, keys) {
  const out = {};
  for (const k of keys) {
    if (body[k] === undefined || body[k] === null) continue;
    const v = typeof body[k] === "string" ? body[k].trim() : body[k];
    if (v === "" || v === null) continue;
    out[k] = v;
  }
  return out;
}

function generateCollectionNumber(artifact_id) {
  const yy = new Date().getFullYear();
  const n = String(artifact_id).padStart(5, "0");
  return `MB-${yy}-${n}`;
}

async function getArtifactIdByContributionId(contribution_id) {
  const art = await ContributionArtifacts.findOne({ where: { contribution_id } });
  return art?.artifact_id ?? null;
}

// ---------- routes (match your auth.js) ----------

// GET /api/auth/contributions/:id/metadata
export async function getArtifactMetadataByContribution(req, res) {
  try {
    const contribution_id = Number(req.params.id);
    const artifact_id = await getArtifactIdByContributionId(contribution_id);
    if (!artifact_id) return res.status(404).json({ error: "Contribution not found" });

    const meta = await ArtifactMetadata.findOne({ where: { artifact_id } });
    return res.json(meta ?? null);
  } catch (err) {
    console.error("getArtifactMetadataByContribution error:", err);
    return res.status(500).json({ error: "Failed to load metadata" });
  }
}

// POST /api/auth/contributions/:id/metadata
// saves a DRAFT — allowed anytime, even after completed
export async function upsertArtifactMetadataDraft(req, res) {
  try {
    const contribution_id = Number(req.params.id);
    const artifact_id = await getArtifactIdByContributionId(contribution_id);
    if (!artifact_id) return res.status(404).json({ error: "Contribution not found" });

    const keys = [
      "date_of_creation",
      "culture",
      "provenance",
      "current_location",
      "discovery_details",
      "excavation_site",
      "acquisition_history",
      "curatorial_description",
      "collection_number",
    ];
    const fields = pickNonBlank(req.body ?? {}, keys);

    // never toggle these through the draft endpoint
    delete fields.metadata_completed;
    delete fields.inventory_synced_at;

    await ArtifactMetadata.upsert({ artifact_id, ...fields });

    const updated = await ArtifactMetadata.findOne({ where: { artifact_id } });
    return res.json({ ok: true, metadata: updated });
  } catch (err) {
    console.error("upsertArtifactMetadataDraft error:", err);
    return res.status(500).json({ error: "Failed to save metadata draft" });
  }
}

// POST /api/auth/contributions/:id/metadata/complete
// idempotent: if already completed, just re-sync inventory
export async function completeArtifactMetadata(req, res) {
  try {
    const contribution_id = Number(req.params.id);
    const artifact_id = await getArtifactIdByContributionId(contribution_id);
    if (!artifact_id) return res.status(404).json({ error: "Contribution not found" });

    let meta = await ArtifactMetadata.findOne({ where: { artifact_id } });
    if (!meta) meta = await ArtifactMetadata.create({ artifact_id, metadata_completed: false });

    if (meta.metadata_completed) {
      // already finalized → refresh catalog + touch inventory_synced_at
      await upsertCatalogArtifact(contribution_id);
      await meta.update({ inventory_synced_at: new Date() });
      const fresh = await ArtifactMetadata.findOne({ where: { artifact_id } });
      return res.json({ ok: true, status: "already_completed_resynced", metadata: fresh });
    }

    const updates = { metadata_completed: true, inventory_synced_at: new Date() };
    if (!meta.collection_number) updates.collection_number = generateCollectionNumber(artifact_id);
    await meta.update(updates);

    await upsertCatalogArtifact(contribution_id);

    const fresh = await ArtifactMetadata.findOne({ where: { artifact_id } });
    return res.json({ ok: true, status: "completed_and_synced", metadata: fresh });
  } catch (err) {
    console.error("completeArtifactMetadata error:", err);
    return res.status(500).json({ error: "Failed to finalize metadata" });
  }
}

// GET /api/auth/catalog/preview/:id   (Public preview; completed only)
export async function previewCatalogRecord(req, res) {
  try {
    const contribution_id = Number(req.params.id);
    const joined = await buildJoinedRecordByContributionId(contribution_id);
    if (!joined) return res.status(404).json({ error: "Contribution not found" });
    if (!joined.metadata_completed)
      return res.status(403).json({ error: "Record not yet published" });
    return res.json(joined);
  } catch (err) {
    console.error("previewCatalogRecord error:", err);
    return res.status(500).json({ error: "Failed to load preview" });
  }
}

// GET /api/auth/public-artifacts?q=...
export async function listPublicCatalogArtifacts(req, res) {
  try {
    const { q, limit, offset } = req.query;
    const rows = await listCatalogArtifacts({
      q: q?.trim() || "",
      limit: Math.min(Number(limit) || 20, 100),
      offset: Number(offset) || 0,
    });
    return res.json(rows);
  } catch (err) {
    console.error("listPublicCatalogArtifacts error:", err);
    return res.status(500).json({ error: "Failed to load catalog" });
  }
}
