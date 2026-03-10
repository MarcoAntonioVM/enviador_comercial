const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Preconfiguration = sequelize.define('Preconfiguration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  days_week: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Array of days, e.g. ["monday","tuesday"]'
  },
  hour: {
    type: DataTypes.STRING(5),
    allowNull: false,
    validate: {
      is: /^([01]\d|2[0-3]):[0-5]\d$/
    },
    comment: 'Hour in HH:MM format'
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
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
  tableName: 'preconfigurations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['template_id'] },
    { fields: ['sender_id'] },
    { fields: ['prospect_id'] },
    { fields: ['active'] }
  ]
});

module.exports = Preconfiguration;
