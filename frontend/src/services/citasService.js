import api from '../api/apiClient.js';
import { normalizeServiceResponse } from './responseHelper.js';

const resource = '/citas';

const getAll = () => api.get(resource).then(normalizeServiceResponse);
const getById = (id) => api.get(`${resource}/${id}`).then(normalizeServiceResponse);
const create = (payload) => api.post(resource, payload).then(normalizeServiceResponse);
const update = (id, payload) => api.put(`${resource}/${id}`, payload).then(normalizeServiceResponse);
const remove = (id) => api.delete(`${resource}/${id}`).then(normalizeServiceResponse);

export default { getAll, getById, create, update, remove };
