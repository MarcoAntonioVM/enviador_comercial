const { Prospect, Sector } = require('../models');
const { AppError } = require('../utils/errors');
const { Op } = require('sequelize');

class ProspectService {
  async getAllProspects(filters = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      sector_id,
      consent_status,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;
    const where = { deleted_at: null };

    if (status) where.status = status;
    if (sector_id) where.sector_id = sector_id;
    if (consent_status) where.consent_status = consent_status;

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Prospect.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
      include: [{ model: Sector, as: 'sector', attributes: ['id', 'name'] }]
    });

    return {
      prospects: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit) }
    };
  }

  async getProspectById(id) {
    const prospect = await Prospect.findOne({
      where: { id, deleted_at: null },
      include: [{ model: Sector, as: 'sector' }]
    });

    if (!prospect) {
      throw new AppError('Prospect not found', 404);
    }

    return prospect;
  }

  async createProspect(data) {
    const { email } = data;

    const existing = await Prospect.findOne({ where: { email } });
    if (existing && !existing.deleted_at) {
      throw new AppError('Prospect with this email already exists', 409);
    }

    const prospect = await Prospect.create(data);
    return prospect;
  }

  async updateProspect(id, data) {
    const prospect = await this.getProspectById(id);

    if (data.email && data.email !== prospect.email) {
      const existing = await Prospect.findOne({ where: { email: data.email } });
      if (existing && existing.id !== id) {
        throw new AppError('Email already in use', 409);
      }
    }

    await prospect.update(data);
    return prospect;
  }

  async deleteProspect(id) {
    const prospect = await this.getProspectById(id);
    await prospect.update({ deleted_at: new Date() });
    return { message: 'Prospect deleted successfully' };
  }

  async bulkImport(prospects) {
    const results = { created: 0, updated: 0, errors: [] };

    for (const prospectData of prospects) {
      try {
        const existing = await Prospect.findOne({ where: { email: prospectData.email } });
        
        if (existing) {
          await existing.update(prospectData);
          results.updated++;
        } else {
          await Prospect.create(prospectData);
          results.created++;
        }
      } catch (error) {
        results.errors.push({ email: prospectData.email, error: error.message });
      }
    }

    return results;
  }

  async unsubscribe(email) {
    const prospect = await Prospect.findOne({ where: { email } });
    if (!prospect) {
      throw new AppError('Prospect not found', 404);
    }

    await prospect.update({
      status: 'unsubscribed',
      consent_status: 'revoked',
      unsubscribed_at: new Date()
    });

    return { message: 'Unsubscribed successfully' };
  }
}

module.exports = new ProspectService();
