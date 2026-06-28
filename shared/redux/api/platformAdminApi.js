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

    checkSubdomainAvailability: builder.query({
      query: (subdomain) => `/platform-admin/tenants/check-subdomain/${subdomain}`,
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

    deleteTenant: builder.mutation({
      query: (tenantId) => ({
        url: `/platform-admin/tenants/${tenantId}`,
        method: 'DELETE',
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

    // ============================================
    // 📋 GESTIÓN DE PLANES
    // ============================================
    
    listPlans: builder.query({
      query: () => '/platform-admin/plans',
      providesTags: (result) =>
        result?.plans
          ? [
              ...result.plans.map(({ planId }) => ({ type: 'Plans', id: planId })),
              { type: 'Plans', id: 'LIST' },
            ]
          : [{ type: 'Plans', id: 'LIST' }],
    }),

    getPlan: builder.query({
      query: (planId) => `/platform-admin/plans/${planId}`,
      providesTags: (result, error, planId) => [{ type: 'Plans', id: planId }],
    }),

    createPlan: builder.mutation({
      query: (data) => ({
        url: '/platform-admin/plans',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Plans', id: 'LIST' },
        'Dashboard',
      ],
    }),

    updatePlan: builder.mutation({
      query: ({ planId, ...data }) => ({
        url: `/platform-admin/plans/${planId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { planId }) => [
        { type: 'Plans', id: planId },
        { type: 'Plans', id: 'LIST' },
        'PublicModules',
      ],
    }),

    deletePlan: builder.mutation({
      query: (planId) => ({
        url: `/platform-admin/plans/${planId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, planId) => [
        { type: 'Plans', id: planId },
        { type: 'Plans', id: 'LIST' },
        'Dashboard',
      ],
    }),

    togglePlanStatus: builder.mutation({
      query: (planId) => ({
        url: `/platform-admin/plans/${planId}/toggle-status`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, planId) => [
        { type: 'Plans', id: planId },
        { type: 'Plans', id: 'LIST' },
      ],
    }),

    listCatalogModules: builder.query({
      query: () => '/platform-admin/modules',
      providesTags: (result) =>
        result?.modules
          ? [
              ...result.modules.map(({ moduleId }) => ({ type: 'CatalogModules', id: moduleId })),
              { type: 'CatalogModules', id: 'LIST' },
            ]
          : [{ type: 'CatalogModules', id: 'LIST' }],
    }),

    updateCatalogModule: builder.mutation({
      query: ({ moduleId, ...data }) => ({
        url: `/platform-admin/modules/${moduleId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { moduleId }) => [
        { type: 'CatalogModules', id: moduleId },
        { type: 'CatalogModules', id: 'LIST' },
        { type: 'Plans', id: 'lifetime' },
        'PublicModules',
      ],
    }),

    // ============================================
    // 🔑 IMPERSONACIÓN DE TENANT
    // ============================================

    impersonateTenant: builder.mutation({
      query: (tenantId) => ({
        url: `/platform-admin/tenants/${tenantId}/impersonate`,
        method: 'POST',
      }),
    }),

    // ============================================
    // 📊 DATOS OPERACIONALES DEL TENANT
    // ============================================

    getTenantOperational: builder.query({
      query: (tenantId) => `/platform-admin/tenants/${tenantId}/operational`,
      providesTags: (r, e, id) => [{ type: 'Tenants', id }],
    }),

    updateTenantSubscription: builder.mutation({
      query: ({ tenantId, ...body }) => ({
        url: `/platform-admin/tenants/${tenantId}/subscription`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (r, e, { tenantId }) => [{ type: 'Tenants', id: tenantId }],
    }),

    resetTenantAdminPassword: builder.mutation({
      query: ({ tenantId, ...body }) => ({
        url: `/platform-admin/tenants/${tenantId}/reset-password`,
        method: 'POST',
        body,
      }),
    }),

    getTenantPayments: builder.query({
      query: ({ tenantId, page = 1, limit = 20 }) => ({
        url: `/platform-admin/tenants/${tenantId}/payments`,
        params: { page, limit },
      }),
      providesTags: (r, e, { tenantId }) => [{ type: 'TenantPayments', id: tenantId }],
    }),

    sendEmailToTenant: builder.mutation({
      query: ({ tenantId, subject, body }) => ({
        url: `/platform-admin/tenants/${tenantId}/send-email`,
        method: 'POST',
        body: { subject, body },
      }),
    }),

    getTenantActivity: builder.query({
      query: ({ tenantId, limit = 50 }) => ({
        url: `/platform-admin/tenants/${tenantId}/activity`,
        params: { limit },
      }),
      providesTags: (r, e, { tenantId }) => [{ type: 'TenantActivity', id: tenantId }],
    }),

    getTenantErrors: builder.query({
      query: (tenantId) => `/platform-admin/tenants/${tenantId}/errors`,
      providesTags: (r, e, tenantId) => [{ type: 'TenantErrors', id: tenantId }],
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
  useCheckSubdomainAvailabilityQuery,
  useGetTenantDetailQuery,
  useUpdateTenantMutation,
  useSuspendTenantMutation,
  useActivateTenantMutation,
  useDeleteTenantMutation,
  
  // Subscriptions
  useListSubscriptionsQuery,
  
  // Plans
  useListPlansQuery,
  useGetPlanQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useTogglePlanStatusMutation,

  // Módulos (catálogo)
  useListCatalogModulesQuery,
  useUpdateCatalogModuleMutation,

  // Impersonation + Operational
  useImpersonateTenantMutation,
  useGetTenantOperationalQuery,

  // Subscription management
  useUpdateTenantSubscriptionMutation,

  // Password reset
  useResetTenantAdminPasswordMutation,

  // Payment history
  useGetTenantPaymentsQuery,

  // Send email
  useSendEmailToTenantMutation,

  // Activity feed
  useGetTenantActivityQuery,

  // Errors
  useGetTenantErrorsQuery,
} = platformAdminApi;

export default platformAdminApi;
