require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const BlogPost = require('./models/BlogPost');
const Comment = require('./models/comment');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ Connected to MongoDB'))
  .catch(err => console.error('✗ Connection error:', err));


// USER ENDPOINTS


// Register a new user
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        registrationDate: user.registrationDate
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login user
app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// BLOG POST ENDPOINTS


// Create a new blog post
app.post('/api/posts', async (req, res) => {
  try {
    const { title, content, authorId, tags, category } = req.body;

    const post = new BlogPost({
      title,
      content,
      author: authorId,
      tags: tags || [],
      category: category || 'General'
    });

    await post.save();
    await post.populate('author', 'username email');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all blog posts (with optional filters, pagination, and sorting)
// BONUS FEATURES: Pagination (?page=1&limit=10), Sorting (?sort=newest|oldest|popular)
app.get('/api/posts', async (req, res) => {
  try {
    const { 
      tag, 
      category, 
      author, 
      page = 1, 
      limit = 10,
      sort = 'newest'
    } = req.query;

    // Build filter
    let filter = {};
    if (tag) filter.tags = tag;
    if (category) filter.category = category;
    if (author) filter.author = author;

    // Determine sort order
    let sortOption = {};
    switch(sort) {
      case 'oldest':
        sortOption = { creationDate: 1 };
        break;
      case 'popular':
        sortOption = { likes: -1 };
        break;
      case 'newest':
      default:
        sortOption = { creationDate: -1 };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await BlogPost.countDocuments(filter);

    const posts = await BlogPost.find(filter)
      .populate('author', 'username email')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      count: posts.length,
      total: total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      posts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single blog post by ID
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id)
      .populate('author', 'username email');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a blog post
app.put('/api/posts/:id', async (req, res) => {
  try {
    const { title, content, tags, category } = req.body;

    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { title, content, tags, category },
      { new: true, runValidators: true }
    ).populate('author', 'username email');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a blog post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await Comment.deleteMany({ blogPost: req.params.id });

    res.json({
      message: 'Post and its comments deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BONUS: Like a blog post
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    ).populate('author', 'username email');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      message: 'Post liked successfully',
      likes: post.likes,
      post
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// COMMENT ENDPOINTS


// Add a comment to a blog post
app.post('/api/comments', async (req, res) => {
  try {
    const { text, commenterId, blogPostId } = req.body;

    const post = await BlogPost.findById(blogPostId);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const comment = new Comment({
      text,
      commenter: commenterId,
      blogPost: blogPostId
    });

    await comment.save();
    await comment.populate('commenter', 'username');

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all comments for a blog post (with pagination and sorting)
// BONUS FEATURES: Pagination (?page=1&limit=20), Sorting (?sort=newest|oldest|popular)
app.get('/api/posts/:postId/comments', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      sort = 'newest'
    } = req.query;

    // Determine sort order
    let sortOption = {};
    switch(sort) {
      case 'oldest':
        sortOption = { creationDate: 1 };
        break;
      case 'popular':
        sortOption = { likes: -1 };
        break;
      case 'newest':
      default:
        sortOption = { creationDate: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Comment.countDocuments({ blogPost: req.params.postId });

    const comments = await Comment.find({ blogPost: req.params.postId })
      .populate('commenter', 'username email')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      count: comments.length,
      total: total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      comments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a comment
app.delete('/api/comments/:id', async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BONUS: Like a comment
app.post('/api/comments/:id/like', async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    ).populate('commenter', 'username');

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({
      message: 'Comment liked successfully',
      likes: comment.likes,
      comment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Blog Platform API is running!',
    endpoints: {
      users: {
        register: 'POST /api/users/register',
        login: 'POST /api/users/login'
      },
      posts: {
        create: 'POST /api/posts',
        getAll: 'GET /api/posts (supports ?page, ?limit, ?sort, ?tag, ?category, ?author)',
        getOne: 'GET /api/posts/:id',
        update: 'PUT /api/posts/:id',
        delete: 'DELETE /api/posts/:id',
        like: 'POST /api/posts/:id/like (BONUS)'
      },
      comments: {
        create: 'POST /api/comments',
        getForPost: 'GET /api/posts/:postId/comments (supports ?page, ?limit, ?sort)',
        delete: 'DELETE /api/comments/:id',
        like: 'POST /api/comments/:id/like (BONUS)'
      }
    },
    bonusFeatures: [
      'Password hashing with bcrypt',
      'Email validation in User schema',
      'Pagination support (?page=1&limit=10)',
      'Sorting support (?sort=newest|oldest|popular)',
      'Likes/upvotes for posts and comments'
    ]
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});