const brevoService = require('../services/brevo.service');
const senderService = require('../services/sender.service');
const templateService = require('../services/template.service');
const prospectService = require('../services/prospect.service');
const emailSendService = require('../services/emailSend.service');
const brevoWebhookService = require('../services/brevoWebhook.service'); 
const { successResponse } = require('../utils/response');

class EmailController {
  /**
   * Sincroniza manualmente el estado de un email consultando la API de Brevo.
   * GET /api/v1/email/sync/:messageId
   */
  async syncStatus(req, res, next) {
    try {
      const { messageId } = req.params;
      
      // 1. Uso de la librería para obtener los reportes
      const reports = await brevoService.getMessageEvents(messageId);
      
      const results = [];
      
      // 2. Procesamos cada evento con la lógica de processWebhookEvent
      if (reports && reports.length > 0) {
        for (const report of reports) {
          // formato del reporte de la librería al que espera processWebhookEvent
          const result = await brevoWebhookService.processWebhookEvent({
            event: report.event,
            'message-id': report.messageId,
            ts_event: Math.floor(new Date(report.date).getTime() / 1000), 
            email: report.email
          });
          results.push(result);
        }
      }

      successResponse(res, { results }, 'Email status synchronized successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Envía un email de prueba vía Brevo.
   */
  async sendTest(req, res, next) {
    try {
      const { to, subject, html, text, sender_id } = req.body;

      let sender = null;
      let replyTo = null;
      if (sender_id) {
        try {
          const s = await senderService.getSenderById(sender_id);
          sender = { name: s.name, email: s.email };
          replyTo = s.reply_to || null;
        } catch {
          // si no existe el sender, se usan los defaults de .env
        }
      }

      const result = await brevoService.sendTransactionalEmail({
        sender: sender || undefined,
        to: [{ email: to, name: to }],
        subject,
        htmlContent: html || undefined,
        textContent: text || undefined,
        replyTo
      });

      successResponse(res, { messageId: result.messageId }, 'Test email sent successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Envía correo usando `preconfiguration_id`
   */
  async sendByPreconfiguration(req, res, next) {
    try {
      const { preconfiguration_id } = req.body;
      const result = await emailSendService.executePreconfiguration(preconfiguration_id);
      successResponse(res, result, 'Email sent using preconfiguration', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmailController();