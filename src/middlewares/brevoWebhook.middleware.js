const crypto = require('crypto');

/**
 * Token enviado por Brevo según configuración del webhook:
 * - Método "Token" en el panel: Authorization: Bearer <token>
 * - Otros: x-sib-webhook-secret / x-brevo-webhook-token (valor literal)
 *
 * Valor esperado en servidor: BREVO_WEBHOOK_TOKEN (mismo string que en Brevo).
 */
function extractIncomingWebhookToken(req) {
  const auth = req.headers.authorization;
  if (auth && typeof auth === 'string') {
    const bearer = auth.match(/^Bearer\s+(.+)$/i);
    if (bearer) return bearer[1].trim();
    const tokenScheme = auth.match(/^Token\s+(.+)$/i);
    if (tokenScheme) return tokenScheme[1].trim();
  }
  return (
    req.headers['x-brevo-webhook-token'] ||
    req.headers['x-sib-webhook-secret'] ||
    req.headers['x-brevo-signature'] ||
    null
  );
}

function verifyBrevoWebhook(req, res, next) {
  const secret =
    process.env.BREVO_WEBHOOK_TOKEN || process.env.BREVO_WEBHOOK_SECRET;
  const secretSet = secret != null && String(secret).trim() !== '';

  if (!secretSet) {
    return next();
  }

  const token = extractIncomingWebhookToken(req);

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
