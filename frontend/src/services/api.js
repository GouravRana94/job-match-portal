import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
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

export const auth = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.get('/auth/verify'),
};

export const profile = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  getStats: () => api.get('/profile/stats'),
};

export const jobs = {
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
};

export const applications = {
  getAll: () => api.get('/applications'),
  create: (data) => api.post('/applications', data),
  withdraw: (id) => api.put(`/applications/${id}/withdraw`),
  getStats: () => api.get('/applications/stats/dashboard'),
};

export const matches = {
  getAll: () => api.get('/matches'),
  generate: () => api.post('/matches/generate'),
  getTop: () => api.get('/matches/top'),
};

export default api;