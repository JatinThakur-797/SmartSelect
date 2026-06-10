
import api from '../axios/api';
import { AuthResponse } from '../types/AuthResponse';
import { LoginRequest } from '../types/LoginRequest';
import { RegisterRequest } from '../types/RegisterRequest';
import { User } from '../types/User';

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};