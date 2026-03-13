const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const emailValidators = require('../validators/email.validator');

router.use(authenticate);

router.post('/send-test', validate(emailValidators.sendTest), emailController.sendTest);
router.post('/send-by-preconfiguration', validate(emailValidators.sendByPreconfiguration), emailController.sendByPreconfiguration);

module.exports = router;
