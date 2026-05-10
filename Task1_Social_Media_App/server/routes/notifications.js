const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  getNotifications,
  markAllRead,
  getUnreadCount,
} = require('../controllers/notificationController');

// ─────────────────────────────────────────
// @route   GET /api/notifications
// @desc    Get notifications for logged-in user
// @access  Private
// ─────────────────────────────────────────
router.get('/', protect, getNotifications);

// ─────────────────────────────────────────
// @route   PUT /api/notifications/read
// @desc    Mark all notifications as read
// @access  Private
// ─────────────────────────────────────────
router.put('/read', protect, markAllRead);

// ─────────────────────────────────────────
// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count (for badge)
// @access  Private
// ─────────────────────────────────────────
router.get('/unread-count', protect, getUnreadCount);

module.exports = router;
