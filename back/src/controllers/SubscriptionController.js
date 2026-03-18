const prisma = require('../utils/prismaClient');
const { MercadoPagoConfig, PreApprovalPlan, PreApproval, Payment } = require('mercadopago');

// Configurar MercadoPago con la nueva SDK
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

const preApprovalPlanClient = new PreApprovalPlan(client);
const preApprovalClient = new PreApproval(client);
const paymentClient = new Payment(client);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

class SubscriptionController {
  
  /**
   * Obtener todos los planes disponibles
   * GET /api/subscriptions/plans
   */
  async getPlans(req, res) {
    try {
      const plans = await prisma.plans.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      });
      
      res.json({
        success: true,
        plans
      });
    } catch (error) {
      console.error('Error obteniendo planes:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener los planes'
      });
    }
  }
  
  /**
   * Obtener suscripción activa del tenant actual
   * GET /api/subscriptions/current
   */
  async getCurrentSubscription(req, res) {
    try {
      const { tenantId } = req.user;
      
      const subscription = await prisma.subscriptions.findFirst({
        where: {
          tenantId,
          status: { in: ['trialing', 'active'] }
        },
        include: {
          plans: true,
        },
        orderBy: { createdAt: 'desc' }
      });
      
      if (!subscription) {
        return res.json({
          success: true,
          subscription: null,
          message: 'No hay suscripción activa'
        });
      }
      
      // Verificar si expiró
      const now = new Date();
      if (subscription.currentPeriodEnd && now > subscription.currentPeriodEnd) {
        await prisma.subscriptions.update({
          where: { subscriptionId: subscription.subscriptionId },
          data: { status: 'past_due' },
        });
        return res.json({
          success: true,
          subscription: null,
          message: 'Suscripción expirada'
        });
      }
      
      console.log('📊 Subscription encontrada:', JSON.stringify(subscription, null, 2));
      console.log('📊 Plan incluido:', subscription.plans ? 'SÍ' : 'NO');
      
      res.json({
        success: true,
        subscription: {
          ...subscription,
          Plan: subscription.plans,
        }
      });
    } catch (error) {
      console.error('Error obteniendo suscripción:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener la suscripción'
      });
    }
  }
  
  /**
   * Crear suscripción con plan asociado (MercadoPago Preapproval)
   * POST /api/subscriptions/create-subscription
   * Body: { planId }
   */
  async createSubscription(req, res) {
    try {
      const { planId } = req.body;
      const { tenantId, email } = req.user;
      
      // Validar plan
      const plan = await prisma.plans.findUnique({ where: { planId } });
      if (!plan || !plan.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Plan no válido'
        });
      }
      
      // Verificar si ya tiene suscripción activa
      const existingSubscription = await prisma.subscriptions.findFirst({
        where: {
          tenantId,
          status: { in: ['trialing', 'active'] }
        }
      });
      
      if (existingSubscription) {
        return res.status(400).json({
          success: false,
          error: 'Ya tienes una suscripción activa'
        });
      }

      // Verificar que el plan tenga ID de MercadoPago
      if (!plan.mpPlanId) {
        return res.status(400).json({
          success: false,
          error: 'El plan no está configurado en MercadoPago. Contacta al administrador.'
        });
      }
      
      // Crear suscripción (preapproval) en MercadoPago
      const preapprovalData = {
        reason: `Suscripción ${plan.name} - Inno Inmobiliaria`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months', // 'days', 'months', 'years'
          transaction_amount: parseFloat(plan.priceMonthly),
          currency_id: plan.currency,
          free_trial: plan.trialDays > 0 ? {
            frequency: plan.trialDays,
            frequency_type: 'days'
          } : undefined
        },
        back_url: `${FRONTEND_URL}/subscription/success`,
        payer_email: email,
        external_reference: `tenant_${tenantId}_plan_${planId}`,
        status: 'pending'
      };

      const response = await preApprovalClient.create({ body: preapprovalData });
      
      // Crear registro de suscripción en estado pendiente
      const subscription = await prisma.subscriptions.create({
        data: {
          tenantId,
          planId,
          status: plan.trialDays > 0 ? 'trialing' : 'incomplete',
          paymentProvider: 'mercadopago',
          mpSubscriptionId: response.id,
          billingCycle: 'monthly',
          amount: plan.priceMonthly,
          currency: plan.currency,
          trialStart: plan.trialDays > 0 ? new Date() : null,
          trialEnd: plan.trialDays > 0 ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000) : null,
        },
      });
      
      res.json({
        success: true,
        subscriptionUrl: response.init_point,
        subscriptionId: subscription.subscriptionId,
        mpSubscriptionId: response.id
      });
    } catch (error) {
      console.error('Error creando suscripción:', error);
      res.status(500).json({
        success: false,
        error: 'Error al crear la suscripción',
        details: error.message
      });
    }
  }
  /**
   * Webhook de MercadoPago para suscripciones
   * POST /api/webhooks/mercadopago
   */
  async handleMercadoPagoWebhook(req, res) {
    // Responder inmediatamente con 200 para evitar timeouts
    res.status(200).send('OK');
    
    try {
      const { type, data, action } = req.body;
      
      console.log('📥 Webhook MercadoPago recibido:', { 
        type, 
        action, 
        dataId: data?.id,
        body: JSON.stringify(req.body)
      });
      
      // Ignorar webhooks de prueba
      if (data?.id === '123456' || data?.id === 123456) {
        console.log('ℹ️ Webhook de prueba ignorado');
        return;
      }
      
      // Tipos de notificaciones de suscripciones
      if (type === 'subscription_preapproval') {
        const preapprovalId = data.id;
        
        // Obtener información de la suscripción
        let preapproval;
        try {
          preapproval = await preApprovalClient.get({ id: preapprovalId });
        } catch (error) {
          console.error('❌ Error obteniendo preapproval de MercadoPago:', error.message);
          return;
        }
        
        console.log('🔔 Suscripción actualizada:', {
          id: preapproval.id,
          status: preapproval.status,
          externalRef: preapproval.external_reference
        });
        
        // Buscar suscripción en BD por mpSubscriptionId
        const subscription = await prisma.subscriptions.findFirst({
          where: { mpSubscriptionId: preapprovalId }
        });
        
        if (subscription) {
          // Mapear estados de MercadoPago a nuestros estados
          let newStatus = subscription.status;
          
          switch (preapproval.status) {
            case 'authorized':
              newStatus = 'active';
              break;
            case 'paused':
              newStatus = 'past_due';
              break;
            case 'cancelled':
              newStatus = 'canceled';
              break;
          }
          
          await prisma.subscriptions.update({
            where: { subscriptionId: subscription.subscriptionId },
            data: {
              status: newStatus,
              currentPeriodStart: preapproval.last_modified ? new Date(preapproval.last_modified) : subscription.currentPeriodStart,
              currentPeriodEnd: preapproval.next_payment_date ? new Date(preapproval.next_payment_date) : subscription.currentPeriodEnd,
            }
          });
          
          console.log('✅ Suscripción actualizada en BD:', subscription.subscriptionId);
        }
      }
      
      // Notificaciones de pagos recurrentes
      if (type === 'payment') {
        const paymentId = data.id;
        
        // Obtener información del pago
        let payment;
        try {
          payment = await paymentClient.get({ id: paymentId });
        } catch (error) {
          console.error('❌ Error obteniendo payment de MercadoPago:', error.message);
          return;
        }
        
        console.log('💳 Pago recurrente recibido:', {
          id: payment.id,
          status: payment.status,
          preapprovalId: payment.preapproval_id
        });
        
        if (payment.status === 'approved' && payment.preapproval_id) {
          // Buscar suscripción por mpSubscriptionId
          const subscription = await prisma.subscriptions.findFirst({
            where: { mpSubscriptionId: payment.preapproval_id }
          });
          
          if (subscription) {
            // Actualizar con información del último pago
            await prisma.subscriptions.update({
              where: { subscriptionId: subscription.subscriptionId },
              data: {
                status: 'active',
                mpPaymentId: payment.id.toString(),
                mpPayerId: payment.payer?.id?.toString(),
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                amount: payment.transaction_amount,
              }
            });
            
            console.log('✅ Pago aplicado a suscripción:', subscription.subscriptionId);
          }
        }
      }
      
      console.log('✅ Webhook procesado exitosamente');
    } catch (error) {
      console.error('❌ Error en webhook de MercadoPago:', error);
      console.error(error.stack);
    }
  }
  
  /**
   * Cancelar suscripción en MercadoPago
   * POST /api/subscriptions/cancel
   */
  async cancelSubscription(req, res) {
    try {
      const { tenantId } = req.user;
      const { immediately = false } = req.body;
      
      const subscription = await prisma.subscriptions.findFirst({
        where: {
          tenantId,
          status: { in: ['trialing', 'active'] }
        }
      });
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'No se encontró una suscripción activa'
        });
      }

      // Cancelar en MercadoPago si existe mpSubscriptionId
      if (subscription.mpSubscriptionId) {
        try {
          await preApprovalClient.update({
            id: subscription.mpSubscriptionId,
            body: { status: 'cancelled' }
          });
          console.log('✅ Suscripción cancelada en MercadoPago:', subscription.mpSubscriptionId);
        } catch (mpError) {
          console.error('Error cancelando en MercadoPago:', mpError);
          // Continuar para cancelar en BD
        }
      }
      
      if (immediately) {
        // Cancelar inmediatamente
        await prisma.subscriptions.update({
          where: { subscriptionId: subscription.subscriptionId },
          data: {
            status: 'canceled',
            canceledAt: new Date(),
          }
        });
      } else {
        // Cancelar al final del período
        await prisma.subscriptions.update({
          where: { subscriptionId: subscription.subscriptionId },
          data: {
            cancelAtPeriodEnd: true,
          }
        });
      }

      const updatedSubscription = await prisma.subscriptions.findUnique({
        where: { subscriptionId: subscription.subscriptionId },
      });
      
      res.json({
        success: true,
        message: immediately 
          ? 'Suscripción cancelada inmediatamente'
          : 'Suscripción se cancelará al final del período',
        subscription: updatedSubscription
      });
    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      res.status(500).json({
        success: false,
        error: 'Error al cancelar la suscripción'
      });
    }
  }
  
  /**
   * Cambiar de plan
   * POST /api/subscriptions/change-plan
   * Body: { newPlanId, billingCycle }
   */
  async changePlan(req, res) {
    try {
      const { tenantId } = req.user;
      const { newPlanId, billingCycle = 'monthly' } = req.body;
      
      // Validar nuevo plan
      const newPlan = await prisma.plans.findUnique({ where: { planId: newPlanId } });
      if (!newPlan || !newPlan.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Plan no válido'
        });
      }
      
      // Buscar suscripción actual
      const subscription = await prisma.subscriptions.findFirst({
        where: {
          tenantId,
          status: { in: ['trialing', 'active'] }
        },
        include: { plans: true }
      });
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'No tienes una suscripción activa'
        });
      }
      
      // Actualizar plan
      await prisma.subscriptions.update({
        where: { subscriptionId: subscription.subscriptionId },
        data: {
          planId: newPlanId,
          billingCycle,
        }
      });

      const updatedSubscription = await prisma.subscriptions.findUnique({
        where: { subscriptionId: subscription.subscriptionId },
        include: { plans: true },
      });
      
      res.json({
        success: true,
        message: `Plan cambiado a ${newPlan.name}`,
        subscription: {
          ...updatedSubscription,
          Plan: updatedSubscription?.plans || null,
        }
      });
    } catch (error) {
      console.error('Error cambiando plan:', error);
      res.status(500).json({
        success: false,
        error: 'Error al cambiar el plan'
      });
    }
  }
  
  /**
   * Iniciar trial gratuito
   * POST /api/subscriptions/start-trial
   * Body: { planId }
   */
  async startTrial(req, res) {
    try {
      const { tenantId } = req.user;
      const { planId = 'basic' } = req.body;
      
      // Verificar si ya tuvo trial
      const hadTrial = await prisma.subscriptions.findFirst({
        where: { tenantId }
      });
      
      if (hadTrial) {
        return res.status(400).json({
          success: false,
          error: 'Ya has usado tu período de prueba'
        });
      }
      
      // Buscar plan
      const plan = await prisma.plans.findUnique({ where: { planId } });
      if (!plan || !plan.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Plan no válido'
        });
      }
      
      // Calcular fechas del trial
      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + plan.trialDays);
      
      // Crear suscripción en trial
      const subscription = await prisma.subscriptions.create({
        data: {
          tenantId,
          planId,
          status: 'trialing',
          paymentProvider: 'manual',
          trialStart,
          trialEnd,
          currentPeriodStart: trialStart,
          currentPeriodEnd: trialEnd,
          billingCycle: 'monthly',
          amount: 0,
          currency: 'ARS',
        }
      });

      const subscriptionWithPlan = await prisma.subscriptions.findUnique({
        where: { subscriptionId: subscription.subscriptionId },
        include: { plans: true },
      });
      
      res.json({
        success: true,
        message: `Trial de ${plan.trialDays} días iniciado`,
        subscription: {
          ...subscriptionWithPlan,
          Plan: subscriptionWithPlan?.plans || null,
        }
      });
    } catch (error) {
      console.error('Error iniciando trial:', error);
      res.status(500).json({
        success: false,
        error: 'Error al iniciar el trial'
      });
    }
  }
}

const controller = new SubscriptionController();

// Exportar métodos con bind correcto
module.exports = {
  getPlans: controller.getPlans.bind(controller),
  getCurrentSubscription: controller.getCurrentSubscription.bind(controller),
  createSubscription: controller.createSubscription.bind(controller),
  cancelSubscription: controller.cancelSubscription.bind(controller),
  changePlan: controller.changePlan.bind(controller),
  startTrial: controller.startTrial.bind(controller),
  handleMercadoPagoWebhook: controller.handleMercadoPagoWebhook.bind(controller)
};
