const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  getUsers,
  getUser,
  toggleFollow,
  updateProfile,
} = require('../controllers/userController');

// ─────────────────────────────────────────
// @route   GET /api/users
// @desc    Search / list users (for discovery)
// @access  Public
// ─────────────────────────────────────────
router.get('/', getUsers);

// ─────────────────────────────────────────
// @route   PUT /api/users/profile/update
// @desc    Update bio / profilePic for the logged-in user
// @access  Private
// NOTE:    This MUST come before /:id to avoid "profile" being treated as an ID
// ─────────────────────────────────────────
router.put('/profile/update', protect, updateProfile);

// ─────────────────────────────────────────
// @route   GET /api/users/:id
// @desc    Get a user's public profile
// @access  Public
// ─────────────────────────────────────────
router.get('/:id', getUser);

// ─────────────────────────────────────────
// @route   PUT /api/users/:id/follow
// @desc    Follow or Unfollow a user (toggle)
// @access  Private
// ─────────────────────────────────────────
router.put('/:id/follow', protect, toggleFollow);

module.exports = router;
