/**
 * API Pública - Endpoints sin autenticación
 * Para landing page y acceso público
 */

import { baseApi } from './baseApi';

export const publicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // ============================================
    // 📋 PLANES PÚBLICOS
    // ============================================
    
    getPublicPlans: builder.query({
      query: () => '/public/plans',
      providesTags: ['PublicPlans'],
    }),

    getPublicModules: builder.query({
      query: () => '/public/modules',
      providesTags: ['PublicModules'],
    }),

  }),
  overrideExisting: false,
});

// Export hooks
export const {
  useGetPublicPlansQuery,
  useGetPublicModulesQuery,
} = publicApi;

export default publicApi;
