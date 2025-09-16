// server/controllers/articleController.js
import { Transaction } from 'sequelize';
import { mainDb as sequelize } from '../models/authModels.js';
import Article from '../models/Article.js';
import User from '../models/Users.js';
import { assignArchiveNumbers } from '../services/archiveNumbering.js';

/**
 * Upload content images (inline editor uploads)
 */
export const uploadContentImages = async (req, res) => {
  try {
    const images = (req.files || []).map((file) => file.filename);
    return res.status(200).json({ message: 'Content images uploaded successfully', images });
  } catch (error) {
    console.error('Error uploading content images:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * CREATE
 * - If created as "scheduled": set upload window from payload
 * - If created as "posted": set start now and assign archive numbers
 */
export const createArticle = async (req, res) => {
  let t;
  try {
    t = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const {
      title,
      article_category,
      content_type,
      description,
      user_id,
      author,
      address,
      selectedDate,
      editImages,
      caption,
      status,
      uploadPeriodStart,
      uploadPeriodEnd,
      barangay,
      reviewer_notes,
    } = req.body;

    const articleData = {
      title,
      article_category,
      content_type: content_type || null, // 'article' | 'event'
      description,
      user_id,
      author,
      address,
      barangay,
      upload_date: selectedDate ? new Date(selectedDate) : null,
      images: req.file ? req.file.filename : null,
      editImages,
      caption,
      status,
      reviewer_notes,
      upload_period_start: null,
      upload_period_end: null,
      volume: null,
      sequence_number: null,
    };

    if (String(status).toLowerCase() === 'scheduled') {
      articleData.upload_period_start = uploadPeriodStart ? new Date(uploadPeriodStart) : null;
      articleData.upload_period_end   = uploadPeriodEnd   ? new Date(uploadPeriodEnd)   : null;
    } else if (String(status).toLowerCase() === 'posted') {
      // first posted time
      articleData.upload_period_start = new Date();
      articleData.upload_period_end   = null;
    }

    const article = await Article.create(articleData, { transaction: t });

    // Assign numbers exactly once if created directly as posted
    if (String(status).toLowerCase() === 'posted') {
      await assignArchiveNumbers(article, t);
    }

    await t.commit();
    return res.status(201).json(article);
  } catch (error) {
    if (t) await t.rollback();
    console.error('Error creating article:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: (error.errors || []).map(e => ({
          path: e.path, message: e.message, value: e.value
        })),
      });
    }
    return res.status(500).json({ message: 'Server error creating article.' });
  }
};

/**
 * ADMIN list
 */
export const getAllArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({ order: [['created_at', 'DESC']] });
    return res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return res.status(500).json({ message: 'Server error retrieving articles.' });
  }
};

/**
 * PUBLIC list (only posted)
 */
export const getPublicArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({
      attributes: [
        'article_id', 'images', 'title', 'article_category', 'content_type',
        'upload_date', 'status', 'description', 'caption',
        'volume', 'sequence_number',
      ],
      where: { status: 'posted' },
      order: [['created_at', 'DESC']],
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const formatted = articles.map((a) => ({
      ...a.dataValues,
      images: a.images ? `${baseUrl}/uploads/pictures/${a.images}` : null,
    }));
    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching public articles:', error);
    return res.status(500).json({ message: 'Server error retrieving public articles.' });
  }
};

/**
 * PUBLIC single
 */
export const getPublicArticle = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Article ID is required.' });

    const article = await Article.findOne({
      where: { article_id: id },
      attributes: [
        'article_id', 'title', 'user_id', 'upload_date', 'images',
        'editImages', 'caption', 'article_category', 'content_type',
        'description', 'author', 'address', 'barangay',
        'status', 'upload_period_start', 'upload_period_end',
        'created_at', 'updated_at', 'reviewer_notes',
        'volume', 'sequence_number',
      ],
    });

    if (!article) return res.status(404).json({ message: 'Article not found.' });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const formatted = {
      ...article.dataValues,
      images: article.images ? `${baseUrl}/uploads/pictures/${article.images}` : null,
    };

    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching public article:', error);
    return res.status(500).json({ message: 'Server error retrieving public article.' });
  }
};

