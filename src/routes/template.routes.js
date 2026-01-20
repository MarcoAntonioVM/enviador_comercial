const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isCommercialOrAdmin } = require('../middlewares/roles.middleware');

router.use(authenticate);
router.use(isCommercialOrAdmin);

router.get('/', templateController.getAllTemplates);
router.get('/default', templateController.getDefaultTemplate);
router.get('/:id', templateController.getTemplateById);
router.post('/', templateController.createTemplate);
router.post('/:id/duplicate', templateController.duplicateTemplate);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);

module.exports = router;
