const app = require('./src/app.js');
const { conn } = require('./src/data');
const { PORT } = require('./src/config/envs.js');
require('dotenv').config();

// Importa la función seed
const seed = require('./src/scripts/seedData.js'); // Ajusta la ruta si es necesario

// En producción no usamos sync, las tablas ya existen por migraciones
const startServer = async () => {
  try {
    // Solo hacer sync en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      await conn.sync({ alter: true });
      console.log('✅ Base de datos sincronizada (desarrollo)');
      // Ejecuta el seed antes de levantar el servidor
      // await seed();
    } else {
      // En producción solo verificamos la conexión
      await conn.authenticate();
      console.log('✅ Conexión a base de datos establecida (producción)');
    }

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