import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized - Session might be expired');
      localStorage.removeItem('userRole');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export const fetchArticles = async (page = 1, limit = 20) => {
  const response = await apiClient.get('/posts', {
    params: { page, limit }
  });
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

export const approvePost = async (postId) => {
  const response = await apiClient.post(`/posts/${postId}/approve`);
  return response.data;
};

export const updatePost = async (postId, updateData) => {
  const response = await apiClient.patch(`/posts/${postId}`, updateData);
  return response.data;
};

export const fetchAllPosts = async () => {
  const response = await apiClient.get('/posts/all-posts');
  return response.data;
};

export default apiClient;