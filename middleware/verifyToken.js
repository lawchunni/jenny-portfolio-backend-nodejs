require('dotenv').config();
const privateKey = process.env.SECRET_KEY;

const jwt = require('jsonwebtoken');

// middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if(!token) return res.status(403).json({ message: 'Access denied, no token provided' });

  jwt.verify(token.split(' ')[1], privateKey, (err, decoded) => {
    if (err) {
      console.error('JWT Verification Error:', err.message);
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }

    // If token is valid, save the decoded token payload to req.user for use in other routes
    req.user = decoded;
    console.log('Token Decoded:', decoded);
    next();
  });

};

module.exports = verifyToken;
