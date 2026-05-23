const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authController.me);
router.put('/profile', protect, upload.single('foto_profil'), authController.updateProfile);
router.put('/password', protect, authController.changePassword);

module.exports = router;
