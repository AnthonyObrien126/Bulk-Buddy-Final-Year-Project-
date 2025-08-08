const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'; 

// Middleware to check and verify JWT token from Authorization header
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // Ensure token is provided and formatted correctly
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token missing or malformed' });
  }

  // Extract token value
  const token = authHeader.split(' ')[1];

  try {
    // Verify token and attach user data to request object
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next(); // Proceed to next middleware or route
  } catch (err) {
    // Invalid or expired token
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
