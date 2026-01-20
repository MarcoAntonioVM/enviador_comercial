const { EmailTemplate, Sector, User } = require('../models');
const { AppError } = require('../utils/errors');

class TemplateService {
  async getAllTemplates(filters = {}) {
    const { sector_id, active, created_by } = filters;
    const where = {};

    if (sector_id) where.sector_id = sector_id;
    if (active !== undefined) where.active = active;
    if (created_by) where.created_by = created_by;

    const templates = await EmailTemplate.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        { model: Sector, as: 'sector', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ]
    });

    return templates;
  }

  async getTemplateById(id) {
    const template = await EmailTemplate.findByPk(id, {
      include: [
        { model: Sector, as: 'sector' },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    return template;
  }

  async createTemplate(data, userId) {
    const template = await EmailTemplate.create({
      ...data,
      created_by: userId
    });

    return template;
  }

  async updateTemplate(id, data) {
    const template = await this.getTemplateById(id);
    await template.update(data);
    return template;
  }

  async deleteTemplate(id) {
    const template = await this.getTemplateById(id);

    // Check if template is used in campaigns
    const { Campaign } = require('../models');
    const campaignCount = await Campaign.count({ where: { template_id: id } });
    
    if (campaignCount > 0) {
      throw new AppError('Cannot delete template that is used in campaigns', 400);
    }

    await template.destroy();
    return { message: 'Template deleted successfully' };
  }

  async duplicateTemplate(id, userId) {
    const originalTemplate = await this.getTemplateById(id);

    const duplicateData = {
      name: `${originalTemplate.name} (Copy)`,
      sector_id: originalTemplate.sector_id,
      subject: originalTemplate.subject,
      html_content: originalTemplate.html_content,
      text_content: originalTemplate.text_content,
      variables: originalTemplate.variables,
      is_default: false,
      active: originalTemplate.active,
      created_by: userId
    };

    const duplicate = await EmailTemplate.create(duplicateData);
    return duplicate;
  }

  async getDefaultTemplate(sectorId = null) {
    const where = { is_default: true, active: true };
    if (sectorId) where.sector_id = sectorId;

    const template = await EmailTemplate.findOne({ where });

    if (!template) {
      throw new AppError('No default template found', 404);
    }

    return template;
  }
}

module.exports = new TemplateService();
