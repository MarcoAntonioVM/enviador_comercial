const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const prospectRoutes = require('./prospect.routes');
const campaignRoutes = require('./campaign.routes');
const sectorRoutes = require('./sector.routes');
const templateRoutes = require('./template.routes');
const senderRoutes = require('./sender.routes');

// API version prefix
const API_VERSION = process.env.API_VERSION || 'v1';

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: API_VERSION
  });
});

/**
 * Mount route modules
 */
router.use(`/api/${API_VERSION}/auth`, authRoutes);
router.use(`/api/${API_VERSION}/users`, userRoutes);
router.use(`/api/${API_VERSION}/prospects`, prospectRoutes);
router.use(`/api/${API_VERSION}/campaigns`, campaignRoutes);
router.use(`/api/${API_VERSION}/sectors`, sectorRoutes);
router.use(`/api/${API_VERSION}/templates`, templateRoutes);
router.use(`/api/${API_VERSION}/senders`, senderRoutes);

module.exports = router;
