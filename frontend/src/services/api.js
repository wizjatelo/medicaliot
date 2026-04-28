import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (email, password) => api.post('/auth/login', { email, password });
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

// Patients
export const getPatients = (params) => api.get('/patients', { params });
export const getPatient = (id) => api.get(`/patients/${id}`);
export const createPatient = (data) => api.post('/patients', data);
export const updatePatient = (id, data) => api.patch(`/patients/${id}`, data);
export const getPatientAdherence = (id, days) => api.get(`/patients/${id}/adherence`, { params: { days } });

// Devices
export const getDevices = () => api.get('/devices');
export const getDevice = (id) => api.get(`/devices/${id}`);
export const createDevice = (data) => api.post('/devices', data);
export const linkDevice = (id, patientId) => api.post(`/devices/${id}/link`, { patientId });
export const unlinkDevice = (id) => api.post(`/devices/${id}/unlink`);
export const testBuzz = (id) => api.post(`/devices/${id}/test-buzz`);

// Alerts
export const getAlerts = (params) => api.get('/alerts', { params });
export const resolveAlert = (id) => api.patch(`/alerts/${id}/resolve`);

// Dashboard
export const getDashboardSummary = () => api.get('/dashboard/summary');

// Medications
export const getMedications = () => api.get('/medications');

// Prescriptions
export const getPatientPrescriptions = (patientId) => api.get(`/prescriptions/patient/${patientId}`);
export const createPrescription = (data) => api.post('/prescriptions', data);

// Dose Events
export const getDoseEvents = (params) => api.get('/events', { params });
