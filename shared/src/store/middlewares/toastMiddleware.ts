// 🎨 Toast Middleware
// Muestra notificaciones automáticas en success/error de acciones async

import { Middleware } from '@reduxjs/toolkit';
import { showToast } from '../../utils/toastHelper';

const toastMiddleware: Middleware = () => (next) => (action: unknown) => {
  const typedAction = action as { type: string; payload?: unknown };
  // Detectar acciones fulfilled/rejected de async thunks
  if (typedAction.type.endsWith('/fulfilled')) {
    const actionName = typedAction.type.split('/')[1];
    
    // Mostrar toast de éxito para operaciones CRUD
    if (['create', 'update', 'delete'].some(op => actionName.includes(op))) {
      showToast('success', getSuccessMessage(actionName));
    }
  }
  
  if (typedAction.type.endsWith('/rejected')) {
    const errorMessage = typedAction.payload || 'Ocurrió un error';
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
