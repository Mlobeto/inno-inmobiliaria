/**
 * Platform Admin Slice - Estado local para el panel de administrador
 * Maneja filtros, paginación, selección de tenant, etc.
 * 
 * Compartido entre web y mobile
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Filtros para lista de tenants
  tenantsFilters: {
    search: '',
    status: '', // 'active', 'suspended', ''
    plan: '', // planId o ''
    page: 1,
    limit: 20,
  },
  
  // Filtros para lista de suscripciones
  subscriptionsFilters: {
    status: '', // 'active', 'trialing', 'canceled', 'expired', ''
    planId: '',
    page: 1,
    limit: 20,
  },
  
  // Filtros para revenue
  revenueFilters: {
    period: 'month', // 'month', 'quarter', 'year'
  },
  
  // Tenant seleccionado (para ver detalle)
  selectedTenant: null,
  
  // UI state
  ui: {
    sidebarOpen: true,
    activeView: 'overview', // 'overview', 'tenants', 'subscriptions', 'revenue', 'metrics'
  },
};

const platformAdminSlice = createSlice({
  name: 'platformAdmin',
  initialState,
  reducers: {
    // Filtros de tenants
    setTenantsSearch: (state, action) => {
      state.tenantsFilters.search = action.payload;
      state.tenantsFilters.page = 1;
    },
    setTenantsStatus: (state, action) => {
      state.tenantsFilters.status = action.payload;
      state.tenantsFilters.page = 1;
    },
    setTenantsPlan: (state, action) => {
      state.tenantsFilters.plan = action.payload;
      state.tenantsFilters.page = 1;
    },
    setTenantsPage: (state, action) => {
      state.tenantsFilters.page = action.payload;
    },
    setTenantsLimit: (state, action) => {
      state.tenantsFilters.limit = action.payload;
      state.tenantsFilters.page = 1;
    },
    resetTenantsFilters: (state) => {
      state.tenantsFilters = initialState.tenantsFilters;
    },
    
    // Filtros de suscripciones
    setSubscriptionsStatus: (state, action) => {
      state.subscriptionsFilters.status = action.payload;
      state.subscriptionsFilters.page = 1;
    },
    setSubscriptionsPlan: (state, action) => {
      state.subscriptionsFilters.planId = action.payload;
      state.subscriptionsFilters.page = 1;
    },
    setSubscriptionsPage: (state, action) => {
      state.subscriptionsFilters.page = action.payload;
    },
    resetSubscriptionsFilters: (state) => {
      state.subscriptionsFilters = initialState.subscriptionsFilters;
    },
    
    // Filtros de revenue
    setRevenuePeriod: (state, action) => {
      state.revenueFilters.period = action.payload;
    },
    
    // Selección y UI
    setSelectedTenant: (state, action) => {
      state.selectedTenant = action.payload;
    },
    clearSelectedTenant: (state) => {
      state.selectedTenant = null;
    },
    setActiveView: (state, action) => {
      state.ui.activeView = action.payload;
    },
    toggleSidebar: (state) => {
      state.ui.sidebarOpen = !state.ui.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.ui.sidebarOpen = action.payload;
    },
    resetPlatformAdminState: () => initialState,
  },
});

// Actions
export const {
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
} = platformAdminSlice.actions;

// Selectors
export const selectTenantsFilters = (state) => state.platformAdmin.tenantsFilters;
export const selectSubscriptionsFilters = (state) => state.platformAdmin.subscriptionsFilters;
export const selectRevenueFilters = (state) => state.platformAdmin.revenueFilters;
export const selectSelectedTenant = (state) => state.platformAdmin.selectedTenant;
export const selectActiveView = (state) => state.platformAdmin.ui.activeView;
export const selectSidebarOpen = (state) => state.platformAdmin.ui.sidebarOpen;

export default platformAdminSlice.reducer;
