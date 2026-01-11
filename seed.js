require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const BlogPost = require('./models/BlogPost');
const Comment = require('./models/comment');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Connection error:', err));

async function seedDatabase() {
  try {
    // Clear existing data
    console.log('Clearing old data...');
    await User.deleteMany({});
    await BlogPost.deleteMany({});
    await Comment.deleteMany({});

    // Create Users
    console.log('Creating users...');
    const hashedPassword1 = await bcrypt.hash('password123', 10);
    const hashedPassword2 = await bcrypt.hash('password456', 10);
    const hashedPassword3 = await bcrypt.hash('password789', 10);

    const users = await User.insertMany([
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: hashedPassword1
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: hashedPassword2
      },
      {
        username: 'bob_jones',
        email: 'bob@example.com',
        password: hashedPassword3
      }
    ]);
    console.log(`Created ${users.length} users`);

    // Create Blog Posts with likes for testing sorting
    console.log('Creating blog posts...');
    const posts = await BlogPost.insertMany([
      {
        title: 'Getting Started with MongoDB',
        content: 'MongoDB is a NoSQL database that stores data in flexible, JSON-like documents. It is perfect for modern applications.',
        author: users[0]._id,
        tags: ['mongodb', 'database', 'tutorial'],
        category: 'Tutorial',
        likes: 15
      },
      {
        title: 'Top 10 JavaScript Tips',
        content: 'Here are my favorite JavaScript tips that will make you a better developer and help you write cleaner code.',
        author: users[0]._id,
        tags: ['javascript', 'tips', 'programming'],
        category: 'Programming',
        likes: 42
      },
      {
        title: 'Why I Love Node.js',
        content: 'Node.js has changed the way we build web applications. Here is why I love it and why you should learn it too.',
        author: users[1]._id,
        tags: ['nodejs', 'javascript', 'backend'],
        category: 'Technology',
        likes: 8
      },
      {
        title: 'Building REST APIs',
        content: 'REST APIs are the backbone of modern web development. Let me show you how to build one from scratch.',
        author: users[1]._id,
        tags: ['api', 'rest', 'backend'],
        category: 'Tutorial',
        likes: 23
      },
      {
        title: 'My Coding Journey',
        content: 'I started coding 5 years ago and here is everything I have learned along the way. My biggest tips for beginners.',
        author: users[2]._id,
        tags: ['personal', 'coding', 'story'],
        category: 'Personal',
        likes: 5
      }
    ]);
    console.log(`Created ${posts.length} blog posts`);

    // Create Comments with likes for testing sorting
    console.log('Creating comments...');
    const comments = await Comment.insertMany([
      {
        text: 'Great article! Very helpful for beginners.',
        commenter: users[1]._id,
        blogPost: posts[0]._id,
        likes: 3
      },
      {
        text: 'Thanks for sharing these tips!',
        commenter: users[2]._id,
        blogPost: posts[1]._id,
        likes: 7
      },
      {
        text: 'I agree, Node.js is amazing!',
        commenter: users[0]._id,
        blogPost: posts[2]._id,
        likes: 2
      },
      {
        text: 'Could you explain more about authentication?',
        commenter: users[2]._id,
        blogPost: posts[3]._id,
        likes: 5
      },
      {
        text: 'Inspiring story! Keep it up.',
        commenter: users[0]._id,
        blogPost: posts[4]._id,
        likes: 1
      },
      {
        text: 'This helped me understand MongoDB better.',
        commenter: users[2]._id,
        blogPost: posts[0]._id,
        likes: 4
      }
    ]);
    console.log(`Created ${comments.length} comments`);

    console.log('\nDatabase seeding completed!');
    console.log('\nSummary:');
    console.log(`  Users: ${users.length}`);
    console.log(`  Posts: ${posts.length}`);
    console.log(`  Comments: ${comments.length}`);

    // Demonstrate CRUD operations
    console.log('\nDemonstrating CRUD Operations:\n');

    // CREATE - Already demonstrated above
    console.log('CREATE - Inserted users, posts, and comments');

    // READ - Find all users
    const allUsers = await User.find().select('-password');
    console.log('\nREAD - All users:');
    allUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.email})`);
    });

    // READ - Find posts by author
    console.log('\nREAD - Posts by john_doe:');
    const johnPosts = await BlogPost.find({ author: users[0]._id }).populate('author', 'username');
    johnPosts.forEach(post => {
      console.log(`  - ${post.title} by ${post.author.username}`);
    });

    // READ - Find posts by tag
    console.log('\nREAD - Posts with tag "javascript":');
    const jsPosts = await BlogPost.find({ tags: 'javascript' }).populate('author', 'username');
    jsPosts.forEach(post => {
      console.log(`  - ${post.title} by ${post.author.username}`);
    });

    // UPDATE - Update a post
    console.log('\nUPDATE - Updating first post...');
    const updatedPost = await BlogPost.findByIdAndUpdate(
      posts[0]._id,
      { title: 'Getting Started with MongoDB - Updated!' },
      { new: true }
    );
    console.log(`  Title updated to: ${updatedPost.title}`);

    // DELETE - Delete a comment
    console.log('\nDELETE - Deleting last comment...');
    const deletedComment = await Comment.findByIdAndDelete(comments[comments.length - 1]._id);
    const remainingComments = await Comment.countDocuments();
    console.log(`  Deleted comment: "${deletedComment.text}"`);
    console.log(`  Remaining comments: ${remainingComments}`);

    console.log('\nAll CRUD operations demonstrated successfully!\n');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed\n');
  }
}

// Run the seeding
seedDatabase();