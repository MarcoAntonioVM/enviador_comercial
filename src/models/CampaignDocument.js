const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CampaignDocument = sequelize.define('CampaignDocument', {
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
  document_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'documents',
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'campaign_documents',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['campaign_id', 'document_id'] }
  ]
});

module.exports = CampaignDocument;
