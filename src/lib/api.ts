import axios from 'axios';
import type { AuthUser } from './auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) {
        const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
        const token = parsed.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      /* ignore */
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Cars API
export const carsApi = {
  getAll: (params?: Record<string, any>) => api.get('/cars', { params }),
  getOne: (id: string) => api.get(`/cars/${id}`),
  getFeatured: (limit = 6) => api.get(`/cars/featured?limit=${limit}`),
  getSimilar: (id: string) => api.get(`/cars/${id}/similar`),
  getBrands: () => api.get('/cars/brands'),
  getStats: () => api.get('/cars/stats'),
  seed: () => api.post('/cars/seed'),
  create: (formData: FormData) =>
    api.post('/cars', formData, { timeout: 120000, maxContentLength: Infinity, maxBodyLength: Infinity }),
  update: (id: string, formData: FormData) =>
    api.patch(`/cars/${id}`, formData, { timeout: 120000, maxContentLength: Infinity, maxBodyLength: Infinity }),
  delete: (id: string) => api.delete(`/cars/${id}`),

  // Seller workflow
  submitBySeller: (formData: FormData) =>
    api.post('/cars/seller', formData, { timeout: 120000, maxContentLength: Infinity, maxBodyLength: Infinity }),
  getMine: () => api.get('/cars/mine'),

  // Admin workflow
  getPending: () => api.get('/cars/admin/pending'),
  publish: (id: string) => api.patch(`/cars/${id}/publish`),
  reject: (id: string, reason?: string) =>
    api.patch(`/cars/${id}/reject`, { reason }),

  /** تقييم السعر بالذكاء الاصطناعي (كل مواصفات السيارة) */
  evaluatePrice: (id: string) => api.get(`/cars/${id}/evaluate-price`),
};

export const priceEvaluationApi = {
  evaluate: (body: Record<string, unknown>) =>
    api.post('/price-evaluation/evaluate', body),
  getCatalog: () =>
    api.get<import('./market-catalog').MarketCatalogFull>('/price-evaluation/catalog'),
};

// Spare Parts API
export const sparePartsApi = {
  getAll: (params?: Record<string, any>) => api.get('/spare-parts', { params }),
  getOne: (id: string) => api.get(`/spare-parts/${id}`),
  getByCar: (carId: string) => api.get(`/spare-parts/car/${carId}`),
  getCategories: () => api.get('/spare-parts/categories'),
  seed: () => api.post('/spare-parts/seed'),
};

// Comparison API
export const comparisonApi = {
  compare: (carIds: string[]) => api.post('/compare', { carIds }),
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; user: AuthUser }>('/auth/login', { email, password }),
  register: (email: string, password: string, name: string, role?: 'user' | 'seller') =>
    api.post<{ accessToken: string; user: AuthUser }>('/auth/register', {
      email,
      password,
      name,
      ...(role ? { role } : {}),
    }),
  me: () => api.get<AuthUser>('/auth/me'),
};
