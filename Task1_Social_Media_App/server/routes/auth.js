const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// ─────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Create a new user account
// @access  Public
// ─────────────────────────────────────────
router.post('/register', register);

// ─────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Log in with email and password
// @access  Public
// ─────────────────────────────────────────
router.post('/login', login);

module.exports = router;
