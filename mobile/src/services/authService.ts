/**
 * services/authService.ts
 * Day 2 authentication wiring for the WeatherWise AI app.
 */

import { apiFetch } from './api';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export async function getCurrentUser(): Promise<AuthResponse['user']> {
  const response = await apiFetch<{ user: AuthResponse['user'] }>('/auth/me');
  return response.user;
}

export async function registerUser(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
