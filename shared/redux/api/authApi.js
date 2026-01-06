import { baseApi } from './baseApi';

/**
 * Authentication API
 * 
 * Endpoints para autenticación y gestión de usuarios:
 * - Login (detecta automáticamente PLATFORM_ADMIN vs tenant admin)
 * - Register
 * - Verify token
 * - Forgot password
 * - Reset password
 * 
 * IMPORTANTE: Después del login, revisa admin.tenantId:
 * - Si tenantId es null → PLATFORM_ADMIN → Redirigir a /platform-admin
 * - Si tenantId existe → Tenant admin/agent → Redirigir a /panel
 */

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // ==================== LOGIN ====================
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials, // { username, password }
      }),
      invalidatesTags: ['Auth', 'User'],
      // Transformar respuesta para incluir información útil
      transformResponse: (response) => {
        const { admin, token } = response;
        return {
          ...response,
          isPlatformAdmin: admin.tenantId === null,
          redirectTo: admin.tenantId === null ? '/platform-admin/dashboard' : '/panel'
        };
      },
    }),
    
    // ==================== REGISTER ====================
    register: builder.mutation({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data, // { username, password, tenantId?, role? }
      }),
      invalidatesTags: ['Auth'],
    }),

    // ==================== REGISTER TENANT (with plan) ====================
    registerTenant: builder.mutation({
      query: (data) => ({
        url: '/auth/register-tenant',
        method: 'POST',
        body: data, // { companyName, fullName, email, password, planId }
      }),
      invalidatesTags: ['Auth'],
      transformResponse: (response) => {
        const { user } = response;
        return {
          ...response,
          isPlatformAdmin: user.tenantId === null,
          redirectTo: user.tenantId === null ? '/platform-admin/dashboard' : '/dashboard'
        };
      },
    }),
    
    // ==================== VERIFY TOKEN ====================
    verifyToken: builder.query({
      query: () => '/auth/verify',
      providesTags: ['Auth', 'User'],
      // Transformar respuesta igual que login
      transformResponse: (response) => {
        const { admin } = response;
        return {
          ...response,
          isPlatformAdmin: admin.tenantId === null,
          redirectTo: admin.tenantId === null ? '/platform-admin/dashboard' : '/panel'
        };
      },
    }),
    
    // ==================== FORGOT PASSWORD ====================
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data, // { email }
      }),
      // No invalida tags porque no afecta datos del usuario
    }),
    
    // ==================== RESET PASSWORD ====================
    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data, // { token, newPassword }
      }),
      // No invalida tags porque no afecta datos actuales del usuario logueado
    }),
    
    // ==================== GET ALL ADMINS ====================
    getAllAdmins: builder.query({
      query: () => '/auth/admin',
      providesTags: ['User'],
    }),
    
    // ==================== EDIT ADMIN ====================
    editAdmin: builder.mutation({
      query: ({ adminId, ...data }) => ({
        url: `/auth/${adminId}`,
        method: 'PUT',
        body: data, // { username?, password? }
      }),
      invalidatesTags: ['User', 'Auth'],
    }),
    
    // ==================== DELETE ADMIN ====================
    deleteAdmin: builder.mutation({
      query: (adminId) => ({
        url: `/auth/${adminId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    
    // ==================== GET CURRENT TENANT ====================
    getCurrentTenant: builder.query({
      query: () => '/admin/tenant',
      providesTags: ['Tenant'],
    }),
  }),
});

// Exportar hooks generados automáticamente
export const {
  useLoginMutation,
  useRegisterMutation,
  useRegisterTenantMutation,
  useVerifyTokenQuery,
  useLazyVerifyTokenQuery, // Para verificar token manualmente
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetAllAdminsQuery,
  useEditAdminMutation,
  useDeleteAdminMutation,
  useGetCurrentTenantQuery,
} = authApi;

export default authApi;
