import Article from '../models/Article.js';

// Controller to handle uploading multiple article images (not the main thumbnail)
export const uploadContentImages = async (req, res) => {
  try {
    // req.files is an array of files
    const images = req.files.map((file) => file.filename);
    return res.status(200).json({
      message: 'Content images uploaded successfully',
      images,
    });
  } catch (error) {
    console.error('Error uploading content images:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Controller to create an article
export const createArticle = async (req, res) => {
  try {
    const {
      title,
      article_category,
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
      reviewerNotes
    } = req.body;

    const articleData = {
      title,
      article_category,
      description,
      user_id,
      author,
      address,
      barangay,
      upload_date: selectedDate,
      images: req.file ? req.file.filename : null,
      editImages: editImages,
      caption,
      status,
      reviewer_notes: reviewerNotes
    };


    // Conditionally set the scheduling dates based on status
    if (status === 'schedule' || status === 'scheduled') {
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
    return res.status(500).json({
      message: 'Server error creating article.'
    });
  }
};
// Retrieve ALL articles (admin or private usage)
export const getAllArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({
      order: [['created_at', 'DESC']],
    });
    return res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return res.status(500).json({ message: 'Server error retrieving articles.' });
  }
};

// Retrieve public articles (lightweight list for landing page)
export const getPublicArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({
      attributes: ['article_id', 'images', 'title', 'article_category', 'upload_date','status', 'description','caption'],
      where: { status: 'posted' },
      order: [['created_at', 'DESC']]
    });

    // Use req.protocol and req.get('host') to build the base URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const formattedArticles = articles.map((article) => ({
      ...article.dataValues,
      images: article.images
        ? `${baseUrl}/uploads/pictures/${article.images}`
        : null
    }));

    return res.json(formattedArticles);
  } catch (error) {
    console.error('Error fetching public articles:', error);
    return res.status(500).json({ message: 'Server error retrieving public articles.' });
  }
};

// Retrieve a specific public article
export const getPublicArticle = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Article ID is required.' });
    }

    const article = await Article.findOne({
      where: { article_id: id },
      attributes: [
        'article_id', 'title', 'user_id', 'upload_date', 'images',
        'editImages','caption' , 'article_category', 'description', 'author',
        'address', 'barangay', 'status', 'upload_period_start',
        'upload_period_end', 'created_at', 'updated_at', 'reviewer_notes'
      ]
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const formattedArticle = {
      ...article.dataValues,
      images: article.images
        ? `${baseUrl}/uploads/pictures/${article.images}`
        : null
    };

    return res.json(formattedArticle);
  } catch (error) {
    console.error('Error fetching public article:', error);
    return res.status(500).json({ message: 'Server error retrieving public article.' });
  }
};

// Update an existing article
export const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      article_category,
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
      reviewer_notes
    } = req.body;

    const updateData = {
      title,
      article_category,
      description,
      user_id,
      author,
      address,
      barangay,
      upload_date: selectedDate,
      images: req.file ? req.file.filename : undefined,
      editImages: editImages,
      caption,
      status,
      reviewer_notes: reviewer_notes,
      updated_at: new Date(),
    };

    // Set scheduling dates based on status
    if (status === 'schedule' || status === 'scheduled') {
      updateData.upload_period_start = uploadPeriodStart ? new Date(uploadPeriodStart) : null;
      updateData.upload_period_end = uploadPeriodEnd ? new Date(uploadPeriodEnd) : null;
    } else {
      updateData.upload_period_start = null;
      updateData.upload_period_end = null;
    }

    const [updatedCount] = await Article.update(
      updateData, {
        where: {
          article_id: id
        }
      }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const updatedArticle = await Article.findOne({
      where: {
        article_id: id
      }
    });
    return res.status(200).json({
      message: 'Article updated successfully',
      article: updatedArticle
    });
  } catch (error) {
    console.error('Error updating article:', error);
    return res.status(500).json({
      message: 'Server error updating article',
      error: error.message
    });
  }
};

export const getArticleById = async (req, res) => {
  try {
    const { id } = req.params; // Get the ID from the URL parameters
    // Assuming your article model has a method to find by primary key or ID
    const article = await Article.findByPk(id); // Example: if using Sequelize

    if (!article) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    res.status(200).json(article);
  } catch (error) {
    console.error('Error fetching article by ID:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

