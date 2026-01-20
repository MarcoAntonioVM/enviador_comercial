const campaignService = require('../services/campaign.service');
const { successResponse, paginatedResponse } = require('../utils/response');

class CampaignController {
  async getAllCampaigns(req, res, next) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        type: req.query.type,
        sector_id: req.query.sector_id,
        created_by: req.query.created_by,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await campaignService.getAllCampaigns(filters);
      paginatedResponse(res, result.campaigns, result.pagination, 'Campaigns retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getCampaignById(req, res, next) {
    try {
      const { id } = req.params;
      const campaign = await campaignService.getCampaignById(id);
      successResponse(res, { campaign }, 'Campaign retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createCampaign(req, res, next) {
    try {
      const campaign = await campaignService.createCampaign(req.body, req.userId);
      successResponse(res, { campaign }, 'Campaign created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCampaign(req, res, next) {
    try {
      const { id } = req.params;
      const campaign = await campaignService.updateCampaign(id, req.body);
      successResponse(res, { campaign }, 'Campaign updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteCampaign(req, res, next) {
    try {
      const { id } = req.params;
      const result = await campaignService.deleteCampaign(id);
      successResponse(res, result, 'Campaign deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async addRecipients(req, res, next) {
    try {
      const { id } = req.params;
      const { recipients } = req.body;
      const result = await campaignService.addRecipients(id, recipients);
      successResponse(res, result, 'Recipients added successfully');
    } catch (error) {
      next(error);
    }
  }

  async getCampaignRecipients(req, res, next) {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;
      const result = await campaignService.getCampaignRecipients(id, page, limit);
      paginatedResponse(res, result.recipients, result.pagination, 'Recipients retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getCampaignStats(req, res, next) {
    try {
      const { id } = req.params;
      const stats = await campaignService.getCampaignStats(id);
      successResponse(res, stats, 'Campaign statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async scheduleCampaign(req, res, next) {
    try {
      const { id } = req.params;
      const { scheduled_at } = req.body;
      const campaign = await campaignService.scheduleCampaign(id, scheduled_at);
      successResponse(res, { campaign }, 'Campaign scheduled successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CampaignController();
