const brevoWebhookService = require('../services/brevoWebhook.service');

/**
 * POST /api/v1/webhooks/brevo
 * Recibe eventos de Brevo (delivered, opened, click, bounce, spam, unsubscribed)
 * y actualiza email_sends con la hora del evento.
 * No requiere autenticación; configurar en Brevo la URL de este endpoint.
 */
async function brevo(req, res, next) {
  try {
    const body = req.body || {};
    const results = await brevoWebhookService.handleWebhookPayload(body);
    res.status(200).json({
      success: true,
      message: 'Webhook processed',
      processed: results.length,
      results
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  brevo
};
