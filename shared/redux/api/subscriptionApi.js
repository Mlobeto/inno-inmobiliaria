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
    
  }),
  overrideExisting: false,
});

// Export hooks
export const {
  useGetCurrentSubscriptionQuery,
  useGetPlansQuery,
} = subscriptionApi;

export default subscriptionApi;
