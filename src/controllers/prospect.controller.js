const prospectService = require('../services/prospect.service');
const { successResponse, paginatedResponse } = require('../utils/response');

class ProspectController {
  async getAllProspects(req, res, next) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        sector_id: req.query.sector_id,
        consent_status: req.query.consent_status,
        search: req.query.search,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await prospectService.getAllProspects(filters);
      paginatedResponse(res, result.prospects, result.pagination, 'Prospects retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getProspectById(req, res, next) {
    try {
      const { id } = req.params;
      const prospect = await prospectService.getProspectById(id);
      successResponse(res, { prospect }, 'Prospect retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createProspect(req, res, next) {
    try {
      const prospect = await prospectService.createProspect(req.body);
      successResponse(res, { prospect }, 'Prospect created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateProspect(req, res, next) {
    try {
      const { id } = req.params;
      const prospect = await prospectService.updateProspect(id, req.body);
      successResponse(res, { prospect }, 'Prospect updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteProspect(req, res, next) {
    try {
      const { id } = req.params;
      const result = await prospectService.deleteProspect(id);
      successResponse(res, result, 'Prospect deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async bulkImport(req, res, next) {
    try {
      const { prospects } = req.body;
      const result = await prospectService.bulkImport(prospects);
      successResponse(res, result, 'Bulk import completed');
    } catch (error) {
      next(error);
    }
  }

  async unsubscribe(req, res, next) {
    try {
      const { email } = req.body;
      const result = await prospectService.unsubscribe(email);
      successResponse(res, result, 'Unsubscribed successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProspectController();
