import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthRoute = url.includes('/auth/');
      const isOnLoginPage = window.location.pathname === '/login';

      if (!isAuthRoute && !isOnLoginPage) {
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('nexus_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;