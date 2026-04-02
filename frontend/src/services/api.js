import axios from 'axios';

// Use production URL on Render, localhost for development
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://job-match-portal-api.onrender.com/api'
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Auth endpoints
export const auth = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.get('/auth/verify'),
};

// Profile endpoints
export const profile = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  getStats: () => api.get('/profile/stats'),
};

// Job endpoints
export const jobs = {
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
};

// Application endpoints
export const applications = {
  getAll: () => api.get('/applications'),
  create: (data) => api.post('/applications', data),
  withdraw: (id) => api.put(`/applications/${id}/withdraw`),
  getStats: () => api.get('/applications/stats/dashboard'),
};

// Match endpoints
export const matches = {
  getAll: () => api.get('/matches'),
  generate: () => api.post('/matches/generate'),
  getTop: () => api.get('/matches/top'),
};

export default api;