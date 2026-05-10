const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username:   { type: String, required: true, unique: true, trim: true, minlength: 3 },
    email:      { type: String, required: true, unique: true, trim: true, lowercase: true, match: [/\S+@\S+\.\S+/, 'Please enter a valid email'] },
    password:   { type: String, required: true, minlength: 6 },
    bio:        { type: String, default: '', maxlength: 160 },
    profilePic: { type: String, default: '' },
    followers:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  },
  { timestamps: true }
);

UserSchema.index({ username: 'text' });

module.exports = mongoose.model('User', UserSchema);
