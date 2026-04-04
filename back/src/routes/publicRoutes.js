const { Router } = require('express');
const prisma = require('../utils/prismaClient');
const publicController = require('../controllers/publicController');

const router = Router();

/**
 * GET /api/public/plans
 * Endpoint público para listar planes activos
 * NO requiere autenticación
 */
router.get('/plans', async (req, res) => {
  try {
    console.log('📋 Public Plans - Listando planes públicos');
    
    const plans = await prisma.plans.findMany({
      where: {
        isActive: true,
        planId: { not: 'lifetime' },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { priceMonthly: 'asc' }
      ],
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

    console.log(`✅ Public Plans - ${plans.length} planes activos encontrados`);

    return res.status(200).json({
      success: true,
      count: plans.length,
      plans
    });

  } catch (error) {
    console.error('❌ Error en GET /public/plans:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener planes',
      error: error.message
    });
  }
});

/**
 * GET /api/public/:subdomain
 * Landing page del tenant con propiedades publicadas
 */
router.get('/:subdomain', publicController.getTenantLanding);

/**
 * GET /api/public/:subdomain/property/:propertyId
 * Detalle de una propiedad publicada
 */
router.get('/:subdomain/property/:propertyId', publicController.getPropertyDetail);

module.exports = router;
