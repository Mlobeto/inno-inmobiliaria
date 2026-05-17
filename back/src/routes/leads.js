const express = require('express');
const leadController = require('../controllers/LeadController');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');

const router = express.Router();

router.use(tenancyMiddleware);

router.get('/',                          leadController.getAllLeads);
router.get('/:id',                       leadController.getLeadById);
router.post('/',                         leadController.createLead);
router.put('/:id',                       leadController.updateLead);
router.delete('/:id',                    leadController.deleteLead);
// Gestión de agentes asignados (solo SUPER_ADMIN)
router.post('/:id/assign',               leadController.assignAgent);
router.delete('/:id/assign/:agentId',    leadController.unassignAgent);

module.exports = router;
