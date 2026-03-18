const express = require('express');
const { 
  register,
  registerTenant,
  registerPlatformAdmin,
  loginAdmin, 
  getAllAdmins, 
  verifyToken, 
  editAdmin, 
  deleteAdmin,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimiter');
const router = express.Router();

// Autenticación básica
router.post('/register', authLimiter, register);
router.post('/register-tenant', authLimiter, registerTenant); // 🆕 NUEVO - Registro de tenant con plan
router.post('/register-platform-admin', authLimiter, registerPlatformAdmin); // Nueva ruta para Platform Admin
router.post('/login', authLimiter, loginAdmin);
router.get('/verify', verifyToken);

// Recuperación de contraseña
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Gestión de admins
router.get('/admin', getAllAdmins);
router.put('/:adminId', editAdmin);
router.delete('/:adminId', deleteAdmin);

module.exports = router;