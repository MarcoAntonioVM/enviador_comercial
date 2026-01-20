const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Credential = sequelize.define('Credential', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email_send_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'email_sends',
      key: 'id'
    }
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  credential_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  expires_at: {
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
  }
}, {
  tableName: 'credentials',
  timestamps: false,
  indexes: [
    { fields: ['expires_at'] }
  ]
});

module.exports = Credential;
