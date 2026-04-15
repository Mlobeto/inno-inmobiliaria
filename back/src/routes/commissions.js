const { Router } = require('express');
const router = Router();
const CommissionController = require('../controllers/CommissionController');

// Middleware para verificar que solo SUPER_ADMIN puede hacer operaciones de escritura
function requireSuperAdmin(req, res, next) {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Solo el administrador principal puede gestionar comisiones' });
  }
  next();
}

// GET /commissions/settlement — resumen de liquidación por agente (solo SUPER_ADMIN)
router.get('/settlement', requireSuperAdmin, CommissionController.getSettlement);

// GET /commissions — listar comisiones (SUPER_ADMIN: todas; AGENT: solo propias)
router.get('/', CommissionController.listCommissions);

// GET /commissions/:id — detalle
router.get('/:id', CommissionController.getCommissionById);

// POST /commissions — crear comisión manual (solo SUPER_ADMIN)
router.post('/', requireSuperAdmin, CommissionController.createCommission);

// PUT /commissions/:id — actualizar comisión (solo SUPER_ADMIN, solo PENDING)
router.put('/:id', requireSuperAdmin, CommissionController.updateCommission);

// POST /commissions/:id/approve — aprobar comisión (solo SUPER_ADMIN)
router.post('/:id/approve', requireSuperAdmin, CommissionController.approveCommission);

// POST /commissions/:id/pay — marcar como pagada (solo SUPER_ADMIN)
router.post('/:id/pay', requireSuperAdmin, CommissionController.markPaid);

// POST /commissions/:id/cancel — cancelar comisión (solo SUPER_ADMIN)
router.post('/:id/cancel', requireSuperAdmin, CommissionController.cancelCommission);

module.exports = router;
