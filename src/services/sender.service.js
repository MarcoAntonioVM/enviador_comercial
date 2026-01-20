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
}

module.exports = new SenderService();
