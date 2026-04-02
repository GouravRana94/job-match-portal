const pool = require('../config/database');

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of allowed user types
 */
const roleAuth = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Get user type from database
      const result = await pool.query(
        'SELECT user_type FROM users WHERE id = $1',
        [req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const userType = result.rows[0].user_type;
      
      // Check if user type is allowed
      if (!allowedRoles.includes(userType)) {
        return res.status(403).json({ 
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
          current_role: userType
        });
      }
      
      // Add user type to request
      req.user.user_type = userType;
      next();
      
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
};

module.exports = roleAuth;