// controllers/artifactMetadataController.js
import { Op } from "sequelize";
import { mainDb } from "../configs/databases.js";
import {
  Contributions,
  ContributionArtifacts,
  ArtifactMetadata,
} from "../models/contributionModels.js";
import { CatalogArtifact } from "../models/CatalogArtifact.js";
import {
  buildJoinedRecordByContributionId,
  upsertCatalogArtifact,
} from "../services/catalogSyncService.js";

/** Accept both snake_case (API-native) and camelCase (UI fallback). */
function normalizeMetadataPayload(body = {}) {
  const pickFirst = (...keys) => {
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(body, k)) return body[k];
    }
    return undefined;
  };

  const normalized = {
    date_of_creation: pickFirst("date_of_creation", "age"),
    culture: pickFirst("culture"),
    provenance: pickFirst("provenance"),
    current_location: pickFirst("current_location", "location"),
    discovery_details: pickFirst("discovery_details", "discovery"),
    excavation_site: pickFirst("excavation_site", "excavationSite"),
    acquisition_history: pickFirst("acquisition_history", "acquisitionHistory"),
    curatorial_description: pickFirst(
      "curatorial_description",
      "curatorialDescription"
    ),
  };

  // Drop undefined keys (update only what’s sent)
  for (const k of Object.keys(normalized)) {
    if (normalized[k] === undefined) delete normalized[k];
  }
  return normalized;
}

/**
 * GET /api/catalog/public-artifacts
 * Public list of catalog artifacts (for homepage catalogue grid).
 * Optional query params:
 *   q            - keyword over title/desc/provenance/curatorial/display
 *   culture      - exact/like filter for culture
 *   location     - like filter for current_location
 *   hasImages    - "1" to require at least one image (images/image_urls/related)
 *   limit, offset
 */
export async function listPublicCatalogArtifacts(req, res) {
  try {
    const {
      q,
      culture,
      location: loc,
      hasImages,
      limit = 200,
      offset = 0,
    } = req.query;

    const where = {};

    if (q && String(q).trim() !== "") {
      const kw = `%${String(q).trim()}%`;
      where[Op.or] = [
        { title: { [Op.like]: kw } },
        { donor_description: { [Op.like]: kw } },
        { display_description: { [Op.like]: kw } },
        { curatorial_description: { [Op.like]: kw } },
        { provenance: { [Op.like]: kw } },
      ];
    }

    if (culture && String(culture).trim() !== "") {
      where.culture = { [Op.like]: `%${String(culture).trim()}%` };
    }

    if (loc && String(loc).trim() !== "") {
      where.current_location = { [Op.like]: `%${String(loc).trim()}%` };
    }

    // Base query
    const findOptions = {
      where,
      order: [["updated_at", "DESC"]],
      limit: Math.min(Number(limit) || 200, 500),
      offset: Number(offset) || 0,
    };

    let rows = await CatalogArtifact.findAll(findOptions);

    // In-memory filter for hasImages (covers arrays/strings/urls)
    if (hasImages === "1") {
      rows = rows.filter((r) => {
        const row = r?.toJSON?.() || r;
        const anyUrl =
          (Array.isArray(row.image_urls) && row.image_urls.length > 0) ||
          (Array.isArray(row.related_image_urls) &&
            row.related_image_urls.length > 0);
        const anyFile =
          (Array.isArray(row.images) && row.images.length > 0) ||
          (Array.isArray(row.related_images) &&
            row.related_images.length > 0) ||
          (!!row.images && typeof row.images === "string") ||
          (!!row.related_images && typeof row.related_images === "string");
        return anyUrl || anyFile;
      });
    }

    return res.json(rows);
  } catch (err) {
    console.error("listPublicCatalogArtifacts error:", err);
    return res.status(500).json({ message: "Server error loading catalog" });
  }
}

/**
 * GET /auth/contributions/:id/metadata
 * Staff-facing join (artifact + metadata) for seeding edit forms.
 */
export async function getArtifactMetadataByContribution(req, res) {
  try {
    const { id } = req.params; // contribution_id
    const c = await Contributions.findByPk(id);
    if (!c) return res.status(404).json({ message: "Contribution not found" });

    const joined = await buildJoinedRecordByContributionId(id);
    if (!joined) {
      return res
        .status(404)
        .json({ message: "Artifact not found for this contribution" });
    }

    return res.json(joined);
  } catch (err) {
    console.error("getArtifactMetadataByContribution error:", err);
    return res
      .status(500)
      .json({ message: "Server error retrieving metadata" });
  }
}

/**
 * POST /auth/contributions/:id/metadata
 * Upserts ArtifactMetadata (draft save) and syncs catalog_artifacts.
 * (No changes to ContributionArtifacts.)
 */
