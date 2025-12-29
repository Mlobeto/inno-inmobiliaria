require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_DEPLOY
  } = require('../config/envs');
//-------------------------------- CONFIGURACION PARA TRABAJAR LOCALMENTE-----------------------------------
const sequelize = new Sequelize(
  `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
  {
    logging: false, // set to console.log to see the raw SQL queries
    native: false,  // lets Sequelize know we can use pg-native for ~30% more speed
    timezone: '-03:00', // Configura la zona horaria GMT-3 (Argentina)
  }
);
//-------------------------------------CONFIGURACION PARA EL DEPLOY---------------------------------------------------------------------
// const sequelize = new Sequelize(DB_DEPLOY, {
//   logging: false, 
//   native: false,  
//   timezone: '-03:00', 
// });

const basename = path.basename(__filename);

const modelDefiners = [];

// Leemos todos los archivos de la carpeta Models, los requerimos y agregamos al arreglo modelDefiners
fs.readdirSync(path.join(__dirname, '/models'))
  .filter(
    (file) =>
      file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
  )
  .forEach((file) => {
    modelDefiners.push(require(path.join(__dirname, '/models', file)));
  });

// Injectamos la conexion (sequelize) a todos los modelos
modelDefiners.forEach((model) => model(sequelize));
// Capitalizamos los nombres de los modelos ie: product => Product
let entries = Object.entries(sequelize.models);
let capsEntries = entries.map((entry) => [
  entry[0][0].toUpperCase() + entry[0].slice(1),
  entry[1],
]);
sequelize.models = Object.fromEntries(capsEntries);

// En sequelize.models están todos los modelos importados como propiedades
// Para relacionarlos hacemos un destructuring
const { 
  Admin, 
  Client, 
  Garantor, 
  Property, 
  Lease, 
  PaymentReceipt, 
  ClientProperty, 
  SaleContract,
  RentUpdate 
} = sequelize.models;

// 1. Relaciones entre Client y Property a través de ClientProperty (many-to-many)
Client.belongsToMany(Property, { 
  through: ClientProperty, 
  foreignKey: 'clientId',
  otherKey: 'propertyId'
});
Property.belongsToMany(Client, { 
  through: ClientProperty, 
  foreignKey: 'propertyId',
  otherKey: 'clientId'
});

ClientProperty.belongsTo(Client, {
  foreignKey: 'clientId',
  targetKey: 'idClient'
});
ClientProperty.belongsTo(Property, {
  foreignKey: 'propertyId', 
  targetKey: 'propertyId'
});
Client.hasMany(ClientProperty, {
  foreignKey: 'clientId',
  sourceKey: 'idClient'
});
Property.hasMany(ClientProperty, {
  foreignKey: 'propertyId',
  sourceKey: 'propertyId'
});

// 2. Relaciones para Lease
// Relación con Property: Cada contrato (Lease) está asociado a una propiedad
Lease.belongsTo(Property, { 
  foreignKey: 'propertyId',
  targetKey: 'propertyId'
});
Property.hasMany(Lease, { 
  foreignKey: 'propertyId',
  sourceKey: 'propertyId'
});

// Relación del contrato con el propietario (landlord)
// Se usa el alias "Landlord" para identificar al cliente que es propietario
Lease.belongsTo(Client, { 
  as: 'Landlord', 
  foreignKey: 'landlordId',
  targetKey: 'idClient'
});
Client.hasMany(Lease, { 
  as: 'LeasesAsLandlord', 
  foreignKey: 'landlordId',
  sourceKey: 'idClient'
});

// Relación del contrato con el inquilino (tenant)
// Se usa el alias "Tenant" para identificar al cliente que es inquilino
Lease.belongsTo(Client, { 
  as: 'Tenant', 
  foreignKey: 'tenantId',
  targetKey: 'idClient'
});
Client.hasMany(Lease, { 
  as: 'LeasesAsTenant', 
  foreignKey: 'tenantId',
  sourceKey: 'idClient'
});
// 3. Relaciones para SaleContract
// Relación SaleContract - Property (uno a uno)
SaleContract.belongsTo(Property, { 
  foreignKey: 'propertyId',
  targetKey: 'propertyId'
});
Property.hasOne(SaleContract, { 
  foreignKey: 'propertyId',
  sourceKey: 'propertyId'
});

// Relación SaleContract - Client (vendedor y comprador)
SaleContract.belongsTo(Client, { 
  as: 'Seller', 
  foreignKey: 'sellerId',
  targetKey: 'idClient'
});
SaleContract.belongsTo(Client, { 
  as: 'Buyer', 
  foreignKey: 'buyerId',
  targetKey: 'idClient'
});
Client.hasMany(SaleContract, { 
  as: 'Sales', 
  foreignKey: 'sellerId',
  sourceKey: 'idClient'
});
Client.hasMany(SaleContract, { 
  as: 'Purchases', 
  foreignKey: 'buyerId',
  sourceKey: 'idClient'
});

// 4. Relaciones para Garantor
// Un contrato (Lease) puede tener varios avalistas (Garantor)
Lease.hasMany(Garantor, { 
  foreignKey: 'leaseId',
  sourceKey: 'id'
});
Garantor.belongsTo(Lease, { 
  foreignKey: 'leaseId',
  targetKey: 'id'
});

// 5. Relaciones para PaymentReceipt
PaymentReceipt.belongsTo(Lease, { 
  foreignKey: 'leaseId',
  targetKey: 'id'
});
Lease.hasMany(PaymentReceipt, { 
  foreignKey: 'leaseId',
  sourceKey: 'id'
});

PaymentReceipt.belongsTo(Client, { 
  foreignKey: 'idClient',
  targetKey: 'idClient'
});
Client.hasMany(PaymentReceipt, { 
  foreignKey: 'idClient',
  sourceKey: 'idClient'
});

Lease.hasMany(RentUpdate, { 
  foreignKey: "leaseId",
  sourceKey: 'id'
});
RentUpdate.belongsTo(Lease, { 
  foreignKey: "leaseId",
  targetKey: 'id'
});



//---------------------------------------------------------------------------------//
module.exports = {
  ...sequelize.models, // para poder importar los modelos así: const { Product, User } = require('./db.js');
  conn: sequelize, // para importart la conexión { conn } = require('./db.js');
  sequelize, // exportar sequelize para usar en el modelo AdminSettings
};
