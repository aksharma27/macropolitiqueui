import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchArticles = async (page = 1, limit = 20) => {
  const response = await apiClient.get('/posts', {
    params: { page, limit }
  });
  // Return just the posts array from the response
  return response.data.posts || response.data;
};

export const postArticle = async (articleData) => {
  const response = await apiClient.post('/posts', articleData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export default apiClient;