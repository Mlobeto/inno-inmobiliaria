const express = require('express');
const clientController = require('../controllers/ClientController');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');
const router = express.Router();

// Todas las rutas requieren tenancyMiddleware
router.use(tenancyMiddleware);

router.post('/', clientController.createClient);
router.get('/', clientController.getAllClients);
router.get('/:idClient', clientController.getClientById);
router.put('/:idClient', clientController.updateClient);

module.exports = router;