const jwt = require('jsonwebtoken');
const db = require('../db'); // Import your database connection
const SECRET_KEY = process.env.JWT_SECRET;

// Middleware to authenticate user
async function authenticateUser(req, res, next) {
  if (!req.headers || !req.headers['authorization']) {
    return res.status(403).json({ message: 'No token provided' });
  }
  
  // Get token from Authorization header
  const token = req.headers['authorization'].split(' ')[1];  // Assumes the format 'Bearer <token>'
  
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }
  
  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, SECRET_KEY);
    
    // Check if the user still exists and is active in the database
    const [users] = await db.query('SELECT User_ID, Username, Role, is_active FROM User WHERE User_ID = ?', [decoded.userId]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    
    const user = users[0];
    
    // Check if the user is still active
    if (user.is_active !== 1) {
      return res.status(401).json({ 
        status: 'fail',
        message: 'User account has been deactivated' 
      });
    }
    
    // Attach the decoded user info to the request object for later use
    req.user = {
      userId: user.User_ID,
      username: user.Username,
      role: user.Role,
      email: decoded.email
    };
    
    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { authenticateUser };