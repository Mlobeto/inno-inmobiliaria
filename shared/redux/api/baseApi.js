import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Base API configuration para RTK Query
 * 
 * Esta configuración es compartida entre:
 * - Frontend Web (React)
 * - Mobile App (React Native)
 * 
 * Configuración automática:
 * - Token JWT inyectado en headers
 * - baseURL desde variable de entorno
 * - Tag types para cache invalidation
 */

const getBaseUrl = () => {
  // Para web
  if (typeof window !== 'undefined') {
    return import.meta.env?.VITE_API_URL || 'http://localhost:3001';
  }
  // Para React Native
  return process.env.REACT_APP_API_URL || 'http://localhost:3001';
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: getBaseUrl(),
    prepareHeaders: (headers, { getState }) => {
      // Obtener token del estado de auth
      const token = getState().auth?.token;
      
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      return headers;
    },
  }),
  tagTypes: [
    // Auth
    'Auth',
    'User',
    
    // Platform Admin
    'PlatformAdmin',
    'Tenants',
    'Subscriptions',
    'Dashboard',
    'Metrics',
    'Revenue',
    
    // Tenant Operations
    'Clients',
    'Properties',
    'Leases',
    'Payments',
    'Guarantors',
  ],
  endpoints: () => ({}), // Los endpoints se agregan en archivos separados
});

export default baseApi;
