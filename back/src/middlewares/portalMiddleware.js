const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación para el Portal Inquilinos
 * Verifica un JWT con { idClient, tenantId, role: 'INQUILINO' }
 */
const portalMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado, se requiere token válido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (verified.role !== 'INQUILINO') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    req.portalClient = {
      idClient: verified.idClient,
      tenantId: verified.tenantId,
    };

    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = portalMiddleware;
