import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - ENSURE credentials are always sent
apiClient.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request:', config.method.toUpperCase(), config.url, {
      withCredentials: config.withCredentials,
      hasAuth: !!config.headers.Authorization
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized - Session might be expired');
      
      // Don't clear storage immediately on 401 for all requests
      // Only redirect to login if it's not a login request itself
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('userRole');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        
        // Use replace to avoid back-button issues
        window.location.replace('/auth');
      }
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
  const response = await apiClient.post('/posts', articleData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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

export const logoutUser = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await apiClient.post('/auth/reset-password', data);
  return response.data;
};

export default apiClient;