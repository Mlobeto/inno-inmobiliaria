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
// const sequelize = new Sequelize(
//   `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
//   {
//     logging: false, // set to console.log to see the raw SQL queries
//     native: false,  // lets Sequelize know we can use pg-native for ~30% more speed
//     timezone: '-03:00', // Configura la zona horaria GMT-3 (Argentina)
//   }
// );
//-------------------------------------CONFIGURACION PARA EL DEPLOY---------------------------------------------------------------------
const sequelize = new Sequelize(DB_DEPLOY, {
  logging: false, 
  native: false,  
  timezone: '-03:00', 
});

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
  Tenant,
  Admin, 
  Client, 
  Garantor, 
  Property, 
  Lease, 
  PaymentReceipt, 
  ClientProperty, 
  SaleContract,
  RentUpdate,
  Commission,
  PdfTemplate,
  Plan,
  Subscription
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

// Relación del contrato con el inquilino (renter)
// Se usa el alias "Renter" para identificar al cliente que es inquilino
Lease.belongsTo(Client, { 
  as: 'Renter', 
  foreignKey: 'renterId',
  targetKey: 'idClient'
});
Client.hasMany(Lease, { 
  as: 'LeasesAsRenter', 
  foreignKey: 'renterId',
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

// 6. Relaciones de TENANT (Multitenant)
// Un Tenant tiene muchos admins, clientes, propiedades, etc.
Tenant.hasMany(Admin, {
  foreignKey: 'tenantId',
  sourceKey: 'tenantId'
});
Admin.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  targetKey: 'tenantId'
});

Tenant.hasMany(Client, {
  foreignKey: 'tenantId',
  sourceKey: 'tenantId'
});
Client.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  targetKey: 'tenantId'
});

Tenant.hasMany(Property, {
  foreignKey: 'tenantId',
  sourceKey: 'tenantId'
});
Property.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  targetKey: 'tenantId'
});

Tenant.hasMany(Lease, {
  foreignKey: 'tenantId',
  sourceKey: 'tenantId'
});
Lease.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  targetKey: 'tenantId'
});

Tenant.hasMany(SaleContract, {
  foreignKey: 'tenantId',
  sourceKey: 'tenantId'
});
SaleContract.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  targetKey: 'tenantId'
});

Tenant.hasMany(ClientProperty, {
  foreignKey: 'tenantId',
  sourceKey: 'tenantId'
});
ClientProperty.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  targetKey: 'tenantId'
});

Tenant.hasMany(Commission, {
  foreignKey: 'tenantId',
  sourceKey: 'tenantId'
});
Commission.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  targetKey: 'tenantId'
});

// 7. Relaciones de AGENT (Admin) con propiedades y transacciones
// Un agente puede tener muchas propiedades asignadas
Admin.hasMany(Property, {
  as: 'ManagedProperties',
  foreignKey: 'agentId',
  sourceKey: 'adminId'
});
Property.belongsTo(Admin, {
  as: 'Agent',
  foreignKey: 'agentId',
  targetKey: 'adminId'
});

// Un agente puede cerrar muchos contratos
Admin.hasMany(Lease, {
  as: 'ClosedLeases',
  foreignKey: 'agentId',
  sourceKey: 'adminId'
});
Lease.belongsTo(Admin, {
  as: 'Agent',
  foreignKey: 'agentId',
  targetKey: 'adminId'
});

// Un agente puede cerrar muchas ventas
Admin.hasMany(SaleContract, {
  as: 'ClosedSales',
  foreignKey: 'agentId',
  sourceKey: 'adminId'
});
SaleContract.belongsTo(Admin, {
  as: 'Agent',
  foreignKey: 'agentId',
  targetKey: 'adminId'
});

// 8. Relaciones de COMMISSION
// Una comisión pertenece a un agente
Commission.belongsTo(Admin, {
  as: 'Agent',
  foreignKey: 'agentId',
  targetKey: 'adminId'
});
Admin.hasMany(Commission, {
  as: 'Commissions',
  foreignKey: 'agentId',
  sourceKey: 'adminId'
});

// Una comisión puede ser aprobada por un admin
Commission.belongsTo(Admin, {
  as: 'ApprovedBy',
  foreignKey: 'approvedBy',
  targetKey: 'adminId'
});

// Una comisión está asociada a una propiedad
Commission.belongsTo(Property, {
  foreignKey: 'propertyId',
  targetKey: 'propertyId'
});
Property.hasMany(Commission, {
  foreignKey: 'propertyId',
  sourceKey: 'propertyId'
});

// Una comisión puede estar asociada a un cliente
Commission.belongsTo(Client, {
  foreignKey: 'clientId',
  targetKey: 'idClient'
});
Client.hasMany(Commission, {
  foreignKey: 'clientId',
  sourceKey: 'idClient'
});

// 9. Relaciones de PDF_TEMPLATE
// Un template pertenece a un tenant
PdfTemplate.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  targetKey: 'tenantId'
});
Tenant.hasMany(PdfTemplate, {
  as: 'PdfTemplates',
  foreignKey: 'tenantId',
  sourceKey: 'tenantId'
});

// Un template fue creado por un admin
PdfTemplate.belongsTo(Admin, {
  as: 'Creator',
  foreignKey: 'createdBy',
  targetKey: 'adminId'
});
Admin.hasMany(PdfTemplate, {
  as: 'CreatedTemplates',
  foreignKey: 'createdBy',
  sourceKey: 'adminId'
});

// 10. Relaciones de SUBSCRIPTION
// Una suscripción pertenece a un tenant
Subscription.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  targetKey: 'tenantId'
});
Tenant.hasOne(Subscription, {
  as: 'ActiveSubscription',
  foreignKey: 'tenantId',
  sourceKey: 'tenantId',
  scope: {
    status: ['trialing', 'active']
  }
});
Tenant.hasMany(Subscription, {
  as: 'Subscriptions',
  foreignKey: 'tenantId',
  sourceKey: 'tenantId'
});

// Una suscripción tiene un plan
Subscription.belongsTo(Plan, {
  foreignKey: 'planId',
  targetKey: 'planId'
});
Plan.hasMany(Subscription, {
  foreignKey: 'planId',
  sourceKey: 'planId'
});

//---------------------------------------------------------------------------------//
module.exports = {
  ...sequelize.models, // para poder importar los modelos así: const { Product, User } = require('./db.js');
  conn: sequelize, // para importart la conexión { conn } = require('./db.js');
  sequelize, // exportar sequelize para usar en el modelo AdminSettings
};
