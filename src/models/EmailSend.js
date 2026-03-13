const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmailSend = sequelize.define('EmailSend', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  preconfiguration_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'preconfigurations',
      key: 'id'
    }
  },
  template_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'email_templates',
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
  prospect_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'prospects',
      key: 'id'
    }
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Hora en que se envió el correo'
  },
  status: {
    type: DataTypes.ENUM('sent', 'failed', 'pending', 'delivered', 'bounced', 'spam', 'unsubscribed'),
    allowNull: false,
    defaultValue: 'sent'
  },
  brevo_message_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Hora en que Brevo confirma entrega'
  },
  opened_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Primera apertura del correo'
  },
  clicked_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Primer clic en enlace'
  },
  bounced_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  bounce_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'soft_bounce, hard_bounce'
  },
  spam_reported_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  unsubscribed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'email_sends',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['preconfiguration_id'] },
    { fields: ['sent_at'] },
    { fields: ['prospect_id'] },
    { fields: ['status'] },
    { fields: ['brevo_message_id'] }
  ]
});

module.exports = EmailSend;
