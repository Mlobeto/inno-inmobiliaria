/**
 * API para Suscripciones - Endpoints usando RTK Query
 * Para obtener y gestionar la suscripción del tenant
 */

import { baseApi } from './baseApi';

export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // Obtener suscripción actual del tenant
    getCurrentSubscription: builder.query({
      query: () => '/subscriptions/current',
      providesTags: ['Subscription'],
    }),
    
    // Obtener planes disponibles
    getPlans: builder.query({
      query: () => '/subscriptions/plans',
      providesTags: ['Plans'],
    }),

    /**
     * Crear nueva suscripción (inicia proceso de pago con MercadoPago)
     * POST /api/subscriptions/create-subscription
     * @param {string} planId - ID del plan a suscribirse
     * @returns {subscriptionUrl, subscriptionId, mpSubscriptionId}
     */
    createSubscription: builder.mutation({
      query: (data) => ({
        url: '/subscriptions/create-subscription',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Subscription']
    }),

    /**
     * Cancelar suscripción actual
     * POST /api/subscriptions/cancel
     * @param {boolean} immediately - Si cancelar inmediatamente o al final del período
     */
    cancelSubscription: builder.mutation({
      query: (data) => ({
        url: '/subscriptions/cancel',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Subscription']
    }),

    /**
     * Cambiar plan de suscripción
     * POST /api/subscriptions/change-plan
     * @param {string} newPlanId - ID del nuevo plan
     * @param {string} billingCycle - 'monthly' o 'yearly'
     */
    changePlan: builder.mutation({
      query: (data) => ({
        url: '/subscriptions/change-plan',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Subscription']
    }),

    /**
     * Iniciar período de prueba gratuito
     * POST /api/subscriptions/start-trial
     * @param {string} planId - ID del plan para el trial
     */
    startTrial: builder.mutation({
      query: (data) => ({
        url: '/subscriptions/start-trial',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Subscription']
    })
    
  }),
  overrideExisting: false,
});

// Export hooks
export const {
  useGetCurrentSubscriptionQuery,
  useGetPlansQuery,
  useCreateSubscriptionMutation,
  useCancelSubscriptionMutation,
  useChangePlanMutation,
  useStartTrialMutation
} = subscriptionApi;

export default subscriptionApi;
