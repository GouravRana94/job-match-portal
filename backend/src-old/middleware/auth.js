const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Verifies JWT token from request headers
 */
module.exports = (req, res, next) => {
  // Get token from header
  const authHeader = req.header('Authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      message: 'Access denied. No token provided.',
      error: 'NO_TOKEN'
    });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    
    // Add user type if available
    if (decoded.user_type) {
      req.user.user_type = decoded.user_type;
    }
    
    next();
  } catch (err) {
    // Handle different JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        error: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({ 
      message: 'Authentication failed',
      error: err.message
    });
  }
};