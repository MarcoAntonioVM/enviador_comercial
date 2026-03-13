const emailSendService = require('../services/emailSend.service');
const prospectService = require('../services/prospect.service');
const templateService = require('../services/template.service');
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
      // Obtener prospectos y plantillas usando sus servicios (evita depender únicamente de includes)
      const rows = result.email_sends || [];

      const prospectIds = Array.from(new Set(rows.map(r => (r && r.prospect_id) || (typeof r.toJSON === 'function' ? r.toJSON().prospect_id : null)).filter(Boolean)));
      const templateIds = Array.from(new Set(rows.map(r => (r && r.template_id) || (typeof r.toJSON === 'function' ? r.toJSON().template_id : null)).filter(Boolean)));

      const [prospectsArray, templatesArray] = await Promise.all([
        Promise.all(prospectIds.map(id => prospectService.getProspectById(id).catch(() => null))),
        Promise.all(templateIds.map(id => templateService.getTemplateById(id).catch(() => null)))
      ]);

      const prospectMap = {};
      prospectIds.forEach((id, i) => { prospectMap[id] = prospectsArray[i] || null; });
      const templateMap = {};
      templateIds.forEach((id, i) => { templateMap[id] = templatesArray[i] || null; });


      const emailSends = rows.map((s) => {
        const item = typeof s.toJSON === 'function' ? s.toJSON() : s;

        const prospect = prospectMap[item.prospect_id] || item.prospect;
        const template = templateMap[item.template_id] || item.template;

        return {
          id: item.id,
          sent_at: item.sent_at,
          status: item.status,
          delivered_at: item.delivered_at,
          opened_at: item.opened_at,
          clicked_at: item.clicked_at,
          bounced_at: item.bounced_at,
          prospect_name: prospect ? prospect.name : 'N/A',
          prospect_email: prospect ? prospect.email : item.prospect_email,
          prospect_company: prospect ? prospect.company : null,
          template_subject: template ? template.subject : item.template_subject,
          template_name: template ? template.name : null,
          preconfiguration_id: item.preconfiguration_id
        };
      });

      paginatedResponse(res, emailSends, result.pagination, 'Email sends retrieved successfully');

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/email-sends/stats
   * Estadísticas agregadas de envíos (totales, tasas de entrega, apertura, clic, rebote...).
   * Filtros opcionales: preconfiguration_id, prospect_id, from_date, to_date
   */
  async getStats(req, res, next) {
    try {
      const filters = {
        preconfiguration_id: req.query.preconfiguration_id,
        prospect_id: req.query.prospect_id,
        from_date: req.query.from_date,
        to_date: req.query.to_date
      };
      const stats = await emailSendService.getStats(filters);
      successResponse(res, { stats }, 'Email send stats retrieved successfully', 200);
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
