// server/scheduler.js
import cron from "node-cron";
import { Op, fn } from "sequelize";
import { mainDb as sequelize } from "../models/authModels.js";
import Article from "../models/Article.js";
import { Appointment, AppointmentStatus } from "../models/appointmentIndex.js";
import { assignArchiveNumbers } from "../services/archiveNumbering.js"; 

export const startArticleScheduler = () => {
  cron.schedule(
    "* * * * *",
    async () => {
      const startTime = Date.now();
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

        // Process articles in parallel
        await Promise.all(
          candidates.map(async (art) => {
            await art.update(
              {
                status: "posted",
                upload_period_start: art.upload_period_start ?? new Date(),
                upload_period_end: art.upload_period_end ?? null,
              },
              { transaction: t }
            );
            await assignArchiveNumbers(art, t);
            postedCount++;
          })
        );

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

        const endTime = Date.now();
        const execTime = endTime - startTime;
        // Format timestamp in Asia/Manila and label as Philippine Standard Time
        const phTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
        if (postedCount || toArchived) {
          console.log(
            `[Scheduler] [${phTime} Philippine Standard Time] posted: ${postedCount} | archived: ${toArchived || 0} | execTime: ${execTime}ms`
          );
        }
      } catch (e) {
        console.error("[Scheduler] Error posted->archived:", e);
      }
    },
    { timezone: "Asia/Manila" }
  );
};

/**
 * Scheduler for automatically marking no-show appointments as FAILED
 * Runs daily at midnight (Philippine time)
 */
export const startAppointmentNoShowScheduler = () => {
  cron.schedule(
    "0 0 * * *", // Run daily at midnight
    async () => {
      try {
        const startTime = Date.now();
        
        // Get today's date at midnight (start of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Find all APPROVED appointments that:
        // 1. Have a preferred_date before today
        // 2. Do not have a present_count recorded (meaning visitor never arrived)
        const missedAppointments = await AppointmentStatus.findAll({
          where: {
            status: 'APPROVED'
          },
          include: [{
            model: Appointment,
            where: {
              preferred_date: {
                [Op.lt]: today
              }
            },
            required: true
          }]
        });

        // Filter for appointments without present_count (no arrival recorded)
        const noShowAppointments = missedAppointments.filter(
          status => status.present_count === null || status.present_count === undefined
        );

        let updatedCount = 0;
        
        // Update each no-show appointment to FAILED status
        for (const appointmentStatus of noShowAppointments) {
          await appointmentStatus.update({
            status: 'FAILED',
            updated_at: new Date()
          });
          updatedCount++;
        }

        const endTime = Date.now();
        const execTime = endTime - startTime;
        const phTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
        
        if (updatedCount > 0) {
          console.log(
            `[No-Show Scheduler] [${phTime} Philippine Standard Time] Marked ${updatedCount} appointment(s) as no-show (FAILED) | execTime: ${execTime}ms`
          );
        }
      } catch (e) {
        console.error("[No-Show Scheduler] Error marking no-show appointments:", e);
      }
    },
    { timezone: "Asia/Manila" }
  );
};
