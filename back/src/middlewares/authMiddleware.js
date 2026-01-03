const jwt = require('jsonwebtoken');
const { Admin } = require('../data');
require('dotenv').config();

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado, se requiere token válido' });
  }

  const token = authHeader.split(' ')[1]; // Extraer el token después de "Bearer"

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    // Buscar el admin completo en la base de datos
    const admin = await Admin.findByPk(verified.id);
    
    if (!admin) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    
    // Establecer req.user con toda la información del admin
    req.user = {
      adminId: admin.adminId,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      tenantId: admin.tenantId
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
