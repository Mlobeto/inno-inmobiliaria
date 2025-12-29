// 🌐 Axios Configuration (JavaScript version)
// Cliente HTTP compartido con interceptors para auth y tenant

import axios from 'axios';

// URL base del API (VITE para web)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Crear instancia de axios
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper para obtener token (compatible web/mobile)
const getToken = async () => {
  if (typeof window !== 'undefined') {
    // Web: localStorage
    return localStorage.getItem('authToken');
  }
  // Mobile: SecureStore (se sobrescribe)
  return null;
};

// Helper para obtener tenant ID
const getTenantId = async () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenantId');
  }
  return null;
};

// Interceptor de Request: Agregar token y tenant
apiClient.interceptors.request.use(
  async (config) => {
    // Agregar token de autenticación
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Agregar tenant_id para multi-tenancy
    const tenantId = await getTenantId();
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Response: Manejar errores globales
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado: redirigir a login
      console.error('Sesión expirada');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    if (error.response?.status === 403) {
      console.error('Acceso denegado');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
