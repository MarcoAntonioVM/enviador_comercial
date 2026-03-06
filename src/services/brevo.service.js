const https = require('https');
const nodemailer = require('nodemailer');
const { AppError } = require('../utils/errors');

const BREVO_API_URL = 'api.brevo.com';
const BREVO_SMTP_PATH = '/v3/smtp/email';

/**
 * Servicio Brevo: envío por SMTP (BREVO_HOST, USER, PASS) o por REST API (BREVO_API_KEY).
 * SMTP: https://developers.brevo.com/docs/smtp-integration
 * REST: https://developers.brevo.com/docs/send-a-transactional-email
 */
class BrevoService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.defaultSenderEmail = process.env.BREVO_EMAIL || process.env.BREVO_DEFAULT_SENDER_EMAIL || null;
    this.defaultSenderName = process.env.BREVO_DEFAULT_SENDER_NAME || 'Enviador Comercial';

    this.smtpHost = process.env.BREVO_HOST;
    this.smtpPort = parseInt(process.env.BREVO_PORT, 10) || 587;
    this.smtpSecure = process.env.BREVO_SECURE === 'true';
    this.smtpUser = process.env.BREVO_USER;
    this.smtpPass = process.env.BREVO_PASS;

    this._transport = null;
  }

  _isSmtpConfigured() {
    return !!(this.smtpHost && this.smtpUser && this.smtpPass);
  }

  _getTransport() {
    if (this._transport) return this._transport;
    if (!this._isSmtpConfigured()) {
      throw new AppError('Brevo SMTP not configured. Set BREVO_HOST, BREVO_USER, BREVO_PASS in .env', 503);
    }
    this._transport = nodemailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpSecure,
      auth: {
        user: this.smtpUser,
        pass: this.smtpPass
      }
    });
    return this._transport;
  }

  _getApiKey() {
    if (!this.apiKey || !this.apiKey.trim()) {
      throw new AppError('BREVO_API_KEY is not configured. Set it in .env', 503);
    }
    return this.apiKey.trim();
  }

  /**
   * Envía un email transaccional (SMTP o REST según configuración).
   * @param {Object} options
   * @param {{ name: string, email: string }} options.sender - Remitente (o usar defaults de .env)
   * @param {{ email: string, name?: string }[]} options.to - Lista de destinatarios
   * @param {string} options.subject - Asunto
   * @param {string} [options.htmlContent] - Cuerpo HTML
   * @param {string} [options.textContent] - Cuerpo texto plano (opcional)
   * @param {string} [options.replyTo] - Reply-To (opcional)
   * @returns {Promise<{ messageId: string }>}
   */
  async sendTransactionalEmail(options) {
    const { sender, to, subject, htmlContent, textContent, replyTo } = options;

    const senderEmail = sender?.email || this.defaultSenderEmail;
    const senderName = sender?.name || this.defaultSenderName;

    if (!senderEmail) {
      throw new AppError('Sender email is required. Set BREVO_EMAIL (or BREVO_DEFAULT_SENDER_EMAIL) in .env or pass sender.', 400);
    }

    if (!to || !Array.isArray(to) || to.length === 0) {
      throw new AppError('At least one recipient (to) is required', 400);
    }

    if (!subject || typeof subject !== 'string') {
      throw new AppError('Subject is required', 400);
    }

    if (!htmlContent && !textContent) {
      throw new AppError('Either htmlContent or textContent is required', 400);
    }

    if (this._isSmtpConfigured()) {
      return this._sendViaSmtp({
        senderEmail,
        senderName,
        to,
        subject,
        htmlContent,
        textContent,
        replyTo
      });
    }

    if (this.apiKey && this.apiKey.trim()) {
      return this._sendViaRest({ senderEmail, senderName, to, subject, htmlContent, textContent, replyTo });
    }

    throw new AppError(
      'Brevo not configured. Set SMTP (BREVO_HOST, BREVO_USER, BREVO_PASS, BREVO_EMAIL) or BREVO_API_KEY in .env',
      503
    );
  }

  async _sendViaSmtp({ senderEmail, senderName, to, subject, htmlContent, textContent, replyTo }) {
    const transport = this._getTransport();
    const mailOptions = {
      from: senderName ? `"${senderName}" <${senderEmail}>` : senderEmail,
      to: to.map(t => (t.name ? `"${t.name}" <${t.email}>` : t.email)).join(', '),
      subject: String(subject).trim(),
      ...(htmlContent && { html: String(htmlContent) }),
      ...(textContent && { text: String(textContent) }),
      ...(replyTo && replyTo.trim() && { replyTo: replyTo.trim() })
    };

    const info = await transport.sendMail(mailOptions);
    return { messageId: info.messageId || info.response || 'ok' };
  }

  _sendViaRest({ senderEmail, senderName, to, subject, htmlContent, textContent, replyTo }) {
    const body = {
      sender: { name: senderName, email: senderEmail },
      to: to.map(t => ({
        email: t.email,
        name: t.name || t.email
      })),
      subject: String(subject).trim(),
      ...(htmlContent && { htmlContent: String(htmlContent) }),
      ...(textContent && { textContent: String(textContent) }),
      ...(replyTo && replyTo.trim() && { replyTo: { email: replyTo.trim() } })
    };

    return this._post(BREVO_SMTP_PATH, body);
  }

  _post(path, data) {
    const apiKey = this._getApiKey();
    const payload = JSON.stringify(data);

    const options = {
      hostname: BREVO_API_URL,
      path,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
        'Content-Length': Buffer.byteLength(payload, 'utf8')
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let raw = '';
        res.on('data', chunk => { raw += chunk; });
        res.on('end', () => {
          let json;
          try {
            json = raw ? JSON.parse(raw) : {};
          } catch {
            return reject(new AppError('Invalid response from Brevo API', 502));
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            return resolve({ messageId: json.messageId || 'ok' });
          }

          const message = json.message || json.code || 'Brevo API error';
          reject(new AppError(message, res.statusCode >= 500 ? 502 : res.statusCode));
        });
      });

      req.on('error', (err) => {
        reject(new AppError(`Brevo request failed: ${err.message}`, 502));
      });

      req.write(payload);
      req.end();
    });
  }
}

module.exports = new BrevoService();
