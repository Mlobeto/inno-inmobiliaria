const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const helmet = require("helmet")
const routes = require("./routes/index.js")
const logger = require("./utils/logger")
const { globalLimiter } = require("./middlewares/rateLimiter")

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://vercel.com/inno-projects'
];

const app = express()

// ==================== SEGURIDAD ====================

// Helmet - Headers de seguridad HTTP
app.use(helmet({
    contentSecurityPolicy: false, // Desactivar CSP por ahora (puede causar problemas con CORS)
    crossOriginEmbedderPolicy: false, // Permitir embeds
}))

// Logging estructurado de HTTP requests
app.use(logger.httpLogger)

// Trust proxy (importante para rate limiting y obtener IP real)
app.set('trust proxy', 1)

// ==================== PARSERS ====================

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ==================== CORS ====================

// Configuración de CORS más permisiva para debugging
app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origin (como Postman, curl, etc.)
        if (!origin) return callback(null, true);
        
        // Permitir cualquier subdominio de vercel.app
        if (origin.includes('.vercel.app') || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.warn('Origin bloqueado por CORS', { origin, path: this.path });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-Id'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 600 // Cache preflight por 10 minutos
}))

// Manejar explícitamente peticiones OPTIONS (preflight CORS)
app.options('*', cors())

// ==================== ENDPOINTS PÚBLICOS ====================

// Health check endpoint (sin rate limiting)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        redis: 'connected' // TODO: Verificar conexión real
    });
})

// ==================== RATE LIMITING ====================

// Rate limiting global por IP (aplicar a todas las rutas /api)
app.use("/api", globalLimiter)

// ==================== ROUTES ====================

app.use("/api", routes)

// ==================== ERROR HANDLING ====================

// Error handling middleware (4 params = Express lo reconoce como error handler)
app.use((err, req, res, next) => {
    logger.error('Error Handler', {
        path: req.path,
        method: req.method,
        origin: req.get('origin'),
        tenantId: req.tenantId,
        userId: req.user?.id,
        error: err.message,
        stack: err.stack,
    });

    // Asegurar CORS también en errores
    const origin = req.get('origin');
    if (origin && (origin.includes('.vercel.app') || allowedOrigins.indexOf(origin) !== -1)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        timestamp: new Date().toISOString(),
    });
});

// ==================== 404 HANDLER ====================

// 404 handler - debe estar al final
app.use((req, res) => {
    logger.warn('404 Not Found', {
        path: req.path,
        method: req.method,
        origin: req.get('origin'),
        ip: req.ip,
    });

    // Asegurar CORS también en 404
    const origin = req.get('origin');
    if (origin && (origin.includes('.vercel.app') || allowedOrigins.indexOf(origin) !== -1)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }

    res.status(404).json({
        error: 'Not Found',
        path: req.path,
    });
});

module.exports = app