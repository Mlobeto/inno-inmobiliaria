const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const AdminSettingsController = require('../controllers/AdminSettingsController');
const router = express.Router();


router.get('/', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'Bienvenido al panel de administración' });
});

// Rutas de firma
router.get('/signature', AdminSettingsController.getSignature);
router.post('/signature', AdminSettingsController.saveSignature);
router.delete('/signature', AdminSettingsController.deleteSignature);

module.exports = router;