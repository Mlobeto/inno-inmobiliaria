const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/TicketController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireTenantScope, isPlatformAdmin } = require('../middlewares/platformAdminMiddleware');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');
const { tenantLimiter } = require('../middlewares/rateLimiter');

// ── Rutas de TENANT (requieren ser tenant, no platform admin) ──
const tenantRouter = express.Router();
tenantRouter.use(authMiddleware, requireTenantScope, tenancyMiddleware, tenantLimiter);
tenantRouter.get('/', ticketController.getMyTickets);
tenantRouter.post('/', ticketController.createTicket);
tenantRouter.post('/:ticketId/messages', ticketController.addTenantMessage);

// ── Rutas de PLATFORM ADMIN ──
const adminRouter = express.Router();
adminRouter.use(authMiddleware, isPlatformAdmin);
adminRouter.get('/stats', ticketController.getTicketStats);
adminRouter.get('/', ticketController.getAllTickets);
adminRouter.get('/:ticketId', ticketController.getTicketById);
adminRouter.post('/:ticketId/messages', ticketController.addAdminMessage);
adminRouter.patch('/:ticketId/status', ticketController.updateTicketStatus);

router.use('/admin', adminRouter);
router.use('/', tenantRouter);

module.exports = router;
