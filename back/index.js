const app = require('./src/app.js');
const { conn } = require('./src/data');
const { PORT } = require('./src/config/envs.js');
require('dotenv').config();

// Importa la función seed
const seed = require('./src/scripts/seedData.js'); // Ajusta la ruta si es necesario

conn.sync({ alter: true }).then(async () => {
  // Ejecuta el seed antes de levantar el servidor
  
  //await seed();

  app.listen(PORT, () => {
    console.log(`🚀 listening on port: ${PORT} 🚀`);
    console.log('Ruta base del proyecto:', __dirname);
  });
});