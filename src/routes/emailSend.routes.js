const express = require('express');
const router = express.Router();
const emailSendController = require('../controllers/emailSend.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', emailSendController.getAll);
router.get('/stats', emailSendController.getStats);
router.get('/timeseries', emailSendController.getTimeSeries);
router.get('/:id', emailSendController.getById);

module.exports = router;
