const { Router } = require('express');
const router = Router();
const CommissionController = require('../controllers/CommissionController');

// Middleware: solo SUPER_ADMIN
function requireSuperAdmin(req, res, next) {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Solo el administrador principal puede gestionar comisiones' });
  }
  next();
}

// Crear comisión: SUPER_ADMIN o AGENT sólo sobre sí mismo
function requireCommissionCreate(req, res, next) {
  if (req.user.role === 'SUPER_ADMIN') return next();
  if (req.user.role === 'AGENT') {
    const aid = Number(req.body?.agentId);
    if (!aid || aid !== req.user.adminId) {
      return res.status(403).json({
        success: false,
        message: 'Solo podés registrar comisiones a nombre tuyo (agente)',
      });
    }
    return next();
  }
  return res.status(403).json({ success: false, message: 'Sin permiso para crear comisiones' });
}

// GET /commissions/settlement — resumen de liquidación por agente (solo SUPER_ADMIN)
router.get('/settlement', requireSuperAdmin, CommissionController.getSettlement);

// GET /commissions — listar comisiones (SUPER_ADMIN: todas; AGENT: solo propias)
router.get('/', CommissionController.listCommissions);

// GET /commissions/:id — detalle
router.get('/:id', CommissionController.getCommissionById);

// POST /commissions — crear comisión manual (ADMIN o AGENT sólo autocreada)
router.post('/', requireCommissionCreate, CommissionController.createCommission);

// PUT /commissions/:id — actualizar comisión (solo SUPER_ADMIN, solo PENDING)
router.put('/:id', requireSuperAdmin, CommissionController.updateCommission);

// POST /commissions/:id/approve — aprobar comisión (solo SUPER_ADMIN)
router.post('/:id/approve', requireSuperAdmin, CommissionController.approveCommission);

// POST /commissions/:id/pay — marcar como pagada (solo SUPER_ADMIN)
router.post('/:id/pay', requireSuperAdmin, CommissionController.markPaid);

// POST /commissions/:id/cancel — cancelar comisión (solo SUPER_ADMIN)
router.post('/:id/cancel', requireSuperAdmin, CommissionController.cancelCommission);

module.exports = router;
