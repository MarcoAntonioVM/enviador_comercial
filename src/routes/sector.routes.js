const express = require('express');
const router = express.Router();
const sectorController = require('../controllers/sector.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isCommercialOrAdmin, isAdmin } = require('../middlewares/roles.middleware');

router.use(authenticate);

// Rutas específicas primero (antes que /:id para evitar que "bulk-import" se interprete como id)
router.get('/', isCommercialOrAdmin, sectorController.getAllSectors);
router.get('/:id/stats', isCommercialOrAdmin, sectorController.getSectorStats);
router.get('/:id', isCommercialOrAdmin, sectorController.getSectorById);
router.post('/bulk-import', isAdmin, sectorController.bulkImport);
router.post('/', isAdmin, sectorController.createSector);
router.put('/:id', isAdmin, sectorController.updateSector);
router.delete('/:id', isAdmin, sectorController.deleteSector);

module.exports = router;
