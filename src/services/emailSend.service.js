const { EmailSend, Preconfiguration, EmailTemplate, Sender, Prospect } = require('../models');
const { AppError } = require('../utils/errors');
const brevoService = require('./brevo.service');
const { getDayBoundsUtc } = require('../utils/preconfigurationSchedule');
const { DateTime } = require('luxon');
const { Op } = require('sequelize');

class EmailSendService {
  /**
   * Listar registros de envíos con filtros y paginación.
   */
  async getAll(filters = {}) {
    const {
      page = 1,
      limit = 10,
      preconfiguration_id,
      prospect_id,
      status,
      from_date,
      to_date,
      sortBy = 'sent_at',
      sortOrder = 'DESC'
    } = filters;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (preconfiguration_id) where.preconfiguration_id = preconfiguration_id;
    if (prospect_id) where.prospect_id = prospect_id;
    if (status) where.status = status;

    if (from_date || to_date) {
      where.sent_at = {};
      if (from_date) where.sent_at[Op.gte] = new Date(from_date);
      if (to_date) where.sent_at[Op.lte] = new Date(`${to_date}T23:59:59`);
    }

    const { count, rows } = await EmailSend.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        { model: Preconfiguration, as: 'preconfiguration', attributes: ['id', 'hour', 'days_week'] },
        { model: EmailTemplate, as: 'template', attributes: ['id', 'name', 'subject'] },
        { model: Sender, as: 'sender', attributes: ['id', 'name', 'email'] },
        { model: Prospect, as: 'prospect', attributes: ['id', 'name', 'email', 'company'] }
      ]
    });

    return {
      email_sends: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }

  /**
   * Obtener un registro de envío por ID.
   */
  async getById(id) {
    const record = await EmailSend.findByPk(id, {
      include: [
        { model: Preconfiguration, as: 'preconfiguration' },
        { model: EmailTemplate, as: 'template' },
        { model: Sender, as: 'sender' },
        { model: Prospect, as: 'prospect' }
      ]
    });

    if (!record) {
      throw new AppError('Email send record not found', 404);
    }

    return record;
  }

  /**
   * Crear registro de envío (usado tras enviar el correo).
   */
  async createRecord(data) {
    const {
      preconfiguration_id,
      template_id,
      sender_id,
      prospect_id,
      sent_at,
      status = 'sent',
      trigger_source = 'manual',
      brevo_message_id,
      error_message
    } = data;

    return await EmailSend.create({
      preconfiguration_id,
      template_id,
      sender_id,
      prospect_id,
      sent_at: sent_at || new Date(),
      status,
      trigger_source,
      brevo_message_id: brevo_message_id || null,
      error_message: error_message || null
    });
  }

  /**
   * True si ya hubo un envío automático (scheduled) hoy en la zona indicada.
   * Los envíos manuales no bloquean el cron.
   */
  async hasScheduledSendToday(preconfigurationId, timeZone) {
    const tz = timeZone || process.env.SCHEDULER_TIMEZONE || 'UTC';
    const { start, end } = getDayBoundsUtc(tz, DateTime.now());
    const count = await EmailSend.count({
      where: {
        preconfiguration_id: preconfigurationId,
        trigger_source: 'scheduled',
        sent_at: { [Op.between]: [start, end] }
      }
    });
    return count > 0;
  }

  /**
   * Envío por job: anti-duplicado solo frente a otros scheduled del mismo día (misma TZ).
   */
  async executeScheduledPreconfiguration(preconfigurationId, timeZone) {
    const tz = timeZone || process.env.SCHEDULER_TIMEZONE || 'UTC';
    if (await this.hasScheduledSendToday(preconfigurationId, tz)) {
      return { skipped: true, reason: 'already_sent_today' };
    }
    return this.executePreconfiguration(preconfigurationId, { triggerSource: 'scheduled' });
  }

  /**
   * Estadísticas generales de email_sends con filtros opcionales.
   */
  async getStats(filters = {}) {
    const { preconfiguration_id, prospect_id, from_date, to_date } = filters;

    const where = {};
    if (preconfiguration_id) where.preconfiguration_id = preconfiguration_id;
    if (prospect_id) where.prospect_id = prospect_id;
    if (from_date || to_date) {
      where.sent_at = {};
      if (from_date) where.sent_at[Op.gte] = new Date(from_date);
      if (to_date) where.sent_at[Op.lte] = new Date(`${to_date}T23:59:59`);
    }

    const total = await EmailSend.count({ where });

    // Conteos por estado y por columna de tracking
    const [delivered, opened, clicked, bounced, spam, unsubscribed] = await Promise.all([
      EmailSend.count({ where: { ...where, delivered_at: { [Op.ne]: null } } }),
      EmailSend.count({ where: { ...where, opened_at:    { [Op.ne]: null } } }),
      EmailSend.count({ where: { ...where, clicked_at:   { [Op.ne]: null } } }),
      EmailSend.count({ where: { ...where, bounced_at:   { [Op.ne]: null } } }),
      EmailSend.count({ where: { ...where, spam_reported_at: { [Op.ne]: null } } }),
      EmailSend.count({ where: { ...where, unsubscribed_at:  { [Op.ne]: null } } })
    ]);

    const failed  = await EmailSend.count({ where: { ...where, status: 'failed' } });

    const rate = (n) => total > 0 ? parseFloat(((n / total) * 100).toFixed(2)) : 0;

    return {
      total,
      delivered,
      opened,
      clicked,
      bounced,
      spam,
      unsubscribed,
      failed,
      rates: {
        delivered_rate:    rate(delivered),
        open_rate:         rate(opened),
        click_rate:        rate(clicked),
        bounce_rate:       rate(bounced),
        spam_rate:         rate(spam),
        unsubscribed_rate: rate(unsubscribed),
        failed_rate:       rate(failed)
      }
    };
  }

  /**
   * Ejecutar el envío de una preconfiguración: envía el correo y guarda la hora del envío.
   * Pensado para ser llamado por un cron/job o manualmente (ej. endpoint de prueba).
   */
  async executePreconfiguration(preconfigurationId, options = {}) {
    const triggerSource = options.triggerSource === 'scheduled' ? 'scheduled' : 'manual';
    const preconfig = await Preconfiguration.findByPk(preconfigurationId, {
      include: [
        { model: EmailTemplate, as: 'template' },
        { model: Sender, as: 'sender' },
        { model: Prospect, as: 'prospect' }
      ]
    });

    if (!preconfig) {
      throw new AppError('Preconfiguration not found', 404);
    }

    if (!preconfig.active) {
      throw new AppError('Preconfiguration is not active', 400);
    }

    const { template, sender, prospect } = preconfig;
    if (!template || !sender || !prospect) {
      throw new AppError('Preconfiguration is missing template, sender or prospect', 400);
    }

    if (!prospect.active) {
      throw new AppError('Prospect is not active', 400);
    }

    const subject = template.subject;
    const htmlContent = template.html_content || '';
    const textContent = (template.html_content || '').replace(/<[^>]*>/g, ' ').trim() || subject;

    const cc = Array.isArray(preconfig.cc) && preconfig.cc.length ? preconfig.cc : undefined;
    const bcc = Array.isArray(preconfig.bcc) && preconfig.bcc.length ? preconfig.bcc : undefined;

    try {
      const result = await brevoService.sendTransactionalEmail({
        sender: { name: sender.name, email: sender.email },
        to: [{ email: prospect.email, name: prospect.name || prospect.email }],
        subject,
        htmlContent,
        textContent,
        replyTo: sender.reply_to || undefined,
        ...(cc && { cc }),
        ...(bcc && { bcc })
      });

      const sentAt = new Date();
      await this.createRecord({
        preconfiguration_id: preconfig.id,
        template_id: template.id,
        sender_id: sender.id,
        prospect_id: prospect.id,
        sent_at: sentAt,
        status: 'sent',
        trigger_source: triggerSource,
        brevo_message_id: result?.messageId || null
      });

      return {
        success: true,
        sent_at: sentAt,
        message_id: result?.messageId,
        prospect_email: prospect.email
      };
    } catch (error) {
      const sentAt = new Date();
      await this.createRecord({
        preconfiguration_id: preconfig.id,
        template_id: template.id,
        sender_id: sender.id,
        prospect_id: prospect.id,
        sent_at: sentAt,
        status: 'failed',
        trigger_source: triggerSource,
        error_message: error.message || String(error)
      }).catch(() => {});

      throw error;
    }
  }

  /**
   * Series de tiempo: conteo de delivered, opened, clicked agrupado por día.
   * Filtros opcionales: preconfiguration_id, prospect_id, from_date, to_date
   */
  async getTimeSeries(filters = {}) {
    const { preconfiguration_id, prospect_id, from_date, to_date } = filters;
    const { sequelize } = EmailSend;

    const where = {};
    if (preconfiguration_id) where.preconfiguration_id = preconfiguration_id;
    if (prospect_id) where.prospect_id = prospect_id;
    if (from_date || to_date) {
      where.sent_at = {};
      if (from_date) where.sent_at[Op.gte] = new Date(from_date);
      if (to_date) where.sent_at[Op.lte] = new Date(`${to_date}T23:59:59`);
    }

    const rows = await EmailSend.findAll({
      where,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('sent_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'sent'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN delivered_at IS NOT NULL THEN 1 ELSE 0 END')), 'delivered'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END')), 'opened'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END')), 'clicked']
      ],
      group: [sequelize.fn('DATE', sequelize.col('sent_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('sent_at')), 'ASC']],
      raw: true
    });

    return rows.map(r => ({
      date: r.date,
      sent: parseInt(r.sent) || 0,
      delivered: parseInt(r.delivered) || 0,
      opened: parseInt(r.opened) || 0,
      clicked: parseInt(r.clicked) || 0
    }));
  }
}

module.exports = new EmailSendService();
