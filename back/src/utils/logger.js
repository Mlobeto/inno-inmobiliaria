const winston = require('winston');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

// Formato para desarrollo (legible, con colores)
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length 
      ? `\n${JSON.stringify(meta, null, 2)}` 
      : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// Formato para producción (JSON estructurado)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configuración del logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  
  format: isProduction ? prodFormat : devFormat,
  
  defaultMeta: {
    service: 'innoinmo-api',
    environment: process.env.NODE_ENV || 'development',
  },
  
  transports: [
    // Consola siempre activa
    new winston.transports.Console({
      format: isProduction ? prodFormat : devFormat,
    }),
    
    // Archivos solo en producción
    ...(isProduction ? [
      // Archivo de errores
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/error.log'),
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
        format: prodFormat,
      }),
      
      // Archivo combinado (todos los niveles)
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/combined.log'),
        maxsize: 10485760, // 10MB
        maxFiles: 5,
        format: prodFormat,
      }),
    ] : []),
  ],
  
  // No salir en caso de error
  exitOnError: false,
});

// Agregar transporte de Elasticsearch en producción si está configurado
if (isProduction && process.env.ELASTICSEARCH_NODE) {
  try {
    const { ElasticsearchTransport } = require('winston-elasticsearch');
    
    const esTransport = new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: process.env.ELASTICSEARCH_NODE,
        auth: process.env.ELASTICSEARCH_USER ? {
          username: process.env.ELASTICSEARCH_USER,
          password: process.env.ELASTICSEARCH_PASSWORD,
        } : undefined,
      },
      index: 'innoinmo-logs',
      dataStream: true,
    });
    
    logger.add(esTransport);
    logger.info('Elasticsearch transport added to logger');
  } catch (error) {
    logger.warn('Failed to add Elasticsearch transport', { error: error.message });
  }
}

/**
 * Middleware para logging de HTTP requests
 */
logger.httpLogger = (req, res, next) => {
  const start = Date.now();
  
  // Capturar el response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      tenantId: req.tenantId,
      userId: req.user?.adminId,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };
    
    // Log según status code
    if (res.statusCode >= 500) {
      logger.error('HTTP Request - Server Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request - Client Error', logData);
    } else if (duration > 3000) {
      logger.warn('HTTP Request - Slow Response', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
};

/**
 * Manejador de errores no capturados
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  
  // En producción, dar tiempo para enviar logs antes de salir
  if (isProduction) {
    setTimeout(() => process.exit(1), 1000);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString(),
  });
});

module.exports = logger;
