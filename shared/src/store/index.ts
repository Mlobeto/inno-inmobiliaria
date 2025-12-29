// 🏗️ Redux Store - Configuración central
// Combina todos los slices y middlewares

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import clientsReducer from './slices/clientsSlice';
import propertiesReducer from './slices/propertiesSlice';
// Importar más slices cuando los crees:
// import leasesReducer from './slices/leasesSlice';
// import paymentsReducer from './slices/paymentsSlice';
// import leadsReducer from './slices/leadsSlice';

import toastMiddleware from './middlewares/toastMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clients: clientsReducer,
    properties: propertiesReducer,
    // leases: leasesReducer,
    // payments: paymentsReducer,
    // leads: leadsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorar acciones específicas si es necesario
        ignoredActions: ['auth/login/fulfilled'],
      },
    }).concat(toastMiddleware),
});

// Tipos para TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks tipados (para usar en componentes)
// Estos se exportan desde hooks/useTypedSelector.ts
