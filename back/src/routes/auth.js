const express = require('express');
const { 
  register,
  registerPlatformAdmin,
  loginAdmin, 
  getAllAdmins, 
  verifyToken, 
  editAdmin, 
  deleteAdmin,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const router = express.Router();

// Autenticación básica
router.post('/register', register);
router.post('/register-platform-admin', registerPlatformAdmin); // Nueva ruta para Platform Admin
router.post('/login', loginAdmin);
router.get('/verify', verifyToken);

// Recuperación de contraseña
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Gestión de admins
router.get('/admin', getAllAdmins);
router.put('/:adminId', editAdmin);
router.delete('/:adminId', deleteAdmin);

module.exports = router;