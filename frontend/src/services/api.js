import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - Add auth token
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

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  refreshToken: () => api.post('/auth/refresh-token'),
};

// Users APIs
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  delete: (id) => api.delete(`/users/${id}`),
};

// Subjects APIs
export const subjectsAPI = {
  getAll: (params) => api.get('/subjects', { params }),
  getById: (id) => api.get(`/subjects/${id}`),
  getPopular: (limit) => api.get('/subjects/popular', { params: { limit } }),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
};

// Tutors APIs
export const tutorsAPI = {
  getAll: (params) => api.get('/tutors', { params }),
  getById: (id) => api.get(`/tutors/${id}`),
  getStats: (id) => api.get(`/tutors/${id}/stats`),
  createProfile: (data) => api.post('/tutors/profile', data),
  updateAvailability: (data) => api.put('/tutors/availability', data),
  toggleAvailability: (data) => api.patch('/tutors/availability', data),
};

// Match APIs
export const matchAPI = {
  getMatches: (params) => api.get('/match', { params }),
  getRecommendations: (params) => api.get('/match/recommend', { params }),
  getAIMatches: (params) => api.get('/match/ai', { params }),
  accept: (matchId) => api.post(`/match/${matchId}/accept`),
  reject: (matchId) => api.post(`/match/${matchId}/reject`),
};

// Booking APIs
export const bookingsAPI = {
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  confirm: (id) => api.patch(`/bookings/${id}/confirm`),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),
  reschedule: (id, scheduledAt) => api.patch(`/bookings/${id}/reschedule`, { scheduledAt }),
  getAvailability: (tutorId, params) => api.get(`/bookings/availability/${tutorId}`, { params }),
};

// Session APIs
export const sessionsAPI = {
  getAll: (params) => api.get('/sessions', { params }),
  getById: (id) => api.get(`/sessions/${id}`),
  getChat: (id, params) => api.get(`/sessions/${id}/chat`, { params }),
  create: (data) => api.post('/sessions', data),
  updateNotes: (id, data) => api.patch(`/sessions/${id}/notes`, data),
  complete: (id, data) => api.patch(`/sessions/${id}/complete`, data),
  saveTools: (id, data) => api.post(`/sessions/${id}/tools`, data),
  addChat: (id, data) => api.post(`/sessions/${id}/chat`, data),
};

// Progress APIs
export const progressAPI = {
  getProgress: (learnerId) => api.get(`/progress/${learnerId}`),
  getAnalytics: (learnerId) => api.get(`/progress/${learnerId}/analytics`),
  record: (data) => api.post('/progress/record', data),
  createPath: (data) => api.post('/progress/path', data),
  updatePath: (id, data) => api.patch(`/progress/path/${id}`, data),
  awardBadge: (data) => api.post('/progress/badge', data),
};

// Community APIs
export const communityAPI = {
  getAll: (params) => api.get('/community', { params }),
  getById: (id) => api.get(`/community/${id}`),
  search: (params) => api.get('/community/search', { params }),
  create: (data) => api.post('/community', data),
  reply: (id, data) => api.post(`/community/${id}/reply`, data),
  upvote: (id) => api.post(`/community/${id}/upvote`),
  downvote: (id) => api.post(`/community/${id}/downvote`),
  acceptAnswer: (data) => api.post('/community/accept', data),
};

// Analytics APIs
export const analyticsAPI = {
  getUser: (userId) => api.get(`/analytics/user/${userId}`),
  track: (data) => api.post('/analytics/track', data),
  getEvents: (params) => api.get('/analytics/events', { params }),
};

// Notification APIs
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  send: (data) => api.post('/notifications/send', data),
  broadcast: (data) => api.post('/notifications/broadcast', data),
};

export default api;
