// server/services/archiveNumbering.js
import { QueryTypes, Transaction } from "sequelize";
import { mainDb as sequelize } from "../models/authModels.js";

const ARCHIVE_START_YEAR = 2025;

const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

export const computeVolume = (dateObj) => {
  if (!isValidDate(dateObj)) return null;
  const y = dateObj.getFullYear();
  return y < ARCHIVE_START_YEAR ? null : (y - ARCHIVE_START_YEAR + 1);
};

// MySQL advisory lock per (content_type, year) on the SAME connection/transaction
async function acquireBucketLock(bucketKey, t) {
  const rows = await sequelize.query("SELECT GET_LOCK(?, 10) AS got", {
    replacements: [bucketKey],
    type: QueryTypes.SELECT,
    transaction: t,
  });
  const got = Array.isArray(rows) ? rows[0]?.got : rows?.got;
  if (Number(got) !== 1) throw new Error("Timeout acquiring MySQL advisory lock: " + bucketKey);

  return async () => {
    await sequelize.query("SELECT RELEASE_LOCK(?)", {
      replacements: [bucketKey],
      type: QueryTypes.SELECT,
      transaction: t,
    });
  };
}

/**
 * Assigns volume & sequence_number ONCE when an article becomes 'posted'.
 * MUST be called inside a transaction `t` that uses the same connection.
 */
export async function assignArchiveNumbers(article, t) {
  if (String(article.status).toLowerCase() !== "posted") return;
  if (article.sequence_number && article.volume != null) return;

  // Prefer scheduling start (actual publish window), else explicit upload_date, else now
  const basis =
    (article.upload_period_start && isValidDate(new Date(article.upload_period_start)) && new Date(article.upload_period_start)) ||
    (article.upload_date && isValidDate(new Date(article.upload_date)) && new Date(article.upload_date)) ||
    new Date();

  const year = basis.getFullYear();
  const ct = String(article.content_type || "article").toLowerCase();
  const bucketKey = `article_seq:${ct}:${year}`;

  const release = await acquireBucketLock(bucketKey, t);
  try {
    // Count both posted AND archived to prevent reusing numbers
    const rows = await sequelize.query(
      `
        SELECT COALESCE(MAX(sequence_number), 0) AS maxSeq
          FROM articles
         WHERE content_type = ?
           AND YEAR(COALESCE(upload_period_start, upload_date)) = ?
           AND status IN ('posted','archived')
      `,
      { replacements: [ct, year], type: QueryTypes.SELECT, transaction: t }
    );
    const maxSeq = Number(rows?.[0]?.maxSeq || 0);
    const nextSeq = maxSeq + 1;

    const vol = computeVolume(basis);

    await article.update(
      { volume: vol, sequence_number: nextSeq },
      { transaction: t }
    );
  } finally {
    await release();
  }
}
