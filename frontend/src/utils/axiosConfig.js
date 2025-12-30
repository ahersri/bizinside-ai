import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Handle successful responses
    if (response.data?.message) {
      // Only show toast for non-GET requests
      if (response.config.method !== 'get') {
        toast.success(response.data.message, {
          duration: 3000,
          position: 'top-right',
        });
      }
    }
    return response;
  },
  (error) => {
    // Handle errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear storage and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
          break;
          
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
          
        case 404:
          toast.error('Resource not found.');
          break;
          
        case 422:
          // Validation errors
          if (data.errors) {
            Object.values(data.errors).forEach((err) => {
              toast.error(err);
            });
          } else {
            toast.error(data.error || 'Validation failed');
          }
          break;
          
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
          
        case 500:
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          toast.error(data?.error || 'An error occurred');
      }
    } else if (error.request) {
      // Request was made but no response received
      toast.error('Network error. Please check your connection.');
    } else {
      // Something else happened
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// API helper functions
export const api = {
  // GET request
  get: (url, config = {}) => axiosInstance.get(url, config),
  
  // POST request
  post: (url, data, config = {}) => axiosInstance.post(url, data, config),
  
  // PUT request
  put: (url, data, config = {}) => axiosInstance.put(url, data, config),
  
  // DELETE request
  delete: (url, config = {}) => axiosInstance.delete(url, config),
  
  // PATCH request
  patch: (url, data, config = {}) => axiosInstance.patch(url, data, config),
  
  // Upload file
  upload: (url, file, module, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return axiosInstance.post(`${url}/${module}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
};

export default axiosInstance;