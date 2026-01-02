import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "../Reducer/reducer"; // Reducer antiguo (se irá eliminando gradualmente)
import toastMiddleware from "../../utils/toastMiddleware";

// ==================== SHARED REDUX (NUEVO) ====================
// Importar desde shared para compatibilidad con mobile
import { 
  baseApi,
  authReducer,
  platformAdminReducer 
} from '../../../shared/redux';

export const store = configureStore({
  reducer: {
    // ==================== REDUX ANTIGUO (DEPRECADO) ====================
    // Mantener temporalmente para compatibilidad
    // TODO: Migrar gradualmente a shared/redux
    ...rootReducer,
    
    // ==================== SHARED REDUX (NUEVO) ====================
    // RTK Query API
    [baseApi.reducerPath]: baseApi.reducer,
    
    // Slices modernos
    auth: authReducer,
    platformAdmin: platformAdminReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(baseApi.middleware) // RTK Query middleware
      .concat(toastMiddleware), // Toast middleware personalizado
});

export default store;
