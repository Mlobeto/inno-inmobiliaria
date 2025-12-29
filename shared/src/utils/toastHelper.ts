// 🔔 Toast Helper
// Abstracción para mostrar notificaciones (react-toastify en web, Alert/Toast en mobile)

type ToastType = 'success' | 'error' | 'info' | 'warning';

export const showToast = (type: ToastType, message: string) => {
  // Esta función debe ser implementada de forma diferente en web vs mobile
  
  // En web: usar react-toastify
  if (typeof window !== 'undefined') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Implementar con react-toastify en web
  }
  
  // En mobile: usar Alert o expo-notifications
  // Se sobrescribe en mobile/src/utils/toastHelper.ts
};

export default showToast;
