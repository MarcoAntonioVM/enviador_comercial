const { Sender } = require('../models');
const { AppError } = require('../utils/errors');

class SenderService {
  async getAllSenders() {
    const senders = await Sender.findAll({
      order: [['created_at', 'DESC']]
    });

    return senders;
  }

  async getSenderById(id) {
    const sender = await Sender.findByPk(id);

    if (!sender) {
      throw new AppError('Sender not found', 404);
    }

    return sender;
  }

  async createSender(data) {
    const { email } = data;

    // Validación adicional
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const existing = await Sender.findOne({ where: { email } });
    if (existing) {
      throw new AppError('Sender with this email already exists', 409);
    }

    const sender = await Sender.create(data);
    return sender;
  }

  async updateSender(id, data) {
    const sender = await this.getSenderById(id);

    if (data.email && data.email !== sender.email) {
      const existing = await Sender.findOne({ where: { email: data.email } });
      if (existing && existing.id !== id) {
        throw new AppError('Email already in use', 409);
      }
    }

    await sender.update(data);
    return sender;
  }

  async deleteSender(id) {
    const sender = await this.getSenderById(id);

    // Check if sender is used in campaigns
    const { Campaign } = require('../models');
    const campaignCount = await Campaign.count({ where: { sender_id: id } });
    
    if (campaignCount > 0) {
      throw new AppError('Cannot delete sender that is used in campaigns', 400);
    }

    await sender.destroy();
    return { message: 'Sender deleted successfully' };
  }

  async getDefaultSender() {
    const sender = await Sender.findOne({ where: { is_default: true } });

    if (!sender) {
      throw new AppError('No default sender found', 404);
    }

    return sender;
  }

  async setDefaultSender(id) {
    const sender = await this.getSenderById(id);

    // Remove default from all others
    await Sender.update({ is_default: false }, { where: {} });

    // Set this one as default
    await sender.update({ is_default: true });

    return sender;
  }

  async checkDailyLimit(senderId) {
    const { EmailSend } = require('../models');
    const sender = await this.getSenderById(senderId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sentToday = await EmailSend.count({
      where: {
        sender_id: senderId,
        sent_at: { [require('sequelize').Op.gte]: today }
      }
    });

    return {
      daily_limit: sender.daily_limit,
      sent_today: sentToday,
      remaining: sender.daily_limit - sentToday,
      can_send: sentToday < sender.daily_limit
    };
  }

  // ============================================
  // OPERACIONES MASIVAS (BULK)
  // ============================================

  /**
   * Crear múltiples senders a la vez
   * @param {Array} sendersData - Array de objetos con datos de senders
   * @returns {Object} Resultado con senders creados y errores
   */
  async bulkCreateSenders(sendersData) {
    const results = {
      created: [],
      errors: [],
      summary: {
        total: sendersData.length,
        successful: 0,
        failed: 0
      }
    };

    for (let i = 0; i < sendersData.length; i++) {
      const senderData = sendersData[i];
      
      try {
        // Validar que el email no exista
        const existing = await Sender.findOne({ where: { email: senderData.email } });
        
        if (existing) {
          results.errors.push({
            index: i,
            email: senderData.email,
            error: 'Email already exists'
          });
          results.summary.failed++;
          continue;
        }

        // Crear el sender
        const sender = await Sender.create(senderData);
        results.created.push(sender);
        results.summary.successful++;

      } catch (error) {
        results.errors.push({
          index: i,
          email: senderData.email,
          error: error.message
        });
        results.summary.failed++;
      }
    }

    return results;
  }

  /**
   * Actualizar múltiples senders a la vez
   * @param {Array} updates - Array de objetos con {id, data}
   * @returns {Object} Resultado con senders actualizados y errores
   */
  async bulkUpdateSenders(updates) {
    const results = {
      updated: [],
      errors: [],
      summary: {
        total: updates.length,
        successful: 0,
        failed: 0
      }
    };

    for (let i = 0; i < updates.length; i++) {
      const { id, ...data } = updates[i];
      
      try {
        // Buscar el sender
        const sender = await Sender.findByPk(id);
        
        if (!sender) {
          results.errors.push({
            index: i,
            id: id,
            error: 'Sender not found'
          });
          results.summary.failed++;
          continue;
        }

        // Validar email si se está actualizando
        if (data.email && data.email !== sender.email) {
          const existing = await Sender.findOne({ where: { email: data.email } });
          if (existing && existing.id !== id) {
            results.errors.push({
              index: i,
              id: id,
              error: 'Email already in use'
            });
            results.summary.failed++;
            continue;
          }
        }

        // Actualizar el sender
        await sender.update(data);
        results.updated.push(sender);
        results.summary.successful++;

      } catch (error) {
        results.errors.push({
          index: i,
          id: id,
          error: error.message
        });
        results.summary.failed++;
      }
    }

    return results;
  }

  /**
   * Eliminar múltiples senders a la vez
   * @param {Array} ids - Array de IDs a eliminar
   * @returns {Object} Resultado con senders eliminados y errores
   */
  async bulkDeleteSenders(ids) {
    const { Campaign } = require('../models');
    const results = {
      deleted: [],
      errors: [],
      summary: {
        total: ids.length,
        successful: 0,
        failed: 0
      }
    };

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      
      try {
        // Buscar el sender
        const sender = await Sender.findByPk(id);
        
        if (!sender) {
          results.errors.push({
            index: i,
            id: id,
            error: 'Sender not found'
          });
          results.summary.failed++;
          continue;
        }

        // Verificar que no esté usado en campañas
        const campaignCount = await Campaign.count({ where: { sender_id: id } });
        
        if (campaignCount > 0) {
          results.errors.push({
            index: i,
            id: id,
            error: `Cannot delete sender used in ${campaignCount} campaign(s)`
          });
          results.summary.failed++;
          continue;
        }

        // Eliminar el sender
        await sender.destroy();
        results.deleted.push({ id, email: sender.email, name: sender.name });
        results.summary.successful++;

      } catch (error) {
        results.errors.push({
          index: i,
          id: id,
          error: error.message
        });
        results.summary.failed++;
      }
    }

    return results;
  }
}

module.exports = new SenderService();
