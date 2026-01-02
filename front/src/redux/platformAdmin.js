/**
 * Redux Platform Admin - Exports centralizados
 * Importa todo desde aquí en tus componentes
 */

// API Hooks (RTK Query)
export {
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
} from './api/platformAdminApi';

// Slice Actions
export {
  // Tenants filters
  setTenantsSearch,
  setTenantsStatus,
  setTenantsPlan,
  setTenantsPage,
  setTenantsLimit,
  resetTenantsFilters,
  
  // Subscriptions filters
  setSubscriptionsStatus,
  setSubscriptionsPlan,
  setSubscriptionsPage,
  resetSubscriptionsFilters,
  
  // Revenue filters
  setRevenuePeriod,
  
  // Selection & UI
  setSelectedTenant,
  clearSelectedTenant,
  setActiveView,
  toggleSidebar,
  setSidebarOpen,
  resetPlatformAdminState,
} from './slices/platformAdminSlice';

// Selectors
export {
  selectTenantsFilters,
  selectSubscriptionsFilters,
  selectRevenueFilters,
  selectSelectedTenant,
  selectActiveView,
  selectSidebarOpen,
} from './slices/platformAdminSlice';
