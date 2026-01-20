const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaign.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isCommercialOrAdmin } = require('../middlewares/roles.middleware');

router.use(authenticate);
router.use(isCommercialOrAdmin);

router.get('/', campaignController.getAllCampaigns);
router.get('/:id', campaignController.getCampaignById);
router.post('/', campaignController.createCampaign);
router.put('/:id', campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);
router.post('/:id/recipients', campaignController.addRecipients);
router.get('/:id/recipients', campaignController.getCampaignRecipients);
router.get('/:id/stats', campaignController.getCampaignStats);
router.post('/:id/schedule', campaignController.scheduleCampaign);

module.exports = router;