export async function upsertArtifactMetadataDraft(req, res) {
  try {
    const { id } = req.params; // contribution_id
    if (!req.session?.user) {
      return res.status(403).json({ message: "Login required" });
    }

    // Normalize input and omit blank strings/nulls
    const normalized = normalizeMetadataPayload(req.body || {});
    const updates = Object.fromEntries(
      Object.entries(normalized).filter(
        ([, v]) => !(v == null || (typeof v === "string" && v.trim() === ""))
      )
    );

    // Diagnostics (useful while wiring UI)
    console.log("[metadata.upsert] content-type:", req.get("content-type"));
    console.log("[metadata.upsert] raw body keys:", Object.keys(req.body || {}));
    console.log("[metadata.upsert] normalized (non-blank):", updates);

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ message: "No metadata fields provided to update." });
    }

    // Find the artifact for this contribution
    const artifact = await ContributionArtifacts.findOne({
      where: { contribution_id: id },
      attributes: ["artifact_id"],
    });
    if (!artifact) {
      return res
        .status(404)
        .json({ message: "Artifact not found for this contribution" });
    }

    // Idempotent upsert on ArtifactMetadata (artifact_id is UNIQUE)
    const payload = { artifact_id: artifact.artifact_id, ...updates };
    await ArtifactMetadata.upsert(payload);

    // Keep catalog in sync (denormalized)
    const catalogRow = await upsertCatalogArtifact(id).catch((e) => {
      console.warn(
        "[metadata.upsert] catalog sync failed (non-fatal):",
        e?.message || e
      );
      return null;
    });

    // Return joined view for client convenience
    const joined = await buildJoinedRecordByContributionId(id);
    return res.status(200).json({
      message: "Metadata saved",
      updated_fields: Object.keys(updates),
      metadata: joined,
      catalog: catalogRow,
    });
  } catch (err) {
    console.error("upsertArtifactMetadataDraft outer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /auth/contributions/:id/metadata/complete
 * Ensures a metadata row exists; syncs catalog.
 * (Collection number appears once the contribution is completed by your other flow.)
 * (No changes to ContributionArtifacts.)
 */
export async function completeArtifactMetadata(req, res) {
  try {
    const { id } = req.params; // contribution_id

    // Require admin
    if (!req.session?.user || req.session.user.roleId !== 1) {
      return res
        .status(403)
        .json({ message: "Admin login required to finalize metadata" });
    }

    const t = await mainDb.transaction();
    try {
      // Ensure contribution exists
      const contribution = await Contributions.findByPk(id, { transaction: t });
      if (!contribution) {
        await t.rollback();
        return res.status(404).json({ message: "Contribution not found" });
      }

      // Ensure artifact exists for this contribution
      const artifact = await ContributionArtifacts.findOne({
        where: { contribution_id: id },
        transaction: t,
      });
      if (!artifact) {
        await t.rollback();
        return res
          .status(404)
          .json({ message: "Artifact not found for this contribution" });
      }

      // Ensure metadata row exists (idempotent)
      await ArtifactMetadata.findOrCreate({
        where: { artifact_id: artifact.artifact_id },
        defaults: { artifact_id: artifact.artifact_id },
        transaction: t,
      });

      await t.commit();
    } catch (err) {
      try {
        await t.rollback();
      } catch {}
      console.error("completeArtifactMetadata tx error:", err);
      return res.status(500).json({
        message: "Server error finalizing metadata",
        error: String(err?.message || err),
      });
    }

    // Sync catalog (best-effort)
    try {
      await upsertCatalogArtifact(id);
    } catch (e) {
      console.warn("Catalog sync after finalize failed (non-fatal):", e);
    }

    // Return joined data for UI convenience
    try {
      const joined = await buildJoinedRecordByContributionId(id);
      return res.status(200).json({
        message:
          "Metadata finalized; collection number will be assigned when the contribution is marked completed.",
        metadata: joined,
      });
    } catch (err) {
      console.error("completeArtifactMetadata join error:", err);
      return res.status(200).json({
        message:
          "Metadata finalized; collection number will be assigned when the contribution is marked completed.",
      });
    }
  } catch (err) {
    console.error("completeArtifactMetadata outer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/catalog/preview/:id
 * Public preview for completed contributions — reads from catalog_artifacts.
 */
export async function previewCatalogRecord(req, res) {
  try {
    const { id } = req.params; // contribution_id
    const c = await Contributions.findByPk(id, { attributes: ["status"] });
    if (!c) return res.status(404).json({ message: "Contribution not found" });

    if (c.status !== "completed") {
      return res.status(409).json({
        message:
          "Contribution not completed; not eligible for public catalog preview",
      });
    }

    let row = await CatalogArtifact.findOne({ where: { contribution_id: id } });
    if (!row) {
      // Backfill if missing
      row = await upsertCatalogArtifact(id);
      if (!row) {
        return res.status(404).json({ message: "Catalog entry not found" });
      }
    }

    return res.json(row);
  } catch (err) {
    console.error("previewCatalogRecord error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
