const { DataTypes } = require('sequelize');

/**
 * Modelo de Suscripciones
 * Gestiona las suscripciones activas de cada tenant
 */
module.exports = (sequelize) => {
  return sequelize.define('Subscription', {
  subscriptionId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'tenantId'
    },
    comment: 'Inmobiliaria que posee la suscripción'
  },
  planId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'plans',
      key: 'planId'
    },
    comment: 'Plan activo'
  },
  
  // Estado de la suscripción
  status: {
    type: DataTypes.ENUM('trialing', 'active', 'past_due', 'canceled', 'incomplete'),
    allowNull: false,
    defaultValue: 'trialing',
    comment: 'Estado actual de la suscripción'
  },
  
  // Procesador de pago
  paymentProvider: {
    type: DataTypes.ENUM('mercadopago', 'stripe', 'manual', 'app_store', 'google_play'),
    allowNull: false,
    defaultValue: 'mercadopago',
    comment: 'Procesador de pago utilizado'
  },
  
  // MercadoPago
  mpPreferenceId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID de preferencia de MercadoPago'
  },
  mpSubscriptionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID de suscripción de MercadoPago'
  },
  mpPayerId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID del pagador en MercadoPago'
  },
  mpPaymentId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID del último pago en MercadoPago'
  },
  
  // Stripe (para futuro)
  stripeSubscriptionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID de suscripción en Stripe'
  },
  stripeCustomerId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID del customer en Stripe'
  },
  
  // App Store / Google Play (para futuro)
  storeSubscriptionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID de suscripción en tienda (Apple/Google)'
  },
  storeReceipt: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Receipt de compra en tienda'
  },
  
  // Períodos y fechas
  currentPeriodStart: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Inicio del período actual'
  },
  currentPeriodEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fin del período actual'
  },
  trialStart: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Inicio del trial'
  },
  trialEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fin del trial'
  },
  canceledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de cancelación'
  },
  cancelAtPeriodEnd: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Si la suscripción se cancelará al final del período'
  },
  
  // Billing
  billingCycle: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    allowNull: false,
    defaultValue: 'monthly',
    comment: 'Ciclo de facturación'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Monto del último pago'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'ARS',
    comment: 'Moneda de la suscripción'
  },
  
  // Metadata
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Información adicional'
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
  tableName: 'subscriptions',
  timestamps: true,
  indexes: [
    {
      fields: ['tenantId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['paymentProvider']
    },
    {
      fields: ['currentPeriodEnd']
    },
    {
      unique: true,
      fields: ['tenantId', 'status'],
      where: {
        status: ['trialing', 'active']
      },
      name: 'unique_active_subscription_per_tenant'
    }
  ]
  });
};
