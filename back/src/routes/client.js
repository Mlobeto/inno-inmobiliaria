const express = require('express');
const clientController = require('../controllers/ClientController');
const router = express.Router();

router.post('/', clientController.createClient);
router.get('/', clientController.getAllClients);
router.get('/:idClient', clientController.getClientById);
router.put('/:idClient', clientController.updateClient);

module.exports = router;