const brevoService = require('../services/brevo.service');
const senderService = require('../services/sender.service');
const { successResponse } = require('../utils/response');

class EmailController {
  /**
   * Envía un email de prueba vía Brevo.
   * POST /api/v1/email/send-test
   * Body: { to, subject, html?, text?, sender_id? }
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
}

module.exports = new EmailController();
