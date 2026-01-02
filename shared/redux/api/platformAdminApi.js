/**
 * API para Platform Admin - Endpoints usando RTK Query
 * Estos endpoints son SOLO para usuarios con rol PLATFORM_ADMIN
 * 
 * Compartido entre web y mobile
 */

import { baseApi } from './baseApi';

export const platformAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // ============================================
    // 📊 DASHBOARD Y MÉTRICAS
    // ============================================
    
    getDashboard: builder.query({
      query: () => '/platform-admin/dashboard',
      providesTags: ['Dashboard'],
    }),

    getMetrics: builder.query({
      query: () => '/platform-admin/metrics',
      providesTags: ['Metrics'],
    }),

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

    getTenantDetail: builder.query({
      query: (tenantId) => `/platform-admin/tenants/${tenantId}`,
      providesTags: (result, error, tenantId) => [{ type: 'Tenants', id: tenantId }],
    }),

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
  useCreateManualTenantMutation,
  useGetTenantDetailQuery,
  useUpdateTenantMutation,
  useSuspendTenantMutation,
  useActivateTenantMutation,
  
  // Subscriptions
  useListSubscriptionsQuery,
} = platformAdminApi;

export default platformAdminApi;
