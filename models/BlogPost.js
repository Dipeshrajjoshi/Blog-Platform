const mongoose = require('mongoose');

// This is like a form template for Blog Posts
const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creationDate: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String
  }],
  category: {
    type: String,
    default: 'General'
  }
});

module.exports = mongoose.model('BlogPost', blogPostSchema);