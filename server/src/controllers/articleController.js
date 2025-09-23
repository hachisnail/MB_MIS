// server/controllers/articleController.js
import { Transaction, fn, col, where as sqlWhere } from 'sequelize';
import { mainDb as sequelize } from '../models/authModels.js';
import Article from '../models/Article.js';
import User from '../models/Users.js';
import { assignArchiveNumbers } from '../services/archiveNumbering.js';
import { createLog } from '../services/logService.js';

/* --------------------------- helpers --------------------------- */
const toDateOrNull = (v) => (v ? new Date(v) : null);
const toLower = (v) => (typeof v === 'string' ? v.toLowerCase() : v);
const baseUrlOf = (req) => `${req.protocol}://${req.get('host')}`;
const safeParseJSON = (maybeJSON) => {
  if (Array.isArray(maybeJSON)) return maybeJSON;
  if (typeof maybeJSON !== 'string') return [];
  try { const p = JSON.parse(maybeJSON); return Array.isArray(p) ? p : []; } catch { return []; }
};

/* ---------------- upload content images (inline) ---------------- */
export const uploadContentImages = async (req, res) => {
  try {
    const images = (req.files || []).map((f) => f.filename);
    return res.status(200).json({ message: 'Content images uploaded successfully', images });
  } catch (error) {
    console.error('Error uploading content images:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/* ------------------------------- CREATE ------------------------------- */
export const createArticle = async (req, res) => {
  let t;
  try {
    t = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const {
      title, article_category, content_type, description, user_id, author, address,
      selectedDate, editImages, caption, status, uploadPeriodStart, uploadPeriodEnd,
      barangay, reviewer_notes,
    } = req.body;

    const normalizedStatus = toLower(status);
    const articleData = {
      title,
      article_category,
      content_type: content_type ? toLower(content_type) : null,
      description,
      user_id,
      author,
      address,
      barangay,
      upload_date: toDateOrNull(selectedDate),
      images: req.file ? req.file.filename : null,
      editImages,
      caption,
      status: normalizedStatus,
      reviewer_notes,
      upload_period_start: null,
      upload_period_end: null,
      volume: null,
      sequence_number: null,
    };

    if (normalizedStatus === 'scheduled') {
      articleData.upload_period_start = toDateOrNull(uploadPeriodStart);
      articleData.upload_period_end   = toDateOrNull(uploadPeriodEnd);
    } else if (normalizedStatus === 'posted') {
      articleData.upload_period_start = new Date();
      articleData.upload_period_end   = null;
    }

    const article = await Article.create(articleData, { transaction: t });

    if (normalizedStatus === 'posted') {
      await assignArchiveNumbers(article, t);
    }

    // Log article creation (admin-side only)
    if (req.session?.user) {
      const userId = req.session.user.id;
      const username = req.session.user.username || 'Admin';
      
      await createLog(
        'create',
        'ARTICLE',
        `New article "${title}" created with status: ${normalizedStatus}`,
        userId,
        null,
        {
          article_id: article.article_id,
          title,
          status: normalizedStatus,
          article_category,
          author
        },
        `${username} created article #${article.article_id}: "${title}"`
      );
    }

    await t.commit();
    return res.status(201).json(article);
  } catch (error) {
    if (t) await t.rollback();
    console.error('Error creating article:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: (error.errors || []).map(e => ({ path: e.path, message: e.message, value: e.value })),
      });
    }
    return res.status(500).json({ message: 'Server error creating article.' });
  }
};

/* ------------------------------ ADMIN list ------------------------------ */
export const getAllArticles = async (req, res) => {
  try {
    // ✅ your DB column is created_at (snake_case)
    const articles = await Article.findAll({ order: [[col('created_at'), 'DESC']] });
    return res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return res.status(500).json({ message: 'Server error retrieving articles.' });
  }
};

/* -------------------------- PUBLIC list (posted) ------------------------- */
export const getPublicArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({
      attributes: [
        'article_id','images','title','article_category','content_type',
        'upload_date','status','description','caption','volume','sequence_number',
      ],
      // case-insensitive status check
      where: sqlWhere(fn('lower', col('status')), 'posted'),
      // ✅ order by physical column created_at, not createdAt
      order: [[col('created_at'), 'DESC']],
    });

    const baseUrl = baseUrlOf(req);
    const formatted = articles.map(a => ({
      ...a.dataValues,
      images: a.images ? `${baseUrl}/uploads/pictures/${a.images}` : null,
    }));
    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching public articles:', error);
    return res.status(500).json({ message: 'Server error retrieving public articles.' });
  }
};