/**
 * UPDATE
 * - Only modify upload window when allowed
 * - Only set upload_period_start once on first transition to 'posted'
 * - Assign archive numbers only on first transition to 'posted'
 */
export const updateArticle = async (req, res) => {
  let t;
  try {
    t = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const { id } = req.params;
    const current = await Article.findByPk(id, { transaction: t });
    if (!current) {
      await t.rollback();
      return res.status(404).json({ message: 'Article not found' });
    }

    // Build whitelist fields
    const fieldsToSet = {};
    const allowKeys = [
      'title','article_category','description','user_id','author',
      'address','barangay','caption','status','reviewer_notes'
    ];
    for (const k of allowKeys) {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) {
        fieldsToSet[k] = req.body[k];
      }
    }

    // Map selectedDate -> upload_date if provided
    if (Object.prototype.hasOwnProperty.call(req.body, 'selectedDate')) {
      fieldsToSet.upload_date = req.body.selectedDate ? new Date(req.body.selectedDate) : null;
    }
    // Or allow direct upload_date if sent
    if (Object.prototype.hasOwnProperty.call(req.body, 'upload_date')) {
      fieldsToSet.upload_date = req.body.upload_date ? new Date(req.body.upload_date) : null;
    }

    // content_type (normalize, optional)
    if (Object.prototype.hasOwnProperty.call(req.body, 'content_type')) {
      const ct = (req.body.content_type ?? '').trim();
      if (ct) fieldsToSet.content_type = ct.toLowerCase();
    }

    // Thumbnail
    if (req.file) {
      fieldsToSet.images = req.file.filename;
    }

    // ---- schedule/posted window rules ----
    const alreadyNumbered = current.volume != null && current.sequence_number != null;
    const wasPosted       = String(current.status).toLowerCase() === 'posted';
    const willBePosted    = String(req.body.status || current.status).toLowerCase() === 'posted';
    const becomingPosted  = !wasPosted && willBePosted;

    if (String(req.body.status).toLowerCase() === 'scheduled') {
      if (alreadyNumbered) {
        await t.rollback();
        return res.status(400).json({
          message: 'Validation error',
          error: 'Cannot change upload period after numbering.',
        });
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'uploadPeriodStart')) {
        fieldsToSet.upload_period_start = req.body.uploadPeriodStart
          ? new Date(req.body.uploadPeriodStart)
          : null;
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'uploadPeriodEnd')) {
        fieldsToSet.upload_period_end = req.body.uploadPeriodEnd
          ? new Date(req.body.uploadPeriodEnd)
          : null;
      }
    } else if (willBePosted) {
      // Set start only once on first transition to posted if not set yet
      if (becomingPosted && !current.upload_period_start) {
        fieldsToSet.upload_period_start = new Date();
      }
      // Never touch upload_period_end here
    }
    // For other statuses, leave upload period untouched

    // Instance update (avoids beforeBulkUpdate hook)
    await current.update(fieldsToSet, {
      fields: Object.keys(fieldsToSet),
      transaction: t,
      userId: req.session?.user?.id, // used by afterUpdate log
    });

    // Numbering: only on first transition to posted
    if (becomingPosted && !(current.volume != null && current.sequence_number != null)) {
      await assignArchiveNumbers(current, t);
    }

    await t.commit();
    return res.status(200).json({ message: 'Article updated successfully', article: current });
  } catch (error) {
    if (t) await t.rollback();
    console.error('Error updating article:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: (error.errors || []).map(e => ({
          path: e.path, message: e.message, value: e.value
        })),
      });
    }
    return res.status(500).json({ message: 'Server error updating article', error: error.message });
  }
};

/**
 * BY ID
 */
export const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ message: 'Article not found.' });
    res.status(200).json(article);
  } catch (error) {
    console.error('Error fetching article by ID:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
