const jwt = require('jsonwebtoken');
const prisma = require('../utils/prismaClient');
require('dotenv').config();

function looksLikeEmail(value) {
  const s = String(value || '').trim();
  return s.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** Email de contacto/cobros: campo `email` o `username` si tiene formato correo (muchos registros tienen solo username). */
function resolveAdminBillingEmail(admin) {
  const field = (admin.email || '').trim();
  if (looksLikeEmail(field)) return field;
  const user = (admin.username || '').trim();
  if (looksLikeEmail(user)) return user;
  return field || null;
}

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado, se requiere token válido' });
  }

  const token = authHeader.split(' ')[1]; // Extraer el token después de "Bearer"

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Buscar el admin completo en la base de datos
    const admin = await prisma.admins.findUnique({ where: { adminId: verified.id } });
    if (!admin) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    
    // Establecer req.user con toda la información del admin
    req.user = {
      adminId: Number(admin.adminId),
      username: admin.username,
      email: resolveAdminBillingEmail(admin),
      role: admin.role,
      tenantId: admin.tenantId != null ? Number(admin.tenantId) : null,
    };
    
    // Mantener compatibilidad con código antiguo
    req.adminId = verified.id;
    req.role = verified.role;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = authMiddleware;
