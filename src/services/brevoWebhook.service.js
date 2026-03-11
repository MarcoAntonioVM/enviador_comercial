const { EmailSend } = require('../models');
const { Op } = require('sequelize');

/**
 * Mapeo de eventos Brevo a columnas de email_sends.
 * Brevo envía: delivered, opened, click, soft_bounce, hard_bounce, spam, unsubscribed, etc.
 */
const EVENT_TO_COLUMN = {
  delivered: 'delivered_at',
  opened: 'opened_at',
  click: 'clicked_at',
  soft_bounce: { column: 'bounced_at', bounce_type: 'soft_bounce' },
  hard_bounce: { column: 'bounced_at', bounce_type: 'hard_bounce' },
  spam: 'spam_reported_at',
  unsubscribed: 'unsubscribed_at'
};

/**
 * Extrae el message-id del payload (Brevo puede enviar message-id o messageId).
 */
function getMessageId(payload) {
  const raw = payload['message-id'] ?? payload.messageId ?? payload.message_id ?? null;
  if (raw == null) return null;
  const s = String(raw).trim();
  return s.replace(/^<|>$/g, '');
}

/**
 * Extrae la fecha del evento (ts_epoch ms, ts segundos, o date string).
 */
function getEventDate(payload) {
  if (payload.ts_epoch != null) {
    return new Date(Number(payload.ts_epoch));
  }
  if (payload.ts_event != null || payload.ts != null) {
    const sec = Number(payload.ts_event ?? payload.ts);
    return new Date(sec * 1000);
  }
  if (payload.date) {
    const d = new Date(payload.date);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

/**
 * Procesa un evento de webhook de Brevo y actualiza el registro en email_sends si existe.
 * @param {Object} payload - Cuerpo del webhook (event, message-id, email, etc.)
 * @returns {{ updated: boolean, emailSendId?: number, event?: string }}
 */
async function processWebhookEvent(payload) {
  const event = (payload.event || '').toLowerCase().trim();
  const messageId = getMessageId(payload);
  const eventDate = getEventDate(payload);

  if (!event) {
    return { updated: false, reason: 'missing event' };
  }

  if (!messageId) {
    return { updated: false, reason: 'missing message-id' };
  }

  const mapping = EVENT_TO_COLUMN[event];
  if (!mapping) {
    return { updated: false, reason: 'unknown event', event };
  }

  const record = await EmailSend.findOne({
    where: {
      [Op.or]: [
        { brevo_message_id: messageId },
        { brevo_message_id: { [Op.like]: `%${messageId}%` } }
      ]
    }
  });

  if (!record) {
    return { updated: false, reason: 'email_send not found', messageId };
  }

  const update = {};
  if (typeof mapping === 'string') {
    if (!record[mapping]) update[mapping] = eventDate;
  } else {
    if (!record[mapping.column]) update[mapping.column] = eventDate;
    if (mapping.bounce_type != null) update.bounce_type = mapping.bounce_type;
  }

  if (Object.keys(update).length === 0) {
    return { updated: false, emailSendId: record.id, event, reason: 'already set' };
  }

  await record.update(update);
  return { updated: true, emailSendId: record.id, event };
}

/**
 * Procesa el payload completo del webhook.
 * Brevo puede enviar un solo evento o un array en alguna propiedad.
 */
async function handleWebhookPayload(body) {
  const results = [];
  const items = Array.isArray(body) ? body : (body.events ? body.events : [body]);

  for (const item of items) {
    if (item && typeof item === 'object') {
      const result = await processWebhookEvent(item);
      results.push(result);
    }
  }

  return results;
}

module.exports = {
  processWebhookEvent,
  handleWebhookPayload,
  getMessageId,
  getEventDate
};
