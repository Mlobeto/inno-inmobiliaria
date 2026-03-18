const app = require('./src/app.js');
const prisma = require('./src/utils/prismaClient');
const { PORT } = require('./src/config/envs.js');
const logger = require('./src/utils/logger');
require('dotenv').config();

const startServer = async () => {
  try {
    // Verificar conexión con Prisma
    await prisma.$queryRawUnsafe('SELECT 1');
    logger.info('Database connection established', {
      environment: process.env.NODE_ENV || 'development',
    });

    app.listen(PORT, () => {
      logger.info('Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

startServer();