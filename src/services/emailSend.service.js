const { EmailSend, Preconfiguration, EmailTemplate, Sender, Prospect } = require('../models');
const { AppError } = require('../utils/errors');
const brevoService = require('./brevo.service');
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
      if (to_date) where.sent_at[Op.lte] = new Date(to_date);
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
      brevo_message_id: brevo_message_id || null,
      error_message: error_message || null
    });
  }

  /**
   * Ejecutar el envío de una preconfiguración: envía el correo y guarda la hora del envío.
   * Pensado para ser llamado por un cron/job o manualmente (ej. endpoint de prueba).
   */
  async executePreconfiguration(preconfigurationId) {
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

    try {
      const result = await brevoService.sendTransactionalEmail({
        sender: { name: sender.name, email: sender.email },
        to: [{ email: prospect.email, name: prospect.name || prospect.email }],
        subject,
        htmlContent,
        textContent,
        replyTo: sender.reply_to || undefined
      });

      const sentAt = new Date();
      await this.createRecord({
        preconfiguration_id: preconfig.id,
        template_id: template.id,
        sender_id: sender.id,
        prospect_id: prospect.id,
        sent_at: sentAt,
        status: 'sent',
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
        error_message: error.message || String(error)
      }).catch(() => {});

      throw error;
    }
  }
}

module.exports = new EmailSendService();
