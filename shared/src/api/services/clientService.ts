// 👥 Client Service
// Servicios para gestión de clientes

import apiClient from '../axiosConfig';
import { ENDPOINTS } from '../endpoints';
import { Client } from '../../store/slices/clientsSlice';

export const getAllClients = () => {
  return apiClient.get(ENDPOINTS.CLIENTS.BASE);
};

export const getClientById = (id: number) => {
  return apiClient.get(ENDPOINTS.CLIENTS.BY_ID(id));
};

export const createClient = (clientData: Partial<Client>) => {
  return apiClient.post(ENDPOINTS.CLIENTS.BASE, clientData);
};

export const updateClient = (id: number, clientData: Partial<Client>) => {
  return apiClient.put(ENDPOINTS.CLIENTS.BY_ID(id), clientData);
};

export const deleteClient = (id: number) => {
  return apiClient.delete(ENDPOINTS.CLIENTS.BY_ID(id));
};

export const getClientsByProperty = (propertyId: number) => {
  return apiClient.get(ENDPOINTS.CLIENTS.BY_PROPERTY(propertyId));
};
