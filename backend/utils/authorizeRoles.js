const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET; 

// authorizeRoles.js

function authorizeRole(allowedRoles) {
    return (req, res, next) => {
      // Ensure the user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in first.' });
      }
  
      // Check if the user's role is in the list of allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden. You do not have the necessary role.' });
      }
  
      // Proceed to the next middleware or route handler if the role is authorized
      next();
    };
  }
  
  module.exports = {authorizeRole};
  