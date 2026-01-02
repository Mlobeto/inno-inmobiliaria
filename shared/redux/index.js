/**
 * Redux Shared - Exports centralizados
 * 
 * Este archivo permite importar todo lo necesario desde un solo lugar:
 * 
 * // Para usar en componentes
 * import { 
 *   useLoginMutation, 
 *   setCredentials, 
 *   selectIsAuthenticated 
 * } from '@shared/redux';
 */

// ==================== BASE API ====================
export { baseApi } from './api/baseApi';

// ==================== AUTH API ====================
export {
  authApi,
  useLoginMutation,
  useRegisterMutation,
  useVerifyTokenQuery,
  useLazyVerifyTokenQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetAllAdminsQuery,
  useEditAdminMutation,
  useDeleteAdminMutation,
} from './api/authApi';

// ==================== PLATFORM ADMIN API ====================
export {
  platformAdminApi,
  useGetDashboardQuery,
  useGetMetricsQuery,
  useGetRevenueQuery,
  useListTenantsQuery,
  useCreateManualTenantMutation,
  useGetTenantDetailQuery,
  useUpdateTenantMutation,
  useSuspendTenantMutation,
  useActivateTenantMutation,
  useListSubscriptionsQuery,
} from './api/platformAdminApi';

// ==================== AUTH SLICE ====================
export {
  default as authReducer,
  setCredentials,
  logout,
  restoreSession,
  setError as setAuthError,
  clearError as clearAuthError,
  updateUser,
  selectCurrentUser,
  selectCurrentToken,
  selectIsAuthenticated,
  selectIsPlatformAdmin,
  selectAuthError,
  selectAuthLoading,
  selectTenantId,
  selectUserRole,
} from './slices/authSlice';

// ==================== PLATFORM ADMIN SLICE ====================
export {
  default as platformAdminReducer,
  setTenantsSearch,
  setTenantsStatus,
  setTenantsPlan,
  setTenantsPage,
  setTenantsLimit,
  resetTenantsFilters,
  setSubscriptionsStatus,
  setSubscriptionsPlan,
  setSubscriptionsPage,
  resetSubscriptionsFilters,
  setRevenuePeriod,
  setSelectedTenant,
  clearSelectedTenant,
  setActiveView,
  toggleSidebar,
  setSidebarOpen,
  resetPlatformAdminState,
  selectTenantsFilters,
  selectSubscriptionsFilters,
  selectRevenueFilters,
  selectSelectedTenant,
  selectActiveView,
  selectSidebarOpen,
} from './slices/platformAdminSlice';
