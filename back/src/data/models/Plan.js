const { DataTypes } = require('sequelize');

/**
 * Modelo de Planes de Suscripción
 * Define los diferentes planes disponibles para las inmobiliarias
 */
module.exports = (sequelize) => {
  return sequelize.define('Plan', {
  planId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false,
    comment: 'ID único del plan (ej: basic, professional, enterprise)'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre del plan'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción del plan'
  },
  
  // Precios
  priceMonthly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Precio mensual en ARS'
  },
  priceYearly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Precio anual en ARS (con descuento)'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'ARS',
    comment: 'Moneda del precio'
  },
  
  // IDs de productos externos (para pagos)
  mpPlanId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID del plan en MercadoPago'
  },
  stripePriceId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID del precio en Stripe (para futuro)'
  },
  
  // Features del plan (JSON)
  features: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Features incluidos en el plan',
    /*
    Estructura:
    {
      maxProperties: 50,
      maxClients: 100,
      maxUsers: 2,
      maxStorageGB: 5,
      pdfTemplates: true,
      customTemplates: false,
      whatsappIntegration: false,
      estadisticas: false,
      exportData: true,
      apiAccess: false,
      customDomain: false,
      prioritySupport: false
    }
    */
  },
  
  // Configuración
  trialDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 14,
    comment: 'Días de prueba gratis'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Si el plan está activo y puede ser seleccionado'
  },
  isPopular: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Marcar como plan más popular'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Orden de visualización'
  },
  
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'plans',
  timestamps: true,
  indexes: [
    {
      fields: ['isActive']
    },
    {
      fields: ['sortOrder']
    }
  ]
  });
};
