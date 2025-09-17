// services/catalogSyncService.js
import {
  Contributions,
  ContributionArtifacts,
  ArtifactMetadata,
} from "../models/contributionModels.js";
import { CatalogArtifact } from "../models/CatalogArtifact.js";
import { Op } from "sequelize";

// ---- helpers ----
function toStringish(v) {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (Buffer.isBuffer(v)) return v.toString("utf8");
  if (typeof v === "object") {
    const keys = Object.keys(v);
    if (keys.length && keys.every((k) => /^\d+$/.test(k))) {
      return keys.sort((a, b) => Number(a) - Number(b)).map((k) => v[k]).join("");
    }
  }
  return null;
}
function asJson(v) {
  if (v && typeof v === "object" && !Buffer.isBuffer(v)) {
    const keys = Object.keys(v);
    if (!keys.length || !keys.every((k) => /^\d+$/.test(k))) return v;
  }
  const s = toStringish(v);
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function parseArtifactFiles(artifact) {
  if (!artifact) return null;
  const a = artifact.dataValues || artifact;
  return {
    ...a,
    images: asJson(a.images) ?? [],
    documents: asJson(a.documents) ?? [],
    related_images: asJson(a.related_images) ?? [],
    image_urls: asJson(a.image_urls) ?? [],
    document_urls: asJson(a.document_urls) ?? [],
    related_image_urls: asJson(a.related_image_urls) ?? [],
  };
}

// ---- core joiner ----
export async function buildJoinedRecordByContributionId(contribution_id, t = null) {
  const artifact = await ContributionArtifacts.findOne({
    where: { contribution_id },
    transaction: t,
  });
  if (!artifact) return null;

  const meta = await ArtifactMetadata.findOne({
    where: { artifact_id: artifact.artifact_id },
    transaction: t,
  });

  const a = parseArtifactFiles(artifact);
  return {
    contribution_id,
    artifact_id: artifact.artifact_id,
    title: a.title,
    donor_description: a.description ?? null,
    curatorial_description: meta?.curatorial_description ?? null,
    display_description: meta?.curatorial_description || a.description || null,

    acquisition_details: a.acquisition_details ?? null,
    additional_info: a.additional_info ?? null,
    narrative: a.narrative ?? null,

    images: a.images,
    documents: a.documents,
    related_images: a.related_images,
    image_urls: a.image_urls,
    document_urls: a.document_urls,
    related_image_urls: a.related_image_urls,

    collection_number: meta?.collection_number ?? null,
    date_of_creation: meta?.date_of_creation ?? null,
    culture: meta?.culture ?? null,
    provenance: meta?.provenance ?? null,
    current_location: meta?.current_location ?? null,
    discovery_details: meta?.discovery_details ?? null,
    excavation_site: meta?.excavation_site ?? null,
    acquisition_history: meta?.acquisition_history ?? null,
    metadata_updated_at: meta?.updated_at ?? null,
  };
}

// ---- upsert into catalog ----
export async function upsertCatalogArtifact(contribution_id, t = null) {
  const joined = await buildJoinedRecordByContributionId(contribution_id, t);
  if (!joined) return null;

  const payload = {
    contribution_id: joined.contribution_id,
    artifact_id: joined.artifact_id,
    title: joined.title,
    donor_description: joined.donor_description,
    curatorial_description: joined.curatorial_description,
    display_description: joined.display_description,

    acquisition_details: joined.acquisition_details,
    additional_info: joined.additional_info,
    narrative: joined.narrative,

    // stringify arrays for storage
    images: JSON.stringify(joined.images || []),
    documents: JSON.stringify(joined.documents || []),
    related_images: JSON.stringify(joined.related_images || []),
    image_urls: JSON.stringify(joined.image_urls || []),
    document_urls: JSON.stringify(joined.document_urls || []),
    related_image_urls: JSON.stringify(joined.related_image_urls || []),

    collection_number: joined.collection_number,
    date_of_creation: joined.date_of_creation,
    culture: joined.culture,
    provenance: joined.provenance,
    current_location: joined.current_location,
    discovery_details: joined.discovery_details,
    excavation_site: joined.excavation_site,
    acquisition_history: joined.acquisition_history,
    metadata_updated_at: joined.metadata_updated_at,
  };

  const existing = await CatalogArtifact.findOne({
    where: { contribution_id },
    transaction: t,
  });

  if (existing) {
    await existing.update(payload, { transaction: t });
    return existing;
  }

  const created = await CatalogArtifact.create(payload, { transaction: t });
  return created;
}

// (Optional) simple list/search for public catalog
export async function listCatalogArtifacts({ q, limit = 20, offset = 0 }) {
  const where = {};
  if (q) {
    where[Op.or] = [
      { title: { [Op.like]: `%${q}%` } },
      { culture: { [Op.like]: `%${q}%` } },
      { collection_number: { [Op.like]: `%${q}%` } },
    ];
  }
  const rows = await CatalogArtifact.findAll({
    where,
    order: [["updated_at", "DESC"]],
    limit,
    offset,
  });
  return rows;
}
