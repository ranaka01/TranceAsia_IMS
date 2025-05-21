const express = require('express');
const systemSettingsController = require('../../Controllers/Admin/SystemSettingsController');
const { authenticateUser } = require('../../utils/authenticateUser');
const { authorizeRole } = require('../../utils/authorizeRoles');

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Protect all routes with Admin authorization
router.use(authorizeRole(['Admin']));

// Routes
router.get('/', systemSettingsController.getAllSettings);
router.get('/:key', systemSettingsController.getSetting);
router.patch('/:key', systemSettingsController.updateSetting);
router.delete('/:key', systemSettingsController.deleteSetting);

module.exports = router;
