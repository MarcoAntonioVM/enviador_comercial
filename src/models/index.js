const { sequelize } = require('../config/database');

// Import models (solo tablas de envios_estandar.sql)
const User = require('./User');
const Prospect = require('./Prospect');
const EmailTemplate = require('./EmailTemplate');
const Sender = require('./Sender');
const SystemConfig = require('./SystemConfig');
const Preconfiguration = require('./Preconfiguration');
const EmailSend = require('./EmailSend');

// ===========================
// Define Relationships
// ===========================

// User relationships
User.hasMany(Prospect, { foreignKey: 'created_by', as: 'prospects' });
User.hasMany(EmailTemplate, { foreignKey: 'created_by', as: 'templates' });
User.hasMany(Sender, { foreignKey: 'created_by', as: 'senders' });

// Prospect relationships
Prospect.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// EmailTemplate relationships
EmailTemplate.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Sender relationships
Sender.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Preconfiguration relationships
Preconfiguration.belongsTo(EmailTemplate, { foreignKey: 'template_id', as: 'template' });
Preconfiguration.belongsTo(Sender, { foreignKey: 'sender_id', as: 'sender' });
Preconfiguration.belongsTo(Prospect, { foreignKey: 'prospect_id', as: 'prospect' });

// EmailSend (registro de envíos por preconfiguración)
Preconfiguration.hasMany(EmailSend, { foreignKey: 'preconfiguration_id', as: 'emailSends' });
EmailSend.belongsTo(Preconfiguration, { foreignKey: 'preconfiguration_id', as: 'preconfiguration' });
EmailSend.belongsTo(EmailTemplate, { foreignKey: 'template_id', as: 'template' });
EmailSend.belongsTo(Sender, { foreignKey: 'sender_id', as: 'sender' });
EmailSend.belongsTo(Prospect, { foreignKey: 'prospect_id', as: 'prospect' });

// Export all models and sequelize instance
module.exports = {
  sequelize,
  User,
  Prospect,
  EmailTemplate,
  Sender,
  SystemConfig,
  Preconfiguration,
  EmailSend
};
