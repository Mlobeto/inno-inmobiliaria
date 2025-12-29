// 🔗 API Endpoints
// Definición centralizada de todas las rutas del API

export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  
  // Clients
  CLIENTS: {
    BASE: '/client',
    BY_ID: (id: number) => `/client/${id}`,
    BY_PROPERTY: (propertyId: number) => `/client/property/${propertyId}`,
  },
  
  // Properties
  PROPERTIES: {
    BASE: '/property',
    BY_ID: (id: number) => `/property/${id}`,
    BY_TYPE: (type: string) => `/property/type/${type}`,
    BY_CLIENT: (clientId: number) => `/property/client/${clientId}`,
    FILTERED: '/property/filter',
  },
  
  // Leases
  LEASES: {
    BASE: '/lease',
    BY_ID: (id: number) => `/lease/${id}`,
    BY_CLIENT: (clientId: number) => `/lease/client/${clientId}`,
    UPDATE_RENT: (id: number) => `/lease/${id}/update-rent`,
    PENDING_UPDATES: '/lease/pending-updates',
  },
  
  // Payments
  PAYMENTS: {
    BASE: '/payment',
    BY_ID: (id: number) => `/payment/${id}`,
    BY_LEASE: (leaseId: number) => `/payment/lease/${leaseId}`,
    BY_CLIENT: (clientId: number) => `/payment/client/${clientId}`,
  },
  
  // Guarantors
  GUARANTORS: {
    BASE: '/garantor',
    BY_ID: (id: number) => `/garantor/${id}`,
  },
  
  // Admin Settings
  ADMIN: {
    SETTINGS: '/admin/settings',
  },
  
  // 🆕 Leads (para fase 5)
  LEADS: {
    BASE: '/leads',
    BY_ID: (id: number) => `/leads/${id}`,
    ASSIGN: (id: number) => `/leads/${id}/assign`,
  },
  
  // 🆕 Public (para landing page)
  PUBLIC: {
    PROPERTIES: (subdomain: string) => `/public/${subdomain}/properties`,
    PROPERTY_DETAIL: (subdomain: string, id: number) => `/public/${subdomain}/properties/${id}`,
    CONTACT: (subdomain: string) => `/public/${subdomain}/leads`,
  },
};
