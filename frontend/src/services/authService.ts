import { request } from './api';
import type { APIResponse, AuthResponse, User } from '../types';

export const authService = {
  async register(data: {
    email: string;
    full_name: string;
    password: string;
    phone_number?: string;
    role?: string;
  }): Promise<APIResponse<AuthResponse>> {
    return request<APIResponse<AuthResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: {
    email: string;
    password: string;
  }): Promise<APIResponse<AuthResponse>> {
    return request<APIResponse<AuthResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<APIResponse<User>> {
    return request<APIResponse<User>>('/auth/me');
  },

  async updateProfile(data: {
    full_name?: string;
    phone_number?: string;
  }): Promise<APIResponse<User>> {
    return request<APIResponse<User>>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
