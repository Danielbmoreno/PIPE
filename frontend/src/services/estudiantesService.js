import api from '../api/apiClient.js';
import { normalizeServiceResponse } from './responseHelper.js';

const resource = '/estudiantes';

const estudiantesService = {
  getAll: () => api.get(resource).then(normalizeServiceResponse),
  getById: (id) => api.get(`${resource}/${id}`).then(normalizeServiceResponse),
  create: (payload) => api.post(resource, payload).then(normalizeServiceResponse),
  update: (id, payload) => api.put(`${resource}/${id}`, payload).then(normalizeServiceResponse),
  remove: (id) => api.delete(`${resource}/${id}`).then(normalizeServiceResponse)
};

export default estudiantesService;
