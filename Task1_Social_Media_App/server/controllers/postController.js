const Post         = require('../models/Post');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const path         = require('path');
const fs           = require('fs');

// ─────────────────────────────────────────
// @desc    Create a new post (text + optional media)
// @route   POST /api/posts
// @access  Private
// ─────────────────────────────────────────
exports.createPost = async (req, res) => {
  try {
    const userId  = req.user.id;
    const content = (req.body.content || '').trim();

    // Must have text OR a file
    if (!content && !req.file) {
      return res.status(400).json({ message: 'Post must have text or media.' });
    }
    if (content.length > 500) {
      return res.status(400).json({ message: 'Post cannot exceed 500 characters.' });
    }

    const postData = { userId, content };

    // Attach media if a file was uploaded
    if (req.file) {
      postData.mediaUrl  = '/uploads/' + req.file.filename;
      postData.mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    const newPost   = new Post(postData);
    const savedPost = await newPost.save();
    await savedPost.populate('userId', 'username email');

    res.status(201).json({ message: 'Post created!', post: savedPost });

  } catch (error) {
    console.error('Create post error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────
// @desc    Get all posts (newest first). Optional ?userId, pagination.
// @route   GET /api/posts
// @access  Public
// ─────────────────────────────────────────
exports.getAllPosts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const posts = await Post.find(filter)
      .populate('userId',          'username email')
      .populate('comments.userId', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(filter);

    res.status(200).json({
      posts,
      page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
    });

  } catch (error) {
    console.error('Get posts error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────
// @desc    Get a single post by ID
// ─────────────────────────────────────────
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId',          'username email')
      .populate('comments.userId', 'username');

    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json(post);

  } catch (error) {
    console.error('Get single post error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────
// @desc    Like / Unlike a post (toggle)
// ─────────────────────────────────────────
exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const post   = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
      if (post.userId.toString() !== userId) {
        await Notification.create({
          recipient: post.userId,
          sender:    userId,
          type:      'like',
          post:      post._id,
        });
      }
    }

    await post.save();

    res.status(200).json({
      message:    alreadyLiked ? 'Post unliked' : 'Post liked',
      totalLikes: post.likes.length,
      likes:      post.likes,
    });

  } catch (error) {
    console.error('Like/unlike error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────
// @desc    Add a comment to a post
// ─────────────────────────────────────────
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const userId   = req.user.id;

    if (!text || !text.trim())      return res.status(400).json({ message: 'Comment cannot be empty' });
    if (text.trim().length > 300)   return res.status(400).json({ message: 'Comment cannot exceed 300 characters' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ userId, text: text.trim() });
    await post.save();

    if (post.userId.toString() !== userId) {
      await Notification.create({
        recipient: post.userId,
        sender:    userId,
        type:      'comment',
        post:      post._id,
      });
    }

    const updatedPost = await Post.findById(req.params.id)
      .populate('userId',          'username email')
      .populate('comments.userId', 'username');

    res.status(201).json({ message: 'Comment added!', post: updatedPost });

  } catch (error) {
    console.error('Comment error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────
// @desc    Delete a post (author only)
// ─────────────────────────────────────────
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not allowed to delete this post' });
    }

    // Delete uploaded media file if it exists
    if (post.mediaUrl) {
      var filePath = path.join(__dirname, '../../public', post.mediaUrl);
      fs.unlink(filePath, function (err) {
        if (err) console.warn('Could not delete media file:', filePath);
      });
    }

    await Post.findByIdAndDelete(req.params.id);
    await User.updateMany(
      { savedPosts: req.params.id },
      { $pull: { savedPosts: req.params.id } }
    );

    res.status(200).json({ message: 'Post deleted successfully' });

  } catch (error) {
    console.error('Delete post error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────
// @desc    Save/unsave a post (bookmark toggle)
// ─────────────────────────────────────────
exports.toggleSavePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const user         = await User.findById(userId);
    const alreadySaved = user.savedPosts.some((id) => id.toString() === postId);

    if (alreadySaved) {
      user.savedPosts = user.savedPosts.filter((id) => id.toString() !== postId);
    } else {
      user.savedPosts.push(postId);
    }

    await user.save();

    res.status(200).json({
      message:    alreadySaved ? 'Post unsaved' : 'Post saved',
      saved:      !alreadySaved,
      savedPosts: user.savedPosts,
    });

  } catch (error) {
    console.error('Save/unsave error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────
// @desc    Get user's saved posts
// ─────────────────────────────────────────
exports.getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedPosts',
      populate: [
        { path: 'userId',          select: 'username email' },
        { path: 'comments.userId', select: 'username' },
      ],
      options: { sort: { createdAt: -1 } },
    });

    res.status(200).json(user.savedPosts || []);

  } catch (error) {
    console.error('Get saved posts error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
