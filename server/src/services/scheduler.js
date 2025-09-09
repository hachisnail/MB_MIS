// server/scheduler.js
import cron from "node-cron";
import { Op, fn } from "sequelize";
import { mainDb as sequelize } from "../models/authModels.js";
import Article from "../models/Article.js";
import { assignArchiveNumbers } from "../services/archiveNumbering.js"; 

export const startArticleScheduler = () => {
  cron.schedule(
    "* * * * *",
    async () => {
      // ---- scheduled -> posted (with numbering) ----
      let postedCount = 0;
      const t = await sequelize.transaction();
      try {
        const nowDb = fn("NOW");

        const candidates = await Article.findAll({
          where: {
            status: "scheduled",
            upload_period_start: { [Op.lte]: nowDb },
            [Op.or]: [
              { upload_period_end: null },
              { upload_period_end: { [Op.gt]: nowDb } },
            ],
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        for (const art of candidates) {
          // Promote to posted
          await art.update(
            {
              status: "posted",
              upload_period_start: art.upload_period_start ?? new Date(),
              upload_period_end: art.upload_period_end ?? null,
            },
            { transaction: t }
          );

          // Assign volume & sequence (MySQL advisory lock inside)
          await assignArchiveNumbers(art, t);
          postedCount++;
        }

        await t.commit();
      } catch (e) {
        await t.rollback();
        console.error("[Scheduler] Error scheduled->posted:", e);
      }

      // ---- posted -> archived (no numbering change) ----
      try {
        const [toArchived] = await Article.update(
          { status: "archived" },
          {
            where: {
              status: "posted",
              upload_period_end: { [Op.lte]: fn("NOW") },
            },
          }
        );

        if (postedCount || toArchived) {
          console.log("[Scheduler] posted:", postedCount, "| archived:", toArchived || 0);
        }
      } catch (e) {
        console.error("[Scheduler] Error posted->archived:", e);
      }
    },
    { timezone: "Asia/Manila" }
  );
};
