const emailSendService = require('../services/emailSend.service');
const { successResponse, paginatedResponse } = require('../utils/response');

class EmailSendController {
  /**
   * GET /api/v1/email-sends
   * Lista registros de envíos (hora del envío, preconfiguración, prospecto, etc.)
   */
  async getAll(req, res, next) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        preconfiguration_id: req.query.preconfiguration_id,
        prospect_id: req.query.prospect_id,
        status: req.query.status,
        from_date: req.query.from_date,
        to_date: req.query.to_date,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await emailSendService.getAll(filters);
      paginatedResponse(
        res,
        result.email_sends,
        result.pagination,
        'Email sends retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/email-sends/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const record = await emailSendService.getById(id);
      successResponse(res, { email_send: record }, 'Email send retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmailSendController();
