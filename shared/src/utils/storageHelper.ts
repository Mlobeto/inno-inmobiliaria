// 💾 Storage Helper
// Abstracción para acceder a storage (localStorage en web, SecureStore en mobile)

// Este archivo debe ser implementado de forma diferente en web vs mobile
// Por ahora, implementación base para web

export const getToken = async (): Promise<string | null> => {
  if (typeof window !== 'undefined') {
    // Web: usar localStorage
    return localStorage.getItem('authToken');
  }
  // Mobile: se sobrescribe con SecureStore
  return null;
};

export const setToken = async (token: string): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
};

export const removeToken = async (): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
};

export const getTenantId = async (): Promise<string | null> => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenantId');
  }
  return null;
};

export const setTenantId = async (tenantId: string): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tenantId', tenantId);
  }
};
