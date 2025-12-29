const { Router } = require('express');
const { fixClientPropertyConstraints, checkConstraints } = require('../controllers/fixConstraintsController');

const router = Router();

// Endpoint para verificar constraints
router.get('/check-constraints', checkConstraints);
// Endpoint temporal para corregir constraints
router.post('/fix-client-property-constraints', fixClientPropertyConstraints);

module.exports = router;
