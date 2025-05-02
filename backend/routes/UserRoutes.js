const express = require('express');
const { registerUser,loginUser } = require('../Controllers/UserController');	
const {authenticateUser} = require('../utils/authenticateUser');
const {authorizeRole} = require('../utils/authorizeRoles');

const router = express.Router();

// Protect this route with authentication and Admin role authorization
router.post('/register-user', authenticateUser, authorizeRole(['Admin']), registerUser);
router.post('/login', loginUser);	
module.exports = router;
