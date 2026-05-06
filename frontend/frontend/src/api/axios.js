import axios from 'axios';

// Create a pre-configured axios instance
// All API calls will use this instead of plain axios
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8082/api',
  timeout: 30000, // 30 seconds — code execution can take time
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR
// Automatically attach JWT token to every request if user is logged in
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
// If the server returns 401 (unauthorized), clear token and redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;