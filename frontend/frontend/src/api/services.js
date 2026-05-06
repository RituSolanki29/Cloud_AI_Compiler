import API from './axios';

// AUTH
export const loginUser = (credentials) => API.post('/auth/login', credentials);
export const registerUser = (userData) => API.post('/auth/register', userData);

// CODE EXECUTION
export const executeCode = (payload) => API.post('/execute', payload);

// AI
export const explainError = (payload) => API.post('/ai/explain', payload);
export const analyzeCode = (payload) => API.post('/ai/analyze', payload);

// HISTORY
export const getHistory = () => API.get('/history');
export const getSubmissionById = (id) => API.get(`/history/${id}`);
export const deleteSubmission = (id) => API.delete(`/history/${id}`);