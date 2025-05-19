const express = require('express');
const multer = require('multer');
const {
    registerUser,
    loginUser,
    getAllUsers,
    getUser,
    updateUserStatus,
    deleteUser,
    getUserProfile,
    updateUserProfile,
    getTechnicians
} = require('../Controllers/UserController');
const { authenticateUser } = require('../utils/authenticateUser');
const { authorizeRole } = require('../utils/authorizeRoles');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const router = express.Router();

// Public routes
router.post('/login', loginUser);

// Protected routes
router.use(authenticateUser);

// Admin only routes
router.post('/register-user', authorizeRole(['Admin']), registerUser);
router.get('/', authorizeRole(['Admin']), getAllUsers);
// Allow all authenticated users to access technicians list
router.get('/technicians', getTechnicians);
router.patch('/:id/status', authorizeRole(['Admin']), updateUserStatus);
router.delete('/:id', authorizeRole(['Admin']), deleteUser);

// User profile routes (accessible by the user themselves and admins)
router.get('/:id', getUserProfile);
router.patch('/:id/profile', upload.single('profile_image'), updateUserProfile);

module.exports = router;