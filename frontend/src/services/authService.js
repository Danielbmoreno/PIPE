import api from '../api/apiClient.js';
import { normalizeServiceResponse } from './responseHelper.js';

const resource = '/auth';

const login = (payload) => api.post(`${resource}/login`, payload).then(normalizeServiceResponse);

export default { login };
