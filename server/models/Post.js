const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text:   { type: String, required: true, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

const PostSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content:   { type: String, trim: true, maxlength: 500, default: '' },
    mediaUrl:  { type: String, default: null },
    mediaType: { type: String, enum: ['image', 'video', null], default: null },
    likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments:  [CommentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);
