const templateService = require('../services/template.service');
const { successResponse } = require('../utils/response');

class TemplateController {
  async getAllTemplates(req, res, next) {
    try {
      const filters = {
        sector_id: req.query.sector_id,
        active: req.query.active,
        created_by: req.query.created_by
      };

      const templates = await templateService.getAllTemplates(filters);
      successResponse(res, { templates }, 'Templates retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getTemplateById(req, res, next) {
    try {
      const { id } = req.params;
      const template = await templateService.getTemplateById(id);
      successResponse(res, { template }, 'Template retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createTemplate(req, res, next) {
    try {
      const template = await templateService.createTemplate(req.body, req.userId);
      successResponse(res, { template }, 'Template created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const template = await templateService.updateTemplate(id, req.body);
      successResponse(res, { template }, 'Template updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const result = await templateService.deleteTemplate(id);
      successResponse(res, result, 'Template deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async duplicateTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const template = await templateService.duplicateTemplate(id, req.userId);
      successResponse(res, { template }, 'Template duplicated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getDefaultTemplate(req, res, next) {
    try {
      const { sector_id } = req.query;
      const template = await templateService.getDefaultTemplate(sector_id);
      successResponse(res, { template }, 'Default template retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TemplateController();
