// 🏠 Property Service
// Servicios para gestión de propiedades

import apiClient from '../axiosConfig';
import { ENDPOINTS } from '../endpoints';
import { Property } from '../../store/slices/propertiesSlice';

export const getAllProperties = () => {
  return apiClient.get(ENDPOINTS.PROPERTIES.BASE);
};

export const getPropertyById = (id: number) => {
  return apiClient.get(ENDPOINTS.PROPERTIES.BY_ID(id));
};

export const getPropertiesByType = (type: 'venta' | 'alquiler') => {
  return apiClient.get(ENDPOINTS.PROPERTIES.BY_TYPE(type));
};

export const getPropertiesByClient = (clientId: number) => {
  return apiClient.get(ENDPOINTS.PROPERTIES.BY_CLIENT(clientId));
};

export const createProperty = (propertyData: Partial<Property>) => {
  return apiClient.post(ENDPOINTS.PROPERTIES.BASE, propertyData);
};

export const updateProperty = (id: number, propertyData: Partial<Property>) => {
  return apiClient.put(ENDPOINTS.PROPERTIES.BY_ID(id), propertyData);
};

export const deleteProperty = (id: number) => {
  return apiClient.delete(ENDPOINTS.PROPERTIES.BY_ID(id));
};

export const filterProperties = (filters: any) => {
  return apiClient.post(ENDPOINTS.PROPERTIES.FILTERED, filters);
};
