import { createSlice } from '@reduxjs/toolkit';

/**
 * Auth Slice - Estado local de autenticación
 * 
 * Gestiona:
 * - Token JWT
 * - Información del usuario logueado
 * - Estado de autenticación
 * - Tipo de usuario (PLATFORM_ADMIN vs tenant admin)
 * 
 * Este slice es compartido entre web y mobile
 */

const initialState = {
  token: null,
  user: null, // { adminId, username, role, tenantId }
  isAuthenticated: false,
  isPlatformAdmin: false,
  isImpersonating: false,
  impersonatedTenant: null, // { tenantId, businessName, subdomain }
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Acción para establecer credenciales después del login
    setCredentials: (state, action) => {
      const { token, admin } = action.payload;
      state.token = token;
      state.user = admin;
      state.isAuthenticated = true;
      state.isPlatformAdmin = admin.tenantId === null;
      state.error = null;
      
      // Guardar token en localStorage (solo web)
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(admin));
      }
    },
    
    // Acción para cerrar sesión
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isPlatformAdmin = false;
      state.error = null;
      
      // Limpiar localStorage (solo web)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },
    
    // Acción para restaurar sesión desde localStorage
    restoreSession: (state) => {
      if (typeof window !== 'undefined') {
        // Detectar token de impersonación en query param (?impersonate=TOKEN)
        const params = new URLSearchParams(window.location.search);
        const impersonateToken = params.get('impersonate');
        const impersonateTenantRaw = params.get('impersonateTenant');

        if (impersonateToken) {
          // Limpiar URL sin recargar la página
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);

          try {
            const tenantInfo = impersonateTenantRaw ? JSON.parse(decodeURIComponent(impersonateTenantRaw)) : null;
            // Decodificar el payload del JWT para obtener el usuario
            const payload = JSON.parse(atob(impersonateToken.split('.')[1]));
            state.token = impersonateToken;
            state.user = {
              adminId: payload.id,
              role: payload.role,
              tenantId: payload.tenantId,
              username: payload.username || '',
            };
            state.isAuthenticated = true;
            state.isPlatformAdmin = false;
            state.isImpersonating = true;
            state.impersonatedTenant = tenantInfo;
            return;
          } catch (e) {
            console.error('Error al cargar token de impersonación:', e);
          }
        }

        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            state.token = token;
            state.user = user;
            state.isAuthenticated = true;
            state.isPlatformAdmin = user.tenantId === null;
          } catch (error) {
            console.error('Error al restaurar sesión:', error);
            // Limpiar datos corruptos
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      }
    },
    
    // Acción para establecer error
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    // Acción para limpiar error
    clearError: (state) => {
      state.error = null;
    },
    
    // Acción para actualizar información del usuario
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        
        // Actualizar en localStorage (solo web)
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      }
    },
  },
});

// ==================== ACTIONS ====================
export const {
  setCredentials,
  logout,
  restoreSession,
  setError,
  clearError,
  updateUser,
} = authSlice.actions;

// ==================== SELECTORS ====================
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsPlatformAdmin = (state) => state.auth.isPlatformAdmin;
export const selectIsImpersonating = (state) => state.auth.isImpersonating;
export const selectImpersonatedTenant = (state) => state.auth.impersonatedTenant;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthLoading = (state) => state.auth.loading;

// Selector para obtener tenantId (null si es platform admin)
export const selectTenantId = (state) => state.auth.user?.tenantId || null;

// Selector para obtener role
export const selectUserRole = (state) => state.auth.user?.role;

// ==================== REDUCER ====================
export default authSlice.reducer;
