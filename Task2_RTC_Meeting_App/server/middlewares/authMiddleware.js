const { verifyToken } = require('../services/authService');

const protect = (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (Bearer <token>)
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = verifyToken(token);

      // Attach user details to the request object
      req.user = decoded;

      next();
    } catch (err) {
      console.error('[authMiddleware] Error:', err.message);
      return res.status(401).json({ error: 'Authentication required: token is invalid or expired' });
    }
  } else {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
