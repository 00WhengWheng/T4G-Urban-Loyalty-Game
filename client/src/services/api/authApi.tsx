import { apiClient } from './apiClient';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    username: string;
    first_name?: string;
    last_name?: string;
    total_points: number;
    level: number;
    status: string;
  };
  token_type: string;
}

interface ProfileResponse {
  userType: 'user';
  profile: {
    id: string;
    email: string;
    username: string;
    first_name?: string;
    last_name?: string;
    total_points: number;
    level: number;
    status: string;
  };
}

export const authApi = {
  // User login
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/user/login', data);
    return response.data;
  },

  // User registration
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/user/register', data);
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  // Logout from all devices
  logoutAll: async (): Promise<void> => {
    await apiClient.post('/auth/logout-all');
  },

  // Get current user profile
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Get active sessions
  getSessions: async () => {
    const response = await apiClient.get('/auth/sessions');
    return response.data;
  },

  // Password reset (future implementation)
  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password with token (future implementation)
  resetPassword: async (token: string, password: string) => {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data;
  },

  // Verify email (future implementation)
  verifyEmail: async (token: string) => {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
  },

  // Resend verification email (future implementation)
  resendVerification: async () => {
    const response = await apiClient.post('/auth/resend-verification');
    return response.data;
  },
};