/* --------------------------- PUBLIC single (robust) --------------------------- */
export const getPublicArticle = async (req, res) => {
  try {
    const idNum = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(idNum)) return res.status(400).json({ message: 'Article ID is required.' });

    const article = await Article.findByPk(idNum, {
      attributes: [
        'article_id','title','user_id','upload_date','images','editImages','caption',
        'article_category','content_type','description','author','address','barangay',
        'status','upload_period_start','upload_period_end',
        'created_at','updated_at','reviewer_notes','reviewer_id',
        'volume','sequence_number',
      ],
    });
    if (!article) return res.status(404).json({ message: 'Article not found.' });

    // Optional reviewer lookup (kept safe so it never crashes the route)
    let reviewer = null;
    if (article.reviewer_id) {
      try {
        reviewer = await User.findByPk(article.reviewer_id, { attributes: ['id','name'] });
      } catch (e) {
        console.warn('[public-article] reviewer lookup failed:', e.message);
      }
    }

    const baseUrl = baseUrlOf(req);
    const formatted = {
      ...article.dataValues,
      images: article.images ? `${baseUrl}/uploads/pictures/${article.images}` : null,
      editImages: safeParseJSON(article.editImages),
      Reviewer: reviewer ? reviewer.toJSON() : null,
    };
    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching public article:', error);
    return res.status(500).json({ message: 'Server error retrieving public article.' });
  }
};

/* --------------------------------- UPDATE --------------------------------- */
export const updateArticle = async (req, res) => {
  let t;
  try {
    t = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    const idNum = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(idNum)) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid article id' });
    }

    const current = await Article.findByPk(idNum, { transaction: t });
    if (!current) {
      await t.rollback();
      return res.status(404).json({ message: 'Article not found' });
    }

    const fieldsToSet = {};
    const allowKeys = [
      'title','article_category','description','author','address','barangay',
      'caption','status','reviewer_notes','reviewer_id',
    ];
    for (const k of allowKeys) {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) {
        fieldsToSet[k] = k === 'status' ? toLower(req.body[k]) : req.body[k];
      }
    }

    // Stamp reviewer if session says privileged
    if ([1,2,4,5].includes(req.session?.user?.roleId)) {
      fieldsToSet.reviewer_id = req.session.user.id;
    }

    // Map dates
    if ('selectedDate' in req.body) fieldsToSet.upload_date = toDateOrNull(req.body.selectedDate);
    if ('upload_date' in req.body) fieldsToSet.upload_date = toDateOrNull(req.body.upload_date);

    // Normalize content_type
    if ('content_type' in req.body) {
      const ct = (req.body.content_type ?? '').trim();
      if (ct) fieldsToSet.content_type = toLower(ct);
    }

    // Thumbnail
    if (req.file) fieldsToSet.images = req.file.filename;

    // Schedule/posted rules
    const alreadyNumbered = current.volume != null && current.sequence_number != null;
    const wasPosted      = toLower(current.status) === 'posted';
    const willBePosted   = toLower(req.body.status || current.status) === 'posted';
    const becomingPosted = !wasPosted && willBePosted;

    if (toLower(req.body.status) === 'scheduled') {
      if (alreadyNumbered) {
        await t.rollback();
        return res.status(400).json({
          message: 'Validation error',
          error: 'Cannot change upload period after numbering.',
        });
      }
      if ('uploadPeriodStart' in req.body) {
        fieldsToSet.upload_period_start = toDateOrNull(req.body.uploadPeriodStart);
      }
      if ('uploadPeriodEnd' in req.body) {
        fieldsToSet.upload_period_end = toDateOrNull(req.body.uploadPeriodEnd);
      }
    } else if (willBePosted) {
      if (becomingPosted && !current.upload_period_start) {
        fieldsToSet.upload_period_start = new Date();
      }
    }

    // Capture before state for logging
    const beforeState = current.toJSON();

    await current.update(fieldsToSet, {
      fields: Object.keys(fieldsToSet),
      transaction: t,
      userId: req.session?.user?.id,
    });

    if (becomingPosted && !(current.volume != null && current.sequence_number != null)) {
      await assignArchiveNumbers(current, t);
    }

    // Log article update (admin-side only)
    if (req.session?.user && Object.keys(fieldsToSet).length > 0) {
      const userId = req.session.user.id;
      const username = req.session.user.username || 'Admin';
      const changedFields = Object.keys(fieldsToSet).join(', ');
      
      await createLog(
        'update',
        'ARTICLE',
        `Article "${current.title}" updated - fields changed: ${changedFields}`,
        userId,
        beforeState,
        current.toJSON(),
        `${username} updated article #${current.article_id}: "${current.title}"`
      );
    }

    await t.commit();
    return res.status(200).json({ message: 'Article updated successfully', article: current });
  } catch (error) {
    if (t) await t.rollback();
    console.error('Error updating article:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: (error.errors || []).map(e => ({ path: e.path, message: e.message, value: e.value })),
      });
    }
    return res.status(500).json({ message: 'Server error updating article', error: error.message });
  }
};

/* --------------------------------- BY ID --------------------------------- */
export const getArticleById = async (req, res) => {
  try {
    const idNum = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(idNum)) return res.status(400).json({ message: 'Invalid article id' });

    const article = await Article.findByPk(idNum);
    if (!article) return res.status(404).json({ message: 'Article not found.' });

    res.status(200).json(article);
  } catch (error) {
    console.error('Error fetching article by ID:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
