const express = require('express');
const addPropertyToClientController = require('../controllers');
const authMiddleware = require('../middlewares/authMiddleware');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');
const router = express.Router();

// Aplicar autenticación y tenancy a todas las rutas
router.use(authMiddleware);
router.use(tenancyMiddleware);

router.post('/addRole', addPropertyToClientController.addPropertyToClientWithRole);

module.exports = router;