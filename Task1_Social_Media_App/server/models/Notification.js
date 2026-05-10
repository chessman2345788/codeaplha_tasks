const mongoose = require('mongoose');

// ── Notification Schema ──────────────────────────────────
// Stores notifications like "User X liked your post", "User Y followed you"
const NotificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,       // fast lookups by recipient
    },

    // Who triggered the notification
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Type of notification
    type: {
      type: String,
      enum: ['like', 'comment', 'follow'],
      required: true,
    },

    // Optional reference to the related post (for like/comment)
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },

    // Has the user seen this notification?
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', NotificationSchema);
