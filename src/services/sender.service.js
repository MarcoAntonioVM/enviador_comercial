const { Sender } = require('../models');
const { AppError } = require('../utils/errors');

class SenderService {

  // =========================
  // CRUD BÁSICO
  // =========================

  async getAllSenders() {
    return await Sender.findAll({
      where: { active: true },
      order: [['created_at', 'DESC']]
    });
  }

  async getSenderById(id) {
    const sender = await Sender.findOne({
      where: { id, active: true }
    });

    if (!sender) {
      throw new AppError('Sender not found', 404);
    }

    return sender;
  }

  async createSender(data, createdBy = null) {
    const { email } = data;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const existing = await Sender.findOne({ where: { email } });
    if (existing && existing.active) {
      throw new AppError('Sender with this email already exists', 409);
    }

    return await Sender.create({ ...data, created_by: createdBy });
  }

  async updateSender(id, data) {
    const sender = await this.getSenderById(id);

    if (data.email && data.email !== sender.email) {
      const existing = await Sender.findOne({
        where: { email: data.email }
      });

      if (existing && existing.id !== id && existing.active) {
        throw new AppError('Email already in use', 409);
      }
    }

    await sender.update(data);
    return sender;
  }

  async deleteSender(id) {
    const sender = await this.getSenderById(id);
    await sender.update({ active: false });
    return {
      message: 'Sender deleted successfully'
    };
  }

  async reactivateSender(id) {
    const sender = await Sender.findByPk(id);

    if (!sender) {
      throw new AppError('Sender not found', 404);
    }

    if (sender.active) {
      throw new AppError('Sender is already active', 400);
    }

    await sender.update({ active: true });
    return { message: 'Sender reactivated successfully' };
  }

  async getDefaultSender() {
    const sender = await Sender.findOne({
      where: { active: true },
      order: [['id', 'ASC']]
    });
    return sender;
  }

  async setDefaultSender(id) {
    return await this.getSenderById(id);
  }

  // =========================
  // LÍMITE DIARIO (TEMPORAL)
  // =========================

  async checkDailyLimit(senderId) {
    const sender = await this.getSenderById(senderId);

    // No existe aún tabla de envíos
    return {
      daily_limit: sender.daily_limit,
      sent_today: 0,
      remaining: sender.daily_limit,
      can_send: true
    };
  }

  // =========================
  // OPERACIONES MASIVAS
  // =========================

  async bulkCreateSenders(sendersData, createdBy = null) {
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
        const existing = await Sender.findOne({
          where: { email: senderData.email }
        });

        if (existing && existing.active) {
          results.errors.push({
            index: i,
            email: senderData.email,
            error: 'Email already exists'
          });
          results.summary.failed++;
          continue;
        }

        const sender = await Sender.create({ ...senderData, created_by: createdBy });
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
        const sender = await Sender.findOne({
          where: { id, active: true }
        });

        if (!sender) {
          results.errors.push({
            index: i,
            id,
            error: 'Sender not found'
          });
          results.summary.failed++;
          continue;
        }

        if (data.email && data.email !== sender.email) {

          const existing = await Sender.findOne({
            where: { email: data.email }
          });

          if (existing && existing.id !== id && existing.active) {
            results.errors.push({
              index: i,
              id,
              error: 'Email already in use'
            });
            results.summary.failed++;
            continue;
          }
        }

        await sender.update(data);
        results.updated.push(sender);
        results.summary.successful++;

      } catch (error) {
        results.errors.push({
          index: i,
          id,
          error: error.message
        });
        results.summary.failed++;
      }
    }

    return results;
  }

  async bulkDeleteSenders(ids) {

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

        const sender = await Sender.findOne({
          where: { id, active: true }
        });

        if (!sender) {
          results.errors.push({
            index: i,
            id,
            error: 'Sender not found'
          });
          results.summary.failed++;
          continue;
        }

        await sender.update({ active: false });

        results.deleted.push({
          id,
          email: sender.email,
          name: sender.name
        });

        results.summary.successful++;

      } catch (error) {
        results.errors.push({
          index: i,
          id,
          error: error.message
        });
        results.summary.failed++;
      }
    }

    return results;
  }
}

module.exports = new SenderService();
