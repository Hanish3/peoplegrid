// auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Get the header
    const authHeader = req.headers.authorization;

    // Check if it exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication failed! Invalid token format.' });
    }

    // Now it's safe to split
    const token = authHeader.split(' ')[1];
    
    // Verify the token using your secret key
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add the userId from the token to the request object
    req.userId = decodedToken.userId;
    
    // Continue to the next function (the actual route logic)
    next();
  } catch (error) {
    // This will catch split errors, invalid tokens, or expired tokens
    res.status(401).json({ error: 'Authentication failed!' });
  }
};