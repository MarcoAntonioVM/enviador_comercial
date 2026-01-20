const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Prospect = sequelize.define('Prospect', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  company: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  sector_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sectors',
      key: 'id'
    }
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'bounced', 'spam_reported', 'unsubscribed'),
    allowNull: false,
    defaultValue: 'active'
  },
  consent_status: {
    type: DataTypes.ENUM('unknown', 'granted', 'revoked'),
    allowNull: false,
    defaultValue: 'unknown'
  },
  consented_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  unsubscribed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
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
  tableName: 'prospects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: false,
  indexes: [
    { unique: true, fields: ['email'] },
    { fields: ['status', 'sector_id'] },
    { fields: ['consent_status', 'deleted_at'] }
  ]
});

module.exports = Prospect;
