/**
 * Middleware de autorización para Platform Admin
 * Solo permite acceso a usuarios con rol PLATFORM_ADMIN
 * Estos usuarios gestionan toda la plataforma InnoInmo (todos los tenants)
 */

const isPlatformAdmin = async (req, res, next) => {
  try {
    const { role, email, tenantId } = req.user;
    
    // Verificar que el usuario tenga rol PLATFORM_ADMIN
    if (role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Esta ruta requiere permisos de Platform Admin.',
        requiredRole: 'PLATFORM_ADMIN',
        currentRole: role,
      });
    }
    
    // Verificar que PLATFORM_ADMIN no tenga tenantId (debe ser null)
    if (tenantId !== null && tenantId !== undefined) {
      return res.status(403).json({
        error: 'Configuración inválida',
        message: 'Los Platform Admins no deben estar asociados a un tenant específico.',
      });
    }
    
    // Opcional: verificar email en whitelist (variable de entorno)
    const allowedEmails = process.env.PLATFORM_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
      return res.status(403).json({
        error: 'Email no autorizado',
        message: 'Tu email no está en la lista de Platform Admins autorizados.',
        hint: 'Contacta al administrador del sistema.',
      });
    }
    
    // Todo OK, continuar
    console.log(`✅ Platform Admin autorizado: ${email} (${role})`);
    next();
    
  } catch (error) {
    console.error('❌ Error en platformAdminMiddleware:', error);
    res.status(500).json({ 
      error: 'Error verificando permisos',
      message: error.message 
    });
  }
};

/**
 * Middleware para verificar que el usuario NO sea PLATFORM_ADMIN
 * Útil para rutas que requieren estar asociado a un tenant específico
 */
const requireTenantScope = (req, res, next) => {
  try {
    const { role, tenantId } = req.user;
    
    if (role === 'PLATFORM_ADMIN') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Esta ruta requiere estar asociado a un tenant específico.',
        hint: 'Los Platform Admins deben usar las rutas /platform-admin/*',
      });
    }
    
    if (!tenantId) {
      return res.status(403).json({
        error: 'Tenant no encontrado',
        message: 'Tu usuario debe estar asociado a una inmobiliaria (tenant).',
      });
    }
    
    next();
    
  } catch (error) {
    console.error('❌ Error en requireTenantScope:', error);
    res.status(500).json({ 
      error: 'Error verificando scope',
      message: error.message 
    });
  }
};

module.exports = {
  isPlatformAdmin,
  requireTenantScope,
};
