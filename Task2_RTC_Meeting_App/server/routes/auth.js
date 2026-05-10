const express = require('express');
const { register, login, joinRoom, verify } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/join', joinRoom); // Allow joinRoom to be protected manually or via token passed
router.get('/verify', protect, verify); // Automatic token validation endpoint

module.exports = router;
