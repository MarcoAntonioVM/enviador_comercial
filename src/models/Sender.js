const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sender = sequelize.define('Sender', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  reply_to: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  signature: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  smtp_config: {
    type: DataTypes.JSON,
    allowNull: true
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  daily_limit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 500,
    validate: {
      min: 1
    }
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
  tableName: 'senders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['email'] },
    { fields: ['is_default'] }
  ]
});

module.exports = Sender;
