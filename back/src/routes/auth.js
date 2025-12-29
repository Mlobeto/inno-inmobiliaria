const express = require('express');
const { register, loginAdmin, getAllAdmins, verifyToken, editAdmin, deleteAdmin } = require('../controllers/authController');
const router = express.Router();


router.post('/register', register);

router.post('/login', loginAdmin);

router.get('/verify', verifyToken);

router.get('/admin', getAllAdmins);

router.put('/:adminId', editAdmin);

router.delete('/:adminId', deleteAdmin)

module.exports = router;