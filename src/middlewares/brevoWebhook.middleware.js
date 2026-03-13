const crypto = require('crypto');

/**
 * Middleware que verifica el token del webhook de Brevo.
 * Brevo envía el secret como valor literal en el header "x-sib-webhook-secret"
 * (o "x-brevo-webhook-token" según versión).
 * - Si BREVO_WEBHOOK_SECRET no está en .env: no se valida (se permite la petición).
 * - Si está definido: se compara el header con comparación timing-safe.
 */
function verifyBrevoWebhook(req, res, next) {
  const secret = process.env.BREVO_WEBHOOK_SECRET;
  const secretSet = secret != null && String(secret).trim() !== '';

  if (!secretSet) {
    return next();
  }

  // Brevo puede enviar el token en cualquiera de estos headers según versión
  const token =
    req.headers['x-brevo-webhook-token'] ||
    req.headers['x-sib-webhook-secret'] ||
    req.headers['x-brevo-signature'] ||
    null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Missing webhook token header'
    });
  }

  try {
    const expected = Buffer.from(secret.trim(), 'utf8');
    const received = Buffer.from(String(token).trim(), 'utf8');

    // Padding para evitar timing attacks aunque los largos difieran
    const len = Math.max(expected.length, received.length);
    const e = Buffer.alloc(len);
    const r = Buffer.alloc(len);
    expected.copy(e);
    received.copy(r);

    if (!crypto.timingSafeEqual(e, r)) {
      return res.status(401).json({ success: false, message: 'Invalid webhook token' });
    }
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid webhook token' });
  }

  next();
}

module.exports = { verifyBrevoWebhook };
