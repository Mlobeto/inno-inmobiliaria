/**
 * API para Platform Admin - Endpoints usando RTK Query
 * Estos endpoints son SOLO para usuarios con rol PLATFORM_ADMIN
 */

import { baseApi } from './baseApi';

export const platformAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // ============================================
    // 📊 DASHBOARD Y MÉTRICAS
    // ============================================
    
    /**
     * GET /platform-admin/dashboard
     * Dashboard principal con métricas generales
     */
    getDashboard: builder.query({
      query: () => '/platform-admin/dashboard',
      providesTags: ['Dashboard'],
    }),

    /**
     * GET /platform-admin/metrics
     * Métricas avanzadas: growth, engagement, retention
     */
    getMetrics: builder.query({
      query: () => '/platform-admin/metrics',
      providesTags: ['Metrics'],
    }),

    /**
     * GET /platform-admin/revenue
     * Análisis de ingresos: MRR, ARR, revenue por plan
     */
    getRevenue: builder.query({
      query: (params = {}) => ({
        url: '/platform-admin/revenue',
        params, // { period: 'month' | 'quarter' | 'year' }
      }),
      providesTags: ['Revenue'],
    }),

    // ============================================
    // 🏢 GESTIÓN DE TENANTS
    // ============================================
    
    /**
     * GET /platform-admin/tenants
     * Lista paginada de tenants con filtros
     */
    listTenants: builder.query({
      query: (params = {}) => ({
        url: '/platform-admin/tenants',
        params, // { page, limit, status, plan, search }
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.tenants.map(({ tenantId }) => ({ type: 'Tenants', id: tenantId })),
              { type: 'Tenants', id: 'LIST' },
            ]
          : [{ type: 'Tenants', id: 'LIST' }],
    }),

    /**
     * GET /platform-admin/tenants/check-subdomain/:subdomain
     * Verificar disponibilidad de subdomain
     */
    checkSubdomainAvailability: builder.query({
      query: (subdomain) => `/platform-admin/tenants/check-subdomain/${subdomain}`,
    }),

    /**
     * POST /platform-admin/tenants/create-manual
     * Crea un tenant manualmente sin MercadoPago (para demos, trials, etc.)
     */
    createManualTenant: builder.mutation({
      query: (data) => ({
        url: '/platform-admin/tenants/create-manual',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Tenants', id: 'LIST' },
        'Dashboard',
        'Metrics',
      ],
    }),

    /**
     * GET /platform-admin/tenants/:tenantId
     * Detalle completo de un tenant con estadísticas de uso
     */
    getTenantDetail: builder.query({
      query: (tenantId) => `/platform-admin/tenants/${tenantId}`,
      providesTags: (result, error, tenantId) => [{ type: 'Tenants', id: tenantId }],
    }),

    /**
     * PUT /platform-admin/tenants/:tenantId
     * Actualiza información de un tenant
     */
    updateTenant: builder.mutation({
      query: ({ tenantId, ...data }) => ({
        url: `/platform-admin/tenants/${tenantId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { tenantId }) => [
        { type: 'Tenants', id: tenantId },
        { type: 'Tenants', id: 'LIST' },
        'Dashboard',
      ],
    }),

    /**
     * POST /platform-admin/tenants/:tenantId/suspend
     * Suspende un tenant
     */
    suspendTenant: builder.mutation({
      query: ({ tenantId, reason }) => ({
        url: `/platform-admin/tenants/${tenantId}/suspend`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { tenantId }) => [
        { type: 'Tenants', id: tenantId },
        { type: 'Tenants', id: 'LIST' },
        'Dashboard',
        'Metrics',
      ],
    }),

    /**
     * POST /platform-admin/tenants/:tenantId/activate
     * Reactiva un tenant suspendido
     */
    activateTenant: builder.mutation({
      query: (tenantId) => ({
        url: `/platform-admin/tenants/${tenantId}/activate`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, tenantId) => [
        { type: 'Tenants', id: tenantId },
        { type: 'Tenants', id: 'LIST' },
        'Dashboard',
        'Metrics',
      ],
    }),

    // ============================================
    // 💳 SUSCRIPCIONES
    // ============================================
    
    /**
     * GET /platform-admin/subscriptions
     * Lista global de suscripciones con filtros
     */
    listSubscriptions: builder.query({
      query: (params = {}) => ({
        url: '/platform-admin/subscriptions',
        params, // { page, limit, status, planId }
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.subscriptions.map(({ subscriptionId }) => ({ 
                type: 'Subscriptions', 
                id: subscriptionId 
              })),
              { type: 'Subscriptions', id: 'LIST' },
            ]
          : [{ type: 'Subscriptions', id: 'LIST' }],
    }),

  }),
  overrideExisting: false,
});

// Export hooks generados automáticamente por RTK Query
export const {
  // Dashboard
  useGetDashboardQuery,
  useGetMetricsQuery,
  useGetRevenueQuery,
  
  // Tenants
  useListTenantsQuery,
  useCheckSubdomainAvailabilityQuery,
  useCreateManualTenantMutation,
  useGetTenantDetailQuery,
  useUpdateTenantMutation,
  useSuspendTenantMutation,
  useActivateTenantMutation,
  
  // Subscriptions
  useListSubscriptionsQuery,
} = platformAdminApi;
