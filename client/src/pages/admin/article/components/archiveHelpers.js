// src/lib/archiveHelpers.js
export const ARCHIVE_START_YEAR = 2025; // set Vol.1 start year

export const isContentTypeArticle = (contentType) =>
  String(contentType || "").toLowerCase() === "article";

export const getVolumeFromYYYYMMDD = (yyyyMMdd) => {
  if (!yyyyMMdd) return null;
  const d = new Date(`${yyyyMMdd}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  if (y < ARCHIVE_START_YEAR) return null;     // avoid mislabeling older years
  return y - ARCHIVE_START_YEAR + 1;
};

export const getYearFromYYYYMMDD = (yyyyMMdd) => {
  if (!yyyyMMdd) return null;
  const d = new Date(`${yyyyMMdd}T00:00:00`);
  return isNaN(d.getTime()) ? null : d.getFullYear();
};

/**
 * Compute the next sequence number for (year, content_type) using a list of existing items.
 * - allItems: array from your /auth/articles (admin fetch)
 */
export const computeNextSequence = (allItems, targetYear, contentType) => {
  if (!targetYear) return null;
  const sameBucket = (allItems || []).filter((x) => {
    const iso = x.upload_date || x.created_at;
    const y = iso ? new Date(iso).getFullYear() : null;
    const t = (x.content_type || "").toLowerCase();
    return y === targetYear && t === String(contentType || "").toLowerCase();
  });
  return sameBucket.length + 1; // best-effort client-side
};

/** Build display label on the fly (no need to store in DB) */
export const makeDisplayLabel = (contentType, seq) =>
  !seq ? "" : (isContentTypeArticle(contentType) ? `No.${seq}` : `Event #${seq}`);
