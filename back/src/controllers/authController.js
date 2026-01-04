const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {Admin, PasswordResetToken} = require('../data');  // Modelo de administrador
const { sendPasswordResetEmail, sendPasswordChangedEmail } = require('../emailService');
require('dotenv').config();  // Para usar las variables de entorno

// Registrar un administrador
exports.register = async (req, res) => {
    const { username, password } = req.body;
  
    // Agregar logs para debug
    console.log('Datos recibidos:', { username, password });
  
    try {
      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('Contraseña hasheada:', hashedPassword);
  
      // Crear el nuevo administrador en la base de datos
      const newAdmin = await Admin.create({ username, password: hashedPassword });
      console.log('Admin creado:', newAdmin);
  
      res.status(201).json({ message: 'Admin registrado con éxito', admin: newAdmin });
    } catch (error) {
      console.error('Error en el registro:', error);  // Log del error en la consola
      res.status(500).json({ message: 'Error en el registro', error: error.message });
    }
  };

// Registrar un Platform Admin (sin tenantId)
exports.registerPlatformAdmin = async (req, res) => {
  const { username, password, fullName, email } = req.body;

  console.log('POST /auth/register-platform-admin - Creando Platform Admin:', { username, email });

  try {
    // Validar datos requeridos
    if (!username || !password) {
      return res.status(400).json({ message: 'Username y password son requeridos' });
    }

    // Verificar que el username no exista
    const existingAdmin = await Admin.findOne({ where: { username } });
    if (existingAdmin) {
      return res.status(409).json({ message: 'El username ya está en uso' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el Platform Admin con tenantId = null
    const newPlatformAdmin = await Admin.create({
      username,
      password: hashedPassword,
      fullName: fullName || 'Platform Administrator',
      email: email || null,
      role: 'PLATFORM_ADMIN',
      tenantId: null // NULL para Platform Admin
    });

    console.log('✅ Platform Admin creado:', {
      adminId: newPlatformAdmin.adminId,
      username: newPlatformAdmin.username,
      role: newPlatformAdmin.role,
      tenantId: newPlatformAdmin.tenantId
    });

    res.status(201).json({
      message: 'Platform Admin registrado con éxito',
      admin: {
        adminId: newPlatformAdmin.adminId,
        username: newPlatformAdmin.username,
        fullName: newPlatformAdmin.fullName,
        email: newPlatformAdmin.email,
        role: newPlatformAdmin.role,
        tenantId: newPlatformAdmin.tenantId
      }
    });
  } catch (error) {
    console.error('❌ Error al crear Platform Admin:', error);
    res.status(500).json({ message: 'Error al crear Platform Admin', error: error.message });
  }
};

// Iniciar sesión (login)
exports.loginAdmin = async (req, res) => {
  const { username, password } = req.body;
  
  console.log('POST /auth/login - Datos recibidos:', { username, password: '***' });

  try {
    const admin = await Admin.findOne({ where: { username } });
    if (!admin) {
      console.log('POST /auth/login - Usuario no encontrado:', username);
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.log('POST /auth/login - Credenciales inválidas para:', username);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: admin.adminId, role: admin.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    console.log('POST /auth/login - Login exitoso para:', username, 'ID:', admin.adminId);
    
    res.status(200).json({ 
      message: 'Inicio de sesión exitoso', 
      token, 
      admin: {
        adminId: admin.adminId,
        username: admin.username,
        role: admin.role,
        tenantId: admin.tenantId || null // Importante para diferenciar PLATFORM_ADMIN
      }
    });
  } catch (error) {
    console.error('POST /auth/login - Error:', error);
    res.status(500).json({ message: 'Error en el inicio de sesión', error: error.message });
  }
};


exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('GET /auth/verify - No se proporcionó token');
      return res.status(401).json({ message: 'No se proporcionó token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const admin = await Admin.findByPk(decoded.id);
    
    if (!admin) {
      console.log('GET /auth/verify - Admin no encontrado para token');
      return res.status(401).json({ message: 'Token inválido' });
    }

    console.log('GET /auth/verify - Token válido para:', admin.username);
    
    res.status(200).json({ 
      message: 'Token válido', 
      admin: {
        adminId: admin.adminId,
        username: admin.username,
        role: admin.role,
        tenantId: admin.tenantId || null
      }
    });
  } catch (error) {
    console.error('GET /auth/verify - Error:', error);
    res.status(401).json({ message: 'Token inválido', error: error.message });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    // Obtener todos los administradores
    const admins = await Admin.findAll();
    
    // Verificar si hay administradores
    if (admins.length === 0) {
      return res.status(404).json({ message: 'No se encontraron administradores' });
    }

    // Devolver los administradores encontrados
    res.status(200).json({ admins });
  } catch (error) {
    console.error('Error al obtener administradores:', error);
    res.status(500).json({ message: 'Error al obtener administradores', error: error.message });
  }
};

// Editar administrador
exports.editAdmin = async (req, res) => {
  const { adminId } = req.params;  // ID del administrador a editar
  const { username, password } = req.body;  // Nuevos datos del admin

  try {
    const admin = await Admin.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Administrador no encontrado' });
    }

    // Si se proporciona una nueva contraseña, la hasheamos
    let updatedPassword = admin.password;  // Mantener la contraseña actual por defecto
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);  // Hashear la nueva contraseña
    }

    // Actualizamos el administrador
    const updatedAdmin = await admin.update({
      username: username || admin.username,  // Solo actualizamos el username si se proporciona uno nuevo
      password: updatedPassword,  // Actualizamos la contraseña si es necesario
    });

    res.status(200).json({ message: 'Administrador actualizado con éxito', admin: updatedAdmin });
  } catch (error) {
    console.error('Error al editar administrador:', error);
    res.status(500).json({ message: 'Error al editar administrador', error: error.message });
  }
};

// ==================== RECUPERACIÓN DE CONTRASEÑA ====================

/**
 * Solicitar recuperación de contraseña
 * Genera un token y envía email con link de reset
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  console.log('POST /auth/forgot-password - Solicitud para:', email);

  try {
    // Buscar admin por email (puede ser username o email dependiendo de tu schema)
    const admin = await Admin.findOne({ 
      where: { username: email } // Ajustar si tienes campo email separado
    });

    // Por seguridad, siempre respondemos con éxito aunque no exista el usuario
    if (!admin) {
      console.log('POST /auth/forgot-password - Usuario no encontrado:', email);
      return res.status(200).json({ 
        message: 'Si el email existe, recibirás un link de recuperación' 
      });
    }

    // Generar token único y seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Establecer expiración: 1 hora desde ahora
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Invalidar tokens anteriores del mismo usuario
    await PasswordResetToken.update(
      { used: true },
      { 
        where: { 
          adminId: admin.adminId,
          used: false 
        } 
      }
    );

    // Crear nuevo token
    await PasswordResetToken.create({
      adminId: admin.adminId,
      email: admin.username, // O admin.email si tienes ese campo
      token: hashedToken,
      expiresAt,
      used: false
    });

    // Enviar email (usar el token sin hashear en el link)
    try {
      await sendPasswordResetEmail(admin.username, resetToken, admin.username);
      console.log('POST /auth/forgot-password - Email enviado a:', email);
    } catch (emailError) {
      console.error('Error al enviar email:', emailError);
      // No revelar error de email al cliente por seguridad
    }

    res.status(200).json({ 
      message: 'Si el email existe, recibirás un link de recuperación',
      // En desarrollo, devolver el token (ELIMINAR EN PRODUCCIÓN)
      ...(process.env.NODE_ENV === 'development' && { token: resetToken })
    });

  } catch (error) {
    console.error('POST /auth/forgot-password - Error:', error);
    res.status(500).json({ 
      message: 'Error al procesar solicitud', 
      error: error.message 
    });
  }
};

/**
 * Resetear contraseña con token
 * Valida el token y actualiza la contraseña
 */
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  
  console.log('POST /auth/reset-password - Intento de reset');

  try {
    // Validar que se envió contraseña
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Hashear el token recibido para compararlo con la BD
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar token válido
    const resetToken = await PasswordResetToken.findOne({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: {
          [require('sequelize').Op.gt]: new Date() // Token no expirado
        }
      },
      include: [{
        model: Admin,
        as: 'admin'
      }]
    });

    if (!resetToken) {
      console.log('POST /auth/reset-password - Token inválido o expirado');
      return res.status(400).json({ 
        message: 'Token inválido o expirado. Solicita uno nuevo.' 
      });
    }

    // Actualizar contraseña del admin
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await Admin.update(
      { password: hashedPassword },
      { where: { adminId: resetToken.adminId } }
    );

    // Marcar token como usado
    await resetToken.update({ used: true });

    // Enviar email de confirmación
    try {
      await sendPasswordChangedEmail(
        resetToken.email, 
        resetToken.admin.username
      );
      console.log('POST /auth/reset-password - Email de confirmación enviado');
    } catch (emailError) {
      console.error('Error al enviar email de confirmación:', emailError);
      // No bloquear el proceso si falla el email
    }

    console.log('POST /auth/reset-password - Contraseña actualizada para:', resetToken.email);

    res.status(200).json({ 
      message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' 
    });

  } catch (error) {
    console.error('POST /auth/reset-password - Error:', error);
    res.status(500).json({ 
      message: 'Error al resetear contraseña', 
      error: error.message 
    });
  }
};


// Eliminar administrador
exports.deleteAdmin = async (req, res) => {
  const { adminId } = req.params;  // ID del administrador a eliminar

  try {
    const admin = await Admin.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Administrador no encontrado' });
    }

    // Eliminamos el administrador
    await admin.destroy();
    res.status(200).json({ message: 'Administrador eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar administrador:', error);
    res.status(500).json({ message: 'Error al eliminar administrador', error: error.message });
  }
};

