import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const API_VERSION = '1.0';

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiBusinessError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiBusinessError';
    this.status = status;
    this.data = data;
  }
}

export class ApiNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiNetworkError';
  }
}

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds default
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': API_VERSION,
  },
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRYABLE_STATUS_CODES = [502, 503, 504];
const NON_RETRYABLE_STATUS_CODES = [400, 401, 403, 404, 409, 422];

// Auth interceptor
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Inject Request ID
  if (!config.headers.has('X-Request-ID')) {
    config.headers.set('X-Request-ID', crypto.randomUUID());
  }

  // Idempotency Key for mutations
  if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
    if (!config.headers.has('Idempotency-Key')) {
      config.headers.set('Idempotency-Key', crypto.randomUUID());
    }
  }

  return config;
});

// Response & Error interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retryCount?: number };
    
    // Network Error or Timeout
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        throw new ApiNetworkError('Request timed out. Please try again.');
      }
      throw new ApiNetworkError('Network error. Please check your connection.');
    }

    const status = error.response.status;

    // 401 Unauthorized handling (Token Refresh)
    if (status === 401 && typeof window !== 'undefined') {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retryCount?: number, _isRetry?: boolean };
      
      if (!originalRequest._isRetry) {
        originalRequest._isRetry = true;
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
          try {
            // Use standard axios to avoid interceptor loop
            const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
            const { access_token, refresh_token: new_refresh_token } = res.data;
            
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', new_refresh_token);
            
            // Retry the original request
            originalRequest.headers.set('Authorization', `Bearer ${access_token}`);
            return axiosInstance(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
               window.location.href = '/login';
            }
            throw new ApiBusinessError('Session expired. Please log in again.', 401);
          }
        }
      }
      
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
         window.location.href = '/login';
      }
      throw new ApiBusinessError('Session expired. Please log in again.', 401);
    }

    // Retry Logic
    if (RETRYABLE_STATUS_CODES.includes(status)) {
      originalRequest._retryCount = originalRequest._retryCount || 0;
      
      if (originalRequest._retryCount < MAX_RETRIES) {
        originalRequest._retryCount++;
        const backoffTime = Math.pow(2, originalRequest._retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
        return axiosInstance(originalRequest);
      }
    }

    // Wrap in Business Error to prevent raw Axios errors from leaking to UI
    const responseData = error.response.data as any;
    const message = responseData?.message || error.message || 'An unexpected error occurred.';
    
    throw new ApiBusinessError(message, status, responseData);
  }
);

// Wrapper to retain the original interface
export const api = {
  get: <T = any>(path: string, config?: any): Promise<ApiResponse<T>> => 
    axiosInstance.get(path, config),
    
  post: <T = any>(path: string, body?: any, config?: any): Promise<ApiResponse<T>> => 
    axiosInstance.post(path, body, config),
    
  put: <T = any>(path: string, body?: any, config?: any): Promise<ApiResponse<T>> => 
    axiosInstance.put(path, body, config),
    
  patch: <T = any>(path: string, body?: any, config?: any): Promise<ApiResponse<T>> => 
    axiosInstance.patch(path, body, config),
    
  delete: <T = any>(path: string, config?: any): Promise<ApiResponse<T>> => 
    axiosInstance.delete(path, config),
};
