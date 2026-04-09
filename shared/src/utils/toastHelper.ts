// 🔔 Toast Helper
// Abstracción para mostrar notificaciones (react-toastify en web, Alert/Toast en mobile)

type ToastType = 'success' | 'error' | 'info' | 'warning';

export const showToast = (type: ToastType, message: string) => {
  // Stub — implementado por cada plataforma (web usa react-toastify, mobile usa Alert)
  void type;
  void message;
};

export default showToast;
