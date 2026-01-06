require('dotenv').config();
const app = require('./app');
const { logger } = require('./utils/logger');
const { sequelize, syncDatabase } = require('./models');

const PORT = process.env.PORT || 5000;

// Function to start the server
const startServer = async () => {
  try {
    // Log environment
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔧 Port: ${PORT}`);
    logger.info(`📁 Database: ${process.env.DB_NAME || 'bizinside_db'}`);

    // Initialize database
    await syncDatabase();
    logger.info('✅ Database connected and synchronized');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`🔗 Health Check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API Docs: http://localhost:${PORT}/api`);
      logger.info(`🔗 Test Database: http://localhost:${PORT}/test-db`);
      logger.info(`🎯 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });

    // Handle graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('⏳ Received shutdown signal, closing connections...');
      
      server.close(async () => {
        logger.info('✅ HTTP server closed');
        
        try {
          await sequelize.close();
          logger.info('✅ Database connection closed');
          process.exit(0);
        } catch (dbError) {
          logger.error('❌ Error closing database:', dbError.message);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('❌ Could not close connections in time, forcing shutdown');
        process.exit(1);
      }, 10000);
    };

    // Handle termination signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('❌ Unhandled Rejection:', err.message);
      logger.error(err.stack);
      // Don't exit in development to allow debugging
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('❌ Uncaught Exception:', err.message);
      logger.error(err.stack);
      // Don't exit in development to allow debugging
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error.message);
    logger.error(error.stack);
    process.exit(1);
  }
};

// Start the application
if (require.main === module) {
  startServer();
}

module.exports = app;