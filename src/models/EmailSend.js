const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmailSend = sequelize.define('EmailSend', {
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
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'senders',
      key: 'id'
    }
  },
  tracking_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  message_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  provider_response: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('queued', 'sent', 'delivered', 'bounced', 'failed', 'spam_reported'),
    allowNull: false,
    defaultValue: 'queued'
  },
  retry_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  last_retry_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'email_sends',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['campaign_id', 'status'] },
    { fields: ['campaign_id', 'sent_at'] },
    { fields: ['sender_id', 'status'] },
    { fields: ['message_id'] }
  ]
});

module.exports = EmailSend;
