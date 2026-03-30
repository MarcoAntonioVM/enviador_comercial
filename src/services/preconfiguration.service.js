const { Preconfiguration, EmailTemplate, Sender, Prospect } = require('../models');
const { AppError } = require('../utils/errors');
const { VALID_DAYS } = require('../utils/preconfigurationSchedule');

class PreconfigurationService {

  async getAll(filters = {}) {
    const {
      page = 1,
      limit = 10,
      active,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (active === undefined) {
      where.active = true;
    } else {
      where.active = active === 'true' || active === true;
    }

    const { count, rows } = await Preconfiguration.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        { model: EmailTemplate, as: 'template', attributes: ['id', 'name', 'subject'] },
        { model: Sender, as: 'sender', attributes: ['id', 'name', 'email'] },
        { model: Prospect, as: 'prospect', attributes: ['id', 'name', 'email', 'company', 'sector_name'] }
      ]
    });

    return {
      preconfigurations: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }

  async getById(id) {
    const preconfig = await Preconfiguration.findByPk(id, {
      include: [
        { model: EmailTemplate, as: 'template', attributes: ['id', 'name', 'subject'] },
        { model: Sender, as: 'sender', attributes: ['id', 'name', 'email'] },
        { model: Prospect, as: 'prospect', attributes: ['id', 'name', 'email', 'company', 'sector_name'] }
      ]
    });

    if (!preconfig) {
      throw new AppError('Preconfiguration not found', 404);
    }

    return preconfig;
  }

  async create(data) {
    const { template_id, sender_id, prospect_id, days_week, hour, cc, bcc } = data;

    // Validate days_week values
    if (!Array.isArray(days_week) || days_week.length === 0) {
      throw new AppError('days_week must be a non-empty array', 400);
    }
    const invalid = days_week.filter(d => !VALID_DAYS.includes(d));
    if (invalid.length > 0) {
      throw new AppError(`Invalid days: ${invalid.join(', ')}. Valid values: ${VALID_DAYS.join(', ')}`, 400);
    }

    // Validate hour format HH:MM
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hour)) {
      throw new AppError('hour must be in HH:MM format (e.g. 09:00)', 400);
    }

    const preconfig = await Preconfiguration.create({
      template_id,
      sender_id,
      prospect_id,
      days_week,
      hour,
      cc: cc ?? null,
      bcc: bcc ?? null,
      active: true
    });

    return this.getById(preconfig.id);
  }

  async update(id, data) {
    const preconfig = await Preconfiguration.findByPk(id);

    if (!preconfig) {
      throw new AppError('Preconfiguration not found', 404);
    }

    const { template_id, sender_id, prospect_id, days_week, hour, active, cc, bcc } = data;
    const updateData = {};

    if (template_id !== undefined) updateData.template_id = template_id;
    if (sender_id !== undefined) updateData.sender_id = sender_id;
    if (prospect_id !== undefined) updateData.prospect_id = prospect_id;
    if (active !== undefined) updateData.active = active;
    if (cc !== undefined) updateData.cc = cc;
    if (bcc !== undefined) updateData.bcc = bcc;

    if (days_week !== undefined) {
      if (!Array.isArray(days_week) || days_week.length === 0) {
        throw new AppError('days_week must be a non-empty array', 400);
      }
      const invalid = days_week.filter(d => !VALID_DAYS.includes(d));
      if (invalid.length > 0) {
        throw new AppError(`Invalid days: ${invalid.join(', ')}`, 400);
      }
      updateData.days_week = days_week;
    }

    if (hour !== undefined) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hour)) {
        throw new AppError('hour must be in HH:MM format (e.g. 09:00)', 400);
      }
      updateData.hour = hour;
    }

    await preconfig.update(updateData);
    return this.getById(id);
  }

  async delete(id) {
    const preconfig = await Preconfiguration.findByPk(id);

    if (!preconfig) {
      throw new AppError('Preconfiguration not found', 404);
    }

    await preconfig.destroy();
    return { id: parseInt(id) };
  }

  /**
   * Listado ligero para el job programado (solo filas activas).
   */
  async findAllActiveForScheduler() {
    return Preconfiguration.findAll({
      where: { active: true },
      attributes: ['id', 'days_week', 'hour', 'active']
    });
  }
}

module.exports = new PreconfigurationService();
