const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (Bearer <token>)
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyformyhabitplatform123!');

      // Verify client IP address to prevent session hijacking or token sharing
      const currentIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      if (decoded.ip && decoded.ip !== currentIp) {
        console.warn(`Auth blocked: IP address mismatch. Token IP: ${decoded.ip}, Current IP: ${currentIp}`);
        return res.status(401).json({ message: 'Not authorized, IP address mismatch' });
      }

      // Get user from database (exclude password) and attach to request
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
