import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
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
    return Promise.reject(payload);
  }
);

export default api;
