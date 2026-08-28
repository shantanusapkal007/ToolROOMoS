import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    // If NEXT_PUBLIC_API_URL is explicitly set to relative path or non-localhost domain, use it
    if (envUrl && (envUrl.startsWith('/') || (!envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')))) {
      return envUrl;
    }
    // If accessing via browser on a remote machine (e.g. AWS EC2, custom IP or domain),
    // default to relative '/api/v1' which is proxied by Next.js rewrites to the backend
    const { hostname } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '/api/v1';
    }
  }
  return envUrl || '/api/v1';
};

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
  baseURL: getBaseUrl(),
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
  config.baseURL = getBaseUrl();

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
    const isAuthRoute = originalRequest.url && (originalRequest.url.includes('auth/login') || originalRequest.url.includes('auth/refresh'));
    if (status === 401 && !isAuthRoute && typeof window !== 'undefined') {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retryCount?: number, _isRetry?: boolean };
      
      if (!originalRequest._isRetry) {
        originalRequest._isRetry = true;
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
          try {
            // Use standard axios to avoid interceptor loop
            const res = await axios.post(`${getBaseUrl()}/auth/refresh`, { refresh_token: refreshToken });
            const payload = res.data?.data?.access_token ? res.data.data : res.data;
            const { access_token, refresh_token: new_refresh_token } = payload;
            
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
    let message = 'An unexpected error occurred.';
    if (responseData?.message) {
      message = Array.isArray(responseData.message)
        ? responseData.message.join(', ')
        : String(responseData.message);
    } else if (error.message) {
      message = error.message;
    }
    
    throw new ApiBusinessError(message, status, responseData);
  }
);

const cleanPath = (path: string): string => {
  if (!path) return '';
  let cleaned = path;
  if (cleaned.startsWith('/')) {
    cleaned = cleaned.slice(1);
  }
  if (cleaned.startsWith('api/v1/')) {
    cleaned = cleaned.slice(7);
  }
  return cleaned;
};

// Wrapper to retain the original interface
export const api = {
  get: <T = any>(path: string, config?: any): Promise<ApiResponse<T>> => 
    axiosInstance.get(cleanPath(path), config),
    
  post: <T = any>(path: string, body?: any, config?: any): Promise<ApiResponse<T>> => 
    axiosInstance.post(cleanPath(path), body, config),
    
  put: <T = any>(path: string, body?: any, config?: any): Promise<ApiResponse<T>> => 
    axiosInstance.put(cleanPath(path), body, config),
    
  patch: <T = any>(path: string, body?: any, config?: any): Promise<ApiResponse<T>> => 
    axiosInstance.patch(cleanPath(path), body, config),
    
  delete: <T = any>(path: string, config?: any): Promise<ApiResponse<T>> => 
    axiosInstance.delete(cleanPath(path), config),
};

export default api;

