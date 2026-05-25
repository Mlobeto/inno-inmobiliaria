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

// ==================== PUBLIC API ====================
export {
  publicApi,
  useGetPublicPlansQuery,
} from './api/publicApi';

// ==================== AUTH API ====================
export {
  authApi,
  useLoginMutation,
  useRegisterMutation,
  useRegisterTenantMutation,
  useVerifyTokenQuery,
  useLazyVerifyTokenQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetAllAdminsQuery,
  useEditAdminMutation,
  useDeleteAdminMutation,
  useGetCurrentTenantQuery,
} from './api/authApi';

// ==================== PLATFORM ADMIN API ====================
export {
  platformAdminApi,
  useGetDashboardQuery,
  useGetMetricsQuery,
  useGetRevenueQuery,
  useListTenantsQuery,
  useCreateManualTenantMutation,
  useCheckSubdomainAvailabilityQuery,
  useGetTenantDetailQuery,
  useUpdateTenantMutation,
  useSuspendTenantMutation,
  useActivateTenantMutation,
  useDeleteTenantMutation,
  useListSubscriptionsQuery,
  useListPlansQuery,
  useGetPlanQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useTogglePlanStatusMutation,
  useImpersonateTenantMutation,
  useGetTenantOperationalQuery,
  useUpdateTenantSubscriptionMutation,
  useResetTenantAdminPasswordMutation,
  useGetTenantPaymentsQuery,
  useSendEmailToTenantMutation,
  useGetTenantActivityQuery,
  useGetTenantErrorsQuery,
} from './api/platformAdminApi';

// ==================== SUBSCRIPTION API ====================
export {
  subscriptionApi,
  useGetCurrentSubscriptionQuery,
  useGetPlansQuery,
  useCreateSubscriptionMutation,
  useCancelSubscriptionMutation,
  useChangePlanMutation,
  useStartTrialMutation,
} from './api/subscriptionApi';

// ==================== CLIENT API ====================
export {
  clientApi,
  useGetAllClientsQuery,
  useGetClientByIdQuery,
  useLazyGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from './api/clientApi';

// ==================== PROPERTY API ====================
export {
  propertyApi,
  useGetAllPropertiesQuery,
  useGetPropertyByIdQuery,
  useLazyGetPropertyByIdQuery,
  useGetPropertiesByClientQuery,
  useLazyGetPropertiesByClientQuery,
  useGetPropertiesByTypeQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
  useTogglePublishLandingMutation,
} from './api/propertyApi';

// ==================== LEASE API ====================
export {
  leaseApi,
  useGetAllLeasesQuery,
  useGetLeaseByIdQuery,
  useLazyGetLeaseByIdQuery,
  useGetLeasesByClientQuery,
  useLazyGetLeasesByClientQuery,
  useCreateLeaseMutation,
  useUpdateLeaseMutation,
  useUpdateLeaseRentMutation,
  useQuickUpdateLeaseMutation,
  useBulkUpdateLeasesMutation,
  useGetPendingUpdatesQuery,
  useGetLeaseHistoryQuery,
  useGetUpdateStatsQuery,
} from './api/leaseApi';

// ==================== PAYMENT API ====================
export {
  paymentApi,
  useGetAllPaymentsQuery,
  useGetPaymentsByLeaseQuery,
  useLazyGetPaymentsByLeaseQuery,
  useGetPaymentsByClientQuery,
  useLazyGetPaymentsByClientQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
} from './api/paymentApi';

// ==================== LEAD API ====================
export {
  leadApi,
  useGetAllLeadsQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useAssignLeadAgentMutation,
  useUnassignLeadAgentMutation,
  useDeleteLeadMutation,
} from './api/leadApi';

// ==================== TICKET API ====================
export {
  ticketApi,
  useGetMyTicketsQuery,
  useCreateTicketMutation,
  useAddTenantMessageMutation,
  useGetTicketStatsQuery,
  useGetAllTicketsQuery,
  useGetTicketByIdQuery,
  useAddAdminMessageMutation,
  useUpdateTicketStatusMutation,
} from './api/ticketApi';

// ==================== LOTEO API ====================
export {
  loteoApi,
  useGetLoteosQuery,
  useGetLoteoByIdQuery,
  useCreateLoteoMutation,
  useUpdateLoteoMutation,
  useDeleteLoteoMutation,
  useTogglePublishLoteoMutation,
  useCreateLoteMutation,
  useUpdateLoteMutation,
  useDeleteLoteMutation,
  useGetCobranzasLoteosQuery,
  useGetVentaLoteQuery,
  useCreateVentaLoteMutation,
  useUpdateVentaLoteMutation,
  useDeleteVentaLoteMutation,
  usePagarCuotaMutation,
} from './api/loteoApi';

// ==================== AGENT API ====================
export {
  agentApi,
  useGetAgentsQuery,
  useGetAgentByIdQuery,
  useCreateAgentMutation,
  useUpdateAgentMutation,
  useDeactivateAgentMutation,
  useReactivateAgentMutation,
} from './api/agentApi';

// ==================== COMMISSION API ====================
export {
  commissionApi,
  useGetCommissionsQuery,
  useGetSettlementQuery,
  useGetCommissionByIdQuery,
  useCreateCommissionMutation,
  useUpdateCommissionMutation,
  useApproveCommissionMutation,
  useMarkCommissionPaidMutation,
  useCancelCommissionMutation,
} from './api/commissionApi';

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
  selectIsImpersonating,
  selectImpersonatedTenant,
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

// ==================== PDF TEMPLATE API ====================
export {
  pdfTemplateApi,
  useGetTemplateTypesQuery,
  useGetAllPdfTemplatesQuery,
  useGetPdfTemplateByIdQuery,
  useCreatePdfTemplateMutation,
  useUpdatePdfTemplateMutation,
  useDeletePdfTemplateMutation,
  useDuplicatePdfTemplateMutation,
  useSetTemplateAsDefaultMutation,
} from './api/pdfTemplateApi';
