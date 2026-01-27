import axios from 'axios';
import { getAuthToken, setAuthToken, removeAuthToken } from '@/lib/utils';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL + '/v1', // Add /v1 prefix
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Log errors for debugging
        if (error.response) {
            console.error('API Error Response:', {
                status: error.response.status,
                data: error.response.data,
                url: originalRequest?.url
            });
        } else if (error.request) {
            console.error('API No Response:', {
                request: error.request,
                url: originalRequest?.url
            });
        } else {
            console.error('API Error:', error.message);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const response = await api.post('/auth/refresh');
                const { access_token } = response.data;
                setAuthToken(access_token);
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                removeAuthToken();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// ============================================================
// 1. AUTHENTICATION & SESSION MANAGEMENT
// ============================================================

export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    refresh: () => api.post('/auth/refresh'),
    me: () => api.get('/auth/me'),
};

// ============================================================
// 2. USER PROFILE
// ============================================================

export const profileAPI = {
    get: () => api.get('/profile/'),
    update: (data) => api.patch('/profile/', data),
};

// ============================================================
// 3. STATION DISCOVERY & VIEW
// ============================================================

export const stationAPI = {
    getAll: (params) => api.get('/stations/', { params }),
    getById: (stationId) => api.get(`/stations/${stationId}`),
    getMapView: () => api.get('/driver/stations/map'),
    getAvailability: (stationId) => api.get(`/stations/${stationId}/availability`),
};

// ============================================================
// 4. TELEMETRY & AI HEALTH (OWNER)
// ============================================================

export const telemetryAPI = {
    getStationTelemetry: (stationId, params) =>
        api.get(`/telemetry/station/${stationId}`, { params }),
    getAIAnalysis: (stationId) => api.get(`/ai/station/${stationId}`),
};

// ============================================================
// 5. BOOKING FLOW (DRIVER)
// ============================================================

export const bookingAPI = {
    create: (data) => api.post('/bookings/', data),
    getMy: () => api.get('/bookings/my'),
    getById: (bookingId) => api.get(`/bookings/${bookingId}`),
    cancel: (bookingId) => api.patch(`/bookings/${bookingId}/cancel`),
};

// ============================================================
// 6. CHARGER STATUS
// ============================================================

export const chargerAPI = {
    getStatus: (chargerId) => api.get(`/chargers/${chargerId}/status`),
};

// ============================================================
// 7. OWNER / OPERATOR DASHBOARD
// ============================================================

export const ownerAPI = {
    getStations: () => api.get('/owner/stations'),
    getStationById: (stationId) => api.get(`/owner/stations/${stationId}`),
    updatePricing: (stationId, pricePerHour) =>
        api.patch(`/owner/stations/${stationId}/pricing`, pricePerHour),
    getRevenue: (params) => api.get('/owner/revenue', { params }),
    getRevenueBreakdown: (params) => api.get('/owner/revenue/breakdown', { params }),
};

// ============================================================
// 8. ANALYTICS
// ============================================================

export const analyticsAPI = {
    getStationAnalytics: (stationId, params) =>
        api.get(`/analytics/station/${stationId}`, { params }),
    getUsage: (params) => api.get('/analytics/usage', { params }),
    getRevenue: (params) => api.get('/analytics/revenue', { params }),
};

// ============================================================
// 9. NOTIFICATIONS
// ============================================================

export const notificationAPI = {
    getAll: (params) => api.get('/notifications', { params }),
    markAsRead: (notificationId) =>
        api.patch(`/notifications/${notificationId}/read`),
};

// ============================================================
// 10. ADMIN MODERATION
// ============================================================

export const adminAPI = {
    getAllStations: (params) => api.get('/admin/stations', { params }),
    updateStationStatus: (stationId, status) =>
        api.patch(`/admin/stations/${stationId}/status`, status, {
            headers: { 'Content-Type': 'text/plain' }
        }),
    getCriticalFaults: (params) => api.get('/admin/faults/critical', { params }),
    disableUser: (userId) => api.patch(`/admin/users/${userId}/disable`),
    enableUser: (userId) => api.patch(`/admin/users/${userId}/enable`),
};

// ============================================================
// 11. SYSTEM / META
// ============================================================

export const systemAPI = {
    health: () => axios.get(`${API_BASE_URL.replace('/api', '')}/health`), // Health is at root, not /api/v1
};

export default api;