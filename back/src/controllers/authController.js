const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../utils/prismaClient');
const { sendPasswordResetEmail, sendPasswordChangedEmail } = require('../emailService');
const { MercadoPagoConfig, PreApproval } = require('mercadopago');
require('dotenv').config();  // Para usar las variables de entorno

// Configurar MercadoPago
const mpClient = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 }
});
const preApprovalClient = new PreApproval(mpClient);

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
      const newAdmin = await prisma.admins.create({ data: { username, password: hashedPassword } });
      console.log('Admin creado:', newAdmin);
  
      res.status(201).json({ message: 'Admin registrado con éxito', admin: newAdmin });
    } catch (error) {
      console.error('Error en el registro:', error);  // Log del error en la consola
      res.status(500).json({ message: 'Error en el registro', error: error.message });
    }
  };

/**
 * Registrar un nuevo tenant - Registro simple
 * POST /auth/register-tenant
 * Body: { fullName, email, password, planId }
 */
exports.registerTenant = async (req, res) => {
  const { fullName, email, password, planId } = req.body;
  
  console.log('POST /auth/register-tenant - Datos recibidos:', { fullName, email, hasPassword: !!password, planId });

  try {
    // Validaciones
    if (!fullName || !email || !password) {
      console.log('❌ Validación fallida - Campos faltantes:', { fullName: !!fullName, email: !!email, password: !!password });
      return res.status(400).json({ 
        success: false,
        error: 'Nombre, email y contraseña son requeridos' 
      });
    }

    // Verificar si el email ya existe
    const existingTenant = await prisma.tenants.findFirst({ where: { email } });
    if (existingTenant) {
      return res.status(409).json({ 
        success: false,
        error: 'Ya existe una cuenta con este email' 
      });
    }

    // Generar nombre de empresa temporal basado en email
    const emailUser = email.split('@')[0];
    const tempCompanyName = `Empresa ${emailUser}`;

    // Generar subdomain automático del email
    const subdomain = emailUser
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);

    // Verificar si el subdomain ya existe (agregar número si es necesario)
    let finalSubdomain = subdomain;
    let counter = 1;
    while (await prisma.tenants.findFirst({ where: { subdomain: finalSubdomain } })) {
      finalSubdomain = `${subdomain}-${counter}`;
      counter++;
    }

    // Buscar plan por planId (si no se envía, usar 'basic' por defecto)
    const selectedPlanId = planId || 'basic';
    const plan = await prisma.plans.findFirst({ where: { planId: selectedPlanId, isActive: true } });
    if (!plan) {
      console.log('❌ Plan no encontrado:', selectedPlanId);
      return res.status(400).json({ 
        success: false,
        error: `Plan "${selectedPlanId}" no disponible` 
      });
    }

    console.log('✅ Plan encontrado:', plan.planId, plan.name, `(${plan.trialDays} días trial)`);

    // Generar CUIT temporal
    const tempCuit = `99-${Math.floor(10000000 + Math.random() * 90000000)}-9`;

    // Determinar el status inicial (trialing si el plan lo tiene)
    const tenantStatus = plan.trialDays > 0 ? 'trialing' : 'active';

    // Crear el tenant con datos del plan seleccionado
    const newTenant = await prisma.tenants.create({
      data: {
        businessName: tempCompanyName,
        email,
        cuit: tempCuit,
        subdomain: finalSubdomain,
        status: tenantStatus,
        plan: plan.planId.toUpperCase(),
        maxAgents: plan.maxUsers || 2,
        maxProperties: plan.maxProperties || 50,
        features: plan.features || {},
        trialEndsAt: plan.trialDays > 0 ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ Tenant creado:', newTenant.tenantId, newTenant.businessName, `Plan: ${newTenant.plan}`);

    // Hash de la contraseña para el admin
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario admin del tenant
    const newAdmin = await prisma.admins.create({
      data: {
        username: email,
        password: hashedPassword,
        fullName,
        email,
        role: 'SUPER_ADMIN',
        tenantId: newTenant.tenantId,
      },
    });

    console.log('✅ Admin creado:', newAdmin.adminId, newAdmin.username);

    // Crear suscripción gratuita por defecto
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + (plan.trialDays || 30));

    const subscription = await prisma.subscriptions.create({
      data: {
        tenantId: newTenant.tenantId,
        planId: plan.planId,
        status: plan.trialDays > 0 ? 'trialing' : 'active',
        paymentProvider: 'manual',
        trialStart: plan.trialDays > 0 ? trialStart : null,
        trialEnd: plan.trialDays > 0 ? trialEnd : null,
        currentPeriodStart: trialStart,
        currentPeriodEnd: trialEnd,
        billingCycle: 'monthly',
        amount: 0,
        currency: 'ARS',
      },
    });

    console.log('✅ Suscripción creada:', subscription.subscriptionId);

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: newAdmin.adminId, 
        role: newAdmin.role,
        tenantId: newAdmin.tenantId
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      success: true,
      message: 'Cuenta creada exitosamente',
      token,
      user: {
        adminId: newAdmin.adminId,
        username: newAdmin.username,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        role: newAdmin.role,
        tenantId: newAdmin.tenantId
      },
      tenant: {
        tenantId: newTenant.tenantId,
        businessName: newTenant.businessName,
        subdomain: newTenant.subdomain,
        plan: newTenant.plan
      },
      subscription: subscription ? {
        subscriptionId: subscription.subscriptionId,
        status: subscription.status,
        trialEnd: subscription.trialEnd
      } : null,
      needsProfileCompletion: true // Indica que debe ir a CompanySettings
    });
  } catch (error) {
    console.error('❌ Error en registro de tenant:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Error al crear la cuenta',
      details: error.message 
    });
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
    const existingAdmin = await prisma.admins.findFirst({ where: { username } });
    if (existingAdmin) {
      return res.status(409).json({ message: 'El username ya está en uso' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el Platform Admin con tenantId = null
    const newPlatformAdmin = await prisma.admins.create({
      data: {
        username,
        password: hashedPassword,
        fullName: fullName || 'Platform Administrator',
        email: email || null,
        role: 'PLATFORM_ADMIN',
        tenantId: null,
      },
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
    const admin = await prisma.admins.findFirst({ where: { username } });
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
    const admin = await prisma.admins.findUnique({ where: { adminId: decoded.id } });
    
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
    const admins = await prisma.admins.findMany();
    
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
    const admin = await prisma.admins.findUnique({ where: { adminId: parseInt(adminId) } });
    if (!admin) {
      return res.status(404).json({ message: 'Administrador no encontrado' });
    }

    // Si se proporciona una nueva contraseña, la hasheamos
    let updatedPassword = admin.password;
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    // Actualizamos el administrador
    const updatedAdmin = await prisma.admins.update({
      where: { adminId: parseInt(adminId) },
      data: {
        username: username || admin.username,
        password: updatedPassword,
      },
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
    const admin = await prisma.admins.findFirst({ where: { username: email } });

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
    await prisma.password_reset_tokens.updateMany({
      where: { adminId: admin.adminId, used: false },
      data: { used: true },
    });

    // Crear nuevo token
    await prisma.password_reset_tokens.create({
      data: {
        adminId: admin.adminId,
        email: admin.username,
        token: hashedToken,
        expiresAt,
        used: false,
      },
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
    const resetToken = await prisma.password_reset_tokens.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: { admins: true },
    });

    if (!resetToken) {
      console.log('POST /auth/reset-password - Token inválido o expirado');
      return res.status(400).json({ 
        message: 'Token inválido o expirado. Solicita uno nuevo.' 
      });
    }

    // Actualizar contraseña del admin
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.admins.update({
      where: { adminId: resetToken.adminId },
      data: { password: hashedPassword },
    });

    // Marcar token como usado
    await prisma.password_reset_tokens.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Enviar email de confirmación
    try {
      await sendPasswordChangedEmail(
        resetToken.email, 
        resetToken.admins.username
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
    const admin = await prisma.admins.findUnique({ where: { adminId: parseInt(adminId) } });
    if (!admin) {
      return res.status(404).json({ message: 'Administrador no encontrado' });
    }

    // Eliminamos el administrador
    await prisma.admins.delete({ where: { adminId: parseInt(adminId) } });
    res.status(200).json({ message: 'Administrador eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar administrador:', error);
    res.status(500).json({ message: 'Error al eliminar administrador', error: error.message });
  }
};

// ─── Push Token ────────────────────────────────────────────────────────────────

/**
 * PUT /api/auth/push-token
 * Registra o actualiza el Expo push token del dispositivo del admin autenticado.
 * Requiere: authMiddleware
 * Body: { pushToken: string }
 */
exports.updatePushToken = async (req, res) => {
  try {
    const adminId = req.user?.adminId;
    const { pushToken } = req.body;

    if (!pushToken || typeof pushToken !== 'string') {
      return res.status(400).json({ message: 'pushToken requerido' });
    }

    // Validación básica del formato Expo push token
    if (!pushToken.startsWith('ExponentPushToken[') && !pushToken.startsWith('ExpoPushToken[')) {
      return res.status(400).json({ message: 'Formato de pushToken inválido' });
    }

    await prisma.admins.update({
      where: { adminId },
      data: { pushToken },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar pushToken:', error);
    res.status(500).json({ message: 'Error interno' });
  }
};

