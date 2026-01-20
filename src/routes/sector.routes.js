const express = require('express');
const router = express.Router();
const sectorController = require('../controllers/sector.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isCommercialOrAdmin, isAdmin } = require('../middlewares/roles.middleware');

router.use(authenticate);

router.get('/', isCommercialOrAdmin, sectorController.getAllSectors);
router.get('/:id', isCommercialOrAdmin, sectorController.getSectorById);
router.get('/:id/stats', isCommercialOrAdmin, sectorController.getSectorStats);
router.post('/', isAdmin, sectorController.createSector);
router.put('/:id', isAdmin, sectorController.updateSector);
router.delete('/:id', isAdmin, sectorController.deleteSector);

module.exports = router;
