const app = require('./src/app.js');
const { conn } = require('./src/data');
const { PORT } = require('./src/config/envs.js');
require('dotenv').config();

// Importa la función seed
const seed = require('./src/scripts/seedData.js'); // Ajusta la ruta si es necesario

// En producción no usamos sync, las tablas ya existen por migraciones
const startServer = async () => {
  try {
    // Solo verificar conexión en ambos entornos (las tablas se manejan con migraciones)
    await conn.authenticate();
    console.log(`✅ Conexión a base de datos establecida (${process.env.NODE_ENV || 'desarrollo'})`);
    
    // Si necesitas sincronizar modelos, descomenta la siguiente línea (solo en desarrollo)
    // await conn.sync({ alter: false });
    
    // Ejecuta el seed antes de levantar el servidor (solo si es necesario)
    // await seed();

    app.listen(PORT, () => {
      console.log(`🚀 listening on port: ${PORT} 🚀`);
      console.log('Ruta base del proyecto:', __dirname);
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();