const { generateTokens, verifyToken, getJwtSecret } = require('../services/authService');
const jwt = require('jsonwebtoken'); // Kept for generating sessionToken currently, or we can use authService
const User = require('../models/User');
const Room = require('../models/Room');

const register = async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ error: 'Username already taken' });

    await User.create({ username, password });
    res.status(201).json({ message: 'Registered successfully' });
  } catch (error) {
    console.error('[register] Error:', error.message);
    next(error);
  }
};

const login = async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate both access and refresh tokens (refresh-token-ready architecture)
    const { accessToken, refreshToken } = generateTokens({ id: user._id, username: user.username });

    // Send token as 'token' for backwards compatibility with frontend, but also include accessToken and refreshToken
    res.json({ 
      token: accessToken, 
      accessToken,
      refreshToken,
      username: user.username, 
      userId: user._id 
    });
  } catch (error) {
    console.error('[login] Error:', error.message);
    next(error);
  }
};

const joinRoom = async (req, res, next) => {
  const { roomId, password } = req.body;
  // Use Bearer token from headers instead of req.body.token for better security
  let token = req.body.token; // Fallback
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!roomId || !token) {
    return res.status(400).json({ error: 'roomId and token are required' });
  }

  try {
    // Verify the user's primary token
    const decoded = verifyToken(token);

    let room = await Room.findOne({ roomId });
    let role = 'participant';

    if (!room) {
      if (!password) {
        return res.status(400).json({ error: 'A password is required to create a room' });
      }
      room = await Room.create({ roomId, password, host: decoded.id });
      role = 'host';
    } else {
      if (room.password && room.password !== password) {
        return res.status(401).json({ error: 'Incorrect room password' });
      }
      if (room.host.toString() === decoded.id.toString()) {
        role = 'host';
      }
    }

    // Create a special room session token
    const sessionToken = jwt.sign(
      { id: decoded.id, username: decoded.username, roomId, role },
      getJwtSecret(),
      { expiresIn: '8h' }
    );

    res.json({ sessionToken, role });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Authentication required: token is invalid or expired' });
    }
    console.error('[joinRoom] Error:', error.message);
    next(error);
  }
};

const verify = async (req, res) => {
  // If the protect middleware passes, the token is valid
  res.json({ valid: true, user: req.user });
};

module.exports = { register, login, joinRoom, verify };
