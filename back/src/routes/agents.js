const { Router } = require('express');
const router = Router();
const AgentController = require('../controllers/AgentController');

// Middleware para verificar que solo el SUPER_ADMIN puede gestionar otros usuarios
function requireSuperAdmin(req, res, next) {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Solo el administrador principal puede gestionar agentes' });
  }
  next();
}

// GET /agents — listar agentes del tenant
router.get('/', requireSuperAdmin, AgentController.listAgents);

// GET /agents/:agentId — detalle de agente
router.get('/:agentId', requireSuperAdmin, AgentController.getAgentById);

// POST /agents — crear agente
router.post('/', requireSuperAdmin, AgentController.createAgent);

// PUT /agents/:agentId — actualizar agente
router.put('/:agentId', requireSuperAdmin, AgentController.updateAgent);

// DELETE /agents/:agentId — desactivar agente
router.delete('/:agentId', requireSuperAdmin, AgentController.deactivateAgent);

// POST /agents/:agentId/reactivate — reactivar agente
router.post('/:agentId/reactivate', requireSuperAdmin, AgentController.reactivateAgent);

module.exports = router;
