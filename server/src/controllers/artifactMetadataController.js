// server/src/controllers/artifactMetadataController.js
import { mainDb } from "../configs/databases.js";
import { ContributionArtifacts } from "../models/contributionModels.js";
import ArtifactMetadata from "../models/ArtifactMetadata.js";
import {
  upsertCatalogArtifact,
  buildJoinedRecordByContributionId,
  listCatalogArtifacts,
} from "../services/catalogSyncService.js";

import fs from "fs/promises";
import path from "path";
import { UPLOAD_BASE_DIR } from "../middlewares/multerMiddleware.js";

/* ---------- helpers ---------- */
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

// Simple MB-YYYY-00001 generator used on completion (hook also guards uniqueness)
function generateCollectionNumber(artifact_id) {
  const yy = new Date().getFullYear();
  const n = String(artifact_id).padStart(5, "0");
  return `MB-${yy}-${n}`;
}

async function getArtifactIdByContributionId(contribution_id) {
  const art = await ContributionArtifacts.findOne({ where: { contribution_id } });
  return art?.artifact_id ?? null;
}

// Validate required fields before allowing completion
function validateRequired(meta) {
  // Adjust required fields to your policy
  const required = ["curatorial_description"];
  const missing = required.filter((k) => !meta?.[k] || String(meta[k]).trim() === "");
  return { ok: missing.length === 0, missing };
}

/* ---------- routes (match your auth.js) ---------- */

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
  const tx = await mainDb.transaction();
  try {
    const contribution_id = Number(req.params.id);
    const artifact_id = await getArtifactIdByContributionId(contribution_id);
    if (!artifact_id) {
      await tx.rollback();
      return res.status(404).json({ error: "Contribution not found" });
    }

    // Ensure a metadata row exists (inside tx)
    let meta = await ArtifactMetadata.findOne({ where: { artifact_id }, transaction: tx, lock: tx.LOCK.UPDATE });
    if (!meta) {
      meta = await ArtifactMetadata.create(
        { artifact_id, metadata_completed: false },
        { transaction: tx }
      );
    }

    // If already completed → refresh catalog + touch inventory_synced_at
    if (meta.metadata_completed) {
      await upsertCatalogArtifact(contribution_id, tx);
      await meta.update({ inventory_synced_at: new Date() }, { transaction: tx });
      await tx.commit();

      const fresh = await ArtifactMetadata.findOne({ where: { artifact_id } });
      return res.json({ ok: true, status: "already_completed_resynced", metadata: fresh });
    }

    // Pull a fresh snapshot for validation (outside tx read would also be fine)
    const snapshot = meta.toJSON();
    const check = validateRequired(snapshot);
    if (!check.ok) {
      await tx.rollback();
      return res.status(422).json({
        ok: false,
        error: "metadata_incomplete",
        missing_fields: check.missing,
      });
    }

    // Mark completed + set inventory_synced_at + assign collection_number if missing
    const updates = { metadata_completed: true, inventory_synced_at: new Date() };
    if (!meta.collection_number) updates.collection_number = generateCollectionNumber(artifact_id);
    await meta.update(updates, { transaction: tx });

    // Upsert catalog inside the same tx (guard in service ensures only completed meta publishes)
    await upsertCatalogArtifact(contribution_id, tx);

    await tx.commit();

    // Copy the first artifact image AFTER commit (filesystem side effect)
    await copyFirstArtifactImage(contribution_id);

    const fresh = await ArtifactMetadata.findOne({ where: { artifact_id } });
    return res.json({ ok: true, status: "completed_and_synced", metadata: fresh });
  } catch (err) {
    try { await tx.rollback(); } catch {}
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

/* ---------- private: media copy ---------- */

async function copyFirstArtifactImage(contribution_id) {
  const artifact = await ContributionArtifacts.findOne({
    where: { contribution_id },
    attributes: ["images"],
  });

  if (!artifact || !artifact.images) {
    console.log(`[copyFirstArtifactImage] No images found for contribution ${contribution_id}`);
    return;
  }

  let images;
  try {
    images = JSON.parse(artifact.images);
  } catch (err) {
    console.error(`[copyFirstArtifactImage] Failed to parse images JSON:`, err);
    return;
  }

  if (!Array.isArray(images) || images.length === 0) return;

  const firstImage = images[0];
  const src = path.join(UPLOAD_BASE_DIR, "private/pictures", firstImage);
  const dest = path.join(UPLOAD_BASE_DIR, "pictures", firstImage);

  try {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
    console.log(`[copyFirstArtifactImage] Copied ${firstImage} → ${dest}`);
  } catch (err) {
    console.error(`[copyFirstArtifactImage] Failed to copy ${firstImage}:`, err);
  }
}

export default {
  getArtifactMetadataByContribution,
  upsertArtifactMetadataDraft,
  completeArtifactMetadata,
  previewCatalogRecord,
  listPublicCatalogArtifacts,
};
