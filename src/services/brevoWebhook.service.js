const { BrevoClient } = require('@getbrevo/brevo');
const { EmailSend } = require('../models');
const { Op } = require('sequelize');

const brevoClient = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });
const transactionalEmails = brevoClient.transactionalEmails;

/**
 * ENVIAR CORREO Y REGISTRAR 
 */
async function sendEmail({ to, subject, htmlContent, templateId, params }) {
  try {
    const payload = {
      subject,
      to: [{ email: to }],
      sender: { 
        name: process.env.BREVO_DEFAULT_SENDER_NAME || 'Enviador Comercial', 
        email: process.env.BREVO_DEFAULT_SENDER_EMAIL 
      },
      ...(templateId ? { templateId } : { htmlContent }),
      params: params || {}
    };

    const data = await transactionalEmails.sendTransacEmail(payload);
    const messageId = (data.messageId || '').replace(/^<|>$/g, '');

    await EmailSend.create({
      brevo_message_id: messageId,
      sent_at: new Date()
    });

    return data;
  } catch (error) {
    console.error('Error enviando correo:', error);
    throw error;
  }
}

/**
 * CONSULTAR EVENTOS MANUALMENTE
 */
async function syncEmailStatus(brevoMessageId) {
  try {
    const response = await transactionalEmails.getTransacEmailsReport({
      messageId: brevoMessageId
    });

    const reports = response.reports || [];
    const results = [];

    for (const report of reports) {
      const payload = {
        event: report.event,
        'message-id': brevoMessageId,
        date: report.date,
        email: report.email,
        ts_event: report.date ? Math.floor(new Date(report.date).getTime() / 1000) : null
      };

      const res = await processWebhookEvent(payload);
      results.push(res);
    }

    return { success: true, processed: results };
  } catch (error) {
    console.error(`Error sincronizando mensaje ${brevoMessageId}:`, error);
    throw error;
  }
}

/**
 * Mapeo extendido basado en la documentación de Brevo
 */
const EVENT_COLUMN_MAP = {
  // Éxito
  request:       'sent_at',
  requests:      'sent_at',
  delivered:     'delivered_at',

  // Aperturas y Clics
  //opened:        'opened_at',
  unique_opened: 'opened_at',
  //loadedByProxy: 'opened_at', // Proxy Open (Apple Mail)
  click:         'clicked_at',
  clicks:        'clicked_at',

  // Rebotes y Errores
  soft_bounce:   'bounced_at',
  softBounces:   'bounced_at',
  hard_bounce:   'bounced_at',
  hardBounces:   'bounced_at',
  invalid:       'bounced_at', // Email inválido
  deferred:      'bounced_at', // Retrasado
  blocked:       'bounced_at', // Bloqueado por Brevo
  error:         'bounced_at',

  // Quejas y Bajas
  spam:          'spam_reported_at',
  complaint:     'spam_reported_at',
  unsubscribed:  'unsubscribed_at'
};

function extractMessageId(payload) {
  const raw = payload['message-id'] || payload['messageId'] || null;
  return raw ? raw.replace(/^<|>$/g, '').trim() : null;
}

/**
 * Procesa un evento individual
 */
async function processWebhookEvent(payload) {
  const event = payload.event;
  const messageId = extractMessageId(payload);
  const column = EVENT_COLUMN_MAP[event];

  if (!column || !messageId) {
    return { skipped: true, event, reason: 'unknown event or missing message-id' };
  }

  const record = await EmailSend.findOne({
    where: {
      [Op.or]: [
        { brevo_message_id: messageId },
        { brevo_message_id: `<${messageId}>` },
        { brevo_message_id: { [Op.like]: `%${messageId}%` } }
      ]
    }
  });

  if (!record) {
    return { skipped: true, event, messageId, reason: 'record not found' };
  }

  const eventDate = payload.ts_event
    ? new Date(payload.ts_event * 1000)
    : payload.ts
      ? new Date(payload.ts * 1000)
      : payload.date
        ? new Date(payload.date)
        : new Date();

  const finalDate = isNaN(eventDate.getTime()) ? new Date() : eventDate;
  const updateData = { [column]: finalDate };

  // --- Lógica de estados actualizada ---
  if (event === 'delivered') {
    updateData.status = 'delivered';
  } else if (['soft_bounce', 'hard_bounce', 'softBounces', 'hardBounces', 'invalid', 'blocked', 'error'].includes(event)) {
    updateData.status = 'bounced';
  } else if (event === 'spam' || event === 'complaint') {
    updateData.status = 'spam';
  } else if (event === 'unsubscribed') {
    updateData.status = 'unsubscribed';
  }

  await record.update(updateData);
  return { updated: true, event, messageId, id: record.id };
}

async function handleWebhookPayload(body) {
  const events = Array.isArray(body) ? body : [body];
  const results = [];
  for (const event of events) {
    try {
      const result = await processWebhookEvent(event);
      results.push(result);
    } catch (err) {
      results.push({ error: err.message, event: event.event, messageId: extractMessageId(event) });
    }
  }
  return results;
}

module.exports = {
  sendEmail,
  syncEmailStatus,
  processWebhookEvent,
  handleWebhookPayload
};