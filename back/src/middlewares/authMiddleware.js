const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado, se requiere token válido' });
  }

  const token = authHeader.split(' ')[1]; // Extraer el token después de "Bearer"

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.adminId = verified.id; // Asegúrate de que coincida con el payload del token
    req.role = verified.role; // Si necesitas el rol
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = authMiddleware;
