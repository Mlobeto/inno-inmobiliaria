/**
 * Base API configurada con RTK Query
 * Maneja automáticamente el caching, refetching y estados de loading
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    prepareHeaders: (headers, { getState }) => {
      // Obtener token del estado de autenticación
      const token = getState().auth?.token;
      
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      
      return headers;
    },
  }),
  tagTypes: [
    'PlatformAdmin',
    'Tenants', 
    'Subscriptions',
    'Dashboard',
    'Metrics',
    'Revenue'
  ],
  endpoints: () => ({}), // Los endpoints se inyectan en archivos separados
});
