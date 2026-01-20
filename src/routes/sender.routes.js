const express = require('express');
const router = express.Router();
const senderController = require('../controllers/sender.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/roles.middleware');

router.use(authenticate);
router.use(isAdmin);

router.get('/', senderController.getAllSenders);
router.get('/default', senderController.getDefaultSender);
router.get('/:id', senderController.getSenderById);
router.get('/:id/daily-limit', senderController.checkDailyLimit);
router.post('/', senderController.createSender);
router.post('/:id/set-default', senderController.setDefaultSender);
router.put('/:id', senderController.updateSender);
router.delete('/:id', senderController.deleteSender);

module.exports = router;
