const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET; // Replace with your actual JWT secret

// Middleware to authenticate user
function authenticateUser(req, res, next) {
    if (!req.headers || !req.headers['authorization']) {
      return res.status(403).json({ message: 'No token provided' });
    }
  
    // Get token from Authorization header
    const token = req.headers['authorization'].split(' ')[1];  // Assumes the format 'Bearer <token>'
  
    if (!token) {
      return res.status(403).json({ message: 'No token provided' });
    }
  
    // Verify the token using the secret key
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
  
      // Attach the decoded user info to the request object for later use
      req.user = decoded;
  
      // Proceed to the next middleware or route handler
      next();
    });
}
  

  

module.exports = {authenticateUser};
