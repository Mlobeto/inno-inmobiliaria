const { catchedAsync } = require("../utils");
const authController = require("./authController"); // Importamos el archivo de controladores de auth
const clientController = require('./ClientController');
const LeaseController = require("./LeaseController")
const PaymentController = require ("./PaymentController")
const PropertyController = require ("./PropertyController")
const garantorController = require ("./garantorController")
const addPropertyToClientController = require('./addPropertyToClientController');
const createSaleAuthorization = require('./createSaleAuthorization');


console.log('Ruta actual:', __dirname);
console.log('Contenido de la carpeta controllers:', require('fs').readdirSync('./src/controllers'));

module.exports = {
  register: catchedAsync(authController.register),  
  loginAdmin: catchedAsync(authController.loginAdmin),
  verifyToken: catchedAsync(authController.verifyToken),
  getAllAdmins: catchedAsync(authController.getAllAdmins),
  editAdmin: catchedAsync(authController.editAdmin),
  deleteAdmin: catchedAsync(authController.deleteAdmin),
  createClient:catchedAsync(clientController.createClient),
  getAllClients:catchedAsync(clientController.getAllClients),
  getClientById:catchedAsync(clientController.getClientById),
  updateClient:catchedAsync(clientController.updateClient),
  deleteClient: catchedAsync(clientController.deleteClient),
  createLease: catchedAsync(LeaseController.createLease),
  savePdf: catchedAsync(LeaseController.savePdf),
  getLeasesByIdClient: catchedAsync(LeaseController.getLeasesByIdClient),
  getLeaseById: catchedAsync(LeaseController.getLeaseById),
  updateRentAmount: catchedAsync(LeaseController.updateRentAmount),
  getPaymentsByLease:catchedAsync(LeaseController.getPaymentsByLease),
  terminateLease: catchedAsync(LeaseController.terminateLease),
  createPayment: catchedAsync(PaymentController.  createPayment) ,
  getPaymentsByIdClient: catchedAsync(PaymentController.getPaymentsByIdClient),
  getPaymentsByLeaseId: catchedAsync(PaymentController.getPaymentsByLeaseId),
  createProperty: catchedAsync(PropertyController.createProperty),
  getAllProperties: catchedAsync(PropertyController.getAllProperties),
  getPropertiesByIdClient: catchedAsync(PropertyController.getPropertiesByIdClient),
  getPropertiesByType: catchedAsync(PropertyController.getPropertiesByType),
  deleteProperty: catchedAsync(PropertyController.deleteProperty),
  updateProperty: catchedAsync(PropertyController.updateProperty),
  getFilteredProperties: catchedAsync(PropertyController.getFilteredProperties),
  getWhatsAppText: catchedAsync(PropertyController.getWhatsAppText),
  createGarantorsForLease: catchedAsync(garantorController.createGarantorsForLease),
  updateGarantor:catchedAsync(garantorController.updateGarantor),
  getGarantorsByLeaseId: catchedAsync(garantorController.getGarantorsByLeaseId),
  addPropertyToClientWithRole : catchedAsync(addPropertyToClientController.addPropertyToClientWithRole),
  getAllProperties: catchedAsync(PropertyController.getAllProperties),
  getPropertyById: catchedAsync(PropertyController.getPropertyById),
  createSaleAuthorization: catchedAsync(createSaleAuthorization.createSaleAuthorization),
  
  // Lease Controller functions
  createLease: catchedAsync(LeaseController.createLease),
  getAllLeases: catchedAsync(LeaseController.getAllLeases),
  getLeaseById: catchedAsync(LeaseController.getLeaseById),
  updateLease: catchedAsync(LeaseController.updateLease),
  terminateLease: catchedAsync(LeaseController.terminateLease),
  checkPendingPayments: catchedAsync(LeaseController.checkPendingPayments),
  updateRentAmount: catchedAsync(LeaseController.updateRentAmount),
  savePdf: catchedAsync(LeaseController.savePdf),
  fixForeignKeyConstraints: catchedAsync(LeaseController.fixForeignKeyConstraints),
  createTestRentUpdate: catchedAsync(LeaseController.createTestRentUpdate),
  debugLeaseAlerts: catchedAsync(LeaseController.debugLeaseAlerts),
  getLeasesPendingUpdate: catchedAsync(LeaseController.getLeasesPendingUpdate),
  getLeaseUpdateHistory: catchedAsync(LeaseController.getLeaseUpdateHistory), 
  getExpiringLeases: catchedAsync(LeaseController.getExpiringLeases),
  getAllPayments: catchedAsync(PaymentController.getAllPayments),
  getPaymentsByIdClient: catchedAsync(PaymentController.getPaymentsByIdClient),
  getAllPayments: catchedAsync(PaymentController.getAllPayments),
  quickUpdateLeaseRent: catchedAsync(LeaseController.quickUpdateLeaseRent),
  getUpdateStatistics: catchedAsync(LeaseController.getUpdateStatistics),
  bulkUpdateLeases: catchedAsync(LeaseController.bulkUpdateLeases)
};