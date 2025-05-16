const express = require('express');
const { signup, login, logout } = require('../controllers/authController');
const { isLoggedIn } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/signup', signup);

router.post('/login', login);

router.post('/logout', isLoggedIn, logout);

module.exports = router;