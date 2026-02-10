const express = require('express');
const router = express.Router();
const prospectController = require('../controllers/prospect.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isCommercialOrAdmin } = require('../middlewares/roles.middleware');

router.use(authenticate);
router.use(isCommercialOrAdmin);

router.get('/', prospectController.getAllProspects);
router.get('/:id', prospectController.getProspectById);
router.post('/', prospectController.createProspect);
router.put('/:id', prospectController.updateProspect);
router.delete('/:id', prospectController.deleteProspect);
router.post('/:id/reactivate', prospectController.reactivateProspect);
router.post('/bulk-import', prospectController.bulkImport);
router.post('/unsubscribe', prospectController.unsubscribe);

module.exports = router;
