import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clms_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  localStorage.setItem('clms_access_token', data.accessToken);
  localStorage.setItem('clms_refresh_token', data.refreshToken);
  return data.user;
}

export function logout() {
  localStorage.removeItem('clms_access_token');
  localStorage.removeItem('clms_refresh_token');
}

export function isAuthed() {
  return Boolean(localStorage.getItem('clms_access_token'));
}

// Typed helpers used by the screens.
export const getDashboard = () => api.get('/dashboard').then((r) => r.data);
export const getJobs = (status?: string) =>
  api.get('/jobs', { params: { status } }).then((r) => r.data);
export const getCustomers = (search?: string) =>
  api.get('/customers', { params: { search } }).then((r) => r.data);
export const getCertificate = (id: string) =>
  api.get(`/certificates/${id}`).then((r) => r.data);
export const getTaskBoard = () => api.get('/tasks/board').then((r) => r.data);
