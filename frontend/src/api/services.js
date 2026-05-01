import API from './axios';

// ─────────────────────────────────────────────
// AUTH SERVICES
// ─────────────────────────────────────────────

// Sends username + password to backend, receives JWT token
export const loginUser = (credentials) =>
  API.post('/auth/login', credentials);

// Registers a new user account
export const registerUser = (userData) =>
  API.post('/auth/register', userData);

// ─────────────────────────────────────────────
// CODE EXECUTION SERVICES
// ─────────────────────────────────────────────

// Submits code to backend which spins up a Docker container and runs it
// payload: { language: 'python'|'java'|'cpp', code: '...', input: '...' }
export const executeCode = (payload) =>
  API.post('/execute', payload);

// Sends the error message + code to AI service for explanation
// payload: { code: '...', error: '...', language: '...' }
export const explainError = (payload) =>
  API.post('/ai/explain', payload);

// Sends code to AI for optimization suggestions and complexity analysis
export const analyzeCode = (payload) =>
  API.post('/ai/analyze', payload);

// ─────────────────────────────────────────────
// HISTORY SERVICES
// ─────────────────────────────────────────────

// Fetches all past submissions for the logged-in user
export const getHistory = () =>
  API.get('/history');

// Fetches a single submission by ID (to re-open it in editor)
export const getSubmissionById = (id) =>
  API.get(`/history/${id}`);

// Deletes a submission from history
export const deleteSubmission = (id) =>
  API.delete(`/history/${id}`);