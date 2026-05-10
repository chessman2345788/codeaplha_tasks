const express  = require('express');
const router   = express.Router();
const protect  = require('../middleware/auth');
const upload   = require('../middleware/upload');
const {
  createPost,
  getAllPosts,
  getPost,
  toggleLike,
  addComment,
  deletePost,
  toggleSavePost,
  getSavedPosts,
} = require('../controllers/postController');

// GET  /api/posts/saved  — MUST be before /:id to avoid shadowing
router.get('/saved', protect, getSavedPosts);

// POST /api/posts  — accepts optional "media" file field
router.post('/', protect, upload.single('media'), createPost);

// GET  /api/posts
router.get('/', getAllPosts);

// GET  /api/posts/:id
router.get('/:id', getPost);

// PUT  /api/posts/:id/like
router.put('/:id/like', protect, toggleLike);

// POST /api/posts/:id/comment
router.post('/:id/comment', protect, addComment);

// PUT  /api/posts/:id/save
router.put('/:id/save', protect, toggleSavePost);

// DELETE /api/posts/:id
router.delete('/:id', protect, deletePost);

module.exports = router;
