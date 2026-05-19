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

/** URL pública del front (MP exige https en producción). */
function buildFrontendUrl(path = '') {
  let base = (process.env.FRONTEND_URL || FRONTEND_URL || 'http://localhost:5173').trim();
  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  }
  return `${base.replace(/\/$/, '')}${path}`;
}

function mpCurrencyId(planCurrency) {
  const code = (planCurrency || 'ARS').toUpperCase();
  return code === 'ARS' || code === 'USD' ? code : 'ARS';
}

function extractMercadoPagoError(error) {
  const message =
    error?.message ||
    error?.apiResponse?.message ||
    error?.cause?.[0]?.description ||
    error?.cause?.message ||
    'Error desconocido de Mercado Pago';
  const status =
    Number(error?.status || error?.statusCode || error?.apiResponse?.status) || 500;
  return { message, status };
}

function isMercadoPagoTestToken() {
  return (process.env.MP_ACCESS_TOKEN || '').trim().startsWith('TEST-');
}

/** Valida que mpPlanId exista con el token actual (evita IDs creados en sandbox). */
async function resolveMpPlanId(plan) {
  if (!plan.mpPlanId) {
    return null;
  }
  try {
    await preApprovalPlanClient.get({ id: plan.mpPlanId });
    return plan.mpPlanId;
  } catch (err) {
    console.warn(
      `[subscriptions] mpPlanId ${plan.mpPlanId} inválido para el token actual: ${err.message}`
    );
    await prisma.plans
      .update({ where: { planId: plan.planId }, data: { mpPlanId: null } })
      .catch(() => {});
    return null;
  }
}

function buildAutoRecurring(plan, currencyId, includeTrial) {
  return {
    frequency: 1,
    frequency_type: 'months',
    transaction_amount: parseFloat(plan.priceMonthly),
    currency_id: currencyId,
    ...(includeTrial
      ? {
          free_trial: {
            frequency: plan.trialDays,
            frequency_type: 'days',
          },
        }
      : {}),
  };
}

function userFacingMpError(message) {
  if (/different countries/i.test(message)) {
    return (
      'Mercado Pago rechazó el pago: la cuenta del comprador y las credenciales de la app deben ser del mismo país (Argentina). ' +
      'En producción usá MP_ACCESS_TOKEN de producción (.ar), no credenciales TEST, y un usuario de prueba/comprador argentino.'
    );
  }
  return message;
}

class SubscriptionController {
  
