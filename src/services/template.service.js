const { EmailTemplate, User } = require('../models');
const { AppError } = require('../utils/errors');

class TemplateService {

  async getAllTemplates(filters = {}) {
    const { active, created_by } = filters;
    const where = {};

    if (active !== undefined) where.active = active;
    if (created_by) where.created_by = created_by;

    const templates = await EmailTemplate.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    return templates;
  }

  async getTemplateById(id) {
    const template = await EmailTemplate.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    return template;
  }

  async createTemplate(data, userId) {
    if (!data.name || !data.subject) {
      throw new AppError('Name and subject are required', 400);
    }
    const template = await EmailTemplate.create({
      name: data.name,
      subject: data.subject,
      html_content: data.html_content,
      active: data.active ?? true,
      created_by: userId
    });

    return template;
  }

  async updateTemplate(id, data) {
    const template = await this.getTemplateById(id);

    await template.update({
      name: data.name ?? template.name,
      subject: data.subject ?? template.subject,
      html_content: data.html_content ?? template.html_content,
      active: data.active ?? template.active
    });

    return template;
  }

  async deleteTemplate(id) {
    const template = await this.getTemplateById(id);

    // Soft delete
    await template.update({ active: false });

    return {
      message: 'Template deactivated successfully'
    };
  }

  async reactivateTemplate(id) {
    const template = await this.getTemplateById(id);

    if (template.active) {
      throw new AppError('Template is already active', 400);
    }

    await template.update({ active: true });
    return { message: 'Template reactivated successfully' };
  }

  async duplicateTemplate(id, userId) {
    const original = await this.getTemplateById(id);

    const duplicate = await EmailTemplate.create({
      name: `${original.name} (Copy)`,
      subject: original.subject,
      html_content: original.html_content,
      active: original.active,
      created_by: userId
    });

    return duplicate;
  }
}

module.exports = new TemplateService();
