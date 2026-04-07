import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          localStorage.setItem('token', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;

export const authAPI = {
  getMe: () => api.get('/auth/me'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

export const expenseAPI = {
  getAll: (params?: any) => api.get('/expenses', { params }),
  getById: (id: string) => api.get(`/expenses/${id}`),
  create: (data: any) => api.post('/expenses', data),
  update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  getRecent: (limit?: number) => api.get('/expenses/recent', { params: { limit } }),
  getOverview: () => api.get('/expenses/stats/overview'),
  getMonthlyStats: (year?: number, month?: number) =>
    api.get('/expenses/stats/monthly', { params: { year, month } }),
  getCategoryBreakdown: (year?: number, month?: number) =>
    api.get('/expenses/stats/categories', { params: { year, month } }),
  getMonthlyTrends: (months?: number) =>
    api.get('/expenses/stats/trends', { params: { months } }),
  getWeeklySpending: () => api.get('/expenses/stats/weekly'),
  getPrediction: () => api.get('/expenses/stats/prediction'),
  uploadReceipt: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/expenses/upload-receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  trainVendor: (data: { vendor: string; categoryId: string; categoryName: string }) =>
    api.post('/expenses/train-vendor', data),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const budgetAPI = {
  getAll: (month?: number, year?: number) => api.get('/budgets', { params: { month, year } }),
  create: (data: any) => api.post('/budgets', data),
  update: (id: string, data: any) => api.put(`/budgets/${id}`, data),
  delete: (id: string) => api.delete(`/budgets/${id}`),
};

export const recurringAPI = {
  getAll: () => api.get('/recurring'),
  create: (data: any) => api.post('/recurring', data),
  update: (id: string, data: any) => api.put(`/recurring/${id}`, data),
  delete: (id: string) => api.delete(`/recurring/${id}`),
};

export const reminderAPI = {
  getAll: () => api.get('/reminders'),
  create: (data: any) => api.post('/reminders', data),
  update: (id: string, data: any) => api.put(`/reminders/${id}`, data),
  markPaid: (id: string) => api.patch(`/reminders/${id}/paid`),
  delete: (id: string) => api.delete(`/reminders/${id}`),
};

export const loanAPI = {
  getAll: () => api.get('/loans'),
  create: (data: any) => api.post('/loans', data),
  update: (id: string, data: any) => api.put(`/loans/${id}`, data),
  recordPayment: (id: string) => api.patch(`/loans/${id}/pay`),
  extraPayment: (id: string, amount: number, note?: string) =>
    api.patch(`/loans/${id}/extra-pay`, { amount, note }),
  getSchedule: (id: string) => api.get(`/loans/${id}/schedule`),
  delete: (id: string) => api.delete(`/loans/${id}`),
};

export const investmentAPI = {
  getAll: () => api.get('/investments'),
  getSummary: () => api.get('/investments/summary'),
  create: (data: any) => api.post('/investments', data),
  update: (id: string, data: any) => api.put(`/investments/${id}`, data),
  delete: (id: string) => api.delete(`/investments/${id}`),
};

export const notificationAPI = {
  getAll: (unread?: boolean) => api.get('/notifications', { params: { unread } }),
  getUnreadCount: () => api.get('/notifications/count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const automationAPI = {
  getRules: () => api.get('/automation/rules'),
  createRule: (data: any) => api.post('/automation/rules', data),
  updateRule: (id: string, data: any) => api.put(`/automation/rules/${id}`, data),
  deleteRule: (id: string) => api.delete(`/automation/rules/${id}`),
  getMappings: () => api.get('/automation/mappings'),
  deleteMapping: (id: string) => api.delete(`/automation/mappings/${id}`),
};

export const exportAPI = {
  csv: (params: Record<string, string>) =>
    api.get('/exports/csv', { params, responseType: 'blob' }),
  excel: (params: Record<string, string>) =>
    api.get('/exports/excel', { params, responseType: 'blob' }),
  pdf: (params: Record<string, string>) =>
    api.get('/exports/pdf', { params, responseType: 'blob' }),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
};

export const bankImportAPI = {
  getProfiles: () => api.get('/bank-import/profiles'),
  createProfile: (data: any) => api.post('/bank-import/profiles', data),
  updateProfile: (id: string, data: any) => api.put(`/bank-import/profiles/${id}`, data),
  deleteProfile: (id: string) => api.delete(`/bank-import/profiles/${id}`),
  preview: (profileId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('profileId', profileId);
    return api.post('/bank-import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  import: (profileId: string, file: File, skipDuplicates: boolean) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('profileId', profileId);
    formData.append('skipDuplicates', String(skipDuplicates));
    return api.post('/bank-import/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
