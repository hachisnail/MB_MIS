// server/scheduler.js
import cron from 'node-cron';
import { Op, fn } from 'sequelize';
import Article from '../models/Article.js';

export const startArticleScheduler = () => {
  cron.schedule(
    '* * * * *',
    async () => {
      try {
        // scheduled -> posted IF start <= NOW() AND (no end OR end > NOW())
        const [toPosted] = await Article.update(
          { status: 'posted' },
          {
            where: {
              status: 'scheduled',
              upload_period_start: { [Op.lte]: fn('NOW') },
              [Op.or]: [
                { upload_period_end: null },
                { upload_period_end: { [Op.gt]: fn('NOW') } }, // strictly in the future
              ],
            },
          }
        );

        // posted -> archived IF end <= NOW()
        const [toArchived] = await Article.update(
          { status: 'archived' },
          {
            where: {
              status: 'posted',
              upload_period_end: { [Op.lte]: fn('NOW') },
            },
          }
        );

        if (toPosted || toArchived) {
          console.log('[Scheduler] posted:', toPosted || 0, '| archived:', toArchived || 0);
        }
      } catch (e) {
        console.error('[Scheduler] Error:', e);
      }
    },
    { timezone: 'Asia/Manila' }
  );
};
