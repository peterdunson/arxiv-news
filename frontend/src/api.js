import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getAuthHeader = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Auth functions
export const register = async (username, email, password) => {
  const response = await axios.post(`${API_BASE}/auth/register`, {
    username,
    email,
    password
  });
  localStorage.setItem('authToken', response.data.access_token);
  localStorage.setItem('currentUser', JSON.stringify(response.data.user));
  return response.data;
};

export const login = async (email, password) => {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email,
    password
  });
  localStorage.setItem('authToken', response.data.access_token);
  localStorage.setItem('currentUser', JSON.stringify(response.data.user));
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('votedPapers');
};

export const getCurrentUser = async () => {
  const response = await axios.get(`${API_BASE}/auth/me`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getUserProfile = async (username) => {
  const response = await axios.get(`${API_BASE}/users/${username}`);
  return response.data;
};

export const updateProfile = async (bio) => {
  const headers = getAuthHeader();
  console.log('Update profile - Auth headers:', headers);
  console.log('Update profile - Token from localStorage:', localStorage.getItem('authToken'));

  const response = await axios.patch(`${API_BASE}/users/me`,
    { bio },
    { headers }
  );
  return response.data;
};

// Paper functions
export const getPapers = async (sort = 'votes', limit = 15000) => {
  const response = await axios.get(`${API_BASE}/papers`, {
    params: { sort, limit },
    headers: getAuthHeader()
  });
  return response.data;
};

export const getPaper = async (arxivId) => {
  const response = await axios.get(`${API_BASE}/papers/${arxivId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const votePaper = async (arxivId, userId) => {
  const response = await axios.post(`${API_BASE}/papers/${arxivId}/vote`, null, {
    params: { user_identifier: userId }
  });
  return response.data;
};

// Comment functions
export const getComments = async (arxivId) => {
  const response = await axios.get(`${API_BASE}/papers/${arxivId}/comments`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const addComment = async (arxivId, content) => {
  const response = await axios.post(
    `${API_BASE}/papers/${arxivId}/comments`,
    { content },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const voteComment = async (commentId) => {
  const response = await axios.post(
    `${API_BASE}/comments/${commentId}/vote`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
};
