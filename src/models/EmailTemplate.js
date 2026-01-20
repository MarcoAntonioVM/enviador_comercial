const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmailTemplate = sequelize.define('EmailTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  sector_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sectors',
      key: 'id'
    }
  },
  subject: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  html_content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  text_content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  variables: {
    type: DataTypes.JSON,
    allowNull: true
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
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
  tableName: 'email_templates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['sector_id'] },
    { fields: ['active'] }
  ]
});

module.exports = EmailTemplate;
