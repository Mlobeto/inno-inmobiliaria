'use strict';

/**
 * Bloquea al rol AGENT en módulos de tenant que no sean leads/comisiones/gestión mínima.
 * Los filtros por agente dentro de cada controlador siguen aplicando donde corresponde.
 */
function forbidAgents(req, res, next) {
  if (req.user?.role !== 'AGENT') return next();

  res.status(403).json({
    success: false,
    code: 'AGENT_RESTRICTED',
    message: 'Tu usuario agente tiene acceso solo a Leads y a tus propias comisiones.',
  });
}

module.exports = forbidAgents;
