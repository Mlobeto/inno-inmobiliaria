// 📦 Shared Package - Entry Point
// Exporta todo el código compartido para web y mobile

// Store
export { store } from './store';
export type { RootState, AppDispatch } from './store';

// Slices - Exportar reducers
export { default as authReducer } from './store/slices/authSlice';
export { default as clientsReducer } from './store/slices/clientsSlice';
export { default as propertiesReducer } from './store/slices/propertiesSlice';

// Exportar thunks (async actions)
export {
  login,
  register,
  logout,
} from './store/slices/authSlice';

export {
  fetchClients,
  fetchClientById,
  createClient,
  updateClient,
  deleteClient,
} from './store/slices/clientsSlice';

export {
  fetchProperties,
  fetchPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from './store/slices/propertiesSlice';

// Exportar types
export type { User, AuthState } from './store/slices/authSlice';
export type { Client, ClientsState } from './store/slices/clientsSlice';
export type { Property, PropertiesState } from './store/slices/propertiesSlice';

// Exportar actions como namespaces para evitar conflictos
export * as authActions from './store/slices/authSlice';
export * as clientActions from './store/slices/clientsSlice';
export * as propertyActions from './store/slices/propertiesSlice';

// API Services
export * as authService from './api/services/authService';
export * as clientService from './api/services/clientService';
export * as propertyService from './api/services/propertyService';

// API Config
export { apiClient } from './api/axiosConfig';
export { ENDPOINTS } from './api/endpoints';

// Utils
export * from './utils/storageHelper';
export { showToast } from './utils/toastHelper';

// Hooks
export { useAppDispatch, useAppSelector } from './hooks';

// Constants - Configuraciones de países y ubicaciones
export * from './constants';
