const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CampaignRecipient = sequelize.define('CampaignRecipient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  campaign_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'campaigns',
      key: 'id'
    }
  },
  prospect_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'prospects',
      key: 'id'
    }
  },
  personalized_data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'campaign_recipients',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['campaign_id', 'prospect_id'] },
    { fields: ['campaign_id'] },
    { fields: ['prospect_id'] }
  ]
});

module.exports = CampaignRecipient;
