require('dotenv').config();
const app = require('./app');
const { sequelize, testConnection } = require('./config/database');
const log = require('./utils/logger');

const PORT = process.env.PORT || 3009;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Test database connection
    log.info('Testing database connection...');
    const isConnected = await testConnection();

    if (!isConnected) {
      log.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Sync database models (use with caution in production)
    if (NODE_ENV === 'development') {
      log.info('Syncing database models...');
      await sequelize.sync({ alter: false });
      log.info('✓ Database models synced');
    }

    // Start server
    const server = app.listen(PORT, () => {
      log.info('=================================');
      log.info(`Server running in ${NODE_ENV} mode`);
      log.info(`Listening on port ${PORT}`);
      log.info(`API Documentation: http://localhost:${PORT}/api-docs`);
      log.info(`Health check: http://localhost:${PORT}/health`);
      log.info('=================================');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      log.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        log.info('HTTP server closed');

        try {
          await sequelize.close();
          log.info('Database connections closed');
          process.exit(0);
        } catch (error) {
          log.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        log.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      log.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      log.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    log.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
