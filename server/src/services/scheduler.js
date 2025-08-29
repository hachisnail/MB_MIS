//Mostly for triggering lang to ng naka-set na date from start to end (currently gamit ko sa article scheduler kung kailan i popost ung artile)

// server/scheduler.js
import cron from 'node-cron';
import Article from '../models/Article.js';
import { Op } from 'sequelize';

export const startArticleScheduler = () => {
    // This job runs every minute
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        // Log the current time being checked (in ISO and Asia/Manila)
        console.log('Running article status check job at:', now.toISOString(), '| Manila:', now.toLocaleString('en-PH', { timeZone: 'Asia/Manila' }));

        try {
            // Find articles that should be posted
            await Article.update(
                { status: 'posted' },
                {
                    where: {
                        status: 'scheduled',
                        upload_period_start: {
                            [Op.lte]: now, // Op.lte means "less than or equal to"
                        },
                    },
                }
            );

            // Find articles that should be archived
            await Article.update(
                { status: 'archived' },
                {
                    where: {
                        status: 'posted',
                        upload_period_end: {
                            [Op.lte]: now,
                        },
                    },
                }
            );

        } catch (error) {
            console.error('Error during scheduled article status update:', error);
        }
    });
};