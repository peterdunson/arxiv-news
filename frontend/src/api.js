import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export const getPapers = async (sort = 'votes', limit = 20) => {
  const response = await axios.get(`${API_BASE}/papers`, {
    params: { sort, limit }
  });
  return response.data;
};

export const getPaper = async (arxivId) => {
  const response = await axios.get(`${API_BASE}/papers/${arxivId}`);
  return response.data;
};

export const votePaper = async (arxivId, userId) => {
  const response = await axios.post(`${API_BASE}/papers/${arxivId}/vote`, null, {
    params: { user_identifier: userId }
  });
  return response.data;
};

export const getComments = async (arxivId) => {
  const response = await axios.get(`${API_BASE}/papers/${arxivId}/comments`);
  return response.data;
};

export const addComment = async (arxivId, userName, content) => {
  const response = await axios.post(`${API_BASE}/papers/${arxivId}/comments`, {
    user_name: userName,
    content: content
  });
  return response.data;
};
