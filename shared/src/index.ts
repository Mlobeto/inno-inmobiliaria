// 📦 Shared Package - Entry Point
// Exporta todo el código compartido para web y mobile

// Store
export { store } from './store';
export type { RootState, AppDispatch } from './store';

// Slices - Exportar reducers y actions
export { default as authReducer } from './store/slices/authSlice';
export { default as clientsReducer } from './store/slices/clientsSlice';
export { default as propertiesReducer } from './store/slices/propertiesSlice';

// Exportar todas las actions y thunks
export * from './store/slices/authSlice';
export * from './store/slices/clientsSlice';
export * from './store/slices/propertiesSlice';

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
