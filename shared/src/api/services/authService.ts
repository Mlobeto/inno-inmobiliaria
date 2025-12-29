// 🔐 Auth Service
// Servicios de autenticación

import apiClient from '../axiosConfig';
import { ENDPOINTS } from '../endpoints';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export const login = (credentials: LoginCredentials) => {
  return apiClient.post(ENDPOINTS.AUTH.LOGIN, credentials);
};

export const register = (userData: RegisterData) => {
  return apiClient.post(ENDPOINTS.AUTH.REGISTER, userData);
};

export const logout = () => {
  return apiClient.post(ENDPOINTS.AUTH.LOGOUT);
};

export const getCurrentUser = () => {
  return apiClient.get(ENDPOINTS.AUTH.ME);
};
