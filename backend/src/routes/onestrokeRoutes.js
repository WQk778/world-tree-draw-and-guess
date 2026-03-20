const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getQuestion, submitDrawing, getRankings } = require('../controllers/onestrokeController');
const { authenticateUser } = require('../middlewares/auth');

const upload = multer({ dest: 'uploads/' });

router.get('/question', authenticateUser, getQuestion);
router.post('/submit', authenticateUser, upload.single('image'), submitDrawing);
router.get('/rankings', getRankings);

module.exports = router;