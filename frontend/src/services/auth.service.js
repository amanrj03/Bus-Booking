import api from './api';

export async function loginUser(credentials) {
  const response = await api.post('/auth/login', credentials);
  return response.data.data; // { user, token }
}

export async function registerUser(payload) {
  const response = await api.post('/auth/register', payload);
  return response.data.data; // { user, token }
}

export async function fetchCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data.data.user;
}
