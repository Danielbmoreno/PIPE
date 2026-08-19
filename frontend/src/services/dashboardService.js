import api from '../api/apiClient.js';
import { normalizeServiceResponse } from './responseHelper.js';

const getMetrics = () => api.get('/dashboard').then(normalizeServiceResponse);

export default { getMetrics };
