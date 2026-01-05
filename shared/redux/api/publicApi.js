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

  }),
  overrideExisting: false,
});

// Export hooks
export const {
  useGetPublicPlansQuery,
} = publicApi;

export default publicApi;
