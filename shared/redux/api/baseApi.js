import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { toast } from 'react-toastify';

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
 * - Manejo automático de 401 (sesión expirada)
 */

const getBaseUrl = () => {
  // Para web
  if (typeof window !== 'undefined') {
    return import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';
  }
  // Para React Native / Expo
  return process.env.EXPO_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
};

// BaseQuery con manejo de errores 401
const baseQueryWithReauth = async (args, api, extraOptions) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: getBaseUrl(),
    prepareHeaders: (headers, { getState }) => {
      // Intentar obtener token del estado de Redux primero
      let token = getState().auth?.token;
      
      // Si no está en Redux, intentar obtenerlo de localStorage
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('token');
      }
      
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      return headers;
    },
  });

  const result = await baseQuery(args, api, extraOptions);

  // Si hay un error 401 (Unauthorized)
  if (result.error && result.error.status === 401) {
    // Solo en entorno web
    if (typeof window !== 'undefined') {
      // Limpiar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Mostrar notificación
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', {
        position: 'top-center',
        autoClose: 5000,
      });
      
      // Redirigir al login después de un breve delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    // Auth
    'Auth',
    'User',
    
    // Platform Admin
    'PlatformAdmin',
    'Tenants',
    'Plans',
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
    
    // PDF Templates
    'PdfTemplates',
    'PdfTemplateTypes',

    // Leads/CRM
    'Lead',

    // Soporte / Tickets
    'Ticket',

    // Loteos
    'Loteo',
    'LoteVenta',

    // Agentes y Comisiones
    'Agent',
    'Commission',
  ],
  endpoints: () => ({}), // Los endpoints se agregan en archivos separados
});

export default baseApi;
