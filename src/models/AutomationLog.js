const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AutomationLog = sequelize.define('AutomationLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  job_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  job_type: {
    type: DataTypes.ENUM('scheduled_send', 'cleanup', 'stats_update', 'webhook_processing'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('started', 'completed', 'failed'),
    allowNull: false
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'automation_logs',
  timestamps: false,
  indexes: [
    { fields: ['job_type'] },
    { fields: ['status'] },
    { fields: ['started_at'] }
  ]
});

module.exports = AutomationLog;
