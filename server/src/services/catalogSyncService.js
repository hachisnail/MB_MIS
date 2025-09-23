// server/src/services/catalogSyncService.js
import { Op } from "sequelize";
import { mainDb } from "../configs/databases.js";
import {
  Contributions,
  ContributionArtifacts,
  ContributionTimelines,
  Contributors,
  ArtifactMetadata,
} from "../models/contributionModels.js";
import { CatalogArtifact } from "../models/CatalogArtifact.js";

/**
 * Build a denormalized record for preview (joins donor artifact + metadata + catalog)
 * Returned shape includes metadata_completed flag to gate preview.
 */
export async function buildJoinedRecordByContributionId(contribution_id) {
  const artifact = await ContributionArtifacts.findOne({
    where: { contribution_id },
    include: [
      { model: ArtifactMetadata, as: "Metadata" },
      { model: CatalogArtifact, as: "Catalog" },
    ],
  });

  if (!artifact) return null;

  const meta = artifact?.Metadata ?? null;
  const catalog = artifact?.Catalog ?? null;

  const joined = {
    contribution_id,
    artifact_id: artifact.artifact_id,
    title: artifact.title,
    donor_description: artifact.description,
    acquisition_details: artifact.acquisition_details,
    additional_info: artifact.additional_info,
    narrative: artifact.narrative,
    images: safeJson(artifact.images),
    documents: safeJson(artifact.documents),
    related_images: safeJson(artifact.related_images),
    image_urls: safeJson(artifact.image_urls),
    document_urls: safeJson(artifact.document_urls),
    related_image_urls: safeJson(artifact.related_image_urls),

    // metadata snapshot
    metadata_completed: !!meta?.metadata_completed,
    collection_number: meta?.collection_number ?? null,
    date_of_creation: meta?.date_of_creation ?? null,
    culture: meta?.culture ?? null,
    provenance: meta?.provenance ?? null,
    current_location: meta?.current_location ?? null,
    discovery_details: meta?.discovery_details ?? null,
    excavation_site: meta?.excavation_site ?? null,
    acquisition_history: meta?.acquisition_history ?? null,
    curatorial_description: meta?.curatorial_description ?? null,
    metadata_updated_at: meta?.updated_at ?? null,

    // catalog echo (if exists)
    catalog: catalog ? catalog.toJSON() : null,
  };

  return joined;
}

/**
 * List public catalog artifacts with a simple search on several text columns.
 * Only returns the catalog rows (already published).
 */
export async function listCatalogArtifacts({ q = "", limit = 20, offset = 0 }) {
  const where = {};
  const term = q.trim();
  if (term) {
    where[Op.or] = [
      { title: { [Op.like]: `%${term}%` } },
      { culture: { [Op.like]: `%${term}%` } },
      { provenance: { [Op.like]: `%${term}%` } },
      { curatorial_description: { [Op.like]: `%${term}%` } },
      { acquisition_history: { [Op.like]: `%${term}%` } },
      { display_description: { [Op.like]: `%${term}%` } },
      { collection_number: { [Op.like]: `%${term}%` } },
    ];
  }

  const rows = await CatalogArtifact.findAll({
    where,
    order: [["created_at", "DESC"]],
    limit: Math.min(Math.max(+limit || 20, 1), 100),
    offset: Math.max(+offset || 0, 0),
  });

  return rows;
}

/**
 * Upsert catalog (inventory) row from a contribution — guarded by metadata completion.
 * If metadata is missing or not completed, this function is a no-op.
 *
 * @param {number} contribution_id
 * @param {object|null} t Optional transaction
 * @returns {Promise<CatalogArtifact|null>}
 */
export async function upsertCatalogArtifact(contribution_id, t = null) {
  // 1) Resolve owning artifact
  const artifact = await ContributionArtifacts.findOne({
    where: { contribution_id },
    transaction: t,
  });
  if (!artifact) return null;

  // 2) Ensure metadata exists AND is completed
  const meta = await ArtifactMetadata.findOne({
    where: { artifact_id: artifact.artifact_id },
    transaction: t,
  });
  if (!meta || !meta.metadata_completed) {
    // Guardrail: never publish drafts
    return null;
  }

  // 3) Pull contribution + contributor for optional future fields (not strictly required)
  const contribution = await Contributions.findOne({
    where: { contribution_id },
    include: [{ model: Contributors }, { model: ContributionTimelines }],
    transaction: t,
  });

  // 4) Build catalog payload from artifact + meta
  const payload = {
    contribution_id,
    artifact_id: artifact.artifact_id,

    title: artifact.title,
    donor_description: artifact.description, // donor-side description
    curatorial_description: meta.curatorial_description ?? null,
    display_description: meta.curatorial_description ?? null, // you can customize this

    acquisition_details: artifact.acquisition_details ?? null,
    additional_info: artifact.additional_info ?? null,
    narrative: artifact.narrative ?? null,

    images: stableString(artifact.images),
    documents: stableString(artifact.documents),
    related_images: stableString(artifact.related_images),
    image_urls: stableString(artifact.image_urls),
    document_urls: stableString(artifact.document_urls),
    related_image_urls: stableString(artifact.related_image_urls),

    // metadata mirrors
    collection_number: meta.collection_number ?? null,
    date_of_creation: meta.date_of_creation ?? null,
    culture: meta.culture ?? null,
    provenance: meta.provenance ?? null,
    current_location: meta.current_location ?? null,
    discovery_details: meta.discovery_details ?? null,
    excavation_site: meta.excavation_site ?? null,
    acquisition_history: meta.acquisition_history ?? null,
    metadata_updated_at: meta.updated_at ?? new Date(),
  };

  // 5) Upsert
  const existing = await CatalogArtifact.findOne({
    where: { contribution_id },
    transaction: t,
    lock: t?.LOCK?.UPDATE,
  });

  if (existing) {
    await existing.update(payload, { transaction: t });
    return existing;
  }
  const created = await CatalogArtifact.create(payload, { transaction: t });
  return created;
}

/* ----------------- helpers ----------------- */

function safeJson(s) {
  if (!s) return [];
  try {
    if (Array.isArray(s)) return s;
    return JSON.parse(String(s));
  } catch (_e) {
    return [];
  }
}

function stableString(v) {
  try {
    if (typeof v === "string") return v;
    return JSON.stringify(v ?? null);
  } catch {
    return JSON.stringify(null);
  }
}

export default {
  upsertCatalogArtifact,
  buildJoinedRecordByContributionId,
  listCatalogArtifacts,
};
