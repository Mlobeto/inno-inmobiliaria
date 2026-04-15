const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/LoteoController');

// todos los endpoints ya reciben authMiddleware + requireTenantScope + tenancyMiddleware desde index.js

// ── Loteos ──────────────────────────────────
router.get('/', ctrl.getLoteos);
router.get('/:loteoId', ctrl.getLoteoById);
router.post('/', ctrl.createLoteo);
router.put('/:loteoId', ctrl.updateLoteo);
router.delete('/:loteoId', ctrl.deleteLoteo);
router.patch('/:loteoId/publish', ctrl.togglePublishLoteo);

// ── Lotes dentro de un loteo ─────────────────
router.post('/:loteoId/lotes', ctrl.createLote);
router.put('/:loteoId/lotes/:loteId', ctrl.updateLote);
router.delete('/:loteoId/lotes/:loteId', ctrl.deleteLote);

module.exports = router;
