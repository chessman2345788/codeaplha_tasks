const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_key';

const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, getJwtSecret(), { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, getRefreshSecret(), { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const verifyToken = (token, isRefresh = false) => {
  const secret = isRefresh ? getRefreshSecret() : getJwtSecret();
  return jwt.verify(token, secret);
};

module.exports = {
  generateTokens,
  verifyToken,
  getJwtSecret,
};
