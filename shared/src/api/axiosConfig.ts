// 🌐 Axios Configuration
// Cliente HTTP compartido con interceptors para auth y tenant

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getToken, getTenantId } from '../utils/storageHelper';

// URL base del API (configurable por entorno)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Crear instancia de axios
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Request: Agregar token y tenant
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Obtener token (desde localStorage en web, SecureStore en mobile)
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Agregar tenant_id (para multi-tenancy)
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
      // Token expirado o inválido: redirigir a login
      // Esto se maneja mejor desde el componente App
      console.error('Sesión expirada');
      // Opcional: disparar acción de Redux para logout
    }
    
    if (error.response?.status === 403) {
      console.error('Acceso denegado');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
