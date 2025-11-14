import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
};

export const productAPI = {
  addProduct: (productData) => api.post('/products', productData),
  getProducts: () => api.get('/products'),
};

export const orderAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: () => api.get('/orders'),
  updateOrderStatus: (orderId, status) => api.put(`/orders/${orderId}/status`, { status }),
};

export const routeAPI = {
  optimizeRoute: (routeData) => api.post('/optimize', routeData),
  createRoute: (routeData) => api.post('/route', routeData),
  getRoutes: () => api.get('/routes'),
};

export const mlAPI = {
  predictDemand: (data) => api.post('/prediction', data),
  getPredictionHistory: () => api.get('/prediction/history'),
};

export const metricsAPI = {
  getCO2Metrics: () => api.get('/metrics/co2'),
  getDashboardMetrics: () => api.get('/metrics/dashboard'),
};

export const dashboardAPI = {
  farmerUpload: (productionData) => api.post('/farmer/upload', productionData),
  retailerDemand: (demandData) => api.post('/retailer/demand', demandData),
  distributorView: () => api.get('/distributor/view'),
};

export default api;
