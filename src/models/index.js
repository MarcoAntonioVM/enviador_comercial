const { sequelize } = require('../config/database');

// Import models
const User = require('./User');
const Sector = require('./Sector');
const Prospect = require('./Prospect');
const EmailTemplate = require('./EmailTemplate');
const Sender = require('./Sender');
const Campaign = require('./Campaign');
const CampaignRecipient = require('./CampaignRecipient');
const Document = require('./Document');
const CampaignDocument = require('./CampaignDocument');
const EmailSend = require('./EmailSend');
const Credential = require('./Credential');
const SystemConfig = require('./SystemConfig');
const AutomationLog = require('./AutomationLog');

// ===========================
// Define Relationships
// ===========================

// User relationships
User.hasMany(EmailTemplate, { foreignKey: 'created_by', as: 'templates' });
User.hasMany(Campaign, { foreignKey: 'created_by', as: 'campaigns' });
User.hasMany(Document, { foreignKey: 'uploaded_by', as: 'documents' });

// Sector relationships
Sector.hasMany(Prospect, { foreignKey: 'sector_id', as: 'prospects' });
Sector.hasMany(EmailTemplate, { foreignKey: 'sector_id', as: 'templates' });
Sector.hasMany(Campaign, { foreignKey: 'sector_id', as: 'campaigns' });
Sector.hasMany(Document, { foreignKey: 'sector_id', as: 'documents' });

// Prospect relationships
Prospect.belongsTo(Sector, { foreignKey: 'sector_id', as: 'sector' });
Prospect.hasMany(CampaignRecipient, { foreignKey: 'prospect_id', as: 'campaignRecipients' });
Prospect.hasMany(EmailSend, { foreignKey: 'prospect_id', as: 'emailSends' });

// EmailTemplate relationships
EmailTemplate.belongsTo(Sector, { foreignKey: 'sector_id', as: 'sector' });
EmailTemplate.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
EmailTemplate.hasMany(Campaign, { foreignKey: 'template_id', as: 'campaigns' });

// Sender relationships
Sender.hasMany(Campaign, { foreignKey: 'sender_id', as: 'campaigns' });
Sender.hasMany(EmailSend, { foreignKey: 'sender_id', as: 'emailSends' });

// Campaign relationships
Campaign.belongsTo(EmailTemplate, { foreignKey: 'template_id', as: 'template' });
Campaign.belongsTo(Sender, { foreignKey: 'sender_id', as: 'sender' });
Campaign.belongsTo(Sector, { foreignKey: 'sector_id', as: 'sector' });
Campaign.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Campaign.hasMany(CampaignRecipient, { foreignKey: 'campaign_id', as: 'recipients' });
Campaign.hasMany(EmailSend, { foreignKey: 'campaign_id', as: 'emailSends' });
Campaign.belongsToMany(Document, { 
  through: CampaignDocument, 
  foreignKey: 'campaign_id',
  otherKey: 'document_id',
  as: 'documents' 
});

// CampaignRecipient relationships
CampaignRecipient.belongsTo(Campaign, { foreignKey: 'campaign_id', as: 'campaign' });
CampaignRecipient.belongsTo(Prospect, { foreignKey: 'prospect_id', as: 'prospect' });

// Document relationships
Document.belongsTo(Sector, { foreignKey: 'sector_id', as: 'sector' });
Document.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });
Document.belongsToMany(Campaign, { 
  through: CampaignDocument, 
  foreignKey: 'document_id',
  otherKey: 'campaign_id',
  as: 'campaigns' 
});

// EmailSend relationships
EmailSend.belongsTo(Campaign, { foreignKey: 'campaign_id', as: 'campaign' });
EmailSend.belongsTo(Prospect, { foreignKey: 'prospect_id', as: 'prospect' });
EmailSend.belongsTo(Sender, { foreignKey: 'sender_id', as: 'sender' });
EmailSend.hasOne(Credential, { foreignKey: 'email_send_id', as: 'credential' });

// Credential relationships
Credential.belongsTo(EmailSend, { foreignKey: 'email_send_id', as: 'emailSend' });

// Export all models and sequelize instance
module.exports = {
  sequelize,
  User,
  Sector,
  Prospect,
  EmailTemplate,
  Sender,
  Campaign,
  CampaignRecipient,
  Document,
  CampaignDocument,
  EmailSend,
  Credential,
  SystemConfig,
  AutomationLog
};
