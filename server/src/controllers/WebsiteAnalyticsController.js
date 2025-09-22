import WebsiteAnalytics from '../models/WebsiteAnalytics.js';
import { Op } from 'sequelize';

/**
 * Store last entry timestamp per (sessionId + date + page) to collapse duplicates
 * within a short cooldown window (e.g., React StrictMode, double renders, quick retries).
 */
const ENTRY_COOLDOWN_MS = 2000;
const lastEntryAt = new Map();

export const trackPageView = async (req, res) => {
  try {
    const { pageName, sessionId, timeSpent } = req.body;
    
    if (!pageName || !sessionId) {
      return res.status(400).json({ error: 'Page name and session ID are required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const sessionKey = `${sessionId}-${today}-${pageName.toLowerCase()}`;

    // Only count initial page entry, not exit tracking
    if (timeSpent === 0) {
      const now = Date.now();
      const last = lastEntryAt.get(sessionKey) || 0;

      // Collapse duplicates within cooldown window
      if (now - last < ENTRY_COOLDOWN_MS) {
        return res.status(200).json({ success: true, message: 'Duplicate within cooldown - skipped' });
      }

      // Record last successful entry time
      lastEntryAt.set(sessionKey, now);
    } else {
      // For exit tracking (timeSpent > 0), don't increment counters
      return res.status(200).json({ success: true, message: 'Exit tracking - no count' });
    }

    // Map page names to database columns
    const pageColumnMap = {
      'home': 'home_views',
      'catalogue': 'catalogue_views', 
      'articles': 'articles_views',
      'about': 'about_views',
      'appointments': 'appointments_views',
      'login': 'login_views',
      'recovery': 'recovery_views'
    };

    const columnName = pageColumnMap[pageName.toLowerCase()];
    if (!columnName) {
      return res.status(400).json({ error: 'Invalid page name' });
    }

    // Find or create today's record
    const [analytics, created] = await WebsiteAnalytics.findOrCreate({
      where: { date: today },
      defaults: {
        date: today,
        home_views: 0,
        catalogue_views: 0,
        articles_views: 0,
        about_views: 0,
        appointments_views: 0,
        login_views: 0,
        recovery_views: 0,
        total_views: 0
      }
    });

    // Increment the specific page view count and total views
    const incrementData = {
      [columnName]: 1,
      total_views: 1
    };

    await analytics.increment(incrementData);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking page view:', error);
    res.status(500).json({ error: 'Failed to track page view' });
  }
};

export const getWebsiteTrafficStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const analytics = await WebsiteAnalytics.findAll({
      where: {
        date: {
          [Op.gte]: startDate.toISOString().split('T')[0]
        }
      },
      order: [['date', 'ASC']]
    });

    // Fill missing dates with 0 values
    const result = [];
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find existing record for this date
      const existingRecord = analytics.find(record => record.date === dateStr);
      
      if (existingRecord) {
        result.push({
          date: dateStr,
          home_views: existingRecord.home_views,
          catalogue_views: existingRecord.catalogue_views,
          articles_views: existingRecord.articles_views,
          about_views: existingRecord.about_views,
          appointments_views: existingRecord.appointments_views,
          login_views: existingRecord.login_views,
          recovery_views: existingRecord.recovery_views,
          total_views: existingRecord.total_views
        });
      } else {
        result.push({
          date: dateStr,
          home_views: 0,
          catalogue_views: 0,
          articles_views: 0,
          about_views: 0,
          appointments_views: 0,
          login_views: 0,
          recovery_views: 0,
          total_views: 0
        });
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching website traffic stats:', error);
    res.status(500).json({ error: 'Failed to fetch website traffic stats' });
  }
};

export const getAnalyticsSummary = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const analytics = await WebsiteAnalytics.findAll({
      where: {
        date: {
          [Op.gte]: startDate.toISOString().split('T')[0]
        }
      }
    });

    // Calculate summary statistics
    const summary = {
      totalViews: 0,
      totalHomeViews: 0,
      totalCatalogueViews: 0,
      totalArticlesViews: 0,
      totalAboutViews: 0,
      totalAppointmentsViews: 0,
      totalLoginViews: 0,
      totalRecoveryViews: 0,
      averageDailyViews: 0,
      mostPopularPage: 'home',
      daysWithData: analytics.length
    };

    analytics.forEach(record => {
      summary.totalViews += record.total_views;
      summary.totalHomeViews += record.home_views;
      summary.totalCatalogueViews += record.catalogue_views;
      summary.totalArticlesViews += record.articles_views;
      summary.totalAboutViews += record.about_views;
      summary.totalAppointmentsViews += record.appointments_views;
      summary.totalLoginViews += record.login_views;
      summary.totalRecoveryViews += record.recovery_views;
    });

    // Calculate average daily views
    if (analytics.length > 0) {
      summary.averageDailyViews = Math.round(summary.totalViews / analytics.length);
    }

    // Find most popular page
    const pageViews = {
      home: summary.totalHomeViews,
      catalogue: summary.totalCatalogueViews,
      articles: summary.totalArticlesViews,
      about: summary.totalAboutViews,
      appointments: summary.totalAppointmentsViews,
      login: summary.totalLoginViews,
      recovery: summary.totalRecoveryViews
    };

    summary.mostPopularPage = Object.keys(pageViews).reduce((a, b) => 
      pageViews[a] > pageViews[b] ? a : b
    );

    res.json(summary);
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
};
