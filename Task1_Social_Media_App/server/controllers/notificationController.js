const Notification = require('../models/Notification');

// ─────────────────────────────────────────
// @desc    Get notifications for logged-in user
// ─────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'username profilePic')
      .populate('post', 'content')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      read: false,
    });

    res.status(200).json({ notifications, unreadCount });

  } catch (error) {
    console.error('Get notifications error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────
// @desc    Mark all notifications as read
// ─────────────────────────────────────────
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ message: 'All notifications marked as read' });

  } catch (error) {
    console.error('Mark read error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────
// @desc    Get unread notification count
// ─────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      read: false,
    });

    res.status(200).json({ count });

  } catch (error) {
    console.error('Unread count error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
