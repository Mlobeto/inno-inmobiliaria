const { Router } = require("express");
const { requireTenantScope } = require("../middlewares/platformAdminMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");

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
router.use("/public", require("./publicRoutes")); // Rutas públicas (planes, etc.)

// Alias directo para /plans - crea un mini-router inline
const plansRouter = Router();
const { Plan } = require("../data");
plansRouter.get("/", async (req, res) => {
  try {
    const plans = await Plan.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['priceMonthly', 'ASC']],
      attributes: [
        'planId', 'name', 'description', 'priceMonthly', 'priceYearly',
        'currency', 'features', 'trialDays', 'isActive', 'isPopular',
        'sortOrder', 'createdAt', 'updatedAt'
      ]
    });
    return res.status(200).json({ success: true, count: plans.length, plans });
  } catch (error) {
    console.error('❌ Error en GET /plans:', error);
    return res.status(500).json({ success: false, message: "Error al obtener planes" });
  }
});
router.use("/plans", plansRouter);

// Rutas de administrador de plataforma (solo PLATFORM_ADMIN)
router.use("/platform-admin", require("./platformAdmin"));

// Rutas de tenants (requieren tenantId - no accesibles por PLATFORM_ADMIN)
router.use("/admin", require("./admin")); // Maneja auth + tenancy internamente
router.use("/client", authMiddleware, requireTenantScope, require("./client"));
router.use("/client", authMiddleware, requireTenantScope, require("./clientDocumentRoutes")); // NUEVO: Rutas de documentos de clientes
router.use("/lease", authMiddleware, requireTenantScope, require("./lease"));
router.use("/payment", authMiddleware, requireTenantScope, require("./payment"));
router.use("/property", authMiddleware, requireTenantScope, require("./property"));
router.use("/garantor", authMiddleware, requireTenantScope, require("./garantor"));
router.use("/import", authMiddleware, requireTenantScope, require("./import"));
router.use("/pdf", authMiddleware, requireTenantScope, require("./pdf")); // PDF generation and templates
router.use("/pdf-templates", authMiddleware, requireTenantScope, require("./pdfTemplates")); // PDF template management
router.use("/tenant", authMiddleware, requireTenantScope, require("./tenant")); // Tenant management and signature
router.use("/subscriptions", require("./subscriptionRoutes")); // Maneja auth + tenancy internamente
router.use("/fix", require("./fixConstraints")); // Endpoint temporal

module.exports = router;
