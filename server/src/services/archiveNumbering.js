// server/services/archiveNumbering.js
import { QueryTypes } from "sequelize";
import { mainDb as sequelize } from "../models/authModels.js";
import Article from "../models/Article.js";

// 2025 is Vol. 1
const ARCHIVE_START_YEAR = 2025;

export const computeVolume = (dateObj) => {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return null;
  const y = dateObj.getFullYear();
  return y < ARCHIVE_START_YEAR ? null : (y - ARCHIVE_START_YEAR + 1);
};

// MySQL advisory lock per (content_type, year)
async function acquireBucketLock(bucketKey, t) {
  const rows = await sequelize.query("SELECT GET_LOCK(?, 10) AS got", {
    replacements: [bucketKey],
    type: QueryTypes.SELECT,
    transaction: t,
  });
  const got = Array.isArray(rows) ? rows[0]?.got : rows?.got;
  if (got !== 1) throw new Error("Timeout acquiring MySQL advisory lock: " + bucketKey);

  return async () => {
    await sequelize.query("SELECT RELEASE_LOCK(?)", {
      replacements: [bucketKey],
      type: QueryTypes.SELECT,
      transaction: t,
    });
  };
}

/**
 * Assigns volume & next sequence_number to an article that is (now) 'posted'.
 * - Only runs if status === 'posted'
 * - Idempotent: does nothing if sequence_number already set
 * - Must be called INSIDE a transaction `t`
 * - MySQL only (uses GET_LOCK/RELEASE_LOCK)
 */
export async function assignArchiveNumbers(article, t) {
  if (article.status !== "posted") return;
  if (article.sequence_number) return;

  const postDate =
    article.upload_date instanceof Date && !Number.isNaN(article.upload_date)
      ? article.upload_date
      : new Date();

  const year = postDate.getFullYear();
  const ct = String(article.content_type || "article").toLowerCase();
  const bucketKey = `article_seq:${ct}:${year}`;

  const release = await acquireBucketLock(bucketKey, t);
  try {
    // Compute next sequence within (year, content_type) bucket for already POSTED items
    const rows = await sequelize.query(
      `SELECT COALESCE(MAX(sequence_number), 0) AS maxSeq
         FROM articles
        WHERE status = 'posted'
          AND content_type = ?
          AND YEAR(upload_date) = ?`,
      { replacements: [ct, year], type: QueryTypes.SELECT, transaction: t }
    );
    const maxSeq = Number(rows?.[0]?.maxSeq || 0);
    const nextSeq = maxSeq + 1;

    const vol = computeVolume(postDate);

    await article.update(
      { volume: vol, sequence_number: nextSeq },
      { transaction: t }
    );
  } finally {
    await release();
  }
}