  /**
   * Obtener todos los planes disponibles
   * GET /api/subscriptions/plans
   */
  async getPlans(req, res) {
    try {
      const plans = await prisma.plans.findMany({
        where: { isActive: true, planId: { not: 'lifetime' } },
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
      
      // Buscar la suscripción más reciente sin filtrar por estado,
      // para que el frontend siempre tenga los datos para mostrar
      const subscription = await prisma.subscriptions.findFirst({
        where: { tenantId },
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
      
      // Verificar expiración y actualizar estado en BD si corresponde
      const now = new Date();
      let finalStatus = subscription.status?.toLowerCase() || subscription.status;

      if (subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && now > subscription.currentPeriodEnd) {
        await prisma.subscriptions.update({
          where: { subscriptionId: subscription.subscriptionId },
          data: { status: 'canceled', canceledAt: now },
        });
        finalStatus = 'canceled';
      } else if (
        ['trialing', 'trial'].includes(finalStatus) &&
        subscription.currentPeriodEnd && now > subscription.currentPeriodEnd
      ) {
        await prisma.subscriptions.update({
          where: { subscriptionId: subscription.subscriptionId },
          data: { status: 'past_due' },
        });
        finalStatus = 'past_due';
      }

      res.json({
        success: true,
        subscription: {
          ...subscription,
          status: finalStatus,
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

      if (process.env.NODE_ENV === 'production' && isMercadoPagoTestToken()) {
        return res.status(503).json({
          success: false,
          error:
            'Mercado Pago está en modo TEST en el servidor. Actualizá el secreto mp-access-token en Azure con el Access Token de producción (.ar) y reiniciá la revisión del Container App.',
        });
      }

      const priorSubscription = await prisma.subscriptions.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
      const tenantAlreadyHadTrial =
        Boolean(priorSubscription?.trialEnd) ||
        ['trialing', 'trial', 'past_due', 'active', 'canceled'].includes(
          (priorSubscription?.status || '').toLowerCase()
        );

      const currencyId = mpCurrencyId(plan.currency);
      const canOfferMpTrial = plan.trialDays > 0 && !tenantAlreadyHadTrial;

      const preapprovalBase = {
        reason: `Suscripción ${plan.name} - Inno Inmobiliaria`,
        back_url: buildFrontendUrl('/subscription/success'),
        payer_email: email,
        external_reference: `tenant_${tenantId}_plan_${planId}`,
        status: 'pending',
      };

      const mpPlanId = await resolveMpPlanId(plan);
      let preapprovalData = { ...preapprovalBase };

      if (mpPlanId) {
        preapprovalData.preapproval_plan_id = mpPlanId;
      } else {
        console.warn(
          `[subscriptions] Plan ${planId} sin mpPlanId válido — ejecutá con token de prod: node src/scripts/syncPlansToMercadoPago.js`
        );
        preapprovalData.auto_recurring = buildAutoRecurring(plan, currencyId, canOfferMpTrial);
      }

      let response;
      try {
        response = await preApprovalClient.create({ body: preapprovalData });
      } catch (firstError) {
        const firstMsg = extractMercadoPagoError(firstError).message;
        if (mpPlanId && /different countries/i.test(firstMsg)) {
          console.warn(
            `[subscriptions] Reintentando sin preapproval_plan_id (plan sandbox vs token prod)`
          );
          await prisma.plans
            .update({ where: { planId }, data: { mpPlanId: null } })
            .catch(() => {});
          preapprovalData = {
            ...preapprovalBase,
            auto_recurring: buildAutoRecurring(plan, currencyId, false),
          };
          response = await preApprovalClient.create({ body: preapprovalData });
        } else {
          throw firstError;
        }
      }

      // Crear registro de suscripción en estado pendiente (sin nuevo trial local si ya lo usó)
      const subscription = await prisma.subscriptions.create({
        data: {
          tenantId,
          planId,
          status: canOfferMpTrial ? 'trialing' : 'incomplete',
          paymentProvider: 'mercadopago',
          mpSubscriptionId: response.id,
          billingCycle: 'monthly',
          amount: plan.priceMonthly,
          currency: currencyId,
          trialStart: canOfferMpTrial ? new Date() : null,
          trialEnd: canOfferMpTrial
            ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000)
            : null,
        },
      });

      res.json({
        success: true,
        subscriptionUrl: response.init_point || response.sandbox_init_point,
        subscriptionId: subscription.subscriptionId,
        mpSubscriptionId: response.id,
      });
    } catch (error) {
      const { message, status } = extractMercadoPagoError(error);
      console.error('Error creando suscripción:', error);
      const httpStatus = status >= 400 && status < 500 ? status : 500;
      res.status(httpStatus).json({
        success: false,
        error: userFacingMpError(message),
        details: process.env.NODE_ENV === 'development' ? message : undefined,
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
        
        if (payment.preapproval_id) {
          // Buscar suscripción por mpSubscriptionId
          const subscription = await prisma.subscriptions.findFirst({
            where: { mpSubscriptionId: payment.preapproval_id }
          });

          if (subscription) {
            if (payment.status === 'approved') {
              // Obtener next_payment_date real del preapproval
              let nextPaymentDate = null;
              try {
                const preapproval = await preApprovalClient.get({ id: payment.preapproval_id });
                nextPaymentDate = preapproval?.next_payment_date ? new Date(preapproval.next_payment_date) : null;
              } catch (_) { /* fallback: +30 días */ }

              const periodStart = new Date();
              const periodEnd = nextPaymentDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

              await prisma.subscriptions.update({
                where: { subscriptionId: subscription.subscriptionId },
                data: {
                  status: 'active',
                  cancelAtPeriodEnd: false,
                  mpPaymentId: payment.id.toString(),
                  mpPayerId: payment.payer?.id?.toString(),
                  currentPeriodStart: periodStart,
                  currentPeriodEnd: periodEnd,
                  amount: payment.transaction_amount,
                }
              });

              await logPayment(prisma, subscription, payment, 'approved', periodStart, periodEnd);
              console.log('✅ Pago aprobado aplicado a suscripción:', subscription.subscriptionId);

            } else if (payment.status === 'rejected') {
              await prisma.subscriptions.update({
                where: { subscriptionId: subscription.subscriptionId },
                data: { status: 'past_due' }
              });
              await logPayment(prisma, subscription, payment, 'rejected', null, null);
              console.log('⚠️ Pago rechazado, suscripción marcada como past_due:', subscription.subscriptionId);
            }
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
      
      // Actualizar preapproval en MercadoPago si la suscripción está activa
      if (subscription.mpSubscriptionId && subscription.status === 'active') {
        try {
          const newAmount = billingCycle === 'yearly'
            ? Math.round(parseFloat(newPlan.priceYearly) / 12)
            : parseFloat(newPlan.priceMonthly);
          await preApprovalClient.update({
            id: subscription.mpSubscriptionId,
            body: {
              reason: `Suscripción ${newPlan.name} - Inno Inmobiliaria`,
              auto_recurring: { transaction_amount: newAmount },
            },
          });
          console.log('✅ Preapproval actualizado en MP:', subscription.mpSubscriptionId);
        } catch (mpError) {
          console.error('⚠️ Error actualizando preapproval en MP (continuando):', mpError.message);
          // No bloqueamos: la BD se actualiza igual y la siguiente renovación usará el monto nuevo
        }
      }

      // Actualizar plan en BD
      await prisma.subscriptions.update({
        where: { subscriptionId: subscription.subscriptionId },
        data: {
          planId: newPlanId,
          billingCycle,
          amount: billingCycle === 'yearly'
            ? Math.round(parseFloat(newPlan.priceYearly) / 12)
            : parseFloat(newPlan.priceMonthly),
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

  /**
   * Historial de pagos del tenant
   * GET /api/subscriptions/payment-history
   */
  async getPaymentHistory(req, res) {
    try {
      const { tenantId } = req.user;
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [logs, total] = await Promise.all([
        prisma.subscription_payment_logs.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
          select: {
            id: true,
            mpPaymentId: true,
            status: true,
            amount: true,
            currency: true,
            periodStart: true,
            periodEnd: true,
            createdAt: true,
          },
        }),
        prisma.subscription_payment_logs.count({ where: { tenantId } }),
      ]);

      res.json({
        success: true,
        logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Error obteniendo historial de pagos:', error);
      res.status(500).json({ success: false, error: 'Error al obtener el historial de pagos' });
    }
  }
}

/**
 * Persiste un evento de pago en subscription_payment_logs.
 * Silencia errores para no afectar el flujo principal.
 */
async function logPayment(prisma, subscription, payment, status, periodStart, periodEnd) {
  try {
    await prisma.subscription_payment_logs.create({
      data: {
        subscriptionId: subscription.subscriptionId,
        tenantId: subscription.tenantId,
        mpPaymentId: payment.id?.toString(),
        mpPreapprovalId: payment.preapproval_id?.toString(),
        status,
        amount: payment.transaction_amount ?? null,
        currency: payment.currency_id ?? 'ARS',
        periodStart: periodStart ?? null,
        periodEnd: periodEnd ?? null,
        rawData: {
          paymentId: payment.id,
          paymentStatus: payment.status,
          paymentStatusDetail: payment.status_detail,
          paymentMethodId: payment.payment_method_id,
        },
      },
    });
  } catch (err) {
    console.error('[logPayment] Error guardando log de pago (no crítico):', err.message);
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
  getPaymentHistory: controller.getPaymentHistory.bind(controller),
  handleMercadoPagoWebhook: controller.handleMercadoPagoWebhook.bind(controller)
};
