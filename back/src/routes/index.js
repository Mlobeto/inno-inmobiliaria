const { Router } = require("express");
const { requireTenantScope } = require("../middlewares/platformAdminMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const { tenancyMiddleware } = require("../middlewares/tenancyMiddleware");
const { tenantLimiter } = require("../middlewares/rateLimiter");
const { checkSubscription, checkFeature } = require("../middlewares/subscriptionMiddleware");
const prisma = require('../utils/prismaClient');

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
router.use("/contact", require("./contact")); // Formulario de contacto público
router.use("/portal", require("./portal")); // Portal Inquilinos (auth propio)
router.use("/webhooks", require("./webhookRoutes")); // Payment webhooks
router.use("/public", require("./publicRoutes")); // Rutas públicas (planes, etc.)

// Alias directo para /plans - crea un mini-router inline
const plansRouter = Router();
plansRouter.get("/", async (req, res) => {
  try {
    const plans = await prisma.plans.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { priceMonthly: 'asc' }],
      select: {
        planId: true,
        name: true,
        description: true,
        priceMonthly: true,
        priceYearly: true,
        currency: true,
        features: true,
        trialDays: true,
        isActive: true,
        isPopular: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      }
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
router.use("/client", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, require("./client"));
router.use("/client", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, require("./clientDocumentRoutes")); // NUEVO: Rutas de documentos de clientes
router.use("/lease", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, require("./lease"));
router.use("/payment", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, require("./payment"));
router.use("/property", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, require("./property"));
router.use("/garantor", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, require("./garantor"));
router.use("/import", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, require("./import"));
router.use("/pdf", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, require("./pdf")); // PDF generation and templates
router.use("/pdf-templates", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, require("./pdfTemplates")); // PDF template management
router.use("/tenant", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, require("./tenant")); // Tenant management and signature
router.use("/upload", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, require("./upload")); // File upload → Azure Blob Storage
router.use("/subscriptions", require("./subscriptionRoutes")); // Maneja auth + tenancy internamente
router.use("/mercadolibre", require("./mercadolibre")); // MercadoLibre integration
router.use("/leads", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, checkSubscription, checkFeature('leads'), require("./leads")); // Leads/CRM
router.use("/tickets", require("./tickets")); // Soporte / Tickets (maneja auth internamente)
router.use("/loteos", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, checkSubscription, checkFeature('loteos'), require("./loteos")); // Loteos y lotes
router.use("/agents", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, checkSubscription, checkFeature('agentRole'), require("./agents")); // Gestión de agentes/usuarios del tenant
router.use("/commissions", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, checkSubscription, checkFeature('agentRole'), require("./commissions")); // Comisiones de agentes
router.use("/owner-settlements", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, require("./ownerSettlements")); // Liquidaciones al propietario
router.use("/temporary-rental", authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter, require("./temporaryRentalRoutes")); // Alquileres temporales
router.use("/electronic-invoicing", require("./electronicInvoiceRoutes")); // ARCA/AFIP facturación electrónica
router.use("/dolar", require("./dolar")); // Cotización del dólar (proxy Bluelytics)
router.use("/fix", require("./fixConstraints")); // Endpoint temporal

module.exports = router;
