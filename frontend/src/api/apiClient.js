import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  try {
    const storage = localStorage.getItem('pipe_auth');
    if (storage) {
      const { token } = JSON.parse(storage);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {
    console.warn('Error leyendo token local', e);
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success) {
        return response.data;
      }
      return Promise.reject(response.data);
    }
    return response.data;
  },
  (error) => {
    const payload = error.response?.data || error;
    if (error.response?.status === 401) {
      localStorage.removeItem('pipe_auth');
      window.location.href = `${import.meta.env.BASE_URL}#/login`;
    }
    return Promise.reject(payload);
  }
);

export default api;
