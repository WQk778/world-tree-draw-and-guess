const express = require('express');
const router = express.Router();
const multer = require('multer');
const { submitDrawing, submitGuess, endRound } = require('../controllers/gameController');
const { authenticateUser } = require('../middlewares/auth');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Route to submit drawing
// Expects 'image' field in multipart/form-data
router.post('/submit-drawing', authenticateUser, upload.single('image'), submitDrawing);

// Route to submit guess
router.post('/guess', authenticateUser, submitGuess);

// Route to end round
router.post('/end-round', authenticateUser, endRound);

module.exports = router;
