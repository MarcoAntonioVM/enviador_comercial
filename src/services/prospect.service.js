const { Prospect } = require('../models');
const { AppError } = require('../utils/errors');
const { Op } = require('sequelize');

class ProspectService {
  async getAllProspects(filters = {}) {
    const {
      page = 1,
      limit = 10,
      sector_name,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;
    const where = { active: true };

    if (sector_name) where.sector_name = sector_name;

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
      order: [[sortBy, sortOrder]]
    });

    return {
      prospects: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit) }
    };
  }

  async getProspectById(id) {
    const prospect = await Prospect.findOne({
      where: { id, active: true }
    });

    if (!prospect) {
      throw new AppError('Prospect not found', 404);
    }

    return prospect;
  }

  async createProspect(data, createdBy = null) {
    const { email } = data;

    const existing = await Prospect.findOne({ where: { email } });
    if (existing && existing.active) {
      throw new AppError('Prospect with this email already exists', 409);
    }

    return await Prospect.create({ ...data, created_by: createdBy });
  }

  async updateProspect(id, data) {
    const prospect = await this.getProspectById(id);

    if (data.email && data.email !== prospect.email) {
      const existing = await Prospect.findOne({ where: { email: data.email } });
      if (existing && existing.id !== id && existing.active) {
        throw new AppError('Email already in use', 409);
      }
    }

    await prospect.update(data);
    return prospect;
  }

  async deleteProspect(id) {
    const prospect = await this.getProspectById(id);
    await prospect.update({ active: false });
    return { message: 'Prospect deleted successfully' };
  }

  async reactivateProspect(id) {
    const prospect = await Prospect.findOne({ where: { id } });

    if (!prospect) {
      throw new AppError('Prospect not found', 404);
    }

    if (prospect.active) {
      throw new AppError('Prospect is already active', 400);
    }

    await prospect.update({ active: true });
    return { message: 'Prospect reactivated successfully' };
  }

  async bulkImport(prospects, createdBy = null) {
    const results = { created: 0, updated: 0, errors: [] };

    for (const prospectData of prospects) {
      try {
        const existing = await Prospect.findOne({ where: { email: prospectData.email } });

        if (existing) {
          await existing.update(prospectData);
          results.updated++;
        } else {
          await Prospect.create({ ...prospectData, created_by: createdBy });
          results.created++;
        }
      } catch (error) {
        results.errors.push({ email: prospectData.email, error: error.message });
      }
    }

    return results;
  }

  async unsubscribe(email) {
    const prospect = await Prospect.findOne({ where: { email, active: true } });
    if (!prospect) {
      throw new AppError('Prospect not found', 404);
    }

    await prospect.update({ active: false });
    return { message: 'Unsubscribed successfully' };
  }
}

module.exports = new ProspectService();
