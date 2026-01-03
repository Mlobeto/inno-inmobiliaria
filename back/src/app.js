const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const routes = require("./routes/index.js")

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://ql-inmobiliaria.vercel.app'
];

const app = express()

// Middleware para logs detallados
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Origin: ${req.get('origin')}`);
    next();
});

app.use(express.json())

// Configuración de CORS más permisiva para debugging
app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origin (como Postman, curl, etc.)
        if (!origin) return callback(null, true);
        
        // Permitir cualquier subdominio de vercel.app
        if (origin.includes('.vercel.app') || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Origin bloqueado por CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 600 // Cache preflight por 10 minutos
}));

app.use(morgan("dev"))

// Manejar explícitamente peticiones OPTIONS (preflight CORS)
app.options('*', cors());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Routes
app.use("/api", routes)

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error Handler:', {
        path: req.path,
        method: req.method,
        origin: req.get('origin'),
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    // Asegurar que los headers CORS estén presentes en errores
    const origin = req.get('origin');
    if (origin && (origin.includes('.vercel.app') || allowedOrigins.indexOf(origin) !== -1)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler - must be last
app.use((req, res) => {
    // Asegurar que los headers CORS estén presentes en 404
    const origin = req.get('origin');
    if (origin && (origin.includes('.vercel.app') || allowedOrigins.indexOf(origin) !== -1)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    res.status(404).json({
        error: 'Not Found',
        path: req.path
    });
});

module.exports = app