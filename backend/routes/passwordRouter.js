const express = require('express');
const { isLoggedIn } = require('../middlewares/authMiddleware');
const { createPassword, getPasswords, editPassword, deletePassword } = require('../controllers/passwordController');

const router = express.Router();

router.get('/', isLoggedIn, getPasswords);
router.post('/', isLoggedIn, createPassword);
router.put('/:id', isLoggedIn, editPassword);
router.delete('/:id', isLoggedIn, deletePassword);

module.exports = router;