const { Router } = require("express");
const { requireTenantScope } = require("../middlewares/platformAdminMiddleware");

const router = Router();

try {
    // Intentamos resolver la ruta del archivo
    console.log(require.resolve("./ClientWithRole"));
    
    // Si no hay errores, procedemos con la carga de la ruta
    router.use("/clientRole", require("./ClientWithRole"));
  } catch (error) {
    // Si ocurre un error, lo mostramos en la consola
    console.error("No se pudo encontrar clientWithRole:", error);
  }

// Rutas públicas (sin requireTenantScope)
router.use("/auth", require("./auth"));
router.use("/webhooks", require("./webhookRoutes")); // Payment webhooks

// Rutas de administrador de plataforma (solo PLATFORM_ADMIN)
router.use("/platform-admin", require("./platformAdmin"));

// Rutas de tenants (requieren tenantId - no accesibles por PLATFORM_ADMIN)
router.use("/admin", requireTenantScope, require("./admin"));
router.use("/client", requireTenantScope, require("./client"));
router.use("/lease", requireTenantScope, require("./lease"));
router.use("/payment", requireTenantScope, require("./payment"));
router.use("/property", requireTenantScope, require("./property"));
router.use("/garantor", requireTenantScope, require("./garantor"));
router.use("/import", requireTenantScope, require("./import"));
router.use("/pdf", requireTenantScope, require("./pdf")); // PDF generation and templates
router.use("/tenant", requireTenantScope, require("./tenant")); // Tenant management and signature
router.use("/subscriptions", requireTenantScope, require("./subscriptionRoutes")); // Plans and subscriptions
router.use("/fix", require("./fixConstraints")); // Endpoint temporal

module.exports = router;
