const crypto = require('crypto');

/**
 * Middleware que verifica la firma del webhook de Brevo (header x-brevo-signature).
 * Usa BREVO_WEBHOOK_SECRET del .env (el token que te da Brevo al configurar el webhook).
 * - Si BREVO_WEBHOOK_SECRET no está definido: no se valida (se permite la petición).
 * - Si está definido: se exige x-brevo-signature y se verifica HMAC-SHA256 sobre el body raw.
 */
function verifyBrevoWebhook(req, res, next) {
  const secret = process.env.BREVO_WEBHOOK_SECRET;
  const secretSet = secret != null && String(secret).trim() !== '';

  if (!secretSet) {
    return next();
  }

  const signature = req.headers['x-brevo-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(401).json({
      success: false,
      message: 'Missing x-brevo-signature header'
    });
  }

  const rawBody = req.rawBody;
  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    return res.status(400).json({
      success: false,
      message: 'Raw body required for signature verification'
    });
  }

  try {
    const expected = crypto
      .createHmac('sha256', secret.trim())
      .update(rawBody)
      .digest('hex');
    const received = signature.replace(/^sha256=/i, '').trim();
    if (received.length !== 64 || expected.length !== 64) {
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
      }
    const receivedBuf = Buffer.from(received, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (!crypto.timingSafeEqual(receivedBuf, expectedBuf)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid webhook signature'
    });
  }

  next();
}

module.exports = { verifyBrevoWebhook };
