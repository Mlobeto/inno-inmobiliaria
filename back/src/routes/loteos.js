const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/LoteoController');

// todos los endpoints ya reciben authMiddleware + requireTenantScope + tenancyMiddleware desde index.js

// ── Loteos ──────────────────────────────────
router.get('/cobranzas', ctrl.getCobranzasLoteos);
router.get('/', ctrl.getLoteos);
router.get('/:loteoId', ctrl.getLoteoById);
router.post('/', ctrl.createLoteo);
router.put('/:loteoId', ctrl.updateLoteo);
router.delete('/:loteoId', ctrl.deleteLoteo);
router.put('/:loteoId/plan', ctrl.saveLoteoPlan);
router.patch('/:loteoId/publish', ctrl.togglePublishLoteo);

// ── Lotes dentro de un loteo ─────────────────
router.post('/:loteoId/lotes', ctrl.createLote);
router.put('/:loteoId/lotes/:loteId', ctrl.updateLote);
router.delete('/:loteoId/lotes/:loteId', ctrl.deleteLote);

// ── Venta y plan de financiación de un lote ──
router.get('/:loteoId/lotes/:loteId/venta', ctrl.getVentaLote);
router.post('/:loteoId/lotes/:loteId/venta', ctrl.createVentaLote);
router.put('/:loteoId/lotes/:loteId/venta', ctrl.updateVentaLote);
router.delete('/:loteoId/lotes/:loteId/venta', ctrl.deleteVentaLote);
router.patch('/:loteoId/lotes/:loteId/venta/cuotas/:cuotaId/pagar', ctrl.pagarCuota);

module.exports = router;
