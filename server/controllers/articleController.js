// controllers/articleController.js

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
      // Previously called "content_images"; now changed to "editImages"
      editImages,
      status,
      barangay // <-- ADD THIS LINE
    } = req.body;

    let thumbnail = null;
    if (req.file) {
      thumbnail = req.file.filename;
    }

    let editImagesString = null;
    if (editImages) {
      editImagesString = typeof editImages === 'string' ? editImages : JSON.stringify(editImages);
    }

    const article = await Article.create({
      title,
      article_category,
      description,
      user_id,
      author,
      address,
      barangay, // <-- ADD THIS LINE
      upload_date: selectedDate,
      images: thumbnail,
      editImages: editImagesString,
      status
    });

    return res.status(201).json(article);
  } catch (error) {
    console.error('Error creating article:', error);
    return res.status(500).json({ message: 'Server error creating article.' });
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
      attributes: ['article_id', 'images', 'title', 'article_category', 'upload_date','status', 'description'],
      where: { status: 'posted' },
      order: [['created_at', 'DESC']]
    });

    // Use req.protocol and req.get('host') to build the base URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const formattedArticles = articles.map((article) => ({
      ...article.dataValues,
      images: article.images
        ? `${baseUrl}/uploads/${article.images}`
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

    // Pull the "editImages" field instead of "content_images"
    const article = await Article.findOne({
      where: { article_id: id },
      attributes: [
        'article_id',
        'title',
        'user_id',
        'upload_date',
        'images',
        'editImages',
        'article_category',
        'description',
        'author',
        'address',
        'barangay',
        'status',
        'upload_period_start',
        'upload_period_end',
        'created_at',
        'updated_at'
      ]
    });

    return res.json(article);
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
      status // <-- Add this line
    } = req.body;

    let thumbnail = null;
    if (req.file) {
      thumbnail = req.file.filename;
    }

    let editImagesString = null;
    if (editImages) {
      if (typeof editImages === 'string') {
        editImagesString = editImages;
      } else {
        editImagesString = JSON.stringify(editImages);
      }
    }

    // Include 'status' in fields to update
    const [updatedCount] = await Article.update(
      {
        title,
        article_category,
        description,
        user_id,
        author,
        address,
        upload_date: selectedDate,
        images: thumbnail || undefined,
        editImages: editImagesString,
        status: status || undefined,  // <-- Include status here
        updated_at: new Date()
      },
      { where: { article_id: id } }
    );

    if (updatedCount === 0) {
      return res.status(404).json({
        message: `Article ID ${id} not found or no changes made.`
      });
    }

    const updatedArticle = await Article.findOne({ where: { article_id: id } });
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



