const { Router } = require('express');
const ctrl = require('../controllers/OwnerSettlementController');

const router = Router();

router.get('/',                   ctrl.list);
router.get('/summary',            ctrl.summary);
router.patch('/liquidate',        ctrl.liquidate);
router.get('/pdf/:landlordId',    ctrl.generatePdf);

module.exports = router;
