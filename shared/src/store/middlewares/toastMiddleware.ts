// 🎨 Toast Middleware
// Muestra notificaciones automáticas en success/error de acciones async

import { Middleware } from '@reduxjs/toolkit';
import { showToast } from '../../utils/toastHelper';

const toastMiddleware: Middleware = () => (next) => (action) => {
  // Detectar acciones fulfilled/rejected de async thunks
  if (action.type.endsWith('/fulfilled')) {
    const actionName = action.type.split('/')[1];
    
    // Mostrar toast de éxito para operaciones CRUD
    if (['create', 'update', 'delete'].some(op => actionName.includes(op))) {
      showToast('success', getSuccessMessage(actionName));
    }
  }
  
  if (action.type.endsWith('/rejected')) {
    const errorMessage = action.payload || 'Ocurrió un error';
    showToast('error', errorMessage as string);
  }
  
  return next(action);
};

function getSuccessMessage(actionName: string): string {
  const messages: Record<string, string> = {
    create: '✅ Creado exitosamente',
    update: '✅ Actualizado exitosamente',
    delete: '✅ Eliminado exitosamente',
  };
  
  for (const [key, message] of Object.entries(messages)) {
    if (actionName.includes(key)) return message;
  }
  
  return '✅ Operación exitosa';
}

export default toastMiddleware;
