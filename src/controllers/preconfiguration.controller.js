const preconfigurationService = require('../services/preconfiguration.service');
const emailSendService = require('../services/emailSend.service');
const { successResponse, paginatedResponse } = require('../utils/response');
const { AppError } = require('../utils/errors');

class PreconfigurationController {

  /**
   * GET /api/v1/preconfigurations
   */
  async getAll(req, res, next) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        active: req.query.active !== undefined ? req.query.active : undefined,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await preconfigurationService.getAll(filters);

      paginatedResponse(
        res,
        result.preconfigurations,
        result.pagination,
        'Preconfigurations retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/preconfigurations/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const preconfig = await preconfigurationService.getById(id);

      successResponse(res, { preconfiguration: preconfig }, 'Preconfiguration retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/preconfigurations
   */
  async create(req, res, next) {
    try {
      const { template_id, sender_id, prospect_id, days_week, hour, cc, bcc } = req.body;

      if (!template_id || !sender_id || !prospect_id || !days_week || !hour) {
        throw new AppError('template_id, sender_id, prospect_id, days_week and hour are required', 400);
      }

      const preconfig = await preconfigurationService.create({
        template_id,
        sender_id,
        prospect_id,
        days_week,
        hour,
        cc,
        bcc
      });

      successResponse(res, { preconfiguration: preconfig }, 'Preconfiguration created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/preconfigurations/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const preconfig = await preconfigurationService.update(id, req.body);

      successResponse(res, { preconfiguration: preconfig }, 'Preconfiguration updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/preconfigurations/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await preconfigurationService.delete(id);

      successResponse(res, result, 'Preconfiguration deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/preconfigurations/:id/execute
   * Ejecuta el envío de la preconfiguración (envía el correo y guarda la hora del envío).
   */
  async execute(req, res, next) {
    try {
      const { id } = req.params;
      const result = await emailSendService.executePreconfiguration(id);
      successResponse(res, result, 'Email sent and send time recorded', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PreconfigurationController();
