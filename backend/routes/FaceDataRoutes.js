const express = require('express');
const { saveFaceData, checkFaceData, verifyFaceData } = require('../controllers/FaceDataController');
const { isLoggedIn } = require('../middlewares/authMiddleware');
const FaceData = require('../models/FaceData');

const router = express.Router();

router.post('/save', saveFaceData);
router.get('/check/:userId', checkFaceData);
router.post('/verify', verifyFaceData);
router.post('/face-verify', verifyFaceData);

router.post('/test', (req, res) => {
  try {
    res.status(200).json({ success: true, message: 'Test endpoint working' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
