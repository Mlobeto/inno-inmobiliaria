const { Router } = require('express');
const { Plan } = require('../data');

const router = Router();

/**
 * GET /api/public/plans
 * Endpoint público para listar planes activos
 * NO requiere autenticación
 */
router.get('/plans', async (req, res) => {
  try {
    console.log('📋 Public Plans - Listando planes públicos');
    
    const plans = await Plan.findAll({
      where: {
        isActive: true // Solo planes activos
      },
      order: [
        ['sortOrder', 'ASC'],
        ['priceMonthly', 'ASC']
      ],
      attributes: [
        'planId',
        'name',
        'description',
        'priceMonthly',
        'priceYearly',
        'currency',
        'features',
        'trialDays',
        'isActive',
        'isPopular',
        'sortOrder',
        'createdAt',
        'updatedAt'
      ]
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

module.exports = router;
