import Article from '../models/Article.js';
import User from '../models/Users.js';
// Upload content images (unchanged)
export const uploadContentImages = async (req, res) => {
  try {
    const images = req.files.map((file) => file.filename);
    return res.status(200).json({ message: 'Content images uploaded successfully', images });
  } catch (error) {
    console.error('Error uploading content images:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// CREATE
export const createArticle = async (req, res) => {
  try {
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
      volume,
      sequence_number,
    } = req.body;

    const articleData = {
      title,
      article_category,
      content_type: content_type || null, // "article" | "event"
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

      // persist minimal archive fields
      volume: volume ? Number(volume) : null,
      sequence_number: sequence_number ? Number(sequence_number) : null,
    };

    if (status === 'scheduled') {
      articleData.upload_period_start = uploadPeriodStart ? new Date(uploadPeriodStart) : null;
      articleData.upload_period_end = uploadPeriodEnd ? new Date(uploadPeriodEnd) : null;
    } else if (status === 'posted') {
      articleData.upload_period_start = new Date();
      articleData.upload_period_end = null;
    } else {
      articleData.upload_period_start = null;
      articleData.upload_period_end = null;
    }

    const article = await Article.create(articleData);
    return res.status(201).json(article);
  } catch (error) {
    console.error('Error creating article:', error);
    return res.status(500).json({ message: 'Server error creating article.' });
  }
};

// ADMIN list
export const getAllArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({ order: [['created_at', 'DESC']] });
    return res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return res.status(500).json({ message: 'Server error retrieving articles.' });
  }
};

// PUBLIC list
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

// PUBLIC single
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

// UPDATE
export const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    // 1) Load current record so we can preserve fields as needed
    const current = await Article.findByPk(id);
    if (!current) return res.status(404).json({ message: 'Article not found' });

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
      barangay,
      uploadPeriodStart,
      uploadPeriodEnd,
      reviewer_notes,
      volume,
      sequence_number,
    } = req.body;

    const updateData = {
      title,
      article_category,
      content_type: content_type || null,
      description,
      user_id,
      author,
      address,
      barangay,
      upload_date: selectedDate ? new Date(selectedDate) : null,
      images: req.file ? req.file.filename : undefined,
      editImages,
      caption,
      status,
      reviewer_notes,
      updated_at: new Date(),

      volume: volume ? Number(volume) : null,
      sequence_number: sequence_number ? Number(sequence_number) : null,
    };

    // 2) Only change scheduling window when appropriate
    if (status === 'scheduled') {
      updateData.upload_period_start = uploadPeriodStart ? new Date(uploadPeriodStart) : null;
      updateData.upload_period_end   = uploadPeriodEnd   ? new Date(uploadPeriodEnd)   : null;
    } else if (status === 'posted') {
      updateData.upload_period_start = current.upload_period_start || new Date();
      updateData.upload_period_end   = current.upload_period_end ?? null;
    } else if (status === 'archived') {
      // DO NOT touch the window: preserve history
      // (i.e., don't set upload_period_start/end on updateData)
    } else {
      // pending / rejected, etc. — also preserve existing values by default
      // (only clear if you explicitly want to wipe them)
    }

    const [updatedCount] = await Article.update(updateData, { where: { article_id: id } });
    if (updatedCount === 0) return res.status(404).json({ message: 'Article not found' });

    const updated = await Article.findOne({ where: { article_id: id } });
    return res.status(200).json({ message: 'Article updated successfully', article: updated });
  } catch (error) {
    console.error('Error updating article:', error);
    return res.status(500).json({ message: 'Server error updating article', error: error.message });
  }
};

// BY ID
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
