const { Campaign, EmailTemplate, Sender, Sector, User, CampaignRecipient, Prospect, EmailSend } = require('../models');
const { AppError } = require('../utils/errors');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

class CampaignService {
  async getAllCampaigns(filters = {}) {
    const {
      page = 1,
      limit = 10,
      type,
      sector_id,
      created_by,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;
    const where = {};

    if (type) where.type = type;
    if (sector_id) where.sector_id = sector_id;
    if (created_by) where.created_by = created_by;

    const { count, rows } = await Campaign.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        { model: EmailTemplate, as: 'template', attributes: ['id', 'name', 'subject'] },
        { model: Sender, as: 'sender', attributes: ['id', 'name', 'email'] },
        { model: Sector, as: 'sector', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ]
    });

    return {
      campaigns: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit) }
    };
  }

  async getCampaignById(id) {
    const campaign = await Campaign.findByPk(id, {
      include: [
        { model: EmailTemplate, as: 'template' },
        { model: Sender, as: 'sender' },
        { model: Sector, as: 'sector' },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    return campaign;
  }

  async createCampaign(data, userId) {
    const { template_id, sender_id, sector_id, recipients } = data;

    // Validate template exists
    const template = await EmailTemplate.findByPk(template_id);
    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // Validate sender exists
    const sender = await Sender.findByPk(sender_id);
    if (!sender) {
      throw new AppError('Sender not found', 404);
    }

    // Create campaign
    const campaign = await Campaign.create({
      ...data,
      created_by: userId,
      total_recipients: recipients ? recipients.length : 0
    });

    // Add recipients if provided
    if (recipients && recipients.length > 0) {
      await this.addRecipients(campaign.id, recipients);
    }

    return campaign;
  }

  async updateCampaign(id, data) {
    const campaign = await this.getCampaignById(id);

    // Don't allow updates to started campaigns
    if (campaign.started_at) {
      throw new AppError('Cannot update a campaign that has already started', 400);
    }

    await campaign.update(data);
    return campaign;
  }

  async deleteCampaign(id) {
    const campaign = await this.getCampaignById(id);

    if (campaign.started_at) {
      throw new AppError('Cannot delete a campaign that has already started', 400);
    }

    await campaign.destroy();
    return { message: 'Campaign deleted successfully' };
  }

  async addRecipients(campaignId, recipients) {
    const campaign = await this.getCampaignById(campaignId);

    const recipientRecords = [];
    for (const recipient of recipients) {
      const prospect = await Prospect.findByPk(recipient.prospect_id);
      if (!prospect) continue;

      recipientRecords.push({
        campaign_id: campaignId,
        prospect_id: recipient.prospect_id,
        personalized_data: recipient.personalized_data || null
      });
    }

    await CampaignRecipient.bulkCreate(recipientRecords, { 
      ignoreDuplicates: true 
    });

    await campaign.update({ total_recipients: recipientRecords.length });

    return { message: `${recipientRecords.length} recipients added successfully` };
  }

  async getCampaignRecipients(campaignId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { count, rows } = await CampaignRecipient.findAndCountAll({
      where: { campaign_id: campaignId },
      limit: parseInt(limit),
      offset,
      include: [
        { model: Prospect, as: 'prospect' }
      ]
    });

    return {
      recipients: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit) }
    };
  }

  async getCampaignStats(campaignId) {
    const campaign = await this.getCampaignById(campaignId);

    const stats = await EmailSend.findAll({
      where: { campaign_id: campaignId },
      attributes: [
        'status',
        [EmailSend.sequelize.fn('COUNT', EmailSend.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const statusCounts = {};
    stats.forEach(stat => {
      statusCounts[stat.status] = parseInt(stat.get('count'));
    });

    return {
      campaign_id: campaignId,
      campaign_name: campaign.name,
      total_recipients: campaign.total_recipients,
      stats: statusCounts,
      started_at: campaign.started_at,
      completed_at: campaign.completed_at
    };
  }

  async scheduleCampaign(campaignId, scheduledAt) {
    const campaign = await this.getCampaignById(campaignId);

    if (campaign.started_at) {
      throw new AppError('Campaign has already started', 400);
    }

    await campaign.update({
      type: 'scheduled',
      scheduled_at: new Date(scheduledAt)
    });

    return campaign;
  }
}

module.exports = new CampaignService();
