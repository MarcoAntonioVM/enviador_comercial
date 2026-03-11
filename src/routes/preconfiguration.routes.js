const express = require('express');
const router = express.Router();
const preconfigurationController = require('../controllers/preconfiguration.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.get('/', preconfigurationController.getAll);
router.get('/:id', preconfigurationController.getById);
router.post('/', preconfigurationController.create);
router.put('/:id', preconfigurationController.update);
router.delete('/:id', preconfigurationController.delete);
router.post('/:id/execute', preconfigurationController.execute);

module.exports = router;
