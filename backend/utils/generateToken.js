const jwt = require('jsonwebtoken');

const generateToken = (userId, role, instituteId) => {
  return jwt.sign(
    { userId, role, instituteId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = generateToken;
