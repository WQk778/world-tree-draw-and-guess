const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticateUser } = require('../middlewares/auth');

// Apply auth middleware to all room routes
router.use(authenticateUser);

router.post('/create', roomController.createRoom);
router.post('/join', roomController.joinRoom);
router.get('/:id/members', roomController.getRoomMembers);

module.exports = router;
