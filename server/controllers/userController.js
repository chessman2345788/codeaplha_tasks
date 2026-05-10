const User = require('../models/User');
const Notification = require('../models/Notification');

// ─────────────────────────────────────────
// @desc    Search / list users
// ─────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.search) {
      filter.username = { $regex: req.query.search, $options: 'i' };
    }

    const users = await User.find(filter)
      .select('-password')
      .limit(20)
      .sort({ createdAt: -1 });

    res.status(200).json(users);

  } catch (error) {
    console.error('List users error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────
// @desc    Get a user's public profile
// ─────────────────────────────────────────
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'username profilePic')
      .populate('following', 'username profilePic');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);

  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────
// @desc    Follow or Unfollow a user (toggle)
// ─────────────────────────────────────────
exports.toggleFollow = async (req, res) => {
  try {
    const userId   = req.user.id;
    const targetId = req.params.id;

    if (userId === targetId) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadyFollowing = currentUser.following.some(
      (id) => id.toString() === targetId
    );

    if (alreadyFollowing) {
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetId
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== userId
      );
    } else {
      currentUser.following.push(targetId);
      targetUser.followers.push(userId);

      // Create follow notification
      await Notification.create({
        recipient: targetId,
        sender: userId,
        type: 'follow',
      });
    }

    await Promise.all([
      currentUser.save(),
      targetUser.save(),
    ]);

    res.status(200).json({
      message:        alreadyFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      following:      currentUser.following,
      followersCount: targetUser.followers.length,
    });

  } catch (error) {
    console.error('Follow/unfollow error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────
// @desc    Update bio / profilePic for the logged-in user
// ─────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { bio, profilePic } = req.body;
    const userId = req.user.id;

    const updates = {};
    if (bio !== undefined) {
      if (bio.length > 160) {
        return res.status(400).json({ message: 'Bio cannot exceed 160 characters' });
      }
      updates.bio = bio;
    }
    if (profilePic !== undefined) {
      updates.profilePic = profilePic;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated!',
      user:    updatedUser,
    });

  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
