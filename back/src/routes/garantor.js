const express = require('express');
const { createGarantorsForLease,  getGarantorsByLeaseId, updateGarantor } = require('../controllers');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');
const router = express.Router();

// Todas las rutas requieren tenancyMiddleware
router.use(tenancyMiddleware);

router.use((req, res, next) => {
    console.log(`Se recibió una petición en /garantor${req.url}`, req.method);
    next();
  });

router.post('/:leaseId', createGarantorsForLease);

router.get('/:leaseId', getGarantorsByLeaseId);
router.put('/:garantorId', updateGarantor);

module.exports = router;