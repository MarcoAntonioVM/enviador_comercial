const express = require('express');
const router = express.Router();
const senderController = require('../controllers/sender.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/roles.middleware');
const { validate } = require('../middlewares/validation.middleware');
const senderValidators = require('../validators/sender.validator');

router.use(authenticate);
router.use(isAdmin);

// Operaciones masivas (deben estar ANTES de las rutas con :id)
router.post('/multiple', validate(senderValidators.bulkCreateSenders), senderController.bulkCreateSenders);
router.put('/multiple', validate(senderValidators.bulkUpdateSenders), senderController.bulkUpdateSenders);
router.delete('/multiple', validate(senderValidators.bulkDeleteSenders), senderController.bulkDeleteSenders);

// Rutas individuales
router.get('/', senderController.getAllSenders);
router.get('/default', senderController.getDefaultSender);
router.get('/:id', senderController.getSenderById);
router.get('/:id/daily-limit', senderController.checkDailyLimit);
router.post('/', validate(senderValidators.createSender), senderController.createSender);
router.post('/:id/set-default', senderController.setDefaultSender);
router.put('/:id', validate(senderValidators.updateSender), senderController.updateSender);
router.delete('/:id', senderController.deleteSender);

module.exports = router;
