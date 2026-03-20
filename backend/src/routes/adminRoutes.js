const express = require('express');
const router = express.Router();
const { getStats, updateAiConfig, updateRules, checkAdmin } = require('../controllers/adminController');
const { authenticateUser, requireAdmin } = require('../middlewares/auth');

// All admin routes require authentication AND admin privileges
router.use(authenticateUser, requireAdmin);

router.get('/check', checkAdmin); // Route to simply verify admin status
router.get('/stats', getStats);
router.post('/config/ai', updateAiConfig);
router.post('/rules', updateRules);

module.exports = router;