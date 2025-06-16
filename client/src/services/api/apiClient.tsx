import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { toast } from 'sonner';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token from localStorage if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log request time in development
    if (import.meta.env.DEV) {
      const endTime = new Date();
      const duration = endTime.getTime() - response.config.metadata?.startTime?.getTime();
      console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle different error scenarios
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          localStorage.removeItem('auth_token');
          if (window.location.pathname !== '/login') {
            toast.error('Sessione scaduta. Effettua nuovamente il login.');
            window.location.href = '/login';
          }
          break;
          
        case 403:
          toast.error('Non hai i permessi per accedere a questa risorsa.');
          break;
          
        case 404:
          toast.error('Risorsa non trovata.');
          break;
          
        case 429:
          toast.error('Troppe richieste. Riprova tra qualche minuto.');
          break;
          
        case 500:
          toast.error('Errore del server. Riprova più tardi.');
          break;
          
        default:
          // Handle validation errors and other API errors
          const message = (data as any)?.message || 'Si è verificato un errore imprevisto.';
          toast.error(message);
      }
    } else if (error.request) {
      // Network error
      toast.error('Errore di connessione. Controlla la tua connessione internet.');
    } else {
      // Something else happened
      toast.error('Si è verificato un errore imprevisto.');
    }
    
    return Promise.reject(error);
  }
);

// API Health check
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api/v1', '')}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error('API Health check failed:', error);
    return false;
  }
};

// Generic API methods
export const api = {
  get: <T = any>(url: string, config?: any) => 
    apiClient.get<T>(url, config),
    
  post: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.post<T>(url, data, config),
    
  put: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.put<T>(url, data, config),
    
  patch: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.patch<T>(url, data, config),
    
  delete: <T = any>(url: string, config?: any) => 
    apiClient.delete<T>(url, config),
};

// Upload files
export const uploadFile = async (file: File, endpoint: string, onProgress?: (progress: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return apiClient.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
};

// Download files
export const downloadFile = async (url: string, filename?: string) => {
  const response = await apiClient.get(url, {
    responseType: 'blob',
  });
  
  const blob = new Blob([response.data]);
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || 'download';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export default apiClient